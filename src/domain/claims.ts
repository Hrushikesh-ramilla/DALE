export type Checkpoint = "seller_dispatch" | "buyer_receipt" | "buyer_return" | "seller_return";
export type Evidence = { id: string; checkpoint: Checkpoint; serial: string; note: string; hash: string; createdAt: string; mime?: string; assetKey?: string };
export type ClaimAnalysis = { outcome: "supported" | "contradicted" | "insufficient"; observations: string[]; sources: string[]; nextStep: string; mode: string };
export function analyzeClaims(evidence: Evidence[]): ClaimAnalysis {
  const dispatch = evidence.find((e) => e.checkpoint === "seller_dispatch" && e.serial.trim());
  const receipt = evidence.find((e) => e.checkpoint === "buyer_receipt" && e.serial.trim());
  const returned = evidence.find((e) => e.checkpoint === "buyer_return" && e.serial.trim());
  const receivedReturn = evidence.find((e) => e.checkpoint === "seller_return" && e.serial.trim());
  const observations: string[] = [];
  const sources: string[] = [];
  let conflict = false;
  for (const [left, right, label] of [[dispatch, receipt, "Dispatch and customer receipt"], [receipt, returned, "Customer receipt and return dispatch"], [returned, receivedReturn, "Return dispatch and seller receipt"]] as const) {
    if (!left || !right) continue;
    const match = left.serial.trim().toUpperCase() === right.serial.trim().toUpperCase();
    observations.push(`${label}: recorded identifiers ${match ? "match" : "differ"}. These are submitted records, not proof of parcel contents.`);
    sources.push(left.id, right.id); conflict ||= !match;
  }
  if (!observations.length) observations.push("There is not enough comparable evidence yet. Missing evidence does not imply dishonesty.");
  observations.push("Damage timing and who caused it cannot be established from these records alone.");
  return { outcome: conflict ? "contradicted" : "insufficient", observations, sources: [...new Set(sources)], nextStep: conflict ? "An identifier conflict needs human review. Your claim remains open." : "A reviewer can apply the customer policy or request specific missing information.", mode: "rules" };
}
export function customerRemedy(input: { reason: string; sellerResponded: boolean; deadlinePassed: boolean; eligible: boolean; requested: "refund" | "replacement"; approvedByReviewer: boolean }) {
  if (!input.sellerResponded && input.deadlinePassed) return { action: "escalate", message: "The seller response deadline passed. Your case is being escalated." };
  if (!input.eligible) return { action: "review", message: "A reviewer will check your options. You can appeal." };
  if (input.approvedByReviewer) return { action: input.requested, message: `Your ${input.requested} is approved under the merchant policy.` };
  return { action: "review", message: "Your request is open. Automated analysis cannot deny it." };
}
