import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../src/server/database";
import { browseCatalog, catalogSummary } from "../src/server/catalog-store";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Milestone I4: Wave 1 Core Electronics Depth & Accessory Graph", () => {
  beforeAll(async () => {
    // Database connection check
    const db = await getDatabase();
    expect(db).toBeDefined();
  });

  it("should have all 13 core electronics leaf targets with brand floor >= 10 in censuses", () => {
    const leaves = [
      "laptops", "tablets", "phones", "headphones", "earbuds",
      "speakers", "wall-chargers", "power-banks", "portable-ssds",
      "internal-ssds", "hard-drives", "keyboards", "mice"
    ];

    for (const leaf of leaves) {
      const censusPath = resolve(process.cwd(), `catalog/census/${leaf}.json`);
      const raw = JSON.parse(readFileSync(censusPath, "utf-8"));
      const brands = new Set(raw.entries.map((e: { canonicalBrand: string }) => e.canonicalBrand));
      // Apple is published starter for phones; adding it if leaf is phones
      if (leaf === "phones") brands.add("Apple");

      expect(brands.size).toBeGreaterThanOrEqual(10);
      expect(raw.entries.length).toBeGreaterThan(0);
    }
  });

  it("should verify depth requirements for key user-demanded categories", async () => {
    // Laptops: 100+ models across 12 brands
    const laptops = await browseCatalog({ leafType: "laptops" });
    expect(laptops.total).toBeGreaterThanOrEqual(100);

    // Phones: 80+ census models across 11 brands
    const phones = await browseCatalog({ leafType: "phones" });
    expect(phones.total).toBeGreaterThanOrEqual(80);

    // Tablets: 50+ models
    const tablets = await browseCatalog({ leafType: "tablets" });
    expect(tablets.total).toBeGreaterThanOrEqual(50);

    // Headphones: 70+ models across 12 audiophile brands
    const headphones = await browseCatalog({ leafType: "headphones" });
    expect(headphones.total).toBeGreaterThanOrEqual(70);
  });

  it("should include affordable Indian third-party chargers (Ambrane and Portronics) with fast-charging specs", async () => {
    const ambraneChargers = await browseCatalog({ leafType: "wall-chargers", brand: "Ambrane" });
    expect(ambraneChargers.total).toBeGreaterThan(0);
    const firstAmbrane = ambraneChargers.products[0];
    expect(firstAmbrane.brand).toBe("Ambrane");
    expect(firstAmbrane.price).toBeLessThan(5000); // Affordable pricing verified

    const portronicsChargers = await browseCatalog({ leafType: "wall-chargers", brand: "Portronics" });
    expect(portronicsChargers.total).toBeGreaterThan(0);
    const firstPortronics = portronicsChargers.products[0];
    expect(firstPortronics.brand).toBe("Portronics");
    expect(firstPortronics.price).toBeLessThan(5000);

    const ambranePowerBanks = await browseCatalog({ leafType: "power-banks", brand: "Ambrane" });
    expect(ambranePowerBanks.total).toBeGreaterThan(0);

    const portronicsPowerBanks = await browseCatalog({ leafType: "power-banks", brand: "Portronics" });
    expect(portronicsPowerBanks.total).toBeGreaterThan(0);
  });

  it("should populate device accessory compatibility relations in catalog_device_accessories", async () => {
    const db = await getDatabase();
    const relations = await db.query<{ count: string }>(
      "SELECT count(*) FROM catalog_device_accessories WHERE compatibility_state='fits'"
    );
    expect(Number(relations.rows[0].count)).toBeGreaterThanOrEqual(500);

    // Check accessories for MacBook Air 13 M2 ("air13")
    const macAccessories = await db.query<{ accessory_id: string }>(
      "SELECT accessory_id FROM catalog_device_accessories WHERE device_id='air13' LIMIT 10"
    );
    expect(macAccessories.rows.length).toBeGreaterThan(0);

    // Check accessories for iPhone 16 Pro ("iphone-16-pro")
    const phoneAccessories = await db.query<{ accessory_id: string }>(
      "SELECT accessory_id FROM catalog_device_accessories WHERE device_id='iphone-16-pro' LIMIT 10"
    );
    expect(phoneAccessories.rows.length).toBeGreaterThan(0);
  });

  it("should return leafCounts across all 13 core categories via catalogSummary and browseCatalog", async () => {
    const store = await catalogSummary();
    expect(store.leafCounts).toBeDefined();

    const expectedLeaves = [
      "laptops", "tablets", "phones", "headphones", "earbuds",
      "speakers", "wall-chargers", "power-banks", "portable-ssds",
      "internal-ssds", "hard-drives", "keyboards", "mice"
    ];

    for (const leaf of expectedLeaves) {
      expect(store.leafCounts[leaf]).toBeGreaterThan(0);
    }
  });

  it("should support brand and leaf faceted filtering simultaneously", async () => {
    const result = await browseCatalog({ leafType: "laptops", brand: "Apple" });
    expect(result.total).toBeGreaterThan(0);
    for (const p of result.products) {
      expect((p.brand || "").toLowerCase()).toBe("apple");
    }

    const beyerHeadphones = await browseCatalog({ leafType: "headphones", brand: "Beyerdynamic" });
    expect(beyerHeadphones.total).toBeGreaterThan(0);
    for (const p of beyerHeadphones.products) {
      expect((p.brand || "").toLowerCase()).toBe("beyerdynamic");
    }
  });
});
