import { afterAll, beforeAll, expect, it } from "vitest";
import manifest from "../catalog/manifests/eyewear-oakley-2026-10-11-v1.json";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import {
  browseCatalog,
  catalogSummary,
  catalogLanguageContext,
} from "../src/server/catalog-store";
import { getDatabase, closeDatabase } from "../src/server/database";
import { bootstrapCatalog } from "../src/server/catalog-bootstrap";
import {
  retireCatalog,
  restoreCatalog,
} from "../src/server/catalog-publishing";
import { fallbackWorkflow } from "../src/domain/agent-workflow";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
afterAll(() => closeDatabase());
it("publishes ten distinct reviewed models with exact-reference media and no invented lens facts", async () => {
  const parsed = catalogManifestSchema.parse(manifest);
  expect(new Set(parsed.products.map((p) => p.attributes.modelName)).size).toBe(
    10,
  );
  const result = await browseCatalog({
    category: "sunglasses",
    requirements: { brand: "oakley" },
  });
  expect(result.total).toBe(10);
  expect((await catalogSummary()).counts.sunglasses).toBe(20);
  for (const product of result.products) {
    expect(product.media?.url).toContain("assets2.oakley.com");
    expect(product.name).toContain(product.id.replace("EYE-", ""));
    expect(product.attributes?.polarization).toBeUndefined();
    expect(product.attributes?.uvProtection).toBeUndefined();
    expect(product.evidence?.missing.length).toBeGreaterThan(0);
  }
  const context = await catalogLanguageContext(
    "Compare square Oakley sunglasses under $250 and use group buying",
  );
  const planned = fallbackWorkflow(
    {
      task: "Compare square Oakley sunglasses under $250 and use group buying",
      model: "not-required",
      budget: 25000,
    },
    undefined,
    context,
  );
  expect(planned.plan).toMatchObject({
    tool: "search_retail",
    category: "sunglasses",
    requirements: { brand: "oakley", frameShape: "square" },
  });
  expect(
    (
      await browseCatalog({
        category: "sunglasses",
        requirements: { frameShape: "square" },
      })
    ).total,
  ).toBe(2);
  expect(
    (
      await browseCatalog({
        category: "sunglasses",
        requirements: { polarization: "polarized" },
      })
    ).total,
  ).toBe(0);
});
it("preserves withdrawal across bootstrap/restart and supports reviewed restoration", async () => {
  const database = await getDatabase();
  const release = await database.query<{ content_hash: string }>(
    "SELECT content_hash FROM catalog_releases WHERE id=$1",
    [manifest.id],
  );
  await retireCatalog(manifest.id);
  await database.transaction((sql) => bootstrapCatalog(sql));
  expect(
    (
      await browseCatalog({
        category: "sunglasses",
        requirements: { brand: "oakley" },
      })
    ).total,
  ).toBe(0);
  await restoreCatalog(manifest.id, release.rows[0].content_hash);
  expect(
    (
      await browseCatalog({
        category: "sunglasses",
        requirements: { brand: "oakley" },
      })
    ).total,
  ).toBe(10);
});
