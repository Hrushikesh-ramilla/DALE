import { randomUUID } from "node:crypto";
import type { NativeMessage } from "@/domain/concierge";
import { browserOperation, searchConstraints } from "@/domain/concierge";
import type { Actor } from "../state";
import { changeConcierge, readConcierge, withOperation } from "./store";
import { catalogTools, readCatalog } from "./catalog-rag";
import { websiteTools, websiteTool } from "./website-tools";
import { modelTurn } from "./model";
import { inputBudget, promptTokens } from "./context-limits";

const declarations = [...catalogTools, ...websiteTools];
export async function executeWebsiteTurn(
  actor: Actor,
  turnId: string,
  initial: NativeMessage[],
  signal?: AbortSignal,
) {
  await changeConcierge(actor, (s) => {
    if (s.execution?.turnId !== turnId)
      s.execution = { turnId, frames: initial, rounds: 0, results: {} };
  });
  for (;;) {
    signal?.throwIfAborted();
    const s = await readConcierge(actor);
    const execution = s.execution!;
    const messages = execution.frames;
    const lastCall = messages.findLastIndex((m) =>
      Boolean(m.tool_calls?.length),
    );
    const answered = new Set(
      messages
        .slice(lastCall + 1)
        .filter((m) => m.role === "tool")
        .map((m) => m.tool_call_id),
    );
    const pending =
      lastCall < 0
        ? undefined
        : messages[lastCall].tool_calls?.find((c) => !answered.has(c.id));
    if (pending) {
      if (s.turn!.calls >= 48)
        throw new Error(
          "This task reached its action limit. Completed effects remain saved.",
        );
      let result: unknown;
      try {
        const raw: unknown = JSON.parse(pending.function.arguments);
        const name = pending.function.name;
        result = await withOperation(
          actor,
          `${turnId}:${pending.id}`,
          async () => {
            if (catalogTools.some((t) => t.name === name)) {
              const data = await readCatalog(name, raw, signal);
              if (
                name === "search_catalog" &&
                "products" in data &&
                "constraints" in data
              ) {
                await changeConcierge(actor, (state) => {
                  if (!state.resultSets.some((r) => r.id === pending.id))
                    state.resultSets.push({
                      id: pending.id,
                      turnId,
                      origin: "search",
                      productIds: (data.products || []).map((p) => p.id),
                      constraints: searchConstraints.parse(data.constraints),
                    });
                });
              }
              return { ok: true, data };
            }
            return {
              ok: true,
              data: await websiteTool(name, raw, actor, s.context!, signal),
            };
          },
        );
      } catch (error) {
        signal?.throwIfAborted();
        result = {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Function could not be completed.",
        };
      }
      signal?.throwIfAborted();
      const operation =
        typeof result === "object" &&
        result &&
        "data" in result &&
        typeof result.data === "object" &&
        result.data &&
        "browser_operation" in result.data
          ? browserOperation.parse(result.data.browser_operation)
          : undefined;
      await changeConcierge(actor, (state) => {
        state.turn!.calls++;
        if (operation) {
          const id = randomUUID();
          state.actions.push({
            id,
            turnId,
            toolCallId: pending.id,
            operation,
            status: "pending",
            expectedRevision: state.context?.revision || 0,
            createdAt: new Date().toISOString(),
            controllerTabId: state.context?.tab_id,
            ...(operation.type === "tabs"
              ? {
                  targets: operation.paths.map((path) => ({
                    tabId: randomUUID(),
                    path,
                    status: "pending" as const,
                  })),
                }
              : {}),
          });
          state.turn!.status = "awaiting_ui";
        } else {
          state.execution!.frames.push({
            role: "tool",
            tool_call_id: pending.id,
            content: JSON.stringify(result),
          });
          state.execution!.results[pending.id] = result;
        }
      });
      if (operation) return;
      continue;
    }
    if (execution.rounds >= 12)
      throw new Error(
        "This task reached its model-round limit. Completed actions are saved.",
      );
    const { budget } = await inputBudget();
    if (
      (await promptTokens(
        [
          ...messages,
          { role: "system", content: JSON.stringify(declarations) },
        ],
        budget,
        signal,
      )) > budget
    )
      throw new Error(
        "This task exceeds the model context budget. Your conversation and actions remain saved.",
      );
    const reply = await modelTurn(messages, declarations, signal);
    signal?.throwIfAborted();
    const previousIds = new Set(
      messages.flatMap((m) => m.tool_calls?.map((c) => c.id) || []),
    );
    const newIds = new Set<string>();
    for (const call of reply.tool_calls || []) {
      if (previousIds.has(call.id) || newIds.has(call.id))
        throw new Error(
          "The provider reused a function-call identity. Completed effects are saved; resume or start a new task.",
        );
      newIds.add(call.id);
    }
    await changeConcierge(actor, (state) => {
      state.execution!.frames.push(reply);
      state.execution!.rounds++;
      if (!reply.tool_calls?.length) {
        state.transcript.push({
          id: randomUUID(),
          sender: "assistant",
          text: reply.content || "",
          timestamp: Date.now(),
        });
        state.messages.push(reply);
        state.turn!.status = "completed";
      }
    });
    if (!reply.tool_calls?.length) return;
  }
}
