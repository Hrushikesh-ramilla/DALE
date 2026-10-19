import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { runConcierge } from "../src/server/concierge/engine";
import { readConcierge } from "../src/server/concierge/store";
import { customerSession } from "../src/server/customers";
import { closeDatabase } from "../src/server/database";
import { uiContext } from "../src/domain/concierge";
import { hybridSearch } from "../src/server/concierge/retrieval";
import { formatMoney } from "../src/domain/money";
const prepared = JSON.parse(
  await readFile(".data/self-hosted/candidate.json", "utf8"),
);
process.env.CONCIERGE_PROVIDER = "self_hosted";
process.env.CONCIERGE_MODEL = prepared.alias;
process.env.AI_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
process.env.AI_SELF_HOSTED_API_KEY = (
  await readFile(".data/self-hosted/api-key", "utf8")
).trim();
process.env.LOCAL_DATA_DIR = ":memory:";
process.env.PAYMENT_MODE = "fixture";
process.env.SESSION_SECRET =
  "isolated-live-inference-acceptance-secret-32-characters";
const started = Date.now();
const results: unknown[] = [];
const expected = new Map<
  string,
  { price: string; source: string; id: string }
>();
try {
  const cases = [
    [
      "general conversation",
      "What is the difference between a lunar eclipse and a solar eclipse?",
    ],
    [
      "native discovery",
      "Which categories are actually available in your store right now? Please check your current catalog rather than guessing.",
    ],
  ];
  if (process.argv.includes("--catalog")) {
    cases.length = 0;
    const regression = (
      await hybridSearch({
        brands: ["Tom Ford"],
        categories: ["fragrance"],
        query: "Fucking Fabulous",
        limit: 1,
      })
    ).products[0];
    const independent = (
      await hybridSearch({ categories: ["headphones"], offset: 3, limit: 1 })
    ).products[0];
    if (!regression)
      results.push({
        case: "screenshot product regression",
        status: "not_available_in_fresh_catalog",
        success: false,
        reason:
          "The requested product is not in the fresh published catalog; no listing was fabricated.",
      });
    for (const p of [regression, independent].filter(Boolean)) {
      const message = `Do you have ${p.name}? Check the actual catalog and tell me its recorded offer price and source, without buying it.`;
      expected.set(message, {
        price: formatMoney(p.price),
        source: p.source,
        id: p.id,
      });
      cases.push(["live product lookup", message]);
    }
  }
  for (const [name, message] of cases) {
    const actor = (await customerSession({ action: "guest" })).actor;
    const view = await runConcierge(actor, {
      turn_id: randomUUID(),
      message,
      client_context: uiContext.parse({
        current_url: "/shop",
        current_page_type: "shop",
      }),
    });
    const state = await readConcierge(actor);
    const calls = state.messages
      .flatMap((m) => m.tool_calls || [])
      .map((c) => ({ name: c.function.name, arguments: c.function.arguments }));
    const answer = view.messages
      .filter((m) => m.sender === "assistant")
      .map((m) => m.text)
      .join("\n");
    const truth = expected.get(message);
    const factual = truth
      ? answer.includes(truth.price) && answer.includes(truth.source)
      : true;
    const success =
      factual &&
      view.turn?.status === "completed" &&
      view.messages.some(
        (m) => m.sender === "assistant" && m.text.length > 30,
      ) &&
      (name !== "native discovery" ||
        calls.some((c) => c.name === "get_categories_and_brands")) &&
      (name !== "live product lookup" ||
        calls.some(
          (c) =>
            c.name === "search_catalog" || c.name === "get_product_details",
        ));
    results.push({
      case: name,
      success,
      status: view.turn?.status,
      error: view.turn?.error,
      reply: view.messages.filter((m) => m.sender === "assistant"),
      calls,
      expected: truth,
      factual,
    });
  }
} catch (e) {
  results.push({
    success: false,
    error: e instanceof Error ? e.message : "Inference failed",
  });
} finally {
  await closeDatabase();
}
await mkdir(".data/concierge-verification", { recursive: true });
const report = {
  at: new Date().toISOString(),
  model: prepared.alias,
  provider: "self_hosted",
  elapsedMs: Date.now() - started,
  scope:
    "Two actual CPU agent-loop checks against an isolated real catalog DB; no payment calls. Not broad quality or production qualification.",
  results,
};
await writeFile(
  process.argv.includes("--catalog")
    ? ".data/concierge-verification/local-catalog-model.json"
    : ".data/concierge-verification/local-model.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
