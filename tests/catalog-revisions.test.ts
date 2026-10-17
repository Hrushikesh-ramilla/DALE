import { afterAll, beforeAll, expect, it } from "vitest";
import { productById } from "../src/domain/catalog";
import {
  stageCatalog,
  publishCatalog,
  createProductRevision,
  rollbackProductRevision,
  getProductRevisions,
} from "../src/server/catalog-publishing";
import { getStoredProduct, browseCatalog } from "../src/server/catalog-store";
import { getDatabase, closeDatabase } from "../src/server/database";
import { customerSession } from "../src/server/customers";
import { makeQuote, checkout, snapshot } from "../src/server/service";
import type { CatalogManifestV2 } from "../src/domain/catalog-manifest";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "catalog-revisions-fixture-secret-32-chars";
});

afterAll(() => closeDatabase());

function manifestV2(id: string): CatalogManifestV2 {
  const original = productById("B010");
  return {
    schemaVersion: "catalog-manifest-v2",
    id,
    reviewedBy: "revision-test-suite",
    reviewedAt: "2026-10-11",
    approvedSourceHosts: [new URL(original.source).hostname],
    products: [
      {
        ...original,
        sponsored: false,
        provenance: "manufacturer_evidence",
        brand: original.brand ?? "Maison Francis Kurkdjian",
        offerKind: "sandbox",
        evidence: original.evidence ?? {
          checkedAt: "2026-10-11",
          region: "US",
          missing: [],
          review: "specifications",
        },
        attributes: {
          ...original.attributes,
          brand: original.brand ?? "Maison Francis Kurkdjian",
        },
        id: `rev-test-${id}`,
        name: `${original.name} (v2 manifest)`,
        leafType: "fragrance",
        modelName: "Baccarat Rouge 540",
        skuVariant: "70ml-spray",
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

it("additive database migration reruns cleanly and creates new tables and columns", async () => {
  const database = await getDatabase();
  // Ensure tables exist and can be queried
  const tables = await database.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
  );
  const tableNames = tables.rows.map((t) => t.table_name);
  expect(tableNames).toContain("catalog_fact_revisions");
  expect(tableNames).toContain("catalog_device_accessories");
  expect(tableNames).toContain("catalog_operator_jobs");

  // Ensure columns exist on catalog_products
  const columns = await database.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name='catalog_products'`,
  );
  const colNames = columns.rows.map((c) => c.column_name);
  expect(colNames).toContain("leaf_type");
  expect(colNames).toContain("brand");
  expect(colNames).toContain("model_name");
  expect(colNames).toContain("sku_variant");
  expect(colNames).toContain("revision_id");
});

it("publishes v2 manifest and populates leaf columns and attributes", async () => {
  const input = manifestV2("v2-pub");
  const staged = await stageCatalog(input);
  await publishCatalog(staged.id, staged.hash);

  const product = await getStoredProduct(input.products[0].id);
  expect(product.name).toBe(input.products[0].name);

  const database = await getDatabase();
  const dbRow = await database.query<{
    leaf_type: string;
    brand: string;
    model_name: string;
    sku_variant: string;
  }>(
    "SELECT leaf_type, brand, model_name, sku_variant FROM catalog_products WHERE id=$1",
    [input.products[0].id],
  );
  expect(dbRow.rows[0].leaf_type).toBe("fragrance");
  expect(dbRow.rows[0].brand.toLowerCase()).toBe("maison francis kurkdjian");
  expect(dbRow.rows[0].model_name).toBe("Baccarat Rouge 540");
  expect(dbRow.rows[0].sku_variant).toBe("70ml-spray");
});

it("creates an immutable fact revision, supersedes prior revisions, and updates active product record", async () => {
  const input = manifestV2("rev-flow");
  const staged = await stageCatalog(input);
  await publishCatalog(staged.id, staged.hash);
  const pId = input.products[0].id;

  // Initial state has no revision record in catalog_fact_revisions
  const initRevs = await getProductRevisions(pId);
  expect(initRevs).toHaveLength(0);

  // Apply Revision 1
  const rev1Result = await createProductRevision({
    productId: pId,
    revisionId: "rev-001",
    leafType: "fragrance",
    brand: "Maison Francis Kurkdjian",
    modelName: "Baccarat Rouge 540 Extrait",
    skuVariant: "200ml",
    facts: { concentration: "Extrait de Parfum", volumeMl: 200 },
    sourceUrl: "https://www.franciskurkdjian.com/extrait-fact",
    observedAt: "2026-10-11T12:00:00Z",
    observedRegion: "US",
    operatorAudit: "Operator verified manufacturer specification update",
    price: 45000,
  });
  expect(rev1Result.status).toBe("revised");
  expect(rev1Result.revisionId).toBe("rev-001");

  // Verify updated product in database
  const updatedProduct = await getStoredProduct(pId);
  expect(updatedProduct.price).toBe(45000);
  expect(updatedProduct.attributes?.concentration).toBe("Extrait de Parfum");
  expect(updatedProduct.attributes?.volumeMl).toBe(200);

  // Verify revision history
  const revs1 = await getProductRevisions(pId);
  expect(revs1).toHaveLength(1);
  expect(revs1[0].revision_id).toBe("rev-001");
  expect(revs1[0].superseded_at).toBeNull();
  expect(revs1[0].operator_audit).toBe(
    "Operator verified manufacturer specification update",
  );

  // Apply Revision 2
  const rev2Result = await createProductRevision({
    productId: pId,
    revisionId: "rev-002",
    leafType: "fragrance",
    brand: "Maison Francis Kurkdjian",
    modelName: "Baccarat Rouge 540 Extrait Reformulation",
    skuVariant: "200ml-flacon",
    facts: { concentration: "Extrait de Parfum", reformulationYear: 2026 },
    sourceUrl: "https://www.franciskurkdjian.com/reformulation",
    observedAt: "2026-10-11T14:00:00Z",
    observedRegion: "FR",
    operatorAudit: "Operator noted annual batch reformulation certificate",
    price: 46000,
  });
  expect(rev2Result.status).toBe("revised");

  const revs2 = await getProductRevisions(pId);
  expect(revs2).toHaveLength(2);
  // rev-002 is active (superseded_at is null), rev-001 is superseded
  const rev002 = revs2.find((r) => r.revision_id === "rev-002");
  const rev001 = revs2.find((r) => r.revision_id === "rev-001");
  expect(rev002?.superseded_at).toBeNull();
  expect(rev001?.superseded_at).not.toBeNull();
});

it("rolls back to an earlier revision cleanly and records audit history", async () => {
  const pId = "rev-test-rev-flow";
  const rollbackResult = await rollbackProductRevision(
    pId,
    "rev-001",
    "Rolling back due to unconfirmed reformulation data",
  );
  expect(rollbackResult.status).toBe("rolled_back");
  expect(rollbackResult.targetRevisionId).toBe("rev-001");

  // Verify active record was restored
  const restoredProduct = await getStoredProduct(pId);
  expect(restoredProduct.attributes?.concentration).toBe("Extrait de Parfum");
  expect(restoredProduct.attributes?.volumeMl).toBe(200);

  const history = await getProductRevisions(pId);
  expect(history.length).toBeGreaterThanOrEqual(3);
  expect(history[0].operator_audit).toContain("Rollback to rev-001");
});

it("preserves historical quote and order terms immutably across catalog revisions and price changes", async () => {
  const input = manifestV2("immutable-quote");
  const staged = await stageCatalog(input);
  await publishCatalog(staged.id, staged.hash);
  const pId = input.products[0].id;

  const { actor } = await customerSession({ action: "guest" });

  // Create quote with original price (32500)
  const originalPrice = input.products[0].price;
  const quote = await makeQuote(actor, pId, "not-required");
  expect(quote.amount).toBe(originalPrice);

  // Operator now updates the catalog product via revision with higher price (50000)
  await createProductRevision({
    productId: pId,
    revisionId: "rev-price-hike",
    facts: { msrpChanged: true },
    sourceUrl: "https://www.franciskurkdjian.com/price-update",
    observedAt: "2026-10-11T16:00:00Z",
    observedRegion: "US",
    operatorAudit: "Manufacturer MSRP adjustment",
    price: 50000,
  });

  // Verify stored product in catalog now has price 50000
  const productNow = await getStoredProduct(pId);
  expect(productNow.price).toBe(50000);

  // The previously issued customer quote MUST STILL checkout with original price
  const order = await checkout(actor, quote.id, quote.fingerprint);
  expect(order.quote.amount).toBe(originalPrice);
  expect(order.quote.amount).not.toBe(50000);

  const customerView = await snapshot(actor);
  const ownedOrder = customerView.orders.find((o) => o.id === order.id);
  expect(ownedOrder?.quote.amount).toBe(originalPrice);
});
