import { createHash } from "node:crypto";
import type { NativeMessage } from "@/domain/concierge";

function setting(name: string, fallback: number, minimum = 64) {
  const value = process.env[name];
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < minimum || n > 20000000)
    throw new Error(`Invalid ${name}.`);
  return n;
}
export const replyTokenLimit = () => setting("CONCIERGE_REPLY_TOKENS", 2048);
const metadata = new Map<
  string,
  { at: number; value: Promise<{ input: number; source: string }> }
>();
const counts = new Map<string, number>();
export async function contextLimit() {
  if (process.env.CONCIERGE_INPUT_TOKEN_LIMIT)
    return {
      input: setting("CONCIERGE_INPUT_TOKEN_LIMIT", 8192, 512),
      source: "operator configuration",
    };
  const model = process.env.CONCIERGE_MODEL || process.env.AI_MODEL || "";
  if (process.env.CONCIERGE_PROVIDER !== "gemini")
    return { input: 8192, source: "conservative fallback" };
  const cached = metadata.get(model);
  if (cached && Date.now() - cached.at < 600000) return cached.value;
  const value = (async () => {
    try {
      if (!/^gemini-[a-zA-Z0-9._-]+$/.test(model) || !process.env.AI_API_KEY)
        throw new Error("Missing model configuration");
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}`,
        {
          headers: { "x-goog-api-key": process.env.AI_API_KEY },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!r.ok) {
        await r.body?.cancel();
        throw new Error("Metadata unavailable");
      }
      const body = await r.json();
      if (
        !Number.isSafeInteger(body.inputTokenLimit) ||
        body.inputTokenLimit < 512
      )
        throw new Error("Invalid context metadata");
      return {
        input: body.inputTokenLimit as number,
        source: "Google model metadata",
      };
    } catch {
      return { input: 8192, source: "conservative fallback" };
    }
  })();
  metadata.set(model, { at: Date.now(), value });
  return value;
}
// UTF-8 bytes plus framing are a deliberately conservative estimate, not a
// claim that words/characters are actual Gemini tokens. Verify large prompts.
export const estimatedTokens = (messages: NativeMessage[]) =>
  messages.reduce(
    (n, m) => n + 64 + Buffer.byteLength(m.content || "", "utf8"),
    0,
  );
export async function promptTokens(
  messages: NativeMessage[],
  budget: number,
  signal?: AbortSignal,
) {
  const estimate = estimatedTokens(messages);
  if (estimate < budget * 0.8 || process.env.CONCIERGE_PROVIDER !== "gemini")
    return estimate;
  signal?.throwIfAborted();
  const model = process.env.CONCIERGE_MODEL || process.env.AI_MODEL;
  const key = process.env.AI_API_KEY;
  if (!key || !model || !/^gemini-[a-zA-Z0-9._-]+$/.test(model))
    return estimate;
  const cacheKey = createHash("sha256")
    .update(JSON.stringify([model, messages]))
    .digest("hex");
  if (counts.has(cacheKey)) return counts.get(cacheKey)!;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          generateContentRequest: {
            model: `models/${model}`,
            systemInstruction: {
              parts: messages
                .filter((m) => m.role === "system")
                .map((m) => ({ text: m.content || "" })),
            },
            contents: messages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content || "" }],
              })),
          },
        }),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
          : AbortSignal.timeout(5000),
      },
    );
    if (!r.ok) {
      await r.body?.cancel();
      return estimate;
    }
    const result = await r.json();
    if (!Number.isSafeInteger(result.totalTokens) || result.totalTokens < 0)
      return estimate;
    if (counts.size >= 32) counts.delete(counts.keys().next().value!);
    counts.set(cacheKey, result.totalTokens);
    return result.totalTokens as number;
  } catch (e) {
    if (signal?.aborted) throw e;
    return estimate;
  }
}
export async function inputBudget() {
  const limits = await contextLimit();
  const configured = setting(
    "CONCIERGE_CONTEXT_BUDGET_TOKENS",
    limits.input,
    512,
  );
  const budget = Math.min(configured, limits.input) - replyTokenLimit() - 256;
  if (budget < 256)
    throw new Error(
      "Context budget is too small for the configured reply allowance.",
    );
  return { budget, limit: limits.input, source: limits.source };
}
