import type { CensusEntry, SupplyException } from "../../../src/domain/coverage-targets";

export interface CreateEntryParams {
  id: string;
  brand: string;
  displayBrand?: string;
  productLine?: string;
  modelName: string;
  year?: string;
  sourceUrl: string;
  sourceRegion?: string;
  variants?: string[];
  mediaUrl?: string;
  attrs: Record<string, unknown>;
  reason: string;
}

export function makeEntry(p: CreateEntryParams): CensusEntry {
  const cleanId = p.id
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .slice(0, 75);

  return {
    id: cleanId,
    canonicalBrand: p.brand,
    displayBrand: p.displayBrand || p.brand,
    productLine: p.productLine,
    modelName: p.modelName,
    generationOrYear: p.year || "Current",
    sourceUrls: [p.sourceUrl],
    observationDate: "2026-10-11",
    sourceRegion: p.sourceRegion || "GLOBAL",
    lifecycle: "active",
    variants: p.variants || ["Standard"],
    mediaSource: p.mediaUrl ? { url: p.mediaUrl } : undefined,
    collectedAttributes: {
      brand: p.brand.toLowerCase(),
      modelName: p.modelName.toLowerCase(),
      ...p.attrs,
    },
    missingAttributes: [],
    inclusionReason: p.reason,
    status: "staged",
  };
}

export function makeException(
  brand: string,
  leafKey: string,
  reason: string,
  url: string,
  models: string[],
  region = "GLOBAL"
): SupplyException {
  return {
    brand,
    leafKey,
    reason,
    officialSourceUrl: url,
    verifiedAt: "2026-10-11",
    fullEnumeratedModels: models,
    totalQualifyingModels: models.length,
    sourceRegion: region,
  };
}
