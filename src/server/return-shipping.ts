import {
  audit,
  mutateWorkspace,
  ownedCase,
  type Actor,
  type ReturnCase,
} from "./state";
export function assertReturnReady(item: ReturnCase) {
  if (
    item.returnShipment &&
    !["not_required", "received"].includes(item.returnShipment.status)
  )
    throw new Error(
      "The prepaid return is awaiting recorded receipt. Your case remains open; a reviewer can waive the return with a reason.",
    );
}
export async function authorizeReturn(
  actor: Actor,
  caseId: string,
  decision: "prepaid" | "waive",
  reason: string,
  labelReference?: string,
) {
  if (actor.role !== "reviewer")
    throw new Error(
      "Reviewer authorization is required for return arrangements.",
    );
  if (!reason.trim())
    throw new Error(
      "Record the customer policy and reason for the arrangement.",
    );
  if (decision === "prepaid" && !labelReference?.trim())
    throw new Error("A prepaid return label reference is required.");
  return mutateWorkspace(actor.workspaceId, (state) => {
    const item = ownedCase(state, actor, caseId);
    if (
      ["resolved", "refund_pending", "refund_failed", "approved"].includes(
        item.status,
      )
    )
      throw new Error(
        "The remedy is already authorized; reconcile it before changing return arrangements.",
      );
    if (item.returnShipment?.status === "received")
      throw new Error("Return receipt has already been recorded.");
    if (item.returnShipment?.status === "not_required" && decision === "waive")
      return item;
    if (item.returnShipment && decision === "prepaid") {
      if (
        item.returnShipment.labelReference === labelReference &&
        item.returnShipment.status !== "not_required"
      )
        return item;
      throw new Error(
        "A return arrangement already exists. Do not replace an active shipping reference.",
      );
    }
    const at = new Date().toISOString();
    if (item.returnShipment)
      (item.previousReturnArrangements ??= []).push({ ...item.returnShipment });
    item.returnShipment = {
      status: decision === "waive" ? "not_required" : "authorized",
      labelReference: decision === "prepaid" ? labelReference : undefined,
      customerCost: 0,
      reason,
      authorizedAt: at,
      remedyDueAt:
        decision === "waive"
          ? new Date(Date.now() + 86400000).toISOString()
          : undefined,
      carrier: "simulated",
    };
    audit(
      state,
      actor,
      decision === "waive" ? "return.waived" : "return.prepaid_authorized",
      caseId,
    );
    return item;
  });
}
export async function returnShippingEvent(
  actor: Actor,
  caseId: string,
  status: "in_transit" | "received",
  trackingReference: string,
) {
  if (actor.role !== (status === "in_transit" ? "buyer" : "seller"))
    throw new Error(
      "Only the submitting party can record this return checkpoint.",
    );
  if (!trackingReference.trim())
    throw new Error("A return tracking reference is required.");
  return mutateWorkspace(actor.workspaceId, (state) => {
    const item = ownedCase(state, actor, caseId);
    const shipment = item.returnShipment;
    if (
      !shipment ||
      shipment.status === "not_required" ||
      ["resolved", "refund_pending", "refund_failed", "approved"].includes(
        item.status,
      )
    )
      throw new Error("There is no active prepaid return for this event.");
    if (
      shipment.status === status &&
      shipment.trackingReference === trackingReference
    )
      return item;
    if (status === "in_transit" && shipment.status !== "authorized")
      throw new Error("Return handoff must precede return receipt.");
    if (
      status === "received" &&
      (shipment.status !== "in_transit" ||
        shipment.trackingReference !== trackingReference)
    )
      throw new Error(
        "Return receipt must match the recorded dispatch reference.",
      );
    shipment.status = status;
    if (status === "in_transit") {
      shipment.trackingReference = trackingReference;
      shipment.sentAt = new Date().toISOString();
    } else {
      shipment.receivedAt = new Date().toISOString();
      shipment.remedyDueAt = new Date(Date.now() + 86400000).toISOString();
    }
    audit(state, actor, `return.${status}_simulated`, caseId);
    return item;
  });
}
