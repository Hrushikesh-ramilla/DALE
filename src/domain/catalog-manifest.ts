import { z } from "zod";
import { categoryIds, leafTypeKeys, resolveParentCategory } from "./departments";
import type { Product } from "./catalog";

const httpsUrl = z.string().refine((value) => {
  if (value.startsWith("/images/products/")) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !/^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(url.hostname) &&
      !url.hostname.includes(":")
    );
  } catch {
    return false;
  }
}, "Use a public HTTPS source or local /images/products/ path without credentials.");
const attributes = z
  .object({
    productType: z.string().min(1).max(60).optional(),
    material: z.string().max(60).optional(),
    size: z.string().max(30).optional(),
    scent: z.string().max(60).optional(),
    use: z.string().max(60).optional(),
    volumeMl: z.number().int().positive().max(1000).optional(),
    finish: z.string().max(60).optional(),
    brand: z.string().min(1).max(80),
    modelName: z.string().max(80).optional(),
    storageGb: z.number().int().positive().max(8192).optional(),
    ramGb: z.number().int().positive().max(256).optional(),
    displayInches: z.number().positive().max(100).optional(),
    refreshHz: z.number().positive().max(1000).optional(),
    batteryMah: z.number().int().positive().optional(),
    concentration: z.string().max(60).optional(),
    movement: z.string().trim().min(1).max(80).optional(),
    caseDiameterMm: z.number().positive().max(10000).optional(),
    waterResistanceM: z.number().positive().max(10000).optional(),
    frameShape: z.string().trim().min(1).max(80).optional(),
    frameMaterial: z.string().trim().min(1).max(80).optional(),
    lensWidthMm: z.number().positive().max(10000).optional(),
    bridgeMm: z.number().positive().max(10000).optional(),
    templeMm: z.number().positive().max(10000).optional(),
    polarization: z.string().trim().min(1).max(80).optional(),
    uvProtection: z.string().trim().min(1).max(80).optional(),
    sizeSystem: z.string().trim().min(1).max(80).optional(),
    shoeSize: z.string().trim().min(1).max(80).optional(),
    connection: z.string().trim().min(1).max(80).optional(),
    noiseCancellation: z.string().trim().min(1).max(80).optional(),
    batteryHours: z.number().positive().max(10000).optional(),
    voltage: z.number().positive().max(10000).optional(),
    capacityLitres: z.number().positive().max(10000).optional(),
    perfumer: z.string().trim().min(1).max(200).optional(),
    topNotes: z.string().trim().min(1).max(500).optional(),
    heartNotes: z.string().trim().min(1).max(500).optional(),
    baseNotes: z.string().trim().min(1).max(500).optional(),
    olfactoryFamily: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
const productBase = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/),
    name: z.string().min(3).max(250),
    category: z.enum(categoryIds),
    description: z.string().max(2000),
    price: z.number().int().positive().max(1000000000),
    compatibleModels: z.array(z.string().max(80)).max(100),
    specs: z.array(z.string().max(300)).max(40),
    sponsored: z.literal(false),
    stock: z.number().int().min(0).max(100000),
    color: z.string().max(60),
    source: httpsUrl,
    familyId: z.string().max(100).optional(),
    provenance: z.literal("manufacturer_evidence"),
    brand: z.string().min(1).max(80),
    offerKind: z.literal("sandbox"),
    comparisonOnly: z.boolean().optional(),
    evidence: z
      .object({
        checkedAt: z.iso.date(),
        region: z.string().min(2).max(60),
        missing: z.array(z.string().max(250)).max(40),
        review: z.enum(["specifications", "product_identity"]),
      })
      .strict(),
    attributes,
    media: z
      .object({
        url: httpsUrl,
        source: httpsUrl,
        alt: z.string().min(3).max(300),
        attribution: z.string().min(1).max(300),
        reviewedAt: z.iso.date(),
        usage: z.enum(["licensed", "external_reference", "catalog_packshot"]),
      })
      .strict()
      .optional(),
  })
  .strict();

