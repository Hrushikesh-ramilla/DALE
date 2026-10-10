import { getWorkspace, ownedCase, ownedOrder, type Actor } from "./state";
import { getAsset } from "./storage";
import { quotePaymentMode } from "../domain/guard";
import { analyzeClaims, type ClaimProposition } from "../domain/claims";

export async function caseReport(actor: Actor, caseId: string) {
  const state = await getWorkspace(actor.workspaceId);
  const item = ownedCase(state, actor, caseId);
  const order = ownedOrder(state, actor, item.orderId);
  const records = [];
  for (const entry of item.evidence) {
    let integrity:
      "verified_at_export" | "unavailable_or_mismatched" | "no_original_file" =
      "no_original_file";
    if (entry.assetKey) {
      try {
        await getAsset(entry.assetKey, entry.hash);
        integrity = "verified_at_export";
      } catch {
        integrity = "unavailable_or_mismatched";
      }
    }
    records.push({
      id: entry.id,
      checkpoint: entry.checkpoint,
      submittedIdentifier: entry.serial,
      submittedDescription: entry.note,
      sha256: entry.hash,
      receivedAt: entry.createdAt,
      media: entry.assetKey
        ? {
            mime: entry.mime,
            kind: entry.mime?.startsWith("video/") ? "video" : "image",
            review: entry.mime?.startsWith("video/")
              ? "human_review_required"
              : "image_adapter_or_human_review",
          }
        : null,
      provenance: entry.provenance || {
        source: entry.assetKey ? "uploaded_file" : "submitted_note",
        assurance: "Legacy submission: capture history not recorded.",
      },
      integrity,
      original: entry.assetKey ? `/api/evidence?id=${entry.id}` : undefined,
    });
  }
  const resources = new Set([
    caseId,
    order.id,
    ...item.evidence.map((e) => e.id),
  ]);
  return {
    schemaVersion: "case-report-v2",
    exportedAt: new Date().toISOString(),
    build: process.env.BUILD_ID || "development",
    claim: {
      id: item.id,
      orderId: order.id,
      reason: item.reason,
      requestedRemedy: item.request,
      status: item.status,
      deadlineAt: item.deadlineAt,
      resolutionNote: item.resolutionNote,
      appeal: item.appeal,
      eligibility: item.eligibility,
      returnShipment: item.returnShipment,
      previousReturnArrangements: item.previousReturnArrangements,
    },
    submittedRecords: records,
    analysis: item.analysis || null,
    propositions: [
      ...(item.analysis?.propositions ||
        analyzeClaims(item.evidence).propositions ||
        []),
      ...records
        .filter((entry) => entry.original)
        .map((entry): ClaimProposition => ({
          id: `integrity:${entry.id}`,
          statement:
            "The original file matches its SHA-256 recorded at ingestion.",
          category: "file_integrity",
          outcome:
            entry.integrity === "verified_at_export"
              ? "supported"
              : "insufficient",
          sourceIds: [entry.id],
          observations: [
            {
              text: `Export integrity result: ${entry.integrity}.`,
              sourceIds: [entry.id],
              basis: "verified_file_integrity",
            },
          ],
          missingFacts:
            entry.integrity === "verified_at_export"
              ? []
              : ["An available original matching the recorded hash."],
          uncertainty: [
            "Intact bytes establish integrity since ingestion, not capture time, scene truth or honesty.",
          ],
          nextAction:
            "A reviewer can inspect the scoped original; an unavailable file cannot automatically defeat a claim.",
        })),
    ],
    sourceIndex: records.map((entry) => ({
      id: entry.id,
      checkpoint: entry.checkpoint,
      integrity: entry.integrity,
      original: entry.original,
    })),
    transactionRecords: {
      adapter: quotePaymentMode(order.quote),
      currency: order.quote.currency,
      capturedReference: order.captureId,
      orderReference: order.providerOrderId,
      approvedAmount: order.quote.amount,
      refundedAmount: order.refundedAmount,
      externalProviderObservations: order.providerObservations || [],
      status: order.status,
      refund: order.refund,
      operations: state.operations
        .filter((op) => op.orderId === order.id)
        .map(({ id, kind, state, resultId, amount }) => ({
          id,
          kind,
          state,
          resultId,
          amount,
        })),
    },
    audit: state.audit.filter((event) => resources.has(event.resource)),
    limitations: [
      "Authenticated submission and intact bytes do not establish honesty, parcel contents, damage timing, or physical truth.",
      "Capture codes associate a submission with a server-issued challenge; code visibility and capture timing are not verified.",
      "Repeated bytes are a review cue, not a reason to deny a claim.",
      "Optional videos are accepted as private original records for human review. Container signatures are checked, not codec playability or depicted-event truth; the image adapter does not inspect video.",
      "Fixture payment references are synthetic; sandbox references describe provider records only. Internal claims do not adjudicate PayPal disputes.",
    ],
  };
}
