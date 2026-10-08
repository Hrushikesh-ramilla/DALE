import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { completion } from "../src/server/ai";
import { selfHostedEndpoint } from "../src/server/self-hosted-ai";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function configure() {
  vi.stubEnv("AI_PROVIDER", "self_hosted");
  vi.stubEnv("AI_MODEL", "tested-local-model");
  vi.stubEnv("AI_SELF_HOSTED_PROFILE", "qwen35");
  vi.stubEnv("AI_SELF_HOSTED_BASE_URL", "http://127.0.0.1:8081/v1");
  vi.stubEnv("AI_SELF_HOSTED_API_KEY", "private-runtime-key");
  vi.stubEnv("AI_API_KEY", "unused-cloud-key");
}
it("uses schema-constrained local text/vision without transmitting the cloud key", async () => {
  configure();
  const modelFetch = vi.fn().mockResolvedValue(
    Response.json({
      choices: [
        { finish_reason: "stop", message: { content: '{"readable":false}' } },
      ],
    }),
  );
  vi.stubGlobal("fetch", modelFetch);
  const result = await completion(
    z.object({ readable: z.boolean() }),
    "Read the image",
    {},
    [{ mime: "image/png", bytes: Buffer.from("owned-image") }],
  );
  expect(result.readable).toBe(false);
  const [url, init] = modelFetch.mock.calls[0];
  expect(url.hostname).toBe("127.0.0.1");
  const payload = JSON.parse(init.body);
  expect(
    payload.response_format.json_schema.schema.properties.readable.type,
  ).toBe("boolean");
  expect(payload.messages[1].content[1].image_url.url).toBe(
    "data:image/png;base64,b3duZWQtaW1hZ2U=",
  );
  expect(init.headers.Authorization).toBe("Bearer private-runtime-key");
  expect(payload.messages[0].content).toContain(
    JSON.stringify(payload.response_format.json_schema.schema),
  );
  expect(payload).toMatchObject({
    temperature: 0.7,
    presence_penalty: 1.5,
    cache_prompt: false,
  });
  expect(JSON.stringify(init)).not.toContain("unused-cloud-key");
});
it.each([
  "https://api.example.com/v1",
  "http://192.168.1.10:8081/v1",
  "http://user:password@127.0.0.1:8081/v1",
])("rejects a non-private endpoint: %s", (base) => {
  configure();
  vi.stubEnv("AI_SELF_HOSTED_BASE_URL", base);
  expect(selfHostedEndpoint).toThrow(/private loopback/);
});
it("never falls back to a cloud provider after local unavailability", async () => {
  configure();
  const modelFetch = vi
    .fn()
    .mockResolvedValue(new Response("private diagnostics", { status: 503 }));
  vi.stubGlobal("fetch", modelFetch);
  await expect(
    completion(z.object({ value: z.number() }), "Read", {}),
  ).rejects.toThrow("HTTP 503");
  expect(modelFetch).toHaveBeenCalledTimes(1);
});
it.each([
  { finish_reason: "length", content: '{"value":1}' },
  { finish_reason: "stop", content: '{"value":"invalid"}' },
])("rejects truncated or schema-invalid analysis", async (result) => {
  configure();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            finish_reason: result.finish_reason,
            message: { content: result.content },
          },
        ],
      }),
    ),
  );
  await expect(
    completion(z.object({ value: z.number() }), "Read", {}),
  ).rejects.toThrow();
});
