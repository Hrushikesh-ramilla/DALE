import { createHash } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { productById } from "../src/domain/catalog";
import {
  stageCatalog,
  publishCatalog,
  createProductRevision,
  getProductRevisions,
} from "../src/server/catalog-publishing";
import { getStoredProduct } from "../src/server/catalog-store";
import { closeDatabase, getDatabase } from "../src/server/database";
import { customerSession } from "../src/server/customers";
import { makeQuote, checkout } from "../src/server/service";

beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.DATABASE_URL = "";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "media-repair-isolated-fixture-secret-32-chars";
  await getDatabase();
}, 60000);
afterAll(() => closeDatabase());

it("repairs media and incorrect bottle facts without rewriting an issued quote or changing offer identity", async () => {
  const original = productById("B010");
  const product = {
    ...original,
    id: "media-repair-fixture",
    name: "Synthetic media repair contract fixture",
    brand: original.brand!,
    color: "35ml",
    skuVariant: "35ml",
    leafType: "fragrance",
    modelName: "Synthetic repair fixture",
    attributes: {
      ...original.attributes,
      volumeMl: 70,
      brand: original.brand!,
    },
    media: {
      url: "https://www.franciskurkdjian.com/fixture-before.png",
      source: original.source,
      alt: "Synthetic test photograph reference",
      attribution: "Synthetic contract fixture; no media fetched",
      reviewedAt: "2026-10-13",
      usage: "external_reference" as const,
    },
  };
  const staged = await stageCatalog({
    schemaVersion: "catalog-manifest-v2",
    id: "media-repair-contract-fixture",
    reviewedBy: "test-fixture",
    reviewedAt: "2026-10-13",
    approvedSourceHosts: [new URL(product.source).hostname],
    products: [product],
  });
  await publishCatalog(staged.id, staged.hash);
  const current = await getStoredProduct(product.id);
  const actor = (await customerSession({ action: "guest" })).actor;
  const quote = await makeQuote(actor, product.id, "not-required");
  const source = "https://www.franciskurkdjian.com/fixture-corrected-35ml";
  const repair = {
    productId: product.id,
    revisionId: "media-repair-fixture-r1",
    expectedRecordHash: createHash("sha256")
      .update(JSON.stringify(current))
      .digest("hex"),
    facts: { volumeMl: 35 },
    attributes: { ...current.attributes, volumeMl: 35 },
    sourceUrl: source,
    observedAt: "2026-10-13T18:00:00Z",
    observedRegion: "Synthetic fixture",
    operatorAudit: "Synthetic exact-volume/photo correction contract",
    media: {
      ...product.media,
      url: "https://www.franciskurkdjian.com/fixture-after.png",
      source,
    },
  };
  await expect(
    createProductRevision({ ...repair, expectedRecordHash: "0".repeat(64) }),
  ).rejects.toThrow("Product changed since repair review");
  expect(await getProductRevisions(product.id)).toHaveLength(0);
  await createProductRevision(repair);
  const corrected = await getStoredProduct(product.id);
  expect(corrected.id).toBe(current.id);
  expect(corrected.price).toBe(current.price);
  expect(corrected.stock).toBe(current.stock);
  expect(corrected.color).toBe("35ml");
  expect(corrected.skuVariant).toBe("35ml");
  expect(corrected.attributes?.volumeMl).toBe(35);
  expect(corrected.source).toBe(source);
  expect(corrected.media?.url).toBe(repair.media.url);
  const order = await checkout(actor, quote.id, quote.fingerprint);
  expect(order.quote.amount).toBe(quote.amount);
  expect(order.quote.fingerprint).toBe(quote.fingerprint);

  const replacement = {
    ...corrected,
    id: "media-repair-new-physical-sku",
    color: "100ml",
    skuVariant: "100ml",
    attributes: { ...corrected.attributes, volumeMl: 100 },
    media: product.media,
  };
  const release = await stageCatalog({
    schemaVersion: "catalog-manifest-v2",
    id: "media-repair-replacement-fixture",
    reviewedBy: "test-fixture",
    reviewedAt: "2026-10-14",
    approvedSourceHosts: [new URL(source).hostname],
    products: [replacement],
  });
  const mappings = [
    {
      oldProductId: corrected.id,
      newProductId: replacement.id,
      expectedRecordHash: createHash("sha256")
        .update(JSON.stringify(corrected))
        .digest("hex"),
    },
  ];
  await expect(
    publishCatalog(release.id, release.hash, [
      { ...mappings[0], expectedRecordHash: "0".repeat(64) },
    ]),
  ).rejects.toThrow("Replacement review is stale");
  const database = await getDatabase();
  expect(
    (
      await database.query("SELECT id FROM catalog_products WHERE id=$1", [
        replacement.id,
      ])
    ).rows,
  ).toHaveLength(0);
  await publishCatalog(release.id, release.hash, mappings);
  expect(
    (
      await database.query<{ publication: string }>(
        "SELECT publication FROM catalog_products WHERE id=$1",
        [corrected.id],
      )
    ).rows[0].publication,
  ).toBe("retired");
  expect(await getStoredProduct(corrected.id)).toEqual(corrected);
  expect((await getStoredProduct(replacement.id)).attributes?.volumeMl).toBe(
    100,
  );
  expect(
    (await publishCatalog(release.id, release.hash, mappings)).existing,
  ).toBe(true);
  await expect(
    publishCatalog(release.id, release.hash, [
      { ...mappings[0], newProductId: "different" },
    ]),
  ).rejects.toThrow("Published replacement audit");
}, 60000);
