import { z } from "zod";

const tier = z.object({
  minimumMembers: z.number().int().min(2).max(100),
  discountPercent: z.number().int().min(1).max(80),
});
export const groupPolicySchema = tier
  .extend({
    formingMinutes: z.number().int().min(5).max(10080),
    checkoutMinutes: z.number().int().min(5).max(1440),
    productTiers: z
      .array(tier.extend({ productId: z.string().min(1).max(100) }))
      .max(40),
  })
  .refine(
    (value) =>
      new Set(value.productTiers.map((item) => item.productId)).size ===
      value.productTiers.length,
    "Each product can have only one approved tier.",
  );
export type GroupPolicyInput = z.infer<typeof groupPolicySchema>;
export type GroupPolicy = GroupPolicyInput & { version: number };
export type GroupTerms = {
  policyVersion: number;
  minimumMembers: number;
  discountPercent: number;
  checkoutMinutes: number;
  baseAmount: number;
  amount: number;
};
export const defaultGroupPolicy: GroupPolicy = {
  version: 1,
  minimumMembers: 2,
  discountPercent: 10,
  formingMinutes: 1440,
  checkoutMinutes: 30,
  productTiers: [],
};
export function groupTerms(
  policy: GroupPolicy | undefined,
  product: { id: string; price: number },
): GroupTerms {
  const approved = policy || defaultGroupPolicy;
  const rule =
    approved.productTiers.find((item) => item.productId === product.id) ||
    approved;
  return {
    policyVersion: approved.version,
    minimumMembers: rule.minimumMembers,
    discountPercent: rule.discountPercent,
    checkoutMinutes: approved.checkoutMinutes,
    baseAmount: product.price,
    amount: Math.round((product.price * (100 - rule.discountPercent)) / 100),
  };
}
