export const RETURN_POLICY = "merchant-policy-v1";
export function returnEligibility(
  reason: string,
  deliveredAt?: string,
  now = Date.now(),
) {
  if (["canceled", "not_delivered"].includes(reason))
    return {
      outcome: "manual_review" as const,
      explanation:
        "An order problem needs review; the delivery-based return window does not determine this request.",
      policy: RETURN_POLICY,
    };
  const delivered = deliveredAt ? Date.parse(deliveredAt) : NaN;
  if (!Number.isFinite(delivered) || delivered > now)
    return {
      outcome: "manual_review" as const,
      explanation:
        "Delivery timing is not established. Your request remains open for review.",
      policy: RETURN_POLICY,
    };
  return now - delivered <= 30 * 86400000
    ? {
        outcome: "within_policy" as const,
        explanation:
          "Requested within 30 days of recorded delivery under the demo merchant policy.",
        policy: RETURN_POLICY,
      }
    : {
        outcome: "manual_review" as const,
        explanation:
          "The recorded 30-day window has passed. A reviewer will check exceptions and your options; this is not an automatic denial.",
        policy: RETURN_POLICY,
      };
}
