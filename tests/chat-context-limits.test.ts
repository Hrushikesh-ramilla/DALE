import { afterEach, it, expect, vi } from "vitest";
import {
  contextLimit,
  promptTokens,
} from "../src/server/concierge/context-limits";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("discovers the configured model input limit without hardcoding a model capacity", async () => {
  vi.stubEnv("CONCIERGE_PROVIDER", "gemini");
  vi.stubEnv("CONCIERGE_INPUT_TOKEN_LIMIT", "");
  vi.stubEnv("CONCIERGE_MODEL", "gemini-test-context");
  vi.stubEnv("AI_API_KEY", "test-only-key");
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ inputTokenLimit: 32768 }));
  vi.stubGlobal("fetch", fetcher);
  expect(await contextLimit()).toEqual({
    input: 32768,
    source: "Google model metadata",
  });
  await contextLimit();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("counts large prompts with a GenerateContentRequest including the system instruction, and caches the result", async () => {
  vi.stubEnv("CONCIERGE_PROVIDER", "gemini");
  vi.stubEnv("CONCIERGE_MODEL", "gemini-test-count");
  vi.stubEnv("AI_API_KEY", "test-only-key");
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ totalTokens: 333 }));
  vi.stubGlobal("fetch", fetcher);
  const messages = [
    { role: "system" as const, content: "Keep this instruction" },
    { role: "user" as const, content: "Long message ".repeat(200) },
  ];
  expect(await promptTokens(messages, 2000)).toBe(333);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body.generateContentRequest.model).toBe("models/gemini-test-count");
  expect(body.generateContentRequest.systemInstruction.parts[0].text).toBe(
    "Keep this instruction",
  );
  expect(body.generateContentRequest.contents[0].role).toBe("user");
  await promptTokens(messages, 2000);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("does not call the tokenizer for ordinary short chats", async () => {
  vi.stubEnv("CONCIERGE_PROVIDER", "gemini");
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  expect(
    await promptTokens([{ role: "user", content: "Hello" }], 10000),
  ).toBeGreaterThan(0);
  expect(fetcher).not.toHaveBeenCalled();
});
it("uses a conservative context budget when metadata is unavailable rather than deleting history", async () => {
  vi.stubEnv("CONCIERGE_PROVIDER", "gemini");
  vi.stubEnv("CONCIERGE_MODEL", "gemini-metadata-down");
  vi.stubEnv("AI_API_KEY", "test-only-key");
  vi.stubEnv("CONCIERGE_INPUT_TOKEN_LIMIT", "");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })),
  );
  expect(await contextLimit()).toEqual({
    input: 8192,
    source: "conservative fallback",
  });
});
