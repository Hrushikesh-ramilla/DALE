import type { CensusEntry, SupplyException } from "../../../src/domain/coverage-targets";

export interface BaseClothingModel {
  id: string;
  brand: string;
  displayBrand?: string;
  productLine?: string;
  modelName: string;
  modelReference?: string;
  generationOrYear?: string;
  sourceUrl: string;
  sourceRegion?: string;
  variants: string[];
  imageUrl?: string;
  attributes: Record<string, unknown>;
  inclusionReason: string;
}

export function makeEntry(leafKey: string, item: BaseClothingModel): CensusEntry {
  const urlObj = new URL(item.sourceUrl);
  return {
    id: item.id,
    canonicalBrand: item.brand,
    displayBrand: item.displayBrand || item.brand,
    productLine: item.productLine || item.brand,
    modelName: item.modelName,
    modelReference: item.modelReference,
    generationOrYear: item.generationOrYear || "2024",
    sourceUrls: [item.sourceUrl],
    observationDate: "2026-10-11",
    sourceRegion: item.sourceRegion || "GLOBAL",
    lifecycle: "active",
    variants: item.variants,
    mediaSource: item.imageUrl
      ? {
          url: item.imageUrl,
          attribution: `Official product photography © ${item.brand}`,
        }
      : {
          url: `https://${urlObj.hostname}/images/products/${item.id}.jpg`,
          attribution: `Official catalog photography © ${item.brand}`,
        },
    collectedAttributes: {
      brand: item.brand.toLowerCase(),
      modelName: item.modelName.toLowerCase(),
      ...item.attributes,
    },
    missingAttributes: [],
    inclusionReason: item.inclusionReason,
    status: "staged",
  };
}

export function makeSupplyException(
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
