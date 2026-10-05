import {
  audit,
  mutateWorkspace,
  ownedOrder,
  ownedCase,
  type Actor,
} from "./state";
export async function cancelFulfillment(
  actor: Actor,
  orderId: string,
  reason: string,
) {
  if (actor.role !== "seller")
    throw new Error("Only seller staff can record a fulfillment cancellation.");
  if (!reason.trim()) throw new Error("A cancellation reason is required.");
  return mutateWorkspace(actor.workspaceId, (state) => {
    const order = ownedOrder(state, actor, orderId);
    if (
      order.fulfillmentIssue?.kind === "canceled" ||
      order.status === "canceled"
    )
      return order;
    if (!["checkout_pending", "paid", "shipped"].includes(order.status))
      throw new Error("Fulfillment cannot be canceled in this state.");
    if (
      !order.captureId &&
      state.operations.some(
        (op) => op.orderId === orderId && op.kind === "capture",
      )
    )
      throw new Error(
        "A payment outcome is unresolved. Reconcile it before canceling.",
      );
    const at = new Date().toISOString();
    order.fulfillmentIssue = { kind: "canceled", reason, at };
    if (!order.captureId) {
      order.status = "canceled";
      order.quote.invalidatedAt = at;
      const quote = state.quotes.find((q) => q.id === order.quote.id);
      if (quote) quote.invalidatedAt = at;
    }
    order.events.push({
      at,
      text: order.captureId
        ? "The seller canceled fulfillment. Your payment remains recorded; choose a refund or replacement through support. A financial remedy requires approval and provider confirmation."
        : "The seller canceled an unpaid order. No payment was captured; review a fresh quote to continue.",
    });
    audit(state, actor, "fulfillment.canceled", orderId);
    return order;
  });
}
export async function chooseRemedy(
  actor: Actor,
  caseId: string,
  request: "refund" | "replacement",
) {
  if (actor.role !== "buyer")
    throw new Error("Only the customer can change the requested remedy.");
  return mutateWorkspace(actor.workspaceId, (state) => {
    const item = ownedCase(state, actor, caseId);
    if (item.request === request) return item;
    if (
      item.remedy ||
      ["resolved", "approved", "refund_pending", "refund_failed"].includes(
        item.status,
      ) ||
      state.operations.some(
        (op) => op.orderId === item.orderId && op.kind === "refund",
      ) ||
      state.orders.some((o) => o.replacementOf === item.orderId)
    )
      throw new Error(
        "Remedy execution has started. Request a human review before changing it.",
      );
    item.request = request;
    audit(state, actor, "remedy.customer_changed", caseId);
    return item;
  });
}
