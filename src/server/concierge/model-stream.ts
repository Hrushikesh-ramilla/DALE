import { sseData } from "@/lib/sse";
import { timing } from "./latency";

type Extra = { google: { thought_signature: string } };
type Call = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
  extra_content?: Extra;
};
function extra(previous: Extra | undefined, raw: unknown): Extra | undefined {
  if (raw === undefined) return previous;
  const signature = (raw as Extra)?.google?.thought_signature;
  if (typeof signature !== "string")
    throw new Error("Invalid continuation metadata.");
  const combined = (previous?.google.thought_signature || "") + signature;
  if (combined.length > 65536)
    throw new Error("Continuation metadata exceeded its limit.");
  return { google: { thought_signature: combined } };
}
/** Returns an envelope for the same final schema as buffered inference. Native
 * calls are never delivered to the executor until the terminal frame is read. */
export async function streamedModelEnvelope(
  response: Response,
  onText: (text: string) => void,
  signal?: AbortSignal,
) {
  if (!response.body) throw new Error("Inference stream has no body.");
  let content = "",
    finish: string | null = null,
    done = false,
    firstText = true;
  let messageExtra: Extra | undefined;
  const calls = new Map<number, Call>();
  let firstData = true;
  for await (const raw of sseData(response.body, signal)) {
    if (firstData) {
      timing("model.first_data");
      firstData = false;
    }
    if (raw === "[DONE]") {
      done = true;
      break;
    }
    const chunk = JSON.parse(raw);
    if (chunk.error)
      throw new Error("Inference stream reported a provider error.");
    if (!Array.isArray(chunk.choices))
      throw new Error("Invalid inference stream envelope.");
    if (chunk.usage)
      timing(
        "model.usage",
        Object.fromEntries(
          Object.entries(chunk.usage).filter(
            (entry): entry is [string, number] => typeof entry[1] === "number",
          ),
        ),
      );
    for (const choice of chunk.choices) {
      if (choice.index !== undefined && choice.index !== 0)
        throw new Error("Unexpected inference choice.");
      const delta = choice.delta || {};
      if (delta.role && delta.role !== "assistant")
        throw new Error("Invalid inference role.");
      if (delta.content !== undefined && delta.content !== null) {
        if (typeof delta.content !== "string")
          throw new Error("Invalid inference text.");
        content += delta.content;
        if (content.length > 24000)
          throw new Error("Inference text exceeded its limit.");
        if (delta.content) {
          if (firstText) {
            timing("model.first_text");
            firstText = false;
          }
          onText(delta.content);
        }
      }
      messageExtra = extra(messageExtra, delta.extra_content);
      for (const fragment of delta.tool_calls || []) {
        // Gemini compatibility streams can identify full calls by ID without
        // the OpenAI positional index. Preserve first-seen order, and attach
        // later metadata by that same opaque ID. Never guess between calls.
        let index = fragment.index;
        if (
          index === undefined &&
          typeof fragment.id === "string" &&
          fragment.id
        ) {
          index = [...calls].find(([, call]) => call.id === fragment.id)?.[0];
          if (index === undefined) {
            index = 0;
            while (calls.has(index)) index++;
          }
        }
        if (
          index === undefined &&
          calls.size === 1 &&
          !fragment.id &&
          !fragment.function?.name
        )
          index = calls.keys().next().value;
        if (!Number.isInteger(index) || index < 0 || index >= 6)
          throw new Error("Invalid function-call index.");
        const call = calls.get(index) || {
          id: "",
          type: "function",
          function: { name: "", arguments: "" },
        };
        if (fragment.type && fragment.type !== "function")
          throw new Error("Invalid function-call type.");
        if (fragment.id) {
          if (
            typeof fragment.id !== "string" ||
            (call.id && call.id !== fragment.id)
          )
            throw new Error("Function-call identity changed midstream.");
          call.id = fragment.id;
        }
        for (const key of ["name", "arguments"] as const) {
          const value = fragment.function?.[key];
          if (value !== undefined) {
            if (typeof value !== "string")
              throw new Error("Invalid function-call delta.");
            call.function[key] += value;
            if (call.function[key].length > (key === "name" ? 80 : 12000))
              throw new Error("Function-call delta exceeded its limit.");
          }
        }
        call.extra_content = extra(call.extra_content, fragment.extra_content);
        calls.set(index, call);
      }
      if (choice.finish_reason) {
        if (finish && finish !== choice.finish_reason)
          throw new Error("Inference finish reason changed.");
        finish = choice.finish_reason;
      }
    }
  }
  if (!done || !finish)
    throw new Error(
      "The inference stream was incomplete. No partial actions were executed.",
    );
  const ordered = [...calls.entries()].sort(([a], [b]) => a - b);
  if (ordered.some(([index], i) => index !== i))
    throw new Error("Incomplete native function-call batch.");
  for (const [, call] of ordered) {
    // Malformed/truncated JSON never crosses the model/executor boundary.
    const args: unknown = JSON.parse(call.function.arguments);
    if (!args || typeof args !== "object" || Array.isArray(args))
      throw new Error("Invalid native function arguments.");
  }
  timing("model.frame_complete", { calls: calls.size });
  return {
    choices: [
      {
        finish_reason: finish,
        message: {
          content: content || null,
          ...(messageExtra ? { extra_content: messageExtra } : {}),
          ...(calls.size
            ? { tool_calls: ordered.map(([, call]) => call) }
            : {}),
        },
      },
    ],
  };
}
