import type { Group, StoredQuote, Workspace } from "./state";
import { getDatabase, type Sql } from "./database";
import { getStoredProduct } from "./catalog-store";

export async function currentGroupProduct(id: string, sql?: Sql) {
  const db = sql || (await getDatabase());
  const product = await getStoredProduct(id, db, true);
  const row = await db.query<{ price: number }>(
    "SELECT price FROM catalog_products WHERE id=$1 FOR SHARE",
    [id],
  );
  return { ...product, price: row.rows[0].price };
}

export function activeStock(
  state: Workspace,
  productId: string,
  replacingGroup?: string,
  replacingBuyer?: string,
  now = Date.now(),
) {
  const orders = state.orders.filter(
    (order) =>
      order.quote.productId === productId &&
      !["refunded", "canceled"].includes(order.status),
  );
  const reservations = state.groups
    .filter(
      (group) =>
        group.productId === productId &&
        group.status === "ready" &&
        Date.parse(group.checkoutExpiresAt || group.expiresAt) > now,
    )
    .reduce(
      (count, group) =>
        count +
        group.members.filter(
          (member) =>
            !(group.id === replacingGroup && member === replacingBuyer) &&
            !orders.some(
              (order) =>
                order.quote.groupId === group.id && order.buyerId === member,
            ),
        ).length,
      0,
    );
  return orders.length + reservations;
}
export function assertGroupQuote(
  state: Workspace,
  quote: StoredQuote,
  now = Date.now(),
) {
  if (!quote.groupId) return;
  const group = state.groups.find((g) => g.id === quote.groupId);
  if (
    !group ||
    group.status !== "ready" ||
    !group.members.includes(quote.buyerId) ||
    group.productId !== quote.productId ||
    group.model !== quote.model ||
    group.amount !== quote.amount ||
    Date.parse(group.checkoutExpiresAt || group.expiresAt) <= now
  )
    throw new Error(
      "The group reservation is no longer available. Review fresh terms.",
    );
  assertMemberRequirements(state, group, quote.buyerId);
}
export function assertMemberRequirements(
  state: Workspace,
  group: Group,
  buyerId: string,
) {
  const binding = group.memberRequirements?.[buyerId];
  if (
    binding &&
    (binding.briefVersion !==
      (state.briefs?.find((b) => b.buyerId === buyerId)?.version || null) ||
      binding.discoveryVersion !==
        (state.discoveryBriefs?.find((b) => b.buyerId === buyerId)?.version ||
          null))
  )
    throw new Error(
      "Saved requirements changed after this circle commitment. Leave and review a fresh commitment.",
    );
}
export function releaseCommitment(
  state: Workspace,
  group: Group,
  buyerId: string,
  reason: string,
  now = Date.now(),
) {
  if (!group.members.includes(buyerId)) return;
  const orders = state.orders.filter(
    (o) => o.quote.groupId === group.id && o.buyerId === buyerId,
  );
  if (
    orders.some(
      (o) =>
        o.captureId ||
        state.operations.some(
          (op) =>
            op.orderId === o.id &&
            op.kind === "capture" &&
            op.state !== "failed",
        ),
    )
  )
    throw new Error(
      "Payment has started for this commitment. Check your order before changing it.",
    );
  const at = new Date(now).toISOString();
  for (const order of orders)
    if (order.status === "checkout_pending") {
      order.status = "canceled";
      order.quote.invalidatedAt = at;
      order.events.push({
        at,
        text: "You declined group checkout. No payment was captured; your unused reservation was released.",
      });
    }
  for (const quote of state.quotes)
    if (quote.groupId === group.id && quote.buyerId === buyerId)
      quote.invalidatedAt = at;
  group.members = group.members.filter((id) => id !== buyerId);
  group.releasedMembers ??= [];
  group.releasedMembers.push({ buyerId, at, reason });
}
