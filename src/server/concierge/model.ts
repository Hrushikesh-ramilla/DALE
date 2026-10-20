import { z } from "zod";
import type { NativeMessage } from "@/domain/concierge";
import { selfHostedEndpoint } from "../self-hosted-ai";
import { replyTokenLimit } from "./context-limits";
import { timed, timing, admitModelAttempt } from "./latency";
import { agentProgress, agentStreams } from "./latency";
import { streamedModelEnvelope } from "./model-stream";
import { randomUUID } from "node:crypto";

export type ToolDeclaration = {
  name: string;
  description: string;
  parameters: unknown;
};
// Gemini's opaque continuation signatures must survive native tool frames.
// They stay in server-side history and are never exposed as shopper prose.
const signature = z
  .object({
    google: z.object({ thought_signature: z.string().min(1).max(65536) }),
  })
  .optional();
const answerSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string(),
        message: z.object({
          content: z.string().max(24000).nullable().optional(),
          extra_content: signature,
          tool_calls: z
            .array(
              z.object({
                id: z.string().min(1).max(150),
                type: z.literal("function"),
                function: z.object({
                  name: z.string().max(80),
                  arguments: z.string().max(12000),
                }),
                extra_content: signature,
              }),
            )
            .max(6)
            .optional(),
        }),
      }),
    )
    .min(1),
});

/** No generation fixtures or language classifier. Every production reply is generated
 * by the selected provider; failures propagate as failures, never scripted answers. */
