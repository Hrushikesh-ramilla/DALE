import { afterAll, beforeAll, expect, it } from "vitest";
import manifest from "../catalog/manifests/eyewear-ray-ban-2026-10-11-v1.json";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import {
  browseCatalog,
  catalogLanguageContext,
} from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";
import { fallbackWorkflow } from "../src/domain/agent-workflow";
import { brandedShopping } from "../src/domain/branded-shopping";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
afterAll(() => closeDatabase());
it("publishes ten exact Ray-Ban models with observed facts and disclosed gaps", async () => {
  const parsed = catalogManifestSchema.parse(manifest);
  expect(new Set(parsed.products.map((product) => product.familyId)).size).toBe(
    10,
  );
  const published = await browseCatalog({
    category: "sunglasses",
    requirements: { brand: "ray-ban" },
  });
  expect(published.total).toBe(10);
  for (const product of published.products) {
    expect(product.media?.url).toContain("images2.ray-ban.com");
    expect(product.attributes?.uvProtection).toBeUndefined();
    expect(product.evidence?.missing.length).toBeGreaterThan(0);
  }
});
it("grounds spaced and compact brand aliases without guessing polarization", async () => {
  for (const brand of ["Ray-Ban", "Ray Ban", "Rayban"]) {
    const input = {
      task: `Find ${brand} sunglasses under $250 and use group buying`,
      model: "not-required",
      budget: 25000,
    };
    const records = await catalogLanguageContext(input.task);
    expect(
      records.filter((product) => product.brand === "Ray-Ban"),
    ).toHaveLength(10);
    expect(fallbackWorkflow(input, undefined, records).plan).toMatchObject({
      tool: "search_retail",
      category: "sunglasses",
      requirements: { brand: "ray-ban" },
    });
  }
  expect(
    (
      await browseCatalog({
        category: "sunglasses",
        requirements: { brand: "ray-ban", polarization: "polarized" },
      })
    ).total,
  ).toBe(0);
  expect(
    (
      await browseCatalog({
        category: "sunglasses",
        requirements: { brand: "ray-ban", polarization: "non-polarized" },
      })
    ).total,
  ).toBe(4);
});
it("does not replace an unavailable extended model with its base model", async () => {
  const records = await catalogLanguageContext(
    "Find Oakley Holbrook XL sunglasses under $250",
  );
  expect(
    brandedShopping(
      "Find Oakley Holbrook XL sunglasses under $250",
      25000,
      records,
    ),
  ).toMatchObject({ kind: "clarification" });
});
