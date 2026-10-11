import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  loadCoverageTargets,
  censusManifestFileSchema,
  summarizeLeafCensus,
  CoverageTarget,
  CensusManifestFile,
  LeafCensusSummary,
} from "../src/domain/coverage-targets";

interface PublishedRecordSummary {
  leafKey: string;
  brand: string;
  modelName?: string;
  id: string;
}

function loadPublishedManifestRecords(): PublishedRecordSummary[] {
  const manifestsDir = resolve(process.cwd(), "catalog/manifests");
  if (!existsSync(manifestsDir)) return [];

  const files = readdirSync(manifestsDir).filter(
    (f) => f.endsWith(".json") && !f.includes(".observations."),
  );

  const results: PublishedRecordSummary[] = [];

  for (const file of files) {
    try {
      const fullPath = join(manifestsDir, file);
      const content = readFileSync(fullPath, "utf-8");
      const data = JSON.parse(content);
      if (Array.isArray(data.products)) {
        for (const p of data.products) {
          // Map category to leafKey if possible
          results.push({
            leafKey: p.leafType || p.category,
            brand: p.brand || p.attributes?.brand || "Unknown",
            modelName: p.attributes?.modelName || p.name,
            id: p.id,
          });
        }
      }
    } catch {
      // Ignore unparseable files
    }
  }

  return results;
}

function loadAllCensusManifests(): Record<string, CensusManifestFile> {
  const censusDir = resolve(process.cwd(), "catalog/census");
  if (!existsSync(censusDir)) return {};

  const files = readdirSync(censusDir).filter((f) => f.endsWith(".json"));
  const manifests: Record<string, CensusManifestFile> = {};

  for (const file of files) {
    try {
      const fullPath = join(censusDir, file);
      const raw = JSON.parse(readFileSync(fullPath, "utf-8"));
      const parsed = censusManifestFileSchema.parse(raw);
      manifests[parsed.leafKey] = parsed;
    } catch (err) {
      console.warn(`[WARN] Failed to parse census file ${file}:`, err);
    }
  }

  return manifests;
}

export function generateCoverageAuditReport() {
  const registry = loadCoverageTargets();
  const publishedRecords = loadPublishedManifestRecords();
  const censusManifests = loadAllCensusManifests();

  const report = {
    generatedAt: new Date().toISOString(),
    totalTargets: registry.totalLeafTargets,
    waves: {} as Record<
      string,
      {
        targets: Array<{
          leafKey: string;
          displayName: string;
          department: string;
          brandFloor: number;
          targetPlacements: { min: number; max: number };
          censusBrands: number;
          censusModels: number;
          publishedCount: number;
          supplyExceptions: number;
          shortfall: number;
          status: string;
        }>;
        totalCensusModels: number;
        totalPublished: number;
        totalTargetPlacements: number;
      }
    >,
    overall: {
      totalTargetPlacementsMin: 0,
      totalTargetPlacementsMax: 0,
      totalCensusModels: 0,
      totalPublishedRecords: publishedRecords.length,
      totalExceptions: 0,
      totalShortfall: 0,
      targetsWithCensus: 0,
      targetsMeetingFloor: 0,
    },
  };

  for (const target of registry.targets) {
    const wave = target.wave;
    if (!report.waves[wave]) {
      report.waves[wave] = {
        targets: [],
        totalCensusModels: 0,
        totalPublished: 0,
        totalTargetPlacements: 0,
      };
    }

    const census = censusManifests[target.leafKey];
    let censusSummary: LeafCensusSummary | undefined;
    if (census) {
      censusSummary = summarizeLeafCensus(census, target);
      report.overall.targetsWithCensus++;
    }

    const censusModels = censusSummary ? censusSummary.distinctModelsFound : 0;
    const censusBrands = censusSummary ? censusSummary.distinctBrandsFound : 0;
    const supplyExceptions = censusSummary
      ? censusSummary.supplyExceptionsCount
      : 0;

    // Filter published records matching this leafKey
    const matchingPublished = publishedRecords.filter(
      (r) => r.leafKey === target.leafKey,
    );
    const publishedCount = matchingPublished.length;

    const shortfall = Math.max(0, target.targetPlacements.min - censusModels);

    let status = "not_enumerated";
    if (censusSummary) {
      if (censusSummary.isModelTargetMet && censusSummary.isBrandFloorMet) {
        status = publishedCount > 0 ? "published" : "staged";
      } else if (supplyExceptions > 0 && censusModels > 0) {
        status = "supply_limited";
      } else if (censusModels > 0) {
        status = "collecting";
      } else {
        status = "review_required";
      }
    } else if (publishedCount > 0) {
      status = "legacy_published_no_census";
    }

    if (censusSummary?.isBrandFloorMet && censusSummary?.isModelTargetMet) {
      report.overall.targetsMeetingFloor++;
    }

    report.waves[wave].targets.push({
      leafKey: target.leafKey,
      displayName: target.displayName,
      department: target.department,
      brandFloor: target.brandFloor,
      targetPlacements: target.targetPlacements,
      censusBrands,
      censusModels,
      publishedCount,
      supplyExceptions,
      shortfall,
      status,
    });

    report.waves[wave].totalCensusModels += censusModels;
    report.waves[wave].totalPublished += publishedCount;
    report.waves[wave].totalTargetPlacements += target.targetPlacements.min;

    report.overall.totalTargetPlacementsMin += target.targetPlacements.min;
    report.overall.totalTargetPlacementsMax += target.targetPlacements.max;
    report.overall.totalCensusModels += censusModels;
    report.overall.totalExceptions += supplyExceptions;
    report.overall.totalShortfall += shortfall;
  }

  return report;
}

