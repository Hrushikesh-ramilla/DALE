import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse } from "dotenv";
import { runConcierge } from "../src/server/concierge/engine";
import { hybridSearch } from "../src/server/concierge/retrieval";
import { customerSession } from "../src/server/customers";
import { closeDatabase } from "../src/server/database";
import { uiContext } from "../src/domain/concierge";
import { formatMoney } from "../src/domain/money";
Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
if (process.argv.includes("--text-candidate")) {
  const candidate = JSON.parse(
    await readFile("deploy/concierge-text-candidate.json", "utf8"),
  );
  process.env.CONCIERGE_MODEL = candidate.alias;
  process.env.CONCIERGE_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8083/v1";
}
process.env.LOCAL_DATA_DIR = ":memory:";
const results = [];
try {
  for (const category of ["fragrance", "phones", "sunglasses"]) {
    const product = (
      await hybridSearch({ categories: [category], offset: 7, limit: 1 })
    ).products[0];
    if (!product) {
      results.push({
        category,
        passed: false,
        error: "Independent catalog sample unavailable",
      });
      continue;
    }
    const { actor } = await customerSession({ action: "guest" });
    const message = `Do you have ${product.name}, and what does it cost?`;
    const start = Date.now();
    const view = await runConcierge(actor, {
      turn_id: randomUUID(),
      message,
      client_context: uiContext.parse({
        current_url: "/department/electronics",
        current_page_type: "department",
      }),
    });
    const response =
      view.messages.filter((m) => m.sender === "assistant").at(-1)?.text || "";
    const result = {
      category,
      message,
      expectedId: product.id,
      expectedPrice: formatMoney(product.price),
      elapsedMs: Date.now() - start,
      status: view.turn?.status,
      error: view.turn?.error,
      response,
      products: view.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
      })),
      passed:
        view.turn?.status === "completed" &&
        view.products.some((p) => p.id === product.id) &&
        view.products.every((p) => p.id === product.id) &&
        (view.turn?.presentation === "catalog" ||
          response.includes(formatMoney(product.price))) &&
        view.products.every((p) => p.price === product.price) &&
        view.basket.cart.length === 0 &&
        view.confirmations.length === 0,
    };
    results.push(result);
    console.log(JSON.stringify(result));
  }
} finally {
  await closeDatabase();
}
const report = {
  at: new Date().toISOString(),
  model: process.env.CONCIERGE_MODEL,
  scope:
    "Real self-hosted inference and isolated application database. Independent catalog samples in three categories, requested from an electronics page. No inference fixtures or payments. Tests product identity and recorded prices, not manufacturer-data authenticity or recommendation quality.",
  passed: results.every((r) => r.passed),
  results,
};
await writeFile(
  ".data/concierge-verification/buyer-catalog-live.json",
  JSON.stringify(report, null, 2),
);
if (!report.passed) process.exitCode = 1;
