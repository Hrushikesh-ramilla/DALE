/** Controlled transport benchmark. Never imports .env or contacts a live provider.
 * This isolates buffering/stream delivery, not customer-task/provider latency. */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { modelTurn } from "../src/server/concierge/model";
import {
  createAgentTrace,
  withAgentTrace,
} from "../src/server/concierge/latency";
const manifest = JSON.parse(
  await readFile(
    new URL("./agent-latency-workloads.json", import.meta.url),
    "utf8",
  ),
);
const originalFetch = globalThis.fetch;
process.env.CONCIERGE_PROVIDER = "self_hosted";
process.env.CONCIERGE_MODEL = "controlled-latency-fixture";
process.env.CONCIERGE_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const samples = [];
const modes = process.argv.includes("--buffered-only") ? [false] : [false, true];
for (const streaming of modes) {
  process.env.CONCIERGE_STREAMING = String(streaming);
  for (let i = 0; i < manifest.transport_fixture.repetitions; i++) {
    let firstText: number | undefined;
    let delivered = "";
    const started = performance.now();
    const trace = createAgentTrace({
      onProgress: (event) => {
        if (event.type === "assistant.delta") {
          firstText ??= performance.now() - started;
          delivered += event.text;
        }
      },
    });
    globalThis.fetch = async (_url, init) => {
      const stream = JSON.parse(String(init?.body)).stream;
      await pause(manifest.transport_fixture.provider_first_chunk_ms);
      if (!stream) {
        await pause(manifest.transport_fixture.provider_remaining_ms);
        return Response.json({
          choices: [
            { finish_reason: "stop", message: { content: "Hello shopper." } },
          ],
        });
      }
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(
              encoder.encode(
                'data: {"choices":[{"index":0,"delta":{"content":"Hello "},"finish_reason":null}]}\n\n',
              ),
            );
            await pause(manifest.transport_fixture.provider_remaining_ms);
            controller.enqueue(
              encoder.encode(
                'data: {"choices":[{"index":0,"delta":{"content":"shopper."},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
              ),
            );
            controller.close();
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    };
    const reply = await withAgentTrace(trace, () =>
      modelTurn([{ role: "user", content: "hello" }], []),
    );
    const total = performance.now() - started;
    if (
      reply.content !== "Hello shopper." ||
      (streaming && delivered !== reply.content)
    )
      throw new Error("Benchmark reply was incomplete.");
    samples.push({
      streaming,
      first_text_ms: firstText ?? total,
      total_ms: total,
      timings: trace.timings,
    });
  }
}
globalThis.fetch = originalFetch;
await mkdir(".data/concierge-verification/latency", { recursive: true });
const report = {
  scope:
    "controlled model transport only; not a live Gemini or end-to-end result",
  manifest,
  samples,
};
await writeFile(
  ".data/concierge-verification/latency/transport.json",
  JSON.stringify(report, null, 2),
);
for (const streaming of modes) {
  const subset = samples.filter((s) => s.streaming === streaming);
  const median = (values: number[]) =>
    values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  console.log(
    JSON.stringify({
      streaming,
      samples: subset.length,
      median_first_text_ms: median(subset.map((s) => s.first_text_ms)),
      median_total_ms: median(subset.map((s) => s.total_ms)),
    }),
  );
}
