import { beforeAll, afterAll, expect, it, vi } from "vitest";
import {
  hybridSearch,
  indexCatalog,
  embed,
} from "../src/server/concierge/retrieval";
import { getDatabase, closeDatabase } from "../src/server/database";
import type { Product } from "../src/domain/catalog";
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.CONCIERGE_EMBEDDING_BASE_URL = "http://127.0.0.1:8088/v1";
  process.env.CONCIERGE_EMBEDDING_MODEL = "test-vector-model";
  const db = await getDatabase();
  await db.query("UPDATE catalog_products SET publication='retired'");
  const p: Product = {
    id: "independent-vector-fixture",
    name: "Alpine glass tumbler",
    brand: "Contract maker",
    category: "home",
    price: 3800,
    stock: 5,
    description: "Cold mountain design",
    specs: ["Insulated glass"],
    source: "test-only",
    compatibleModels: [],
    sponsored: false,
    color: "clear",
  };
  await db.query(
    "INSERT INTO catalog_products(id,category,price,record,publication) VALUES($1,$2,$3,$4::jsonb,'published')",
    [p.id, p.category, p.price, JSON.stringify(p)],
  );
}, 60000);
afterAll(async () => {
  await closeDatabase();
  vi.unstubAllGlobals();
  delete process.env.CONCIERGE_EMBEDDING_MODEL;
  delete process.env.CONCIERGE_EMBEDDING_BASE_URL;
});
it("ranks semantic matches from a real persisted index and still enforces exact price predicates", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      return Response.json({
        data: body.input.map((_: unknown, index: number) => ({
          index,
          embedding: [1, 0, 0],
        })),
      });
    }),
  );
  expect((await indexCatalog()).updated).toBe(1);
  const result = await hybridSearch({
    query: "winter landscape",
    match_mode: "semantic",
    max_price: 3800,
  });
  expect(result.products[0].id).toBe("independent-vector-fixture");
  expect(result.mode).toBe("hybrid");
  expect(
    (
      await hybridSearch({
        query: "winter landscape",
        match_mode: "semantic",
        max_price: 3799,
      })
    ).total,
  ).toBe(0);
});
it("rejects stale vectors immediately when metadata changes, before reindexing", async () => {
  const db = await getDatabase();
  await db.query(
    "UPDATE catalog_products SET record=jsonb_set(record,'{description}','\"Revised document\"'::jsonb) WHERE id='independent-vector-fixture'",
  );
  const result = await hybridSearch({
    query: "winter landscape",
    match_mode: "semantic",
  });
  expect(result.products).toEqual([]);
  expect(result.degradation).toContain("current semantic vector");
  expect((await indexCatalog()).updated).toBe(1);
});
it("does not accept partial embedding batches", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: [] })),
  );
  await expect(embed(["independent input"])).rejects.toThrow("incomplete");
});
