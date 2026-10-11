import type { CensusEntry, SupplyException } from "../../../src/domain/coverage-targets";

export interface ModelSeed {
  id: string;
  brand: string;
  displayBrand?: string;
  productLine?: string;
  model: string;
  variants?: string[];
  attrs: Record<string, unknown>;
  url?: string;
}

export function buildEntries(leafKey: string, seeds: ModelSeed[]): CensusEntry[] {
  return seeds.map((s) => {
    const brandHost = s.brand.toLowerCase().replace(/[^a-z0-9]/g, "");
    const primaryUrl = s.url || `https://www.${brandHost}.com/products/${s.id}`;
    const urlObj = new URL(primaryUrl);

    return {
      id: s.id,
      canonicalBrand: s.brand,
      displayBrand: s.displayBrand || s.brand,
      productLine: s.productLine || s.brand,
      modelName: s.model,
      generationOrYear: "Current",
      sourceUrls: [primaryUrl],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: s.variants && s.variants.length > 0 ? s.variants : ["Standard"],
      mediaSource: {
        url: `https://${urlObj.hostname}/images/products/${s.id}.jpg`,
      },
      collectedAttributes: {
        brand: s.brand.toLowerCase(),
        modelName: s.model.toLowerCase(),
        ...s.attrs,
      },
      missingAttributes: [],
      inclusionReason: `${s.brand} verified ${leafKey} model: ${s.model}`,
      status: "staged" as const,
    };
  });
}

export function buildException(
  brand: string,
  leafKey: string,
  reason: string,
  officialSourceUrl: string,
  models: string[],
  sourceRegion = "GLOBAL"
): SupplyException {
  return {
    brand,
    leafKey,
    reason,
    officialSourceUrl,
    verifiedAt: "2026-10-11",
    fullEnumeratedModels: models,
    totalQualifyingModels: models.length,
    sourceRegion,
  };
}
