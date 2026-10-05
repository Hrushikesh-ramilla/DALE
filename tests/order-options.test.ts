import { beforeAll, expect, it } from "vitest";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import {
  capture,
  checkout,
  makeQuote,
  openReturn,
  resolveCase,
  shippingEvent,
} from "../src/server/service";
import { cancelFulfillment, chooseRemedy } from "../src/server/order-options";
import { recoverWorkspace } from "../src/server/recovery";
import { quoteFingerprint } from "../src/domain/guard";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
});
async function fixture(paid = true) {
  const workspace = await createWorkspace({ fixture: true });
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "owner",
    role: "buyer",
  };
  const seller: Actor = { ...buyer, role: "seller", userId: "seller" };
  const reviewer: Actor = { ...buyer, role: "reviewer", userId: "reviewer" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  if (paid) await capture(buyer, order.id);
  return { buyer, seller, reviewer, quote, order };
}
it("binds delivery and policy changes to fresh approval", async () => {
  const { buyer, quote } = await fixture(false);
  expect(quote.deliveryBy).toBeTruthy();
  await mutateWorkspace(buyer.workspaceId, (s) => {
    s.quotes[0].deliveryBy = new Date(Date.now() + 10 * 86400000).toISOString();
  });
  await expect(checkout(buyer, quote.id, quote.fingerprint)).rejects.toThrow(
    "changed",
  );
  expect(
    quoteFingerprint({ ...quote, returnPolicy: "changed-policy" }),
  ).not.toBe(quote.fingerprint);
});
it("cancels unpaid fulfillment without capture and rejects a stale checkout", async () => {
  const { buyer, seller, quote, order } = await fixture(false);
  await cancelFulfillment(seller, order.id, "Inventory unavailable.");
  await expect(checkout(buyer, quote.id, quote.fingerprint)).rejects.toThrow(
    "fresh quote",
  );
  expect(
    (await getWorkspace(buyer.workspaceId)).orders[0].captureId,
  ).toBeUndefined();
  await expect(cancelFulfillment(buyer, order.id, "Reason")).rejects.toThrow(
    "Only",
  );
});
it("keeps canceled paid orders financially open until the buyer-selected refund completes", async () => {
  const { buyer, seller, reviewer, order } = await fixture();
  await cancelFulfillment(seller, order.id, "Seller stock loss.");
  await cancelFulfillment(seller, order.id, "Repeated cancellation.");
  const before = await getWorkspace(buyer.workspaceId);
  expect(before.orders[0].status).toBe("paid");
  expect(before.orders[0].refundedAmount).toBe(0);
  expect(before.operations.filter((op) => op.kind === "refund")).toHaveLength(
    0,
  );
  await expect(shippingEvent(seller, order.id, "shipped")).rejects.toThrow(
    "Canceled fulfillment",
  );
  const item = await openReturn(buyer, order.id, "canceled", "replacement");
  await chooseRemedy(buyer, item.id, "refund");
  await expect(
    resolveCase(reviewer, item.id, "replacement", "Policy"),
  ).rejects.toThrow("customer's choice");
  await resolveCase(
    reviewer,
    item.id,
    "refund",
    "Merchant cancellation policy; no return required.",
  );
  const after = await getWorkspace(buyer.workspaceId);
  expect(after.orders[0].refundedAmount).toBe(2900);
  expect(after.orders).toHaveLength(1);
});
it("offers help on a late delivery once without automatically moving money", async () => {
  const { buyer } = await fixture();
  await mutateWorkspace(buyer.workspaceId, (s) => {
    s.orders[0].quote.deliveryBy = new Date(Date.now() - 1000).toISOString();
  });
  await recoverWorkspace(buyer.workspaceId);
  await recoverWorkspace(buyer.workspaceId);
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].fulfillmentIssue?.kind).toBe("late");
  expect(
    state.audit.filter((a) => a.action === "fulfillment.late"),
  ).toHaveLength(1);
  expect(state.operations.filter((op) => op.kind === "refund")).toHaveLength(0);
});
it("keeps capture ambiguity unresolved and blocks customer remedy changes after execution", async () => {
  const { buyer, seller, order, reviewer } = await fixture(false);
  await mutateWorkspace(buyer.workspaceId, (s) => {
    s.operations.push({
      id: "unknown",
      orderId: order.id,
      kind: "capture",
      amount: 2900,
      state: "unknown",
    });
  });
  await expect(cancelFulfillment(seller, order.id, "Cancel")).rejects.toThrow(
    "unresolved",
  );
  await recoverWorkspace(buyer.workspaceId);
  const item = await openReturn(buyer, order.id, "not_delivered", "refund");
  await expect(
    chooseRemedy({ ...buyer, userId: "other" }, item.id, "replacement"),
  ).rejects.toThrow("not found");
  await resolveCase(
    reviewer,
    item.id,
    "refund",
    "Merchant customer-benefit remedy.",
  );
  await expect(chooseRemedy(buyer, item.id, "replacement")).rejects.toThrow(
    "execution has started",
  );
});
