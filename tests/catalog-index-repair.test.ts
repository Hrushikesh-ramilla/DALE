import { afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { repairCatalogIndexes } from "../src/server/catalog-index-repair";
import { productById } from "../src/domain/catalog";
import type { Sql } from "../src/server/database";

const engine = new PGlite();
const sql: Sql = {
  async query<T>(text: string, values: unknown[] = []) {
    return { rows: (await engine.query<T>(text, values)).rows };
  },
};
afterAll(() => engine.close());

it("recovers missing browse indexes without changing facts, overwriting explicit indexes or guessing broad categories", async () => {
  await engine.exec(`CREATE TABLE catalog_products(id text PRIMARY KEY,record jsonb,publication text,leaf_type text,brand text,model_name text,sku_variant text);
    CREATE TABLE catalog_operator_jobs(id text PRIMARY KEY,kind text,payload jsonb,status text,completed_at timestamptz);`);
  const original = productById("B010");
  for (const [id, record, publication, leaf] of [
    ["missing", original, "published", null],
    ["explicit", original, "published", "watches"],
    ["broad", { ...original, category: "home", attributes: {} }, "published", null],
    ["retired", original, "retired", null],
  ] as const) {
    await sql.query("INSERT INTO catalog_products(id,record,publication,leaf_type) VALUES($1,$2::jsonb,$3,$4)", [id, JSON.stringify(record), publication, leaf]);
  }
  await repairCatalogIndexes(sql);
  const first = await sql.query<{ id: string; record: unknown; leaf_type: string | null }>("SELECT * FROM catalog_products ORDER BY id");
  expect(first.rows.find(r => r.id === "missing")?.leaf_type).toBe("fragrance");
  expect(first.rows.find(r => r.id === "missing")?.record).toEqual(original);
  expect(first.rows.find(r => r.id === "explicit")?.leaf_type).toBe("watches");
  expect(first.rows.find(r => r.id === "broad")?.leaf_type).toBeNull();
  expect(first.rows.find(r => r.id === "retired")?.leaf_type).toBeNull();
  await repairCatalogIndexes(sql);
  expect((await sql.query("SELECT * FROM catalog_products ORDER BY id")).rows).toEqual(first.rows);
  expect((await sql.query("SELECT * FROM catalog_operator_jobs")).rows).toHaveLength(1);
});
