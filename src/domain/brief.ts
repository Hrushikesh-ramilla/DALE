import { z } from "zod";

export const briefSchema = z.object({
  message: z.string().max(2000),
  model: z.string().max(80),
  category: z.enum([
    "",
    "chargers",
    "docks",
    "storage",
    "audio",
    "accessories",
  ]),
  budget: z.number().int().min(1).max(100000),
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