let activeGenerations = 0;
async function geminiRetryDelay(response: Response): Promise<number | null> {
  const payload = await response
    .clone()
    .json()
    .catch(() => undefined);
  const error = Array.isArray(payload) ? payload[0]?.error : payload?.error;
  const parsed = z
    .array(
      z.object({
        "@type": z.string().optional(),
        retryDelay: z.string().optional(),
        violations: z
          .array(
            z.object({
              quotaId: z.string().optional(),
              quotaMetric: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .safeParse(error?.details || []);
  const details = parsed.success ? parsed.data : [];
  const violations = details.flatMap((d) => d.violations || []);
  // Daily exhaustion cannot recover within an interactive request. Never enable
  // billing or swap providers to evade it.
  if (
    violations.some((v) =>
      /per.?day/i.test(`${v.quotaId || ""} ${v.quotaMetric || ""}`),
    )
  )
    return null;
  const header = response.headers.get("retry-after");
  const retryInfo = details.find((d) => d["@type"]?.endsWith("RetryInfo"));
  const seconds =
    typeof retryInfo?.retryDelay === "string" &&
    /^\d+(\.\d+)?s$/.test(retryInfo.retryDelay)
      ? Number(retryInfo.retryDelay.slice(0, -1))
      : undefined;
  const headerMs =
    header !== null
      ? /^\d+(\.\d+)?$/.test(header)
        ? Number(header) * 1000
        : Date.parse(header) - Date.now()
      : undefined;
  const hints = [
    headerMs,
    seconds === undefined ? undefined : seconds * 1000,
  ].filter((n): n is number => n !== undefined && Number.isFinite(n));
  const ms = hints.length ? Math.max(0, ...hints) : 15000;
  return ms <= 60000 ? Math.ceil(ms) : null;
}
export async function modelTurn(
  messages: NativeMessage[],
  tools: ToolDeclaration[],
  signal?: AbortSignal,
): Promise<NativeMessage> {
  if (activeGenerations >= 1)
    throw new Error(
      "AI inference is busy. No additional generation was queued; please retry shortly.",
    );
  activeGenerations++;
  try {
    return await timed("model.total", () => generate(messages, tools, signal));
  } finally {
    activeGenerations--;
  }
}
async function generate(
  messages: NativeMessage[],
  tools: ToolDeclaration[],
  signal?: AbortSignal,
): Promise<NativeMessage> {
  const provider = process.env.CONCIERGE_PROVIDER || "self_hosted";
  const model = process.env.CONCIERGE_MODEL || process.env.AI_MODEL;
  const reasoning = process.env.CONCIERGE_REASONING_EFFORT || "low";
  const streaming = agentStreams();
  const generation = randomUUID();
  if (streaming)
    agentProgress({ type: "model.started", generation_id: generation });
  if (
    provider === "gemini" &&
    !["none", "minimal", "low", "medium", "high"].includes(reasoning)
  )
    throw new Error("Unsupported Gemini reasoning effort.");
  if (!model) throw new Error("Concierge model identity is not configured.");
  let endpoint: URL;
  let key: string | undefined;
  if (provider === "self_hosted") {
    endpoint = selfHostedEndpoint(process.env.CONCIERGE_SELF_HOSTED_BASE_URL);
    key =
      process.env.CONCIERGE_SELF_HOSTED_API_KEY ||
      process.env.AI_SELF_HOSTED_API_KEY;
  } else if (provider === "gemini") {
    if (
      process.env.CONCIERGE_ALLOW_CLOUD !== "true" ||
      process.env.AI_BILLING_DISABLED !== "true" ||
      process.env.AI_FREE_QUOTA_CONFIRMED !== "true"
    )
      throw new Error(
        "Cloud concierge generation is disabled. Configure the self-hosted model or explicitly authorize the free cloud provider.",
      );
    endpoint = new URL(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    );
    key = process.env.AI_API_KEY;
    if (!key)
      throw new Error("Configured model provider credentials are missing.");
  } else throw new Error("Unsupported concierge model provider.");
  const combined = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(90000)])
    : AbortSignal.timeout(90000);
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    combined.throwIfAborted();
    await admitModelAttempt();
    timing("model.attempt", {
      attempt: attempt + 1,
      model,
      provider,
      reasoning,
      messages: messages.length,
      tools: tools.length,
    });
    try {
      response = await timed("model.headers", () =>
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(provider === "self_hosted" ? { Connection: "close" } : {}),
            ...(key ? { Authorization: `Bearer ${key}` } : {}),
          },
          body: JSON.stringify({
            model,
            messages,
            ...(tools.length
              ? {
                  tools: tools.map((t) => ({ type: "function", function: t })),
                  tool_choice: "auto",
                  parallel_tool_calls: provider === "self_hosted",
                }
              : {}),
            temperature: provider === "self_hosted" ? 0 : 0.7,
            ...(provider === "gemini" ? { reasoning_effort: reasoning } : {}),
            max_tokens: replyTokenLimit(),
            stream: streaming,
          }),
          signal: combined,
        }),
      );
    } catch (error) {
      // Generation has no customer-side effects. Retrying its transport once is
      // safe; tool execution occurs only after a complete validated response.
      if (combined.aborted || attempt === 1) throw error;
      continue;
    }
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 1)
      break;
    const retryMs =
      provider === "gemini" && response.status === 429
        ? await geminiRetryDelay(response)
        : 700;
    if (retryMs === null) break;
    timing("model.retry", { delay_ms: retryMs, status: response.status });
    await response.body?.cancel();
    combined.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        reject(combined.reason);
      };
      const timer = setTimeout(() => {
        combined.removeEventListener("abort", onAbort);
        resolve();
      }, retryMs);
      combined.addEventListener("abort", onAbort, { once: true });
      if (combined.aborted) onAbort();
    });
  }
  if (!response?.ok) {
    await response?.body?.cancel().catch(() => undefined);
    throw new Error(
      `Concierge inference returned HTTP ${response?.status ?? "unavailable"}. No scripted response was substituted.`,
    );
  }
  const envelope = answerSchema.parse(
    streaming &&
      response.headers.get("content-type")?.includes("text/event-stream")
      ? await streamedModelEnvelope(
          response,
          (text) =>
            agentProgress({
              type: "assistant.delta",
              generation_id: generation,
              text,
            }),
          combined,
        )
      : await response.json(),
  );
  const choice = envelope.choices[0];
  if (!["stop", "tool_calls"].includes(choice.finish_reason))
    throw new Error(
      "The model response was incomplete. No actions were inferred from partial output.",
    );
  const message: NativeMessage = {
    role: "assistant",
    content: choice.message.content || null,
    ...(choice.message.extra_content
      ? { extra_content: choice.message.extra_content }
      : {}),
    ...(choice.message.tool_calls?.length
      ? { tool_calls: choice.message.tool_calls }
      : {}),
  };
  if (!message.content && !message.tool_calls?.length)
    throw new Error("The model returned neither a response nor tool calls.");
  if (streaming)
    agentProgress({
      type: "model.finished",
      generation_id: generation,
      has_tools: Boolean(message.tool_calls?.length),
    });
  return message;
}
