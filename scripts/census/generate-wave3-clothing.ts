import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

import { shirtsCensus } from "./clothing-data/shirts";
import { tshirtsCensus } from "./clothing-data/t-shirts";
import { knitwearCensus } from "./clothing-data/knitwear";
import { trousersCensus } from "./clothing-data/trousers";
import { denimCensus } from "./clothing-data/denim";
import { dressesCensus } from "./clothing-data/dresses";
import { suitsCensus } from "./clothing-data/suits";
import { jacketsCensus } from "./clothing-data/jackets";
import { coatsCensus } from "./clothing-data/coats";

export const wave3ClothingCensuses: CensusManifestFile[] = [
  shirtsCensus,
  tshirtsCensus,
  knitwearCensus,
  trousersCensus,
  denimCensus,
  dressesCensus,
  suitsCensus,
  jacketsCensus,
  coatsCensus,
];

export function generateWave3ClothingCensuses() {
  console.log("=== GENERATING WAVE 3: LUXURY & TAILORED CLOTHING CENSUSES ===");
  const results: Array<{
    leafKey: string;
    displayName: string;
    models: number;
    brands: number;
    exceptions: number;
  }> = [];

  for (const census of wave3ClothingCensuses) {
    const validated = censusManifestFileSchema.parse(census);
    const outPath = resolve(process.cwd(), `catalog/census/${validated.leafKey}.json`);
    writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");

    const brandCounts = new Map<string, number>();
    for (const entry of validated.entries) {
      brandCounts.set(entry.canonicalBrand, (brandCounts.get(entry.canonicalBrand) || 0) + 1);
    }

    const exceptionBrands = new Set(validated.supplyExceptions.map((e) => e.brand));

    // Verify brand floor & exceptions
    for (const [brand, count] of brandCounts.entries()) {
      if (count < 10 && !exceptionBrands.has(brand)) {
        console.warn(
          `[WARNING] Brand '${brand}' in '${validated.leafKey}' has ${count} models (<10) but no documented supply exception!`
        );
      }
    }

    const totalBrands = brandCounts.size;

    results.push({
      leafKey: validated.leafKey,
      displayName: validated.displayName,
      models: validated.entries.length,
      brands: totalBrands,
      exceptions: validated.supplyExceptions.length,
    });

    console.log(
      `[OK] ${validated.leafKey.padEnd(12)} | Models: ${String(validated.entries.length).padStart(3)} | Brands: ${String(totalBrands).padStart(2)} | Exceptions: ${validated.supplyExceptions.length}`
    );
  }

  return results;
}

if (process.argv[1]?.includes("generate-wave3-clothing")) {
  generateWave3ClothingCensuses();
}
