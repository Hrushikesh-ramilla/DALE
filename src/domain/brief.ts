import { z } from "zod";
import { categoryIds } from "./departments";

export const briefSchema = z.object({
  message: z.string().max(2000),
  model: z.string().max(80),
  category: z.enum(["", ...categoryIds]),
  requirements: z
    .object({
      productType: z.string().trim().toLowerCase().min(1).max(60).optional(),
      material: z.string().trim().toLowerCase().min(1).max(60).optional(),
      size: z.enum(["S", "M", "L"]).optional(),
      scent: z
        .enum([
          "citrus",
          "floral",
          "woody",
          "gourmand",
          "fresh",
          "amber",
          "aromatic",
          "spicy",
        ])
        .optional(),
      use: z.string().trim().toLowerCase().min(1).max(60).optional(),
      volumeMl: z.number().int().min(1).max(1000).optional(),
      brand: z.string().trim().toLowerCase().min(1).max(80).optional(),
      modelName: z.string().trim().toLowerCase().min(1).max(80).optional(),
      storageGb: z.number().int().min(1).max(8192).optional(),
      ramGb: z.number().int().min(1).max(256).optional(),
      movement: z.string().trim().toLowerCase().min(1).max(80).optional(),
      caseDiameterMm: z.number().positive().max(10000).optional(),
      waterResistanceM: z.number().positive().max(10000).optional(),
      frameShape: z.string().trim().toLowerCase().min(1).max(80).optional(),
      frameMaterial: z.string().trim().toLowerCase().min(1).max(80).optional(),
      lensWidthMm: z.number().positive().max(10000).optional(),
      bridgeMm: z.number().positive().max(10000).optional(),
      templeMm: z.number().positive().max(10000).optional(),
      polarization: z.string().trim().toLowerCase().min(1).max(80).optional(),
      uvProtection: z.string().trim().toLowerCase().min(1).max(80).optional(),
      sizeSystem: z.string().trim().toLowerCase().min(1).max(80).optional(),
      shoeSize: z.string().trim().toLowerCase().min(1).max(80).optional(),
      connection: z.string().trim().toLowerCase().min(1).max(80).optional(),
      noiseCancellation: z
        .string()
        .trim()
        .toLowerCase()
        .min(1)
        .max(80)
        .optional(),
      batteryHours: z.number().positive().max(10000).optional(),
      voltage: z.number().positive().max(10000).optional(),
      capacityLitres: z.number().positive().max(10000).optional(),
      concentration: z
        .enum([
          "eau de parfum",
          "eau de toilette",
          "eau de cologne",
          "parfum",
          "extrait de parfum",
        ])
        .optional(),
    })
    .strict()
    .optional(),
  budget: z.number().int().min(1).max(1000000),
  preference: z.string().trim().max(80).default(""),
  priority: z.enum(["price", "features"]).default("price"),
  weights: z
    .object({
      price: z.number().min(0).max(100),
      features: z.number().min(0).max(100),
    })
    .refine(
      (value) => value.price + value.features > 0,
      "At least one preference weight must be positive.",
    )
    .optional(),
  confirmConstraints: z.boolean().default(false),
  realRequirements: z
    .object({
      cable: z.enum(["unknown", "none", "usb60", "usb100", "magsafe3"]),
      fastCharging: z.boolean(),
    })
    .optional(),
});
export type ShoppingBrief = Omit<
  z.infer<typeof briefSchema>,
  "confirmConstraints"
> & { confirmConstraints?: boolean };
export type PurchaseBrief = {
  buyerId: string;
  version: number;
  input: ShoppingBrief;
  updatedAt: string;
  clarificationRequired?: boolean;
};
