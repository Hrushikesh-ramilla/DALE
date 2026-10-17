import { describe, it, expect } from "vitest";
import {
  loadCoverageTargets,
  coverageTargetsFileSchema,
  censusManifestFileSchema,
  summarizeLeafCensus,
  CensusManifestFile,
  CoverageTarget,
} from "../src/domain/coverage-targets";

describe("Coverage Targets & Census Registry Framework", () => {
  it("loads and validates catalog/coverage-targets.json with exactly 50 leaf targets", () => {
    const registry = loadCoverageTargets();
    expect(registry.totalLeafTargets).toBe(50);
    expect(registry.targets).toHaveLength(50);

    const waveBreakdown: Record<string, number> = {};
    const seenLeafKeys = new Set<string>();

    for (const target of registry.targets) {
      expect(seenLeafKeys.has(target.leafKey)).toBe(false);
      seenLeafKeys.add(target.leafKey);

      expect(target.brandFloor).toBeGreaterThanOrEqual(10);
      expect(target.priorityBrands.length).toBeGreaterThanOrEqual(10);
      expect(target.targetPlacements.min).toBeGreaterThanOrEqual(100);
      expect(target.targetPlacements.max).toBeGreaterThanOrEqual(150);
      expect(target.keyAttributes.length).toBeGreaterThanOrEqual(3);

      waveBreakdown[target.wave] = (waveBreakdown[target.wave] || 0) + 1;
    }

    // Verify exact wave distribution as specified in ASSORTMENT_DEPTH_MASTER_PLAN
    expect(waveBreakdown["electronics-core"]).toBe(13);
    expect(waveBreakdown["electronics-remaining"]).toBe(8);
    expect(waveBreakdown["clothing"]).toBe(9);
    expect(waveBreakdown["lifestyle"]).toBe(15);
    expect(waveBreakdown["home-appliances"]).toBe(5);
  });

  it("validates and parses a conforming census manifest file", () => {
    const dummyManifest: CensusManifestFile = {
      leafKey: "laptops",
      displayName: "Laptops",
      censusDate: "2026-10-11",
      entries: [
        {
          id: "apple-macbook-air-13-m3",
          canonicalBrand: "Apple",
          displayBrand: "Apple",
          productLine: "MacBook Air",
          modelName: "MacBook Air 13 (M3)",
          generationOrYear: "2024",
          sourceUrls: ["https://www.apple.com/in/macbook-air/specs/"],
          observationDate: "2026-10-11",
          sourceRegion: "IN",
          lifecycle: "active",
          variants: ["Midnight", "Starlight", "Space Gray", "Silver", "256GB", "512GB"],
          mediaSource: {
            url: "https://www.apple.com/newsroom/images/2024/03/apple-unveils-the-new-13-and-15-inch-macbook-air-with-the-powerful-m3-chip/article/Apple-MacBook-Air-M3-midnight-front_inline.jpg.large.jpg",
          },
          collectedAttributes: {
            cpu: "Apple M3 (8-core CPU)",
            gpu: "8-core or 10-core GPU",
            displayInches: 13.6,
            ramGb: 8,
            usbCPDWatts: 70,
            weightKg: 1.24,
          },
          missingAttributes: [],
          inclusionReason: "Flagship consumer ultralight laptop",
          status: "staged",
        },
      ],
      supplyExceptions: [],
    };

    const parsed = censusManifestFileSchema.parse(dummyManifest);
    expect(parsed.leafKey).toBe("laptops");
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].modelName).toBe("MacBook Air 13 (M3)");
  });

  it("enforces model deduplication: variant repetitions do not increase distinct model counts", () => {
    const dummyTarget: CoverageTarget = {
      leafKey: "laptops",
      displayName: "Laptops",
      department: "electronics",
      parentCategory: "laptops",
      wave: "electronics-core",
      brandFloor: 10,
      modelsPerBrandTarget: { min: 10, max: 15 },
      targetPlacements: { min: 100, max: 150 },
      priorityBrands: [
        "Apple",
        "Dell",
        "HP",
        "ASUS",
        "Acer",
        "MSI",
        "Microsoft",
        "Lenovo",
        "Samsung",
        "LG",
      ],
      distinctFamilyPolicy: "Distinct chassis and generation",
      keyAttributes: ["cpu", "ramGb", "displayInches"],
    };

    const dummyManifest: CensusManifestFile = {
      leafKey: "laptops",
      displayName: "Laptops",
      censusDate: "2026-10-11",
      entries: [
        {
          id: "apple-macbook-air-13-m3-256",
          canonicalBrand: "Apple",
          displayBrand: "Apple",
          modelName: "MacBook Air 13 (M3)",
          sourceUrls: ["https://www.apple.com/in/macbook-air/specs/"],
          observationDate: "2026-10-11",
          sourceRegion: "IN",
          lifecycle: "active",
          variants: ["256GB"],
          collectedAttributes: { cpu: "M3", ramGb: 8, displayInches: 13.6 },
          missingAttributes: [],
          inclusionReason: "Base variant",
          status: "staged",
        },
        {
          id: "apple-macbook-air-13-m3-512",
          canonicalBrand: "Apple",
          displayBrand: "Apple",
          modelName: "MacBook Air 13 (M3)", // Same model name, different storage variant
          sourceUrls: ["https://www.apple.com/in/macbook-air/specs/"],
          observationDate: "2026-10-11",
          sourceRegion: "IN",
          lifecycle: "active",
          variants: ["512GB"],
          collectedAttributes: { cpu: "M3", ramGb: 16, displayInches: 13.6 },
          missingAttributes: [],
          inclusionReason: "Higher tier variant",
          status: "staged",
        },
      ],
      supplyExceptions: [],
    };

    const summary = summarizeLeafCensus(dummyManifest, dummyTarget);
    // Distinct models found should be 1, NOT 2, because variants do not count as distinct models!
    expect(summary.distinctModelsFound).toBe(1);
    expect(summary.brandBreakdown["Apple"].modelCount).toBe(1);
    expect(summary.modelShortfall).toBe(99); // 100 - 1 = 99
  });

  it("handles and tracks documented supply exceptions accurately", () => {
    const dummyTarget: CoverageTarget = {
      leafKey: "laptops",
      displayName: "Laptops",
      department: "electronics",
      parentCategory: "laptops",
      wave: "electronics-core",
      brandFloor: 10,
      modelsPerBrandTarget: { min: 10, max: 15 },
      targetPlacements: { min: 100, max: 150 },
      priorityBrands: [
        "Apple",
        "Dell",
        "HP",
        "ASUS",
        "Acer",
        "MSI",
        "Microsoft",
        "Lenovo",
        "Samsung",
        "LG",
      ],
      distinctFamilyPolicy: "Distinct chassis and generation",
      keyAttributes: ["cpu", "ramGb", "displayInches"],
    };

    const dummyManifest: CensusManifestFile = {
      leafKey: "laptops",
      displayName: "Laptops",
      censusDate: "2026-10-11",
      entries: [],
      supplyExceptions: [
        {
          brand: "Framework",
          leafKey: "laptops",
          reason:
            "Framework is a modular laptop specialist currently offering exactly 2 modular chassis lines in active production (Laptop 13 and Laptop 16).",
          officialSourceUrl: "https://frame.work/products",
          verifiedAt: "2026-10-11",
          fullEnumeratedModels: ["Framework Laptop 13", "Framework Laptop 16"],
          totalQualifyingModels: 2,
          sourceRegion: "GLOBAL",
        },
      ],
    };

    const summary = summarizeLeafCensus(dummyManifest, dummyTarget);
    expect(summary.supplyExceptionsCount).toBe(1);
    expect(summary.brandBreakdown["Framework"].hasSupplyException).toBe(true);
    expect(summary.brandBreakdown["Framework"].modelCount).toBe(2);
  });

  it("validates all committed census manifest files in catalog/census/", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const registry = loadCoverageTargets();
    const targetMap = new Map(registry.targets.map((t) => [t.leafKey, t]));

    const censusDir = path.resolve(process.cwd(), "catalog/census");
    if (!fs.existsSync(censusDir)) return;

    const files = fs.readdirSync(censusDir).filter((f: string) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(4); // Laptops, tablets, headphones, wall chargers, portable SSDs

    for (const file of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(censusDir, file), "utf-8"));
      const manifest = censusManifestFileSchema.parse(raw);
      expect(targetMap.has(manifest.leafKey)).toBe(true);

      const target = targetMap.get(manifest.leafKey)!;
      const summary = summarizeLeafCensus(manifest, target);

      // Verify brand floor or documented supply exceptions
      expect(summary.distinctBrandsFound).toBeGreaterThanOrEqual(target.brandFloor);

      // Verify each entry has valid IDs and observation dates
      for (const entry of manifest.entries) {
        expect(entry.sourceUrls.length).toBeGreaterThanOrEqual(1);
        expect(entry.observationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.inclusionReason.length).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
