import { z } from "zod";
import type { Product } from "./catalog";
import type { GroupTerms } from "./group-policy";
const review = z.object({
  productDigest: z.string().length(64),
  policyVersion: z.number().int().positive(),
  briefVersion: z.number().int().positive().nullable(),
  discoveryVersion: z.number().int().positive().nullable(),
});
export const circleCommand = z.discriminatedUnion("action", [
  review
    .extend({
      action: z.literal("join"),
      circleId: z.string().uuid().optional(),
      productId: z.string().min(1).max(150),
      model: z.string().min(1).max(100),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({ action: z.literal("leave"), circleId: z.string().uuid() })
    .strict(),
]);
export type CircleOffer = {
  product: Product;
  model: string;
  terms: GroupTerms;
  review: z.infer<typeof review>;
};
export type CircleView = CircleOffer & {
  id: string;
  status: "forming" | "ready" | "expired" | "unavailable";
  memberCount: number;
  qualifiedMemberCount: number;
  expiresAt: string;
  checkoutExpiresAt?: string;
  joined: boolean;
  canJoin: boolean;
  canReview: boolean;
  canLeave: boolean;
  message: string;
};
export type CircleResponse = {
  circles: CircleView[];
  offer: CircleOffer | null;
};
