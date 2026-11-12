import { z } from "zod";
import { searchConstraints, type SearchConstraints } from "./concierge";
import type { Product } from "./catalog";
import type { GroupTerms } from "./group-policy";

export const discoveryInput = z
  .object({
    purpose: z.string().trim().min(1).max(600),
    budget_quote: z.string().trim().min(1).max(100).nullable().default(null),
    constraints: searchConstraints.safeExtend({
      max_price: searchConstraints.shape.max_price
        .removeDefault()
        .describe(
          "Required: the customer's unchanged maximum budget in integer USD cents. Use null only if the customer did not state a budget. Never raise/remove it to search for conditional group deals; the server performs that search itself.",
        ),
    }),
    group_savings: z.boolean().default(false),
    unknown_requirements: z
      .array(z.string().min(1).max(200))
      .max(8)
      .default([]),
    expected_version: z.number().int().min(0).default(0),
  })
  .strict();
export type DiscoveryInput = z.infer<typeof discoveryInput>;
export const decisionReviewInput = z.object({
  decisionId: z.string().uuid(),
  productId: z.string().min(1).max(150),
  groupId: z.string().uuid().optional(),
}).strict();
export type DiscoveryBrief = {
  buyerId: string;
  version: number;
  input: Omit<DiscoveryInput, "expected_version">;
  updatedAt: string;
  requestId?: string;
  budgetAnchor?: { messageId: string; maxPrice: number };
};
export type DecisionOffer = {
  product: Product;
  productDigest: string;
  policyDigest: string;
  kind: "solo" | "conditional_group";
  soloAmount: number;
  group: GroupTerms | null;
  reasons: string[];
  unknowns: string[];
  constraints: SearchConstraints;
};
export type ShoppingDecision = {
  id: string;
  buyerId: string;
  version: number;
  brief: DiscoveryBrief["input"];
  createdAt: string;
  outcome: "matches" | "no_match" | "clarification";
  offers: DecisionOffer[];
  questions: string[];
  retrieval: { mode: string; total: number; degradation: string | null }[];
  inference: { provider: string; model: string | null };
  quoteIds: string[];
  purchaseBriefVersion: number | null;
  requestMessageId: string | null;
};
export type DecisionView = ShoppingDecision & {
  status: "current" | "stale";
  staleReasons: string[];
};
