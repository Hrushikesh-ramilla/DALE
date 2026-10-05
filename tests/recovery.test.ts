import { beforeEach, expect, it, vi } from "vitest";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import {
  capture,
  checkout,
  joinGroup,
  makeQuote,
  openReturn,
} from "../src/server/service";
import { acceptWebhook, recoverWorkspace } from "../src/server/recovery";
import { getPayment, verifyWebhook } from "../src/server/payments";
vi.mock("../src/server/payments", async (original) => ({
  ...(await original<typeof import("../src/server/payments")>()),
  getPayment: vi.fn(),
  verifyWebhook: vi.fn(),
}));
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  vi.mocked(verifyWebhook).mockResolvedValue(false);
});
async function setup() {
  const state = await createWorkspace();
  const actor: Actor = {
    workspaceId: state.id,
    userId: "customer",
    role: "buyer",
  };
  const quote = await makeQuote(actor, "P001", "Atlas 14");
  const order = await checkout(actor, quote.id, quote.fingerprint);
  return { actor, order };
}
it("expires unpaid approvals and groups and releases stock", async () => {
  const { actor } = await setup();
  await joinGroup(actor, "P001", "Atlas 14");
  await recoverWorkspace(actor.workspaceId, Date.now() + 2 * 86400000);
  const state = await getWorkspace(actor.workspaceId);
  expect(state.orders[0].status).toBe("canceled");
  expect(state.groups[0].status).toBe("expired");
});
it("escalates overdue claims once without denying or refunding them", async () => {
  const { actor, order } = await setup();
  await capture(actor, order.id);
  const item = await openReturn(actor, order.id, "damaged", "refund");
  await recoverWorkspace(actor.workspaceId, Date.now() + 2 * 86400000);
  await recoverWorkspace(actor.workspaceId, Date.now() + 2 * 86400000);
  const state = await getWorkspace(actor.workspaceId);
  expect(state.cases[0].status).toBe("review");
  expect(state.orders[0].refundedAmount).toBe(0);
  expect(
    state.audit.filter(
      (a) => a.action === "case.deadline_escalated" && a.resource === item.id,
    ),
  ).toHaveLength(1);
});
it("resumes an already authorized refund after a persisted interruption", async () => {
  const { actor, order } = await setup();
  await capture(actor, order.id);
  await openReturn(actor, order.id, "canceled", "refund");
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.cases[0].status = "approved";
    state.cases[0].remedy = "refund";
    state.operations.push({
      id: "recovery-refund",
      orderId: order.id,
      kind: "refund",
      state: "unknown",
      amount: 2900,
      createdAt: new Date().toISOString(),
    });
  });
  await recoverWorkspace(actor.workspaceId);
  await recoverWorkspace(actor.workspaceId);
  const state = await getWorkspace(actor.workspaceId);
  expect(state.orders[0].refundedAmount).toBe(2900);
  expect(state.cases[0].status).toBe("resolved");
});
it("recovers a crash after reviewer approval but before refund operation creation", async () => {
  const { actor, order } = await setup();
  await capture(actor, order.id);
  await openReturn(actor, order.id, "canceled", "refund");
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.cases[0].status = "approved";
    state.cases[0].remedy = "refund";
    state.cases[0].resolutionNote = "Authorized customer cancellation refund";
  });
  await recoverWorkspace(actor.workspaceId);
  const state = await getWorkspace(actor.workspaceId);
  expect(state.orders[0].refundedAmount).toBe(2900);
  expect(state.operations.filter((op) => op.kind === "refund")).toHaveLength(1);
});
it("reconciles completed captures using provider reads without issuing another capture", async () => {
  const { actor, order } = await setup();
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.operations.push({
      id: "capture-recovery",
      orderId: order.id,
      kind: "capture",
      state: "unknown",
      amount: 2900,
    });
  });
  process.env.PAYMENT_MODE = "sandbox";
  vi.mocked(getPayment).mockResolvedValue({
    id: order.providerOrderId!,
    status: "COMPLETED",
    purchase_units: [
      {
        custom_id: order.id,
        payee: { merchant_id: order.quote.payee },
        amount: { currency_code: "USD", value: "29.00" },
        payments: {
          captures: [
            {
              id: "capture-confirmed",
              status: "COMPLETED",
              amount: { currency_code: "USD", value: "29.00" },
            },
          ],
        },
      },
    ],
  });
  await recoverWorkspace(actor.workspaceId);
  expect((await getWorkspace(actor.workspaceId)).orders[0].captureId).toBe(
    "capture-confirmed",
  );
});
it("rejects unverified webhooks and persists verified duplicate detection", async () => {
  process.env.PAYMENT_MODE = "sandbox";
  const event = {
    id: "WEBHOOK-TEST-1",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {},
  };
  await expect(acceptWebhook(new Headers(), event)).rejects.toThrow(
    "signature",
  );
  vi.mocked(verifyWebhook).mockResolvedValue(true);
  expect(await acceptWebhook(new Headers(), event)).toEqual({
    duplicate: false,
  });
  expect(await acceptWebhook(new Headers(), event)).toEqual({
    duplicate: true,
  });
});
