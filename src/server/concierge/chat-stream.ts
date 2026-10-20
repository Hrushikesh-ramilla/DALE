import type { Actor } from "../state";
import type { TurnInput } from "@/domain/concierge";
import type { AgentStreamEvent } from "@/lib/agent-stream";
import { runConcierge } from "./engine";
import { ownerKey } from "./store";
import { createAgentTrace, timing, withAgentTrace } from "./latency";
import { takeRequestBudget } from "../budgets";

export function chatStream(
  actor: Actor,
  input: TurnInput,
  signal: AbortSignal,
) {
  const abort = new AbortController();
  const combined = AbortSignal.any([signal, abort.signal]);
  const encoder = new TextEncoder();
  let closed = false,
    sequence = 0;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: Partial<AgentStreamEvent> & { type: string }) => {
        if (closed || combined.aborted) return;
        if ((controller.desiredSize ?? 0) < -256) {
          closed = true;
          abort.abort();
          controller.error(new Error("Agent stream consumer is too slow."));
          return;
        }
        const event: AgentStreamEvent = {
          ...data,
          version: 1,
          stream_id: trace.id,
          owner_id: ownerKey(actor),
          turn_id: input.turn_id,
          sequence: ++sequence,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      const trace = createAgentTrace({
        onProgress: send,
        beforeAttempt: async () => {
          if (process.env.CONCIERGE_PROVIDER !== "gemini") return;
          const configured = Number(
            process.env.CONCIERGE_GENERATIONS_PER_MINUTE || 10,
          );
          const limit =
            Number.isInteger(configured) && configured > 0 && configured <= 60
              ? configured
              : 10;
          await takeRequestBudget(
            {
              workspaceId: "concierge-provider",
              userId: "project",
              role: "buyer",
            },
            `generation:${process.env.CONCIERGE_MODEL || process.env.AI_MODEL}`,
            limit,
          );
        },
      });
      send({ type: "turn.started" });
      void withAgentTrace(trace, async () => {
        try {
          timing("request.started", { resume: input.resume });
          const view = await runConcierge(actor, input, combined);
          timing("request.completed");
          send({ type: "request.completed", view, timings: trace.timings });
        } catch (error) {
          send({
            type: "request.failed",
            error:
              error instanceof Error ? error.message : "Agent request failed.",
          });
        } finally {
          if (!closed) {
            closed = true;
            controller.close();
          }
        }
      });
    },
    cancel() {
      closed = true;
      abort.abort();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-Agent-Stream-Version": "1",
    },
  });
}
