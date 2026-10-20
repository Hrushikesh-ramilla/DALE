import { afterEach, expect, it, vi } from "vitest";
import { embed } from "../src/server/concierge/retrieval";
import { modelTurn } from "../src/server/concierge/model";
import {
  createAgentTrace,
  withAgentTrace,
  withoutAgentDraft,
} from "../src/server/concierge/latency";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function embeddings() {
  vi.stubEnv("CONCIERGE_EMBEDDING_BASE_URL", "http://127.0.0.1:8088/v1");
  vi.stubEnv("CONCIERGE_EMBEDDING_MODEL", "single-flight-test");
  vi.stubEnv("CONCIERGE_EMBEDDING_SINGLE_FLIGHT", "true");
}
it("shares identical query embeddings while one shopper cancels and keeps cached vectors immutable", async () => {
  embeddings();
  const a = new AbortController(),
    b = new AbortController();
  let release!: (response: Response) => void;
  const transport = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  vi.stubGlobal("fetch", transport);
  const first = embed(["shared unique query"], a.signal, "query");
  const second = embed(["shared unique query"], b.signal, "query");
  const rejected = expect(first).rejects.toThrow("shopper stopped");
  await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
  a.abort(new Error("shopper stopped"));
  await rejected;
  expect(transport.mock.calls[0][1].signal.aborted).toBe(false);
  release(Response.json({ data: [{ index: 0, embedding: [1, 2] }] }));
  const result = await second;
  expect(result).toEqual([[1, 2]]);
  result[0][0] = 99;
  expect(await embed(["shared unique query"], undefined, "query")).toEqual([
    [1, 2],
  ]);
  expect(transport).toHaveBeenCalledTimes(1);
});
it("does not share different embedding profiles or cache incomplete/failed requests", async () => {
  embeddings();
  const transport = vi.fn(async () =>
    Response.json({ data: [{ index: 0, embedding: [1] }] }),
  );
  vi.stubGlobal("fetch", transport);
  await embed(["profile query"], undefined, "query");
  vi.stubEnv("CONCIERGE_EMBEDDING_PROFILE", "bge");
  await embed(["profile query"], undefined, "query");
  expect(transport).toHaveBeenCalledTimes(2);
  transport.mockImplementationOnce(async () => Response.json({ data: [] }));
  await expect(
    embed(["incomplete unique"], undefined, "query"),
  ).rejects.toThrow("incomplete");
  await embed(["incomplete unique"], undefined, "query");
  expect(transport).toHaveBeenCalledTimes(4);
});
function gemini() {
  vi.stubEnv("CONCIERGE_PROVIDER", "gemini");
  vi.stubEnv("CONCIERGE_MODEL", "gemini-test");
  vi.stubEnv("CONCIERGE_ALLOW_CLOUD", "true");
  vi.stubEnv("AI_BILLING_DISABLED", "true");
  vi.stubEnv("AI_FREE_QUOTA_CONFIRMED", "true");
  vi.stubEnv("AI_API_KEY", "fixture-key");
}
it("admits two independent Gemini generations but bounds further concurrency", async () => {
  gemini();
  const releases: Array<(r: Response) => void> = [];
  const transport = vi.fn(
    () => new Promise<Response>((resolve) => releases.push(resolve)),
  );
  vi.stubGlobal("fetch", transport);
  const first = modelTurn([{ role: "user", content: "one" }], []);
  const second = modelTurn([{ role: "user", content: "two" }], []);
  await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(2));
  await expect(
    modelTurn([{ role: "user", content: "three" }], []),
  ).rejects.toThrow("busy");
  for (const release of releases)
    release(
      Response.json({
        choices: [
          { finish_reason: "stop", message: { content: "Generated reply" } },
        ],
      }),
    );
  await Promise.all([first, second]);
});
it("counts retry attempts and keeps internal memory generations out of public draft events", async () => {
  gemini();
  const events: unknown[] = [],
    attempts = vi.fn(async () => undefined);
  const transport = vi
    .fn()
    .mockResolvedValueOnce(new Response("retry", { status: 503 }))
    .mockResolvedValueOnce(
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: "Internal memory summary" },
          },
        ],
      }),
    );
  vi.stubGlobal("fetch", transport);
  const trace = createAgentTrace({
    onProgress: (event) => events.push(event),
    beforeAttempt: attempts,
  });
  await withAgentTrace(trace, () =>
    withoutAgentDraft(() =>
      modelTurn([{ role: "user", content: "internal" }], []),
    ),
  );
  expect(attempts).toHaveBeenCalledTimes(2);
  expect(events).toEqual([]);
  expect(trace.timings.filter((t) => t.phase === "model.attempt")).toHaveLength(
    2,
  );
  expect(JSON.stringify(trace.timings)).not.toContain(
    "Internal memory summary",
  );
});
