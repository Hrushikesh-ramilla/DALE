import { afterAll, beforeAll, expect, it } from "vitest";
import { productById } from "../src/domain/catalog";
import { stageCatalog, publishCatalog } from "../src/server/catalog-publishing";
import { browseCatalog, catalogSummary } from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";
import type { CatalogManifestV2 } from "../src/domain/catalog-manifest";
import { getCategoryLeafTypes, leafTitles } from "../src/domain/departments";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
});

afterAll(() => closeDatabase());

it("maps categories to leaf types and provides descriptive titles", () => {
  const storageLeaves = getCategoryLeafTypes("storage");
  expect(storageLeaves).toContain("portable-ssds");
  expect(storageLeaves).toContain("internal-ssds");
  expect(storageLeaves).toContain("hard-drives");

  const audioLeaves = getCategoryLeafTypes("audio");
  expect(audioLeaves).toContain("speakers");
  expect(audioLeaves).toContain("soundbars");

  expect(leafTitles["laptops"]).toBe("Laptops");
  expect(leafTitles["wall-chargers"]).toBe("Wall Chargers & Power Adapters");
  expect(leafTitles["headphones"]).toBe("Over-Ear & On-Ear Headphones");
});

it("filters catalog by leafType and brand with cursor pagination", async () => {
  const original = productById("B010");
  const manifest: CatalogManifestV2 = {
    schemaVersion: "catalog-manifest-v2",
    id: "nav-test-v2",
    reviewedBy: "navigation-test-reviewer",
    reviewedAt: "2026-10-11",
    approvedSourceHosts: [new URL(original.source).hostname],
    products: [
      {
        ...original,
        sponsored: false,
        provenance: "manufacturer_evidence",
        brand: "Dell",
        offerKind: "sandbox",
        evidence: {
          checkedAt: "2026-10-11",
          region: "US",
          missing: [],
          review: "specifications",
        },
        attributes: {
          brand: "Dell",
          modelName: "XPS 13 9340",
        },
        id: "dell-xps-13",
        name: "Dell XPS 13 9340 Laptop",
        category: "laptops",
        leafType: "laptops",
        price: 9900,
        media: {
          url: "https://www.franciskurkdjian.com/test-fixture.jpg",
          source: original.source,
          alt: "Dell XPS 13",
          attribution: "Synthetic test fixture",
          reviewedAt: "2026-10-11",
          usage: "external_reference",
        },
      },
      {
        ...original,
        sponsored: false,
        provenance: "manufacturer_evidence",
        brand: "Apple",
        offerKind: "sandbox",
        evidence: {
          checkedAt: "2026-10-11",
          region: "US",
          missing: [],
          review: "specifications",
        },
        attributes: {
          brand: "Apple",
          modelName: "MacBook Air 15 M3",
        },
        id: "apple-mba-15",
        name: "Apple MacBook Air 15 M3",
        category: "laptops",
        leafType: "laptops",
        price: 9999,
        media: {
          url: "https://www.franciskurkdjian.com/test-fixture.jpg",
          source: original.source,
          alt: "Apple MacBook Air 15",
          attribution: "Synthetic test fixture",
          reviewedAt: "2026-10-11",
          usage: "external_reference",
        },
      },
      {
        ...original,
        sponsored: false,
        provenance: "manufacturer_evidence",
        brand: "Sennheiser",
        offerKind: "sandbox",
        evidence: {
          checkedAt: "2026-10-11",
          region: "US",
          missing: [],
          review: "specifications",
        },
        attributes: {
          brand: "Sennheiser",
          modelName: "HD 660S2",
        },
        id: "sennheiser-hd660s2",
        name: "Sennheiser HD 660S2 Headphones",
        category: "headphones",
        leafType: "headphones",
        price: 9900,
        media: {
          url: "https://www.franciskurkdjian.com/test-fixture.jpg",
          source: original.source,
          alt: "Sennheiser HD 660S2",
          attribution: "Synthetic test fixture",
          reviewedAt: "2026-10-11",
          usage: "external_reference",
        },
      },
    ],
  };

  const staged = await stageCatalog(manifest);
  await publishCatalog(staged.id, staged.hash);

  // Filter by leafType: laptops
  const laptopResults = await browseCatalog({ leafType: "laptops" });
  expect(laptopResults.products.some((p) => p.id === "dell-xps-13")).toBe(true);
  expect(laptopResults.products.some((p) => p.id === "apple-mba-15")).toBe(true);
  expect(laptopResults.products.some((p) => p.id === "sennheiser-hd660s2")).toBe(false);

  // Filter by leafType + brand
  const dellResults = await browseCatalog({ leafType: "laptops", brand: "dell" });
  expect(dellResults.products.some((p) => p.id === "dell-xps-13")).toBe(true);
  expect(dellResults.products.some((p) => p.id === "apple-mba-15")).toBe(false);

  // Filter by leafType: headphones
  const headphoneResults = await browseCatalog({ leafType: "headphones" });
  expect(headphoneResults.products.some((p) => p.id === "sennheiser-hd660s2")).toBe(true);
  expect(headphoneResults.products.some((p) => p.id === "dell-xps-13")).toBe(false);

  // Summary returns leafCounts
  const summary = await catalogSummary();
  expect(summary.leafCounts["laptops"]).toBeGreaterThanOrEqual(2);
  expect(summary.leafCounts["headphones"]).toBeGreaterThanOrEqual(1);
});
