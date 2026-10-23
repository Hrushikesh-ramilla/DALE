import { afterEach, expect, it, vi } from "vitest";
import { modelTurn } from "../src/server/concierge/model";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function configure() {
  vi.stubEnv("CONCIERGE_PROVIDER", "self_hosted");
  vi.stubEnv("CONCIERGE_MODEL", "contract-model");
  vi.stubEnv("AI_SELF_HOSTED_BASE_URL", "http://127.0.0.1:8081/v1");
}
it("passes native tool observations back to configured self-hosted inference without keyword routing", async () => {
  configure();
  const transport = vi.fn().mockResolvedValue(
    Response.json({
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            content: null,
            tool_calls: [
              {
                id: "independent-call",
                type: "function",
                function: { name: "inspect", arguments: "{}" },
              },
            ],
          },
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", transport);
  const result = await modelTurn(
    [
      { role: "user", content: "arbitrary task" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "previous",
            type: "function",
            function: { name: "lookup", arguments: "{}" },
          },
        ],
      },
      { role: "tool", tool_call_id: "previous", content: '{"actual":true}' },
    ],
    [{ name: "inspect", description: "read", parameters: { type: "object" } }],
  );
  expect(result.tool_calls?.[0].function.name).toBe("inspect");
  const sent = JSON.parse(transport.mock.calls[0][1].body);
  expect(sent.model).toBe("contract-model");
  expect(sent.temperature).toBe(0);
  expect(sent.messages[2].tool_call_id).toBe("previous");
});
it("does not silently fall back to cloud or hardcoded replies on error", async () => {
  configure();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("unavailable", { status: 401 })),
  );
  await expect(
    modelTurn([{ role: "user", content: "hello" }], []),
  ).rejects.toThrow("HTTP 401");
  vi.stubEnv("CONCIERGE_PROVIDER", "gemini");
  vi.stubEnv("CONCIERGE_ALLOW_CLOUD", "false");
  await expect(
    modelTurn([{ role: "user", content: "hello" }], []),
  ).rejects.toThrow("disabled");
});
it("rejects incomplete model frames instead of executing truncated arguments", async () => {
  configure();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          { finish_reason: "length", message: { content: "incomplete" } },
        ],
      }),
    ),
  );
  await expect(
    modelTurn([{ role: "user", content: "task" }], []),
  ).rejects.toThrow("incomplete");
});
it("forbids remote URLs disguised as self-hosted inference", async () => {
  configure();
  vi.stubEnv("AI_SELF_HOSTED_BASE_URL", "https://example.com/v1");
  await expect(
    modelTurn([{ role: "user", content: "task" }], []),
  ).rejects.toThrow("loopback");
});
it("validates a dedicated buyer endpoint with the same loopback boundary", async () => {
  configure();
  vi.stubEnv("CONCIERGE_SELF_HOSTED_BASE_URL", "https://example.com/v1");
  await expect(
    modelTurn([{ role: "user", content: "task" }], []),
  ).rejects.toThrow("loopback");
});
it("rejects concurrent generations before contacting the provider", async () => {
  configure();
  let release!: (response: Response) => void;
  const transport = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  vi.stubGlobal("fetch", transport);
  const first = modelTurn(
    [{ role: "user", content: "first independent shopper" }],
    [],
  );
  await expect(
    modelTurn([{ role: "user", content: "another independent shopper" }], []),
  ).rejects.toThrow("busy");
  expect(transport).toHaveBeenCalledTimes(1);
  release(
    Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: { content: "Contract test response" },
        },
      ],
    }),
  );
  await first;
});
it("recovers once from a stale inference connection without replaying customer actions", async () => {
  configure();
  const transport = vi
    .fn()
    .mockRejectedValueOnce(new TypeError("fetch failed"))
    .mockResolvedValueOnce(
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: "Recovered generation" },
          },
        ],
      }),
    );
  vi.stubGlobal("fetch", transport);
  expect(
    (await modelTurn([{ role: "user", content: "independent task" }], []))
      .content,
  ).toBe("Recovered generation");
  expect(transport).toHaveBeenCalledTimes(2);
  expect(transport.mock.calls[0][1].headers.Connection).toBe("close");
});
