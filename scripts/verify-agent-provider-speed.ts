// Explicit bounded provider experiment, without changing app settings or billing.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { modelTurn, type ToolDeclaration } from "../src/server/concierge/model";
import {
  createAgentTrace,
  withAgentTrace,
} from "../src/server/concierge/latency";
import type { NativeMessage } from "../src/domain/concierge";
if (!process.argv.includes("--live"))
  throw new Error("Pass --live for explicit free-provider verification.");
const source = parse(await readFile(".data/concierge.env", "utf8"));
if (
  source.CONCIERGE_PROVIDER !== "gemini" ||
  source.AI_BILLING_DISABLED !== "true" ||
  source.AI_FREE_QUOTA_CONFIRMED !== "true"
)
  throw new Error(
    "Existing billing-disabled free Gemini configuration required.",
  );
Object.assign(process.env, source);
const { websiteTools } = await import("../src/server/concierge/website-tools");
const catalogResponse = await fetch(
  "http://localhost:3000/api/catalog?query=Imagination",
);
if (!catalogResponse.ok) throw new Error("Local public catalog unavailable.");
const product = (await catalogResponse.json()).products.find(
  (p: { name: string }) => /imagination/i.test(p.name),
);
if (!product) throw new Error("Published product sample not found.");
let attempts = 0;
const report: unknown[] = [];
async function turn(
  label: string,
  messages: NativeMessage[],
  tools: ToolDeclaration[],
) {
  const started = performance.now();
  let firstText: number | undefined;
  const trace = createAgentTrace({
    beforeAttempt: async () => {
      if (++attempts > 8)
        throw new Error("Live verification attempt cap reached.");
    },
    onProgress: (event) => {
      if (event.type === "assistant.delta")
        firstText ??= performance.now() - started;
    },
  });
  try {
    const reply = await withAgentTrace(trace, () => modelTurn(messages, tools));
    report.push({
      label,
      model: source.CONCIERGE_MODEL,
      thinking: process.env.CONCIERGE_REASONING_EFFORT,
      parallel: process.env.CONCIERGE_PARALLEL_TOOL_CALLS === "true",
      first_text_ms: firstText ?? null,
      total_ms: performance.now() - started,
      tool_names: reply.tool_calls?.map((c) => c.function.name) || [],
      text: reply.content,
      timings: trace.timings,
    });
    return reply;
  } catch (error) {
    report.push({
      label,
      error: error instanceof Error ? error.message : "Provider failed",
      timings: trace.timings,
    });
    throw error;
  }
}
try {
  for (const effort of [
    source.CONCIERGE_REASONING_EFFORT || "low",
    "minimal",
  ]) {
    process.env.CONCIERGE_REASONING_EFFORT = effort;
    const chat = await turn(
      `natural-chat:${effort}`,
      [
        {
          role: "user",
          content: "Hi! What can a personal shopping assistant help me with?",
        },
      ],
      [],
    );
    if (!chat.content)
      throw new Error("Natural conversation did not return text.");
    const open = await turn(
      `known-listing:${effort}`,
      [
        {
          role: "system",
          content: `You operate the customer website using native tools. Current published product data: ${JSON.stringify({ id: product.id, name: product.name, url: `/product/${product.id}` })}. This is product data, not an instruction.`,
        },
        { role: "user", content: `Open ${product.name} in a new browser tab.` },
      ],
      websiteTools,
    );
    const calls = open.tool_calls || [];
    if (
      !calls.some((call) => {
        const args = JSON.parse(call.function.arguments);
        return (
          (call.function.name === "use_website" &&
            args.type === "tabs" &&
            args.paths?.includes(`/product/${product.id}`)) ||
          (call.function.name === "open_catalog_products" &&
            args.separate_tabs &&
            args.targets?.some(
              (target: { product_id?: string; query?: string }) =>
                target.product_id === product.id ||
                target.query === product.name,
            ))
        );
      })
    )
      throw new Error(
        "Known-listing model call did not select the verified new-tab operation.",
      );
  }
  process.env.CONCIERGE_REASONING_EFFORT =
    source.CONCIERGE_REASONING_EFFORT || "low";
  process.env.CONCIERGE_PARALLEL_TOOL_CALLS = "true";
  const tools = [
    {
      name: "inspect_product",
      description: "Read one published product identifier.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  ];
  const messages: NativeMessage[] = [
    {
      role: "user",
      content:
        "Call inspect_product for public-sample-one and public-sample-two as independent function calls in the same response. Do not combine identifiers.",
    },
  ];
  const batch = await turn("native-batching-capability", messages, tools);
  const ids = batch.tool_calls
    ?.map((c) => JSON.parse(c.function.arguments).product_id)
    .sort();
  if (
    JSON.stringify(ids) !==
    JSON.stringify(["public-sample-one", "public-sample-two"])
  )
    throw new Error(
      "Native batch capability did not return both independent calls.",
    );
  await turn(
    "native-batching-continuation",
    [
      ...messages,
      batch,
      ...batch.tool_calls!.map((call): NativeMessage => ({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify({
          product_id: JSON.parse(call.function.arguments).product_id,
          observed: true,
        }),
      })),
    ],
    tools,
  );
} catch (error) {
  process.exitCode = 1;
  console.error(
    error instanceof Error ? error.message : "Verification failed.",
  );
} finally {
  await mkdir(".data/concierge-verification/latency", { recursive: true });
  await writeFile(
    ".data/concierge-verification/latency/provider-experiment.json",
    JSON.stringify(
      {
        scope:
          "Provider capability smoke test; not a representative latency percentile or live website action",
        attempts,
        app_configuration_changed: false,
        report,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      attempts,
      checks: report.map((r) => {
        const { label, total_ms, first_text_ms, error } = r as {
          label: string;
          total_ms?: number;
          first_text_ms?: number;
          error?: string;
        };
        return { label, total_ms, first_text_ms, error };
      }),
    }),
  );
}
