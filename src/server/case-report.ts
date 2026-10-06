import { getWorkspace, ownedCase, ownedOrder, type Actor } from "./state";
import { getAsset } from "./storage";
import { quotePaymentMode } from "../domain/guard";

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
    schemaVersion: "case-report-v1",
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
    transactionRecords: {
      adapter: quotePaymentMode(order.quote),
      currency: order.quote.currency,
      capturedReference: order.captureId,
      orderReference: order.providerOrderId,
      approvedAmount: order.quote.amount,
      refundedAmount: order.refundedAmount,
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
      "Fixture payment references are synthetic; sandbox references describe provider records only. Internal claims do not adjudicate PayPal disputes.",
    ],
  };
}
