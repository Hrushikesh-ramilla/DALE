import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const httpsUrl = z.string().url().refine((val) => {
  try {
    const url = new URL(val);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !/^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(url.hostname)
    );
  } catch {
    return false;
  }
}, "Must be a valid HTTPS URL without credentials, IP address or custom ports.");

export const coverageWaveSchema = z.enum([
  "electronics-core",
  "electronics-remaining",
  "clothing",
  "lifestyle",
  "home-appliances",
]);
export type CoverageWave = z.infer<typeof coverageWaveSchema>;

export const coverageTargetSchema = z.object({
  leafKey: z.string().min(2).max(64),
  displayName: z.string().min(2).max(120),
  department: z.string().min(2).max(64),
  parentCategory: z.string().min(2).max(64),
  wave: coverageWaveSchema,
  brandFloor: z.number().int().min(10),
  modelsPerBrandTarget: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
  }),
  targetPlacements: z.object({
    min: z.number().int().min(10),
    max: z.number().int().min(10),
  }),
  priorityBrands: z.array(z.string().min(1).max(80)).min(10),
  distinctFamilyPolicy: z.string().min(10).max(500),
  keyAttributes: z.array(z.string().min(1).max(80)).min(3),
});
export type CoverageTarget = z.infer<typeof coverageTargetSchema>;

export const coverageTargetsFileSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1),
  totalLeafTargets: z.literal(50),
  defaultRules: z.object({
    brandFloor: z.number().int().min(10),
    modelsPerBrandMin: z.number().int().min(10),
    modelsPerBrandMax: z.number().int().min(10),
    targetPlacementsMin: z.number().int().min(100),
    targetPlacementsMax: z.number().int().min(100),
    preferredRegion: z.string().min(2),
    globalRegionFallback: z.boolean(),
    variantRule: z.string().min(10),
    supplyExceptionRule: z.string().min(10),
  }),
  targets: z.array(coverageTargetSchema).length(50),
});
export type CoverageTargetsFile = z.infer<typeof coverageTargetsFileSchema>;

export const censusLifecycleSchema = z.enum([
  "active",
  "announced",
  "discontinued",
  "legacy",
]);
export type CensusLifecycle = z.infer<typeof censusLifecycleSchema>;

export const censusStatusSchema = z.enum([
  "not_enumerated",
  "collecting",
  "review_required",
  "staged",
  "published",
  "qualified",
  "supply_limited",
]);
export type CensusStatus = z.infer<typeof censusStatusSchema>;

export const censusEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,79}$/i),
  canonicalBrand: z.string().min(1).max(80),
  displayBrand: z.string().min(1).max(80),
  parentCompany: z.string().max(80).optional(),
  productLine: z.string().max(80).optional(),
  modelName: z.string().min(1).max(120),
  modelReference: z.string().max(80).optional(),
  generationOrYear: z.union([z.string(), z.number()]).optional(),
  sourceUrls: z.array(httpsUrl).min(1).max(10),
  observationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceRegion: z.string().min(2).max(10),
  lifecycle: censusLifecycleSchema,
  variants: z.array(z.string().max(100)).default([]),
  mediaSource: z
    .object({
      url: httpsUrl,
      variant: z.string().max(80).optional(),
      attribution: z.string().max(120).optional(),
    })
    .optional(),
  collectedAttributes: z.record(z.string(), z.any()),
  missingAttributes: z.array(z.string().max(80)).default([]),
  inclusionReason: z.string().min(5).max(300),
  status: censusStatusSchema,
});
export type CensusEntry = z.infer<typeof censusEntrySchema>;

export const supplyExceptionSchema = z.object({
  brand: z.string().min(1).max(80),
  leafKey: z.string().min(2).max(64),
  reason: z.string().min(10).max(500),
  officialSourceUrl: httpsUrl,
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fullEnumeratedModels: z.array(z.string().min(1).max(120)).min(1),
  totalQualifyingModels: z.number().int().min(1),
  sourceRegion: z.string().min(2).max(10),
});
export type SupplyException = z.infer<typeof supplyExceptionSchema>;

export const censusManifestFileSchema = z.object({
  $schema: z.string().optional(),
  leafKey: z.string().min(2).max(64),
  displayName: z.string().min(2).max(120),
  censusDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(censusEntrySchema),
  supplyExceptions: z.array(supplyExceptionSchema).default([]),
  notes: z.string().max(1000).optional(),
});
export type CensusManifestFile = z.infer<typeof censusManifestFileSchema>;

export function loadCoverageTargets(
  filePath = resolve(process.cwd(), "catalog/coverage-targets.json"),
): CoverageTargetsFile {
  if (!existsSync(filePath)) {
    throw new Error(`Coverage targets registry not found at: ${filePath}`);
  }
  const content = readFileSync(filePath, "utf-8");
  const raw = JSON.parse(content);
  return coverageTargetsFileSchema.parse(raw);
}

export function validateCensusManifest(raw: unknown): CensusManifestFile {
  return censusManifestFileSchema.parse(raw);
}

export interface LeafCensusSummary {
  leafKey: string;
  displayName: string;
  targetBrandFloor: number;
  targetModelsMin: number;
  targetModelsMax: number;
  distinctBrandsFound: number;
  distinctModelsFound: number;
  brandBreakdown: Record<
    string,
    {
      modelCount: number;
      models: string[];
      hasSupplyException: boolean;
      exceptionReason?: string;
    }
  >;
  supplyExceptionsCount: number;
  isBrandFloorMet: boolean;
  isModelTargetMet: boolean;
  modelShortfall: number;
}

export function summarizeLeafCensus(
  manifest: CensusManifestFile,
  target: CoverageTarget,
): LeafCensusSummary {
  const brandBreakdown: LeafCensusSummary["brandBreakdown"] = {};
  const modelSet = new Set<string>();

  for (const entry of manifest.entries) {
    const brand = entry.canonicalBrand;
    if (!brandBreakdown[brand]) {
      brandBreakdown[brand] = {
        modelCount: 0,
        models: [],
        hasSupplyException: false,
      };
    }
    const modelKey = `${brand}::${entry.modelName}`;
    if (!modelSet.has(modelKey)) {
      modelSet.add(modelKey);
      brandBreakdown[brand].modelCount++;
      brandBreakdown[brand].models.push(entry.modelName);
    }
  }

  for (const exc of manifest.supplyExceptions) {
    if (brandBreakdown[exc.brand]) {
      brandBreakdown[exc.brand].hasSupplyException = true;
      brandBreakdown[exc.brand].exceptionReason = exc.reason;
    } else {
      brandBreakdown[exc.brand] = {
        modelCount: exc.totalQualifyingModels,
        models: exc.fullEnumeratedModels,
        hasSupplyException: true,
        exceptionReason: exc.reason,
      };
    }
  }

  const distinctBrandsFound = Object.keys(brandBreakdown).length;
  const distinctModelsFound = modelSet.size;
  const isBrandFloorMet = distinctBrandsFound >= target.brandFloor;
  const isModelTargetMet = distinctModelsFound >= target.targetPlacements.min;
  const modelShortfall = Math.max(0, target.targetPlacements.min - distinctModelsFound);

  return {
    leafKey: target.leafKey,
    displayName: target.displayName,
    targetBrandFloor: target.brandFloor,
    targetModelsMin: target.targetPlacements.min,
    targetModelsMax: target.targetPlacements.max,
    distinctBrandsFound,
    distinctModelsFound,
    brandBreakdown,
    supplyExceptionsCount: manifest.supplyExceptions.length,
    isBrandFloorMet,
    isModelTargetMet,
    modelShortfall,
  };
}
