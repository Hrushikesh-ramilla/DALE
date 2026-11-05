import { afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import plan from "../catalog/repairs/repair-first-2026-10-24.json";
import registry from "../catalog/media/verified-product-images.json";
import {
  applyCatalogRepairs,
  publishedReplacement,
  type CatalogRepair,
} from "../src/server/catalog-repairs";
import {
  hasConsistentBottleVolume,
  resolveVerifiedProductImage,
} from "../src/domain/verified-product-image";
import { productById } from "../src/domain/catalog";
import type { Sql } from "../src/server/database";
import { cleanCatalogCopy } from "../src/domain/catalog-copy";
const engine = new PGlite();
const sql: Sql = {
  async query<T>(text: string, values: unknown[] = []) {
    return { rows: (await engine.query<T>(text, values)).rows };
  },
};
afterAll(() => engine.close());
it("makes boilerplate readable without changing facts or claiming verification", () => {
  const original = {
    ...productById("B010"),
    brand: "Test House",
    name: "Test House Test House Fragrance",
    description:
      "Test House Fragrance (Current). Official manufacturer specification recorded from GLOBAL technical documentation.",
    specs: [
      "Brand: Test House",
      "volumeMl: 70",
      "volumeMl: 70",
      "concentration: eau de parfum",
    ],
    skuVariant: "70 ml",
  };
  const cleaned = cleanCatalogCopy(original);
  expect(cleaned.name).toBe("Test House Fragrance");
  expect(cleaned.specs).toEqual([
    "Bottle size (ml): 70",
    "Concentration: eau de parfum",
  ]);
  expect(cleaned.description).not.toMatch(
    /verified|official manufacturer|Current/i,
  );
  expect(cleaned.description).toContain("Selected variant: 70 ml");
  expect({
    ...cleaned,
    name: original.name,
    description: original.description,
    specs: original.specs,
  }).toEqual(original);
  expect(cleanCatalogCopy(cleaned)).toBe(cleaned);
});
it("applies only explicit repairs, preserves historical records and unrelated inventory, and never resurrects withdrawals", async () => {
  await engine.exec(`CREATE TABLE catalog_products(id text PRIMARY KEY,category text,price integer,record jsonb,publication text,release_id text,leaf_type text,brand text,model_name text,sku_variant text);
    CREATE TABLE catalog_operator_jobs(id text PRIMARY KEY,kind text,payload jsonb,status text,completed_at timestamptz);`);
  const before = {
    ...productById("B010"),
    id: "repair-old",
    brand: "Test House",
    stock: 7,
    price: 12345,
  };
  const next = {
    ...before,
    id: "repair-next",
    name: "Exact reference",
    media: {
      url: "/images/verified/test.webp",
      source: before.source,
      alt: "Exact reference",
      attribution: "Fixture",
      reviewedAt: "2026-10-24",
      usage: "external_reference" as const,
    },
  };
  const expected = {
    name: before.name,
    brand: before.brand,
    source: before.source,
    attributes: before.attributes,
  };
  const operation: CatalogRepair = {
    oldId: before.id,
    expected,
    product: next,
    reason: "Exact manufacturer SKU recovery fixture",
    evidence: {},
  };
  for (const record of [before, { ...before, id: "unrelated" }])
    await sql.query(
      "INSERT INTO catalog_products(id,category,price,record,publication) VALUES($1,$2,$3,$4::jsonb,'published')",
      [record.id, record.category, record.price, JSON.stringify(record)],
    );
  expect(
    await engine.transaction((tx) =>
      applyCatalogRepairs(tx as Sql, [operation]),
    ),
  ).toEqual({ applied: 1, skipped: 0, alreadyApplied: 0 });
  const old = await sql.query<{ record: unknown; publication: string }>(
    "SELECT record,publication FROM catalog_products WHERE id='repair-old'",
  );
  expect(old.rows[0]).toEqual({ record: before, publication: "retired" });
  expect(await publishedReplacement(sql, before.id)).toBe(next.id);
  expect(
    (
      await sql.query<{ record: unknown; publication: string }>(
        "SELECT record,publication FROM catalog_products WHERE id='unrelated'",
      )
    ).rows[0],
  ).toEqual({
    record: { ...before, id: "unrelated" },
    publication: "published",
  });
  await sql.query(
    "UPDATE catalog_products SET publication='retired' WHERE id=$1",
    [next.id],
  );
  expect((await applyCatalogRepairs(sql, [operation])).alreadyApplied).toBe(1);
  expect(await publishedReplacement(sql, before.id)).toBeUndefined();
  // Source failure, a changed specification, or an unrelated ID is not a withdrawal.
  const stale = {
    ...operation,
    oldId: "unrelated",
    expected: { ...expected, name: "Stale review" },
  };
  expect((await applyCatalogRepairs(sql, [stale])).skipped).toBe(1);
  expect(
    (
      await sql.query<{ publication: string }>(
        "SELECT publication FROM catalog_products WHERE id='unrelated'",
      )
    ).rows[0].publication,
  ).toBe("published");
  const inplace: CatalogRepair = {
    ...operation,
    oldId: "unrelated",
    product: { ...next, id: "unrelated", stock: 999, price: 1 },
    reason: "Correct image, preserve current inventory",
  };
  expect((await applyCatalogRepairs(sql, [inplace])).applied).toBe(1);
  const updated = (
    await sql.query<{ record: typeof before }>(
      "SELECT record FROM catalog_products WHERE id='unrelated'",
    )
  ).rows[0].record;
  expect([updated.price, updated.stock]).toEqual([12345, 7]);
});
it("every bundled correction has a consistent exact variant and intact reviewed photograph", () => {
  const seen = new Set<string>();
  for (const operation of plan.operations) {
    expect(seen.has(operation.oldId)).toBe(false);
    seen.add(operation.oldId);
    expect(operation.product.brand).toBe(operation.expected.brand);
    expect(hasConsistentBottleVolume(operation.product)).toBe(true);
    const image = resolveVerifiedProductImage(
      operation.product,
      registry.entries,
    );
    expect(image.url, operation.oldId).toBeTruthy();
    const entry =
      registry.entries[operation.product.id as keyof typeof registry.entries];
    expect(
      createHash("sha256")
        .update(readFileSync("public" + image.url))
        .digest("hex"),
    ).toBe(entry.sha256);
    expect(operation.product.media?.url).toBe(image.url);
    expect(operation.product.specs.length).toBeGreaterThan(1);
  }
  expect(plan.operations.filter((o) => o.oldId !== o.product.id).length).toBe(
    257,
  );
  expect(plan.policy).toContain("remain untouched");
});
