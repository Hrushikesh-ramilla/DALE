import type { Workspace } from "./state";
import { quotePaymentMode } from "@/domain/guard";
import { z } from "zod";
const relatedOrder = z.object({
  supplementary_data: z.object({
    related_ids: z.object({ order_id: z.string().min(1).max(255) }),
  }),
});
export function recordVerifiedReceipt(
  state: Workspace,
  event: { id: string; event_type: string; resource: Record<string, unknown> },
) {
  if (state.fixtureWorkspace) return false;
  const related = relatedOrder.safeParse(event.resource);
  const orderId = related.success
    ? related.data.supplementary_data.related_ids.order_id
    : undefined;
  const reference =
    typeof event.resource.id === "string" ? event.resource.id : undefined;
  const orderIds = state.orders
    .filter(
      (order) =>
        quotePaymentMode(order.quote) === "sandbox" &&
        ((orderId && order.providerOrderId === orderId) ||
          (reference &&
            (order.captureId === reference ||
              order.refund?.reference === reference ||
              state.operations.some(
                (operation) =>
                  operation.orderId === order.id &&
                  operation.kind === "refund" &&
                  operation.resultId === reference,
              ))) ||
          order.providerObservations?.some((observation) =>
            observation.eventIds.includes(event.id),
          )),
    )
    .map((order) => order.id);
  if (!orderIds.length) return false;
  state.signedWebhookReceipts ??= [];
  if (!state.signedWebhookReceipts.some((receipt) => receipt.id === event.id))
    state.signedWebhookReceipts = [
      ...state.signedWebhookReceipts,
      {
        id: event.id,
        type: event.event_type,
        receivedAt: new Date().toISOString(),
        orderIds,
      },
    ].slice(-100);
  // A verified signature proves notification origin. Capture/refund status
  // continues to require the existing exact provider GET and authorization.
  return true;
}
