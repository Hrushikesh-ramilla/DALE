import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { browseCatalog } from "../src/server/catalog-store";
import { closeDatabase, getDatabase } from "../src/server/database";

// Always isolated. Never populate a customer's database with benchmark fixtures.
delete process.env.DATABASE_URL;
process.env.LOCAL_DATA_DIR = ":memory:";
process.env.ALLOW_EMBEDDED_DATABASE = "true";
const count = 10_000;
const output = process.argv[2] || ".data/evaluations/catalog-capacity.json";
function requireCheck(passed: boolean, message: string) {
  if (!passed) throw new Error(message);
}
try {
  const database = await getDatabase();
  const start = performance.now();
  for (let offset = 0; offset < count; offset += 500) {
    const rows = Array.from({ length: 500 }, (_, local) => {
      const index = offset + local;
      const id = `capacity-fixture-${index.toString().padStart(5, "0")}`;
      const category = index % 2 ? "phones" : "headphones";
      const price = 10_000 + Math.floor(index / 4);
      return {
        id,
        category,
        price,
        record: {
          id,
          category,
          price,
          name: `CapacityFixture ${index}`,
          description:
            "Synthetic database benchmark; not manufacturer inventory.",
          compatibleModels: [],
          specs: [],
          sponsored: false,
          stock: 20,
          color: "fixture",
          source: "fixture:capacity",
          provenance: "merchant_sample",
          attributes: {
            brand: `FixtureBrand${index % 10}`,
            modelName: `Fixture${index}`,
          },
        },
      };
    });
    await database.query(
      `INSERT INTO catalog_products(id,category,price,record,publication)
      SELECT id,category,price,record,'fixture' FROM jsonb_to_recordset($1::jsonb)
      AS rows(id text,category text,price integer,record jsonb)`,
      [JSON.stringify(rows)],
    );
  }
  const seedMs = performance.now() - start;
  requireCheck(
    (await browseCatalog({ query: "CapacityFixture" })).total === 0,
    "Synthetic capacity records leaked into the public catalog.",
  );
  const latencies: number[] = [];
  const ids = new Set<string>();
  let cursor: string | undefined,
    pages = 0;
  do {
    const started = performance.now();
    const page = await browseCatalog({
      query: "CapacityFixture",
      fixtures: true,
      cursor,
    });
    latencies.push(performance.now() - started);
    requireCheck(
      page.total === count && page.products.length <= 48,
      "Catalog page contract failed.",
    );
    for (const record of page.products) {
      requireCheck(!ids.has(record.id), "Cursor repeated a product.");
      ids.add(record.id);
    }
    cursor = page.nextCursor || undefined;
    pages++;
  } while (cursor);
  requireCheck(
    ids.size === count && pages === Math.ceil(count / 48),
    "Cursor lost products.",
  );
  const parallelStart = performance.now();
  const filtered = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      browseCatalog({
        query: "CapacityFixture",
        category: index % 2 ? "phones" : "headphones",
        requirements: { brand: `FixtureBrand${index}` },
        fixtures: true,
      }),
    ),
  );
  requireCheck(
    filtered.every(
      (page, i) =>
        page.total === 1000 &&
        page.products.every(
          (record) => record.attributes?.brand === `FixtureBrand${i}`,
        ),
    ),
    "Concurrent attribute filters crossed results.",
  );
  const queryPlan = await database.query<{ "QUERY PLAN": string }>(`EXPLAIN
    SELECT id FROM catalog_products WHERE publication='fixture' AND category='phones'
    AND price<=12000 AND (price,id)>(11000,'capacity-fixture-04000') ORDER BY price,id LIMIT 49`);
  const sorted = latencies.slice().sort((a, b) => a - b);
  const p95Ms = sorted[Math.ceil(sorted.length * 0.95) - 1];
  requireCheck(
    p95Ms < 1500,
    "Isolated catalog p95 exceeded the 1500 ms development gate.",
  );
  const receipt = {
    checkedAt: new Date().toISOString(),
    passed: true,
    scope:
      "10,000 synthetic in-memory PGlite records; no production inventory, HTTP, EC2 throughput or live model qualification is claimed",
    count,
    pages,
    uniqueProducts: ids.size,
    seedMs,
    p95Ms,
    maxMs: sorted.at(-1),
    concurrentFilterRequests: 10,
    concurrentFiltersMs: performance.now() - parallelStart,
    publicFixtureLeakage: 0,
    queryPlan: queryPlan.rows.map((row) => row["QUERY PLAN"]),
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(receipt, null, 2) + "\n");
  console.log(
    JSON.stringify({ passed: true, count, pages, p95Ms, receipt: output }),
  );
} finally {
  await closeDatabase();
}
