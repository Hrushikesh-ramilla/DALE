import { afterAll, beforeAll, expect, it } from "vitest";
import { productById } from "../src/domain/catalog";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import {
  stageCatalog,
  publishCatalog,
  retireCatalog,
  restoreCatalog,
} from "../src/server/catalog-publishing";
import {
  catalogSummary,
  browseCatalog,
  getStoredProduct,
  searchStoredCatalog,
} from "../src/server/catalog-store";
import { bootstrapCatalog } from "../src/server/catalog-bootstrap";
import { getDatabase, closeDatabase } from "../src/server/database";
import { customerSession } from "../src/server/customers";
import { actionSchema } from "../src/domain/actions";
import {
  makeQuote,
  checkout,
  capture,
  snapshot,
  updateBrief,
  joinGroup,
} from "../src/server/service";

beforeAll(async () => {
  await closeDatabase();
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "catalog-publishing-fixture-secret-at-least-32";
});
afterAll(() => closeDatabase());
function manifest(id: string) {
  const original = productById("B010");
  return {
    schemaVersion: "catalog-manifest-v1",
    id,
    reviewedBy: "isolated-contract-fixture",
    reviewedAt: "2026-10-11",
    approvedSourceHosts: [new URL(original.source).hostname],
    products: [
      {
        ...original,
        id: `test-${id}`,
        name: `${original.name} (isolated publication fixture)`,
        media: {
          url: "https://www.franciskurkdjian.com/test-fixture.jpg",
          source: original.source,
          alt: "Synthetic media contract fixture",
          attribution: "Synthetic test fixture; no image is fetched",
          reviewedAt: "2026-10-11",
          usage: "external_reference",
        },
      },
    ],
  };
}
it(
  "paginates a full 500-record publication without duplicates or fixture leakage",
  async () => {
  const input = manifest("batch-capacity");
  const template = input.products[0];
  input.products = Array.from({ length: 500 }, (_, index) => ({
    ...template,
    id: `isolated-capacity-${index.toString().padStart(4, "0")}`,
    name: `IsolatedCapacity ${index}`,
    price: 10000 + index,
  }));
  const staged = await stageCatalog(input);
  expect((await browseCatalog({ query: "IsolatedCapacity" })).total).toBe(0);
  await publishCatalog(staged.id, staged.hash);
  const ids: string[] = [];
  for (let page = 1; page <= 11; page++) {
    const result = await browseCatalog({ query: "IsolatedCapacity", page });
    expect(result.total).toBe(500);
    expect(result.products.length).toBe(page === 11 ? 20 : 48);
    ids.push(...result.products.map((product) => product.id));
  }
  expect(new Set(ids).size).toBe(500);
  expect(ids).toEqual(input.products.map((product) => product.id));
  const continuedIds: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await browseCatalog({ query: "IsolatedCapacity", cursor });
    continuedIds.push(...result.products.map((product) => product.id));
    cursor = result.nextCursor || undefined;
  } while (cursor);
  expect(continuedIds).toEqual(ids);
  // A feature-preferred record beyond the cheapest 100 still has to be retrieved.
  const database = await getDatabase();
  const preferredId = ids.at(-1)!;
  await database.query(
    "UPDATE catalog_products SET record=jsonb_set(record,'{specs}',$2::jsonb) WHERE id=$1",
    [preferredId, JSON.stringify(["CapacityPreferenceFact"])],
  );
  for (const scoring of [
    { priority: "features" as const },
    { weights: { price: 1, features: 100 } },
  ]) {
    const candidates = await searchStoredCatalog({
      model: "not-required",
      budget: 15000,
      category: "fragrance",
      requirements: { brand: template.attributes!.brand },
      preference: "CapacityPreferenceFact",
      ...scoring,
    });
    expect(candidates).toHaveLength(100);
    expect(candidates[0].id).toBe(preferredId);
  }
  const first = await browseCatalog({ query: "IsolatedCapacity" });
  await expect(
    browseCatalog({ query: "different", cursor: first.nextCursor! }),
  ).rejects.toThrow("continuation");
  // Withdrawing an earlier record must not shift the next page or repeat IDs.
  await database.query(
    "UPDATE catalog_products SET publication='retired' WHERE id=$1",
    [ids[0]],
  );
  const second = await browseCatalog({
    query: "IsolatedCapacity",
    cursor: first.nextCursor!,
  });
  expect(second.products.map((p) => p.id)).toEqual(ids.slice(48, 96));
  await retireCatalog(staged.id);
  expect((await browseCatalog({ query: "IsolatedCapacity" })).total).toBe(0);
}, 90000);
it("accepts full manifest product IDs for explicit commerce approvals", () => {
  const productId = "record-" + "x".repeat(73);
  for (const action of ["quote", "join_group"]) {
    expect(
      actionSchema.safeParse({ action, productId, model: "not-required" })
        .success,
    ).toBe(true);
    expect(
      actionSchema.safeParse({
        action,
        productId: productId + "x",
        model: "not-required",
      }).success,
    ).toBe(false);
  }
});
it("stages privately, publishes without a code whitelist, and preserves new-product commerce and retirement history", async () => {
  const input = manifest("lifecycle");
  const id = input.products[0].id;
  const before = await browseCatalog({});
  const staged = await stageCatalog(input);
  expect((await browseCatalog({})).total).toBe(before.total);
  expect(await stageCatalog(input)).toMatchObject({
    existing: true,
    hash: staged.hash,
  });
  await publishCatalog(staged.id, staged.hash);
  expect((await browseCatalog({})).total).toBe(before.total + 1);
  expect(await publishCatalog(staged.id, staged.hash)).toMatchObject({
    existing: true,
  });
  expect(
    (
      await searchStoredCatalog({
        model: "not-required",
        category: "fragrance",
        budget: 40000,
        requirements: { brand: "maison francis kurkdjian" },
      })
    ).some((p) => p.id === id),
  ).toBe(true);
  const { actor } = await customerSession({ action: "guest" });
  await updateBrief(actor, {
    message: "Recorded fragrance",
    model: "not-required",
    category: "fragrance",
    budget: 40000,
    priority: "price",
    preference: "",
    confirmConstraints: true,
    requirements: { brand: "maison francis kurkdjian", volumeMl: 70 },
  });
  const quote = await makeQuote(actor, id, "not-required");
  const order = await checkout(actor, quote.id, quote.fingerprint);
  await capture(actor, order.id);
  const owned = await snapshot(actor);
  expect(owned.orders.some((o) => o.id === order.id && o.captureId)).toBe(true);
  expect(owned.catalogReferences.some((p) => p.id === id)).toBe(true);
  await retireCatalog(staged.id);
  expect((await browseCatalog({})).products.some((p) => p.id === id)).toBe(
    false,
  );
  expect((await getStoredProduct(id)).name).toBe(input.products[0].name);
  await expect(makeQuote(actor, id, "not-required")).rejects.toThrow("retired");
  expect((await snapshot(actor)).orders.some((o) => o.id === order.id)).toBe(
    true,
  );
  await expect(publishCatalog(staged.id, staged.hash)).rejects.toThrow(
    "retired",
  );
});
it("joins the same imported exact product from independent customers and rejects stale unpublished approvals", async () => {
  const input = manifest("shared-group");
  const release = await stageCatalog(input);
  await publishCatalog(release.id, release.hash);
  const first = await customerSession({ action: "guest" });
  const second = await customerSession({ action: "guest" });
  const id = input.products[0].id;
  const group = await joinGroup(first.actor, id, "not-required");
  expect(await joinGroup(second.actor, id, "not-required")).toBe(group);
  expect(
    (await snapshot(first.actor)).groups.find((g) => g.id === group),
  ).toMatchObject({ memberCount: 2, status: "ready" });
  const quote = await makeQuote(first.actor, id, "not-required", group);
  await retireCatalog(release.id);
  await expect(
    checkout(first.actor, quote.id, quote.fingerprint),
  ).rejects.toThrow("retired");
});
it("rejects identity collisions, modified manifests and unchecked hashes atomically", async () => {
  const input = manifest("immutable");
  const release = await stageCatalog(input);
  await expect(
    stageCatalog({ ...input, reviewedBy: "changed-reviewer" }),
  ).rejects.toThrow("immutable");
  await expect(publishCatalog(release.id, "wrong-hash")).rejects.toThrow(
    "hash",
  );
  await expect(
    stageCatalog({
      ...manifest("old-id"),
      products: [{ ...input.products[0], id: "B010" }],
    }),
  ).rejects.toThrow("existing product");
  expect(
    (await browseCatalog({})).products.some(
      (p) => p.id === input.products[0].id,
    ),
  ).toBe(false);
});
it("requires reviewed media and rejects unsafe sources, duplicates and purchasable identity-only records", async () => {
  const input = manifest("no-media");
  const { media: unused, ...withoutMedia } = input.products[0];
  void unused;
  const release = await stageCatalog({ ...input, products: [withoutMedia] });
  await expect(publishCatalog(release.id, release.hash)).rejects.toThrow(
    "media",
  );
  expect(
    catalogManifestSchema.safeParse({
      ...input,
      products: [{ ...input.products[0], source: "http://localhost/internal" }],
    }).success,
  ).toBe(false);
  expect(
    catalogManifestSchema.safeParse({
      ...input,
      approvedSourceHosts: ["wrong.example"],
    }).success,
  ).toBe(false);
  expect(
    catalogManifestSchema.safeParse({
      ...input,
      products: [input.products[0], input.products[0]],
    }).success,
  ).toBe(false);
  expect(
    catalogManifestSchema.safeParse({
      ...input,
      products: [
        {
          ...input.products[0],
          evidence: {
            ...input.products[0].evidence,
            review: "product_identity",
          },
        },
      ],
    }).success,
  ).toBe(false);
});
it("bootstrap and ordinary reads preserve imported records and existing operator updates", async () => {
  const database = await getDatabase();
  const original = await getStoredProduct("B010");
  await database.query(
    "UPDATE catalog_products SET price=price+1 WHERE id='B010'",
  );
  const before = await database.query<{ price: number }>(
    "SELECT price FROM catalog_products WHERE id='B010'",
  );
  await database.transaction((sql) => bootstrapCatalog(sql));
  await browseCatalog({});
  expect(
    (
      await database.query<{ price: number }>(
        "SELECT price FROM catalog_products WHERE id='B010'",
      )
    ).rows[0].price,
  ).toBe(before.rows[0].price);
  expect((await getStoredProduct("B010")).name).toBe(original.name);
});

