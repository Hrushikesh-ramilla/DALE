import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema } from "../src/domain/coverage-targets";
import { catalogManifestV2Schema } from "../src/domain/catalog-manifest";

const WAVE2_LEAVES = [
  "soundbars",
  "cables",
  "memory-cards",
  "usb-flash-drives",
  "monitors",
  "docks-hubs",
  "webcams",
  "routers",
] as const;

describe("Wave 2: Electronics Remaining Depth & Manifest Verification", () => {
  it("should have valid census files meeting all depth, brand, and exception criteria", () => {
    for (const leafKey of WAVE2_LEAVES) {
      const censusPath = resolve(process.cwd(), `catalog/census/${leafKey}.json`);
      expect(existsSync(censusPath), `Census file missing for ${leafKey}`).toBe(true);

      const raw = JSON.parse(readFileSync(censusPath, "utf-8"));
      const census = censusManifestFileSchema.parse(raw);

      // Verify leafKey and displayName
      expect(census.leafKey).toBe(leafKey);
      expect(census.displayName.length).toBeGreaterThan(0);

      // Verify depth target: 100-150 models
      expect(census.entries.length).toBeGreaterThanOrEqual(100);
      expect(census.entries.length).toBeLessThanOrEqual(150);

      // Verify brand floor: >= 10 brands
      const brandCounts = new Map<string, number>();
      for (const entry of census.entries) {
        brandCounts.set(entry.canonicalBrand, (brandCounts.get(entry.canonicalBrand) || 0) + 1);

        // Verify valid HTTPS manufacturer URLs
        for (const url of entry.sourceUrls) {
          expect(url.startsWith("https://")).toBe(true);
        }
      }

      expect(brandCounts.size).toBeGreaterThanOrEqual(10);

      // Verify supply exceptions: every brand with < 10 models must have an official exception
      const exceptionBrands = new Set(census.supplyExceptions.map((e) => e.brand));
      for (const [brand, count] of brandCounts.entries()) {
        if (count < 10) {
          expect(
            exceptionBrands.has(brand),
            `Brand '${brand}' in leaf '${leafKey}' has ${count} models (< 10) but lacks a supply exception`
          ).toBe(true);
        }
      }

      // Verify exception URL validity
      for (const exc of census.supplyExceptions) {
        expect(exc.officialSourceUrl.startsWith("https://")).toBe(true);
        expect(exc.fullEnumeratedModels.length).toBeGreaterThan(0);
      }
    }
  });

  it("should have valid compiled manifests with >= 100 products for all 8 leaves", () => {
    for (const leafKey of WAVE2_LEAVES) {
      const manifestPath = resolve(process.cwd(), `catalog/manifests/${leafKey}-core-2026-10-11-v2.json`);
      expect(existsSync(manifestPath), `Manifest missing for ${leafKey}`).toBe(true);

      const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const manifest = catalogManifestV2Schema.parse(raw);

      expect(manifest.id).toBe(`${leafKey}-core-2026-10-11-v2`);
      expect(manifest.products.length).toBeGreaterThanOrEqual(100);
      expect(manifest.approvedSourceHosts.length).toBeGreaterThan(0);

      // Ensure every product has required schema fields and non-zero price
      for (const prod of manifest.products) {
        expect(prod.leafType).toBe(leafKey);
        expect(prod.price).toBeGreaterThan(0);
        expect(prod.source.startsWith("https://")).toBe(true);
      }
    }
  });
});
