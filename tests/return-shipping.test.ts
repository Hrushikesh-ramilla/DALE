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
  executeRefund,
  analyzeCase,
} from "../src/server/service";
import {
  authorizeReturn,
  returnShippingEvent,
} from "../src/server/return-shipping";
import { returnEligibility } from "../src/domain/return-policy";
import { recoverWorkspace } from "../src/server/recovery";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
});
async function fixture() {
  const workspace = await createWorkspace({ fixture: true });
  const buyer: Actor = {
    workspaceId: workspace.id,
    role: "buyer",
    userId: "owner",
  };
  const seller: Actor = { ...buyer, role: "seller", userId: "seller" };
  const reviewer: Actor = { ...buyer, role: "reviewer", userId: "reviewer" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  await shippingEvent(seller, order.id, "shipped");
  await shippingEvent(seller, order.id, "delivered");
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  return { buyer, seller, reviewer, order, item };
}
it("records a 30-day window without denying late or uncertain claims", async () => {
  const now = Date.now();
  expect(
    returnEligibility(
      "damaged",
      new Date(now - 30 * 86400000).toISOString(),
      now,
    ).outcome,
  ).toBe("within_policy");
  expect(
    returnEligibility(
      "damaged",
      new Date(now - 31 * 86400000).toISOString(),
      now,
    ).outcome,
  ).toBe("manual_review");
  expect(returnEligibility("damaged", "invalid", now).outcome).toBe(
    "manual_review",
  );
  expect(returnEligibility("not_delivered", undefined, now).outcome).toBe(
    "manual_review",
  );
  const { buyer, order } = await fixture();
  await mutateWorkspace(buyer.workspaceId, (s) => {
    s.cases = [];
    s.orders[0].returnId = undefined;
    s.orders[0].deliveredAt = new Date(now - 31 * 86400000).toISOString();
  });
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  expect(item.eligibility?.outcome).toBe("manual_review");
  expect(item.status).toBe("open");
});
it("requires a paid return, matching handoff and receipt, then refunds once with zero customer shipping cost", async () => {
  const { buyer, seller, reviewer, item } = await fixture();
  await authorizeReturn(
    reviewer,
    item.id,
    "prepaid",
    "Merchant damage policy covers shipping.",
    "LABEL-1",
  );
  await expect(
    resolveCase(reviewer, item.id, "refund", "Customer policy"),
  ).rejects.toThrow("awaiting recorded receipt");
  await expect(
    returnShippingEvent(seller, item.id, "received", "TRACK-1"),
  ).rejects.toThrow("must match");
  await returnShippingEvent(buyer, item.id, "in_transit", "TRACK-1");
  await expect(
    returnShippingEvent(seller, item.id, "received", "OTHER"),
  ).rejects.toThrow("must match");
  await returnShippingEvent(seller, item.id, "received", "TRACK-1");
  await returnShippingEvent(seller, item.id, "received", "TRACK-1");
  await analyzeCase(buyer, item.id);
  await resolveCase(
    reviewer,
    item.id,
    "refund",
    "Received return; apply customer damage policy.",
  );
  await resolveCase(reviewer, item.id, "refund", "Repeat command.");
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.cases[0].returnShipment?.customerCost).toBe(0);
  expect(state.cases[0].returnShipment?.remedyDueAt).toBeTruthy();
  expect(state.orders[0].refundedAmount).toBe(2900);
  expect(state.operations.filter((o) => o.kind === "refund")).toHaveLength(1);
});
it("denies other shoppers, buyer approvals, reviewer receipt impersonation, and missing labels", async () => {
  const { buyer, seller, reviewer, item } = await fixture();
  await expect(
    authorizeReturn(buyer, item.id, "waive", "Reason"),
  ).rejects.toThrow("authorization");
  await expect(
    authorizeReturn(reviewer, item.id, "prepaid", "Reason"),
  ).rejects.toThrow("label");
  await expect(
    authorizeReturn(reviewer, item.id, "waive", " "),
  ).rejects.toThrow("reason");
  await authorizeReturn(reviewer, item.id, "prepaid", "Policy", "LABEL");
  await expect(
    returnShippingEvent(
      { ...buyer, userId: "other" },
      item.id,
      "in_transit",
      "TRACK",
    ),
  ).rejects.toThrow("not found");
  await expect(
    returnShippingEvent(seller, item.id, "in_transit", "TRACK"),
  ).rejects.toThrow("Only");
  await expect(
    returnShippingEvent(reviewer, item.id, "received", "TRACK"),
  ).rejects.toThrow("Only");
  await expect(
    authorizeReturn(reviewer, item.id, "prepaid", "Policy", "NEW-LABEL"),
  ).rejects.toThrow("already exists");
});
it("allows a reviewer to waive an awaiting return with a reason and never regresses financial authorization on a deadline", async () => {
  const { buyer, reviewer, item, order } = await fixture();
  await authorizeReturn(reviewer, item.id, "prepaid", "Policy", "LABEL");
  await authorizeReturn(
    reviewer,
    item.id,
    "waive",
    "Customer-benefit exception; no return needed.",
  );
  expect(
    (await getWorkspace(buyer.workspaceId)).cases[0]
      .previousReturnArrangements?.[0].labelReference,
  ).toBe("LABEL");
  await mutateWorkspace(buyer.workspaceId, (s) => {
    s.cases[0].status = "approved";
    s.cases[0].remedy = "refund";
    s.cases[0].deadlineAt = new Date(Date.now() - 1000).toISOString();
    s.cases[0].returnShipment!.remedyDueAt = new Date(
      Date.now() - 1000,
    ).toISOString();
  });
  await recoverWorkspace(buyer.workspaceId);
  await recoverWorkspace(buyer.workspaceId);
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].refundedAmount).toBe(2900);
  expect(
    state.audit.filter((e) => e.action === "case.remedy_target_escalated"),
  ).toHaveLength(1);
  await executeRefund(reviewer, order.id);
  expect(
    (await getWorkspace(buyer.workspaceId)).operations.filter(
      (o) => o.kind === "refund",
    ),
  ).toHaveLength(1);
});
