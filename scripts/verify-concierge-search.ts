import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "dotenv";
import {
  hybridSearch,
  catalogCapabilities,
} from "../src/server/concierge/retrieval";
import { closeDatabase } from "../src/server/database";
Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
const cases = [
  { query: "soft fabric for a formal evening", categories: ["dresses"] },
  { query: "quiet wireless listening on a flight", categories: ["headphones"] },
  { query: "warm woody amber scent", categories: ["fragrance"] },
];
const started = Date.now();
const results = [];
try {
  for (const query of cases) {
    const result = await hybridSearch({
      ...query,
      match_mode: "semantic",
      limit: 5,
    });
    results.push({
      query,
      mode: result.mode,
      degradation: result.degradation,
      total: result.total,
      products: result.products.map((p) => ({
        id: p.id,
        name: p.name,
        price_cents: p.price,
        source: p.source,
        specs: p.specs,
        attributes: p.attributes,
      })),
    });
  }
  const capabilities = await catalogCapabilities();
  await mkdir(".data/concierge-verification", { recursive: true });
  const report = {
    at: new Date().toISOString(),
    elapsedMs: Date.now() - started,
    scope:
      "Actual local BGE index queries; top results provided for review, not an independently labeled recall/precision evaluation",
    indexedCatalogCollections: capabilities.collections.length,
    results,
  };
  await writeFile(
    ".data/concierge-verification/semantic-search.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      elapsedMs: report.elapsedMs,
      results: results.map((r) => ({
        query: r.query,
        mode: r.mode,
        degradation: r.degradation,
        total: r.total,
        top: r.products.map((p) => p.name),
      })),
    }),
  );
} finally {
  await closeDatabase();
}
