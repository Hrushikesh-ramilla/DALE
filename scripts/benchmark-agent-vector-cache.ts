// Isolated SQL/vector transfer benchmark. No live DB, provider or embeddings.
import { mkdir, writeFile } from "node:fs/promises";
import { closeDatabase } from "../src/server/database";
import { conciergeDatabase } from "../src/server/concierge/store";
import { hybridSearch, documentHash } from "../src/server/concierge/retrieval";
import {
  createAgentTrace,
  withAgentTrace,
} from "../src/server/concierge/latency";
process.env.LOCAL_DATA_DIR = ":memory:";
process.env.DATABASE_URL = "";
process.env.AI_MODE = "fixture";
process.env.PAYMENT_MODE = "fixture";
process.env.CONCIERGE_EMBEDDING_BASE_URL = "http://127.0.0.1:8088/v1";
process.env.CONCIERGE_EMBEDDING_MODEL = "vector-transfer-benchmark";
const originalFetch = globalThis.fetch;
const values = Array.from({ length: 384 }, (_, i) => Math.sin(i + 1) / 20);
globalThis.fetch = async () =>
  Response.json({ data: [{ index: 0, embedding: values }] });
const results = [];
try {
  const db = await conciergeDatabase();
  await db.query("UPDATE catalog_products SET publication='retired'");
  const products = Array.from({ length: 1000 }, (_, i) => ({
    id: `vector-transfer-${i}`,
    name: `Vector benchmark ${i}`,
    brand: "Fixture",
    category: "home",
    price: 1000 + i,
    stock: 5,
    specs: ["Benchmark fixture"],
    attributes: {},
    description: "Vector transfer workload",
    source: "test-only",
    compatibleModels: [],
    sponsored: false,
    color: "black",
  }));
  await db.query(
    "INSERT INTO catalog_products(id,category,price,record,publication) SELECT p->>'id','home',(p->>'price')::integer,p,'published' FROM jsonb_array_elements($1::jsonb) p",
    [JSON.stringify(products)],
  );
  await db.query(
    "INSERT INTO concierge_embeddings(product_id,content_hash,model,vector) SELECT e->>'id',e->>'hash','vector-transfer-benchmark',e->'vector' FROM jsonb_array_elements($1::jsonb) e",
    [
      JSON.stringify(
        products.map((p) => ({
          id: p.id,
          hash: documentHash(p),
          vector: values,
        })),
      ),
    ],
  );
  let expected = "";
  for (const enabled of [false, true]) {
    process.env.CONCIERGE_VECTOR_CACHE = String(enabled);
    for (let sample = 0; sample < 4; sample++) {
      const trace = createAgentTrace();
      const started = performance.now();
      const result = await withAgentTrace(trace, () =>
        hybridSearch({ query: "benchmark", match_mode: "semantic", limit: 12 }),
      );
      const ids = JSON.stringify(result.products.map((p) => p.id));
      expected ||= ids;
      if (ids !== expected || result.total !== 1000)
        throw new Error("Vector caching changed results or coverage.");
      results.push({
        enabled,
        sample,
        total_ms: performance.now() - started,
        timings: trace.timings,
      });
    }
  }
  // A warm cache must not bypass publication, offer or stock predicates.
  await db.query(
    "UPDATE catalog_products SET price=9000 WHERE publication='published'",
  );
  if (
    (
      await hybridSearch({
        query: "benchmark",
        match_mode: "semantic",
        max_price: 2000,
      })
    ).total
  )
    throw new Error("Cached records bypassed live prices.");
  await db.query(
    "UPDATE catalog_products SET record=jsonb_set(record,'{stock}','0'::jsonb) WHERE publication='published'",
  );
  if (
    (
      await hybridSearch({
        query: "benchmark",
        match_mode: "semantic",
        in_stock: true,
      })
    ).total
  )
    throw new Error("Cached records bypassed live stock.");
  await db.query(
    "UPDATE catalog_products SET record=jsonb_set(record,'{stock}','5'::jsonb)",
  );
  await db.query("UPDATE catalog_products SET publication='retired'");
  if (
    (await hybridSearch({ query: "benchmark", match_mode: "semantic" })).total
  )
    throw new Error("Retired records escaped live SQL.");
  await mkdir(".data/concierge-verification/latency", { recursive: true });
  await writeFile(
    ".data/concierge-verification/latency/vector-transfer.json",
    JSON.stringify(
      {
        scope:
          "1000 synthetic products, 384-dimensional vectors, isolated embedded PostgreSQL; not a live shopper percentile",
        results,
        publication_check: "passed",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      results.map(({ enabled, sample, total_ms }) => ({
        enabled,
        sample,
        total_ms,
      })),
    ),
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Vector benchmark failed.",
  );
  process.exitCode = 1;
} finally {
  globalThis.fetch = originalFetch;
  await closeDatabase();
}
