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
});
export type ShoppingBrief = z.infer<typeof briefSchema>;
export type PurchaseBrief = {
  buyerId: string;
  version: number;
  input: ShoppingBrief;
  updatedAt: string;
};