const product = productBase.superRefine((value, context) => {
  if (value.brand.toLowerCase() !== value.attributes.brand.toLowerCase())
    context.addIssue({
      code: "custom",
      message: "Brand identity and normalized attributes must agree.",
    });
  if (value.evidence.review === "product_identity" && !value.comparisonOnly)
    context.addIssue({
      code: "custom",
      message: "Identity-only records cannot become purchasable offers.",
    });
  if (value.evidence.review === "product_identity" && value.stock !== 0)
    context.addIssue({
      code: "custom",
      message: "Identity-only stock must be zero.",
    });
});
export const catalogManifestSchema = z
  .object({
    schemaVersion: z.literal("catalog-manifest-v1"),
    id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/),
    reviewedBy: z.string().min(3).max(100),
    reviewedAt: z.iso.date(),
    approvedSourceHosts: z
      .array(z.string().regex(/^[a-z0-9.-]+$/))
      .min(1)
      .max(100),
    products: z.array(product).min(1).max(500),
  })
  .strict()
  .superRefine((manifest, context) => {
    const ids = new Set<string>();
    for (const record of manifest.products) {
      if (ids.has(record.id))
        context.addIssue({
          code: "custom",
          message: `Duplicate product ID: ${record.id}`,
        });
      ids.add(record.id);
      if (
        !manifest.approvedSourceHosts.includes(new URL(record.source).hostname)
      )
        context.addIssue({
          code: "custom",
          message: `Source origin is not reviewed for ${record.id}`,
        });
    }
  });
export type CatalogManifest = z.infer<typeof catalogManifestSchema>;
export const manifestProducts = (manifest: CatalogManifest): Product[] =>
  manifest.products;

const productV2Base = productBase.extend({
  attributes: attributes.passthrough(),
  leafType: z.enum(leafTypeKeys).optional(),
  modelName: z.string().min(1).max(120).optional(),
  skuVariant: z.string().max(80).optional(),
  revisionId: z.string().max(80).optional(),
  accessoryProtocols: z.record(z.string(), z.any()).optional(),
  deviceCompatibility: z.array(z.string().max(80)).optional(),
});

const productV2 = productV2Base.superRefine((value, context) => {
  if (value.brand.toLowerCase() !== value.attributes.brand.toLowerCase())
    context.addIssue({
      code: "custom",
      message: "Brand identity and normalized attributes must agree.",
    });
  if (value.evidence.review === "product_identity" && !value.comparisonOnly)
    context.addIssue({
      code: "custom",
      message: "Identity-only records cannot become purchasable offers.",
    });
  if (value.evidence.review === "product_identity" && value.stock !== 0)
    context.addIssue({
      code: "custom",
      message: "Identity-only stock must be zero.",
    });
});
export type ProductV2 = z.infer<typeof productV2>;

export const catalogManifestV2Schema = z
  .object({
    schemaVersion: z.literal("catalog-manifest-v2"),
    id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/),
    reviewedBy: z.string().min(3).max(100),
    reviewedAt: z.iso.date(),
    approvedSourceHosts: z
      .array(z.string().regex(/^[a-z0-9.-]+$/))
      .min(1)
      .max(100),
    products: z.array(productV2).min(1).max(500),
  })
  .strict()
  .superRefine((manifest, context) => {
    const ids = new Set<string>();
    for (const record of manifest.products) {
      if (ids.has(record.id))
        context.addIssue({
          code: "custom",
          message: `Duplicate product ID: ${record.id}`,
        });
      ids.add(record.id);
      if (
        !manifest.approvedSourceHosts.includes(new URL(record.source).hostname)
      )
        context.addIssue({
          code: "custom",
          message: `Source origin is not reviewed for ${record.id}`,
        });
    }
  });
export type CatalogManifestV2 = z.infer<typeof catalogManifestV2Schema>;

export const anyCatalogManifestSchema = z.union([
  catalogManifestSchema,
  catalogManifestV2Schema,
]);
export type AnyCatalogManifest = z.infer<typeof anyCatalogManifestSchema>;

export function parseAnyCatalogManifest(input: unknown): AnyCatalogManifest {
  if (typeof input === "object" && input !== null && "schemaVersion" in input) {
    if (input.schemaVersion === "catalog-manifest-v2") {
      return catalogManifestV2Schema.parse(input);
    }
  }
  return catalogManifestSchema.parse(input);
}