function printCliReport() {
  const report = generateCoverageAuditReport();

  console.log("\n================================================================================");
  console.log("            DALE 50-LEAF ASSORTMENT DEPTH COVERAGE AUDIT REPORT                 ");
  console.log(`                     Generated: ${report.generatedAt}                          `);
  console.log("================================================================================\n");

  for (const [wave, data] of Object.entries(report.waves)) {
    console.log(`\n--- WAVE: ${wave.toUpperCase()} ---`);
    console.log(
      `Target Placements Floor: ${data.totalTargetPlacements} | Census Models: ${data.totalCensusModels} | Published: ${data.totalPublished}\n`,
    );

    console.log(
      `${"Leaf Key".padEnd(20)} | ${"Brands".padStart(6)} | ${"Census".padStart(7)} | ${"Pub".padStart(5)} | ${"Target".padStart(7)} | ${"Shortfall".padStart(9)} | Status`,
    );
    console.log("-".repeat(80));

    for (const t of data.targets) {
      console.log(
        `${t.leafKey.padEnd(20)} | ${String(t.censusBrands).padStart(6)} | ${String(t.censusModels).padStart(7)} | ${String(t.publishedCount).padStart(5)} | ${String(t.targetPlacements.min).padStart(7)} | ${String(t.shortfall).padStart(9)} | ${t.status}`,
      );
    }
  }

  console.log("\n================================================================================");
  console.log("OVERALL SUMMARY:");
  console.log(`- Total Leaf Targets: ${report.totalTargets}`);
  console.log(
    `- Planning Placement Budget: ${report.overall.totalTargetPlacementsMin} - ${report.overall.totalTargetPlacementsMax} models`,
  );
  console.log(`- Total Enumerated Census Models: ${report.overall.totalCensusModels}`);
  console.log(`- Total Published Starter Records: ${report.overall.totalPublishedRecords}`);
  console.log(`- Total Documented Supply Exceptions: ${report.overall.totalExceptions}`);
  console.log(`- Total Model Shortfall Across All Targets: ${report.overall.totalShortfall}`);
  console.log(`- Targets with Completed Censuses: ${report.overall.targetsWithCensus}/50`);
  console.log("================================================================================\n");
}

if (process.argv[1]?.endsWith("coverage-report.ts")) {
  printCliReport();
}
