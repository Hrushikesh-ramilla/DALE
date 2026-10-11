import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

import { cleansersCensus } from "./wave5/cleansers";
import { serumsCensus } from "./wave5/serums";
import { moisturizersCensus } from "./wave5/moisturizers";
import { sunscreensCensus } from "./wave5/sunscreens";
import { kitchenwareCensus } from "./wave5/kitchenware";
import { decorCensus } from "./wave5/decor";
import { homeTextilesCensus } from "./wave5/home-textiles";
import { vacuumCleanersCensus } from "./wave5/vacuum-cleaners";
import { airPurifiersCensus } from "./wave5/air-purifiers";

const wave5Censuses: CensusManifestFile[] = [
  cleansersCensus,
  serumsCensus,
  moisturizersCensus,
  sunscreensCensus,
  kitchenwareCensus,
  decorCensus,
  homeTextilesCensus,
  vacuumCleanersCensus,
  airPurifiersCensus,
];

export function generateWave5Censuses() {
  console.log("=== GENERATING WAVE 5: SKINCARE/BEAUTY & HOME/APPLIANCES CENSUSES ===");
  const results: Array<{
    leafKey: string;
    displayName: string;
    models: number;
    brands: number;
    exceptions: number;
  }> = [];

  for (const census of wave5Censuses) {
    const validated = censusManifestFileSchema.parse(census);
    const outPath = resolve(process.cwd(), `catalog/census/${validated.leafKey}.json`);
    writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");

    const brandSet = new Set<string>();
    for (const entry of validated.entries) {
      brandSet.add(entry.canonicalBrand);
    }
    for (const exc of validated.supplyExceptions) {
      brandSet.add(exc.brand);
    }

    results.push({
      leafKey: validated.leafKey,
      displayName: validated.displayName,
      models: validated.entries.length,
      brands: brandSet.size,
      exceptions: validated.supplyExceptions.length,
    });

    console.log(
      `[OK] ${validated.leafKey.padEnd(18)} | Models: ${String(validated.entries.length).padStart(3)} | Brands: ${String(brandSet.size).padStart(2)} | Exceptions: ${validated.supplyExceptions.length}`
    );
  }

  return results;
}

if (process.argv[1]?.includes("generate-wave5-home-beauty")) {
  generateWave5Censuses();
}
