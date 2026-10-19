import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

import { soundbarsCensus } from "./wave2-data/soundbars";
import { cablesCensus } from "./wave2-data/cables";
import { memoryCardsCensus } from "./wave2-data/memory-cards";
import { usbFlashDrivesCensus } from "./wave2-data/usb-flash-drives";
import { monitorsCensus } from "./wave2-data/monitors";
import { docksHubsCensus } from "./wave2-data/docks-hubs";
import { webcamsCensus } from "./wave2-data/webcams";
import { routersCensus } from "./wave2-data/routers";

export const wave2Censuses: CensusManifestFile[] = [
  soundbarsCensus,
  cablesCensus,
  memoryCardsCensus,
  usbFlashDrivesCensus,
  monitorsCensus,
  docksHubsCensus,
  webcamsCensus,
  routersCensus,
];

export function generateWave2ElectronicsCensuses() {
  console.log("=== GENERATING WAVE 2: ELECTRONICS REMAINING CENSUSES ===");
  const results: Array<{
    leafKey: string;
    displayName: string;
    models: number;
    brands: number;
    exceptions: number;
  }> = [];

  for (const census of wave2Censuses) {
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
        console.warn(`[WARNING] Brand '${brand}' in '${validated.leafKey}' has ${count} models (<10) but no documented supply exception!`);
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
      `[OK] ${validated.leafKey.padEnd(18)} | Models: ${String(validated.entries.length).padStart(3)} | Brands: ${String(totalBrands).padStart(2)} | Exceptions: ${validated.supplyExceptions.length}`
    );
  }

  return results;
}

if (process.argv[1]?.includes("generate-wave2-electronics")) {
  generateWave2ElectronicsCensuses();
}
