export type Checkpoint =
  "seller_dispatch" | "buyer_receipt" | "buyer_return" | "seller_return";
export type Evidence = {
  id: string;
  checkpoint: Checkpoint;
  serial: string;
  note: string;
  hash: string;
  createdAt: string;
  mime?: string;
  assetKey?: string;
  provenance?: {
    source: "submitted_note" | "uploaded_file" | "challenge_associated_upload";
    submittedBy: string;
    serverReceivedAt: string;
    challenge?: { id: string; code: string; issuedAt: string };
    repeatedEvidenceIds: string[];
  };
};
export type ClaimAnalysis = {
  outcome: "supported" | "contradicted" | "insufficient";
  observations: string[];
  sources: string[];
  nextStep: string;
  mode: string;
  propositions?: ClaimProposition[];
  versions?: {
    policy: string;
    prompt: string;
    model: string;
    analyzedAt: string;
  };
};
export type ClaimProposition = {
  id: string;
  statement: string;
  category:
    | "recorded_identifier"
    | "reported_condition"
    | "physical_causation"
    | "media_appearance"
    | "file_integrity";
  outcome: "supported" | "contradicted" | "insufficient";
  sourceIds: string[];
  observations: {
    text: string;
    sourceIds: string[];
    basis: "submitted_record" | "verified_file_integrity" | "model_inference";
  }[];
  missingFacts: string[];
  uncertainty: string[];
  nextAction: string;
};
export function analyzeClaims(evidence: Evidence[]): ClaimAnalysis {
  const dispatch = evidence.find(
    (e) => e.checkpoint === "seller_dispatch" && e.serial.trim(),
  );
  const receipt = evidence.find(
    (e) => e.checkpoint === "buyer_receipt" && e.serial.trim(),
  );
  const returned = evidence.find(
    (e) => e.checkpoint === "buyer_return" && e.serial.trim(),
  );
  const receivedReturn = evidence.find(
    (e) => e.checkpoint === "seller_return" && e.serial.trim(),
  );
  const observations: string[] = [];
  const sources: string[] = [];
  const propositions: ClaimProposition[] = [];
  let conflict = false;
  for (const [left, right, label] of [
    [dispatch, receipt, "Dispatch and customer receipt"],
    [receipt, returned, "Customer receipt and return dispatch"],
    [returned, receivedReturn, "Return dispatch and seller receipt"],
  ] as const) {
    const pairIds = [left?.id, right?.id].filter((id): id is string =>
      Boolean(id),
    );
    const pair = evidence.filter(
      (entry) =>
        entry.serial.trim() &&
        (entry.checkpoint === left?.checkpoint ||
          entry.checkpoint === right?.checkpoint),
    );
    const identifiers = new Set(
      pair.map((entry) => entry.serial.trim().toUpperCase()),
    );
    const match = Boolean(left && right && identifiers.size === 1);
    const differs = Boolean(left && right && identifiers.size > 1);
    propositions.push({
      id: `identifiers:${label.toLowerCase().replaceAll(" ", "-")}`,
      statement: `${label}: the submitted identifiers agree.`,
      category: "recorded_identifier",
      outcome: differs ? "contradicted" : match ? "supported" : "insufficient",
      sourceIds: left && right ? pair.map((entry) => entry.id) : pairIds,
      observations:
        left && right
          ? pair.map((entry) => ({
              text: `Submitted identifier at ${entry.checkpoint}: ${entry.serial}.`,
              sourceIds: [entry.id],
              basis: "submitted_record" as const,
            }))
          : [],
      missingFacts:
        left && right
          ? []
          : ["Comparable identifiers from both checkpoints are missing."],
      uncertainty: [
        "Identifier agreement describes submitted records; it does not establish actual parcel contents or honesty.",
      ],
      nextAction: differs
        ? "A reviewer should check the conflicting records; the customer's claim remains open."
        : "A reviewer can consider these records alongside the reported issue and customer policy.",
    });
    if (!left || !right) continue;
    observations.push(
      `${label}: recorded identifiers ${match ? "match" : "differ"}. These are submitted records, not proof of parcel contents.`,
    );
    sources.push(...pair.map((entry) => entry.id));
    conflict ||= differs;
  }
  for (const entry of evidence) {
    propositions.push({
      id: `condition:${entry.id}`,
      statement: `The condition described in the ${entry.checkpoint.replaceAll("_", " ")} submission is independently corroborated.`,
      category: "reported_condition",
      outcome: "insufficient",
      sourceIds: [entry.id],
      observations: [
        { text: entry.note, sourceIds: [entry.id], basis: "submitted_record" },
      ],
      missingFacts: ["Independent corroboration of the described condition."],
      uncertainty: [
        "A description is a party's account, not a verified physical observation.",
        ...(entry.mime?.startsWith("video/")
          ? [
              "Video is retained for human review; the image-analysis adapter does not inspect video.",
            ]
          : []),
      ],
      nextAction:
        "Review the original record and apply the customer policy; missing media is not a reason to deny a claim.",
    });
  }
  propositions.push({
    id: "physical-causation",
    statement: "The records establish when damage occurred and who caused it.",
    category: "physical_causation",
    outcome: "insufficient",
    sourceIds: evidence.map((entry) => entry.id),
    observations: [],
    missingFacts: ["Independently established damage timing and causation."],
    uncertainty: [
      "Submitted records, matching identifiers, intact files and capture codes cannot prove physical truth.",
    ],
    nextAction:
      "Keep the claim open for an authorized reviewer and a customer-policy remedy.",
  });
  if (!observations.length)
    observations.push(
      "There is not enough comparable evidence yet. Missing evidence does not imply dishonesty.",
    );
  observations.push(
    "Damage timing and who caused it cannot be established from these records alone.",
  );
  return {
    outcome: conflict ? "contradicted" : "insufficient",
    observations,
    sources: [...new Set(sources)],
    nextStep: conflict
      ? "An identifier conflict needs human review. Your claim remains open."
      : "A reviewer can apply the customer policy or request specific missing information.",
    mode: "rules",
    propositions,
  };
}
export function customerRemedy(input: {
  reason: string;
  sellerResponded: boolean;
  deadlinePassed: boolean;
  eligible: boolean;
  requested: "refund" | "replacement";
  approvedByReviewer: boolean;
}) {
  if (!input.sellerResponded && input.deadlinePassed)
    return {
      action: "escalate",
      message:
        "The seller response deadline passed. Your case is being escalated.",
    };
  if (!input.eligible)
    return {
      action: "review",
      message: "A reviewer will check your options. You can appeal.",
    };
  if (input.approvedByReviewer)
    return {
      action: input.requested,
      message: `Your ${input.requested} is approved under the merchant policy.`,
    };
  return {
    action: "review",
    message: "Your request is open. Automated analysis cannot deny it.",
  };
}
