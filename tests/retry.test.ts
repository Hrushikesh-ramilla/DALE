import { afterEach, expect, it, vi } from "vitest";
import { fetchAnalysisWithRetry } from "../src/server/retry";
afterEach(() => vi.unstubAllGlobals());
it("retries transient failures with exponential backoff and jitter", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response("busy", { status: 503 }))
    .mockResolvedValueOnce(new Response("busy", { status: 502 }))
    .mockResolvedValueOnce(new Response("ok"));
  vi.stubGlobal("fetch", fetch);
  const sleep = vi.fn().mockResolvedValue(undefined);
  const result = await fetchAnalysisWithRetry(
    new URL("https://example.test"),
    {},
    { sleep, random: () => 0.5 },
  );
  expect(result.status).toBe(200);
  expect(sleep.mock.calls.flat()).toEqual([1250, 2250]);
  expect(fetch).toHaveBeenCalledTimes(3);
});
it("honors Retry-After and never retries credential failures", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response("busy", { status: 429, headers: { "Retry-After": "3" } }),
    )
    .mockResolvedValueOnce(new Response("invalid", { status: 401 }));
  vi.stubGlobal("fetch", fetch);
  const sleep = vi.fn().mockResolvedValue(undefined);
  expect(
    (
      await fetchAnalysisWithRetry(
        new URL("https://example.test"),
        {},
        { sleep, random: () => 0 },
      )
    ).status,
  ).toBe(401);
  expect(sleep).toHaveBeenCalledWith(3000);
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("bounds attempts and surfaces persistent outages", async () => {
  const fetch = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response("busy", { status: 503 })),
    );
  vi.stubGlobal("fetch", fetch);
  expect(
    (
      await fetchAnalysisWithRetry(
        new URL("https://example.test"),
        {},
        { sleep: async () => {}, attempts: 99 },
      )
    ).status,
  ).toBe(503);
  expect(fetch).toHaveBeenCalledTimes(4);
});
