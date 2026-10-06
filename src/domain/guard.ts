import { createHash } from "node:crypto";
export type Quote = {
  id: string;
  productId: string;
  model: string;
  payee: string;
  amount: number;
  currency: "USD";
  expiresAt: string;
  version: number;
  groupId?: string;
  provider?: "fixture" | "sandbox";
  deliveryBy?: string;
  returnPolicy?: string;
};
export function quoteFingerprint(quote: Quote): string {
  const fields = [
    quote.id,
    quote.productId,
    quote.model,
    quote.payee,
    quote.amount,
    quote.currency,
    quote.expiresAt,
    quote.version,
    quote.groupId ?? null,
  ];
  // Existing persisted approvals retain their original encoding.
  if (quote.provider) fields.push(quote.provider);
  if (quote.deliveryBy || quote.returnPolicy)
    fields.push(quote.deliveryBy ?? null, quote.returnPolicy ?? null);
  return createHash("sha256").update(JSON.stringify(fields)).digest("hex");
}
export function quotePaymentMode(quote: Quote) {
  return (
    quote.provider || (quote.payee === "fixture-store" ? "fixture" : "sandbox")
  );
}
export function checkPurchase(
  quote: Quote,
  approvedFingerprint: string,
  actual: {
    amount: number;
    currency: string;
    payee: string;
    productId: string;
  },
  now = Date.now(),
) {
  if (new Date(quote.expiresAt).getTime() <= now)
    throw new Error("Your quote expired. Please review a fresh quote.");
  if (!Number.isSafeInteger(quote.amount) || quote.amount < 1)
    throw new Error("Invalid quote amount");
  if (quoteFingerprint(quote) !== approvedFingerprint)
    throw new Error("The purchase changed. Your approval is required again.");
  if (
    actual.amount !== quote.amount ||
    actual.currency !== quote.currency ||
    actual.payee !== quote.payee ||
    actual.productId !== quote.productId
  )
    throw new Error("Payment details do not match your approved purchase.");
  return true;
}
export function allowedRefund(
  captured: number,
  completed: number,
  pending: number,
  requested: number,
) {
  if (
    ![captured, completed, pending, requested].every(Number.isSafeInteger) ||
    [captured, completed, pending].some((v) => v < 0) ||
    requested <= 0 ||
    completed + pending + requested > captured
  )
    throw new Error("Refund exceeds the available payment balance.");
  return true;
}