it("indexes word-order-independent search and returns database-backed department facets", async () => {
  const input = manifest("indexed-lookup");
  input.products[0].name = "Evidence Cedar Fragrance";
  input.products[0].attributes = {
    ...input.products[0].attributes,
    modelName: "evidence cedar",
    brand: "maison francis kurkdjian",
  };
  const staged = await stageCatalog(input);
  await publishCatalog(staged.id, staged.hash);
  const results = await browseCatalog({ query: "cedar evidence" });
  expect(results.products.map((p) => p.id)).toEqual([input.products[0].id]);
  const summary = await catalogSummary();
  expect(summary.facets.fragrance.modelName).toContain("evidence cedar");
  expect(summary.counts.fragrance).toBeGreaterThan(0);
  await retireCatalog(staged.id);
  expect((await catalogSummary()).facets.fragrance.modelName).not.toContain(
    "evidence cedar",
  );
});

it("restores a withdrawn reviewed release without replacing product identities or historical orders", async () => {
  const input = manifest("restore");
  const staged = await stageCatalog(input);
  await publishCatalog(staged.id, staged.hash);
  const before = await getStoredProduct(input.products[0].id);
  await retireCatalog(staged.id);
  await expect(restoreCatalog(staged.id, "unchecked")).rejects.toThrow("hash");
  expect(
    (
      await browseCatalog({ query: "isolated publication fixture" })
    ).products.some((p) => p.id === before.id),
  ).toBe(false);
  await restoreCatalog(staged.id, staged.hash);
  expect(await getStoredProduct(before.id)).toEqual(before);
  expect(
    (
      await browseCatalog({
        category: "fragrance",
        query: "isolated publication fixture",
      })
    ).products.some((p) => p.id === before.id),
  ).toBe(true);
  expect(await restoreCatalog(staged.id, staged.hash)).toMatchObject({
    existing: true,
  });
});
