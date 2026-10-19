import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

import { fragranceCensus } from "./wave4/data-fragrance";
import { watchesCensus } from "./wave4/data-watches";
import { sunglassesCensus } from "./wave4/data-sunglasses";
import { handbagsCensus } from "./wave4/data-handbags";
import { backpacksCensus } from "./wave4/data-backpacks";
import { walletsCensus } from "./wave4/data-wallets";
import { loafersCensus } from "./wave4/data-loafers";
import { formalShoesCensus } from "./wave4/data-formal-shoes";
import { runningShoesCensus } from "./wave4/data-running-shoes";
import { lifestyleSneakersCensus } from "./wave4/data-lifestyle-sneakers";
import { bootsCensus } from "./wave4/data-boots";

export const wave4Censuses: CensusManifestFile[] = [
  fragranceCensus,
  watchesCensus,
  sunglassesCensus,
  handbagsCensus,
  backpacksCensus,
  walletsCensus,
  loafersCensus,
  formalShoesCensus,
  runningShoesCensus,
  lifestyleSneakersCensus,
  bootsCensus,
];

export function generateWave4Censuses() {
  console.log("=== GENERATING WAVE 4: LIFESTYLE & FOOTWEAR CENSUSES ===");
  const results: Array<{
    leafKey: string;
    displayName: string;
    models: number;
    brands: number;
    exceptions: number;
  }> = [];

  for (const census of wave4Censuses) {
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
      `[OK] ${validated.leafKey.padEnd(20)} | Models: ${String(validated.entries.length).padStart(3)} | Brands: ${String(brandSet.size).padStart(2)} | Exceptions: ${validated.supplyExceptions.length}`
    );
  }

  return results;
}

if (process.argv[1]?.includes("generate-wave4-lifestyle")) {
  generateWave4Censuses();
}
