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
import {
  makeQuote,
  checkout,
  capture,
  snapshot,
  updateBrief,
  joinGroup,
} from "../src/server/service";

beforeAll(() => {
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
    (await browseCatalog({ category: "fragrance" })).products.some(
      (p) => p.id === before.id,
    ),
  ).toBe(true);
  expect(await restoreCatalog(staged.id, staged.hash)).toMatchObject({
    existing: true,
  });
});
