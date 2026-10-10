import { beforeEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  providerMinorUnits,
  assertProviderRemedyReady,
} from "../src/domain/provider-adjustments";
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
  executeRefund,
  reconcileExternalOrder,
} from "../src/server/service";
import { acceptWebhook, recoverWorkspace } from "../src/server/recovery";
import {
  getProviderCapture,
  getProviderDispute,
  getProviderRefund,
  getProviderDisputesForCapture,
  refundPayment,
  verifyWebhook,
} from "../src/server/payments";
vi.mock("../src/server/payments", async (original) => ({
  ...(await original<typeof import("../src/server/payments")>()),
  getProviderCapture: vi.fn(),
  getProviderDispute: vi.fn(),
  getProviderRefund: vi.fn(),
  getProviderDisputesForCapture: vi.fn(),
  refundPayment: vi.fn(),
  verifyWebhook: vi.fn(),
}));
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  vi.clearAllMocks();
  vi.mocked(verifyWebhook).mockResolvedValue(true);
  vi.mocked(getProviderDisputesForCapture).mockResolvedValue([]);
  vi.mocked(getProviderCapture).mockImplementation(async (captureId) => ({
    id: captureId,
    status: "COMPLETED",
    amount: { value: "29.00", currency_code: "USD" },
  }));
});
async function setup() {
  const workspace = await createWorkspace();
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "owner",
    role: "buyer",
  };
  const reviewer: Actor = { ...buyer, userId: "reviewer", role: "reviewer" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  const captureId = (await getWorkspace(workspace.id)).orders[0].captureId!;
  await mutateWorkspace(workspace.id, (state) => {
    state.orders[0].quote.provider = "sandbox";
  });
  process.env.PAYMENT_MODE = "sandbox";
  return { buyer, reviewer, order, item, captureId };
}
function disputeEvent(captureId: string, reference = "DISPUTE-1") {
  return {
    id: randomUUID(),
    event_type: "CUSTOMER.DISPUTE.CREATED",
    resource: {
      dispute_id: reference,
      disputed_transactions: [{ seller_transaction_id: captureId }],
    },
  };
}
function refundEvent(captureId: string, reference = "REFUND-1") {
  return {
    id: randomUUID(),
    event_type: "PAYMENT.CAPTURE.REFUNDED",
    resource: {
      id: reference,
      links: [
        {
          rel: "up",
          href: `https://api-m.sandbox.paypal.com/v2/payments/captures/${captureId}`,
        },
      ],
    },
  };
}
function refund(
  captureId: string,
  id = "REFUND-1",
  amount = "10.00",
  status = "COMPLETED",
) {
  return {
    id,
    status,
    amount: { value: amount, currency_code: "USD" },
    links: [
      {
        rel: "up",
        href: `https://api-m.sandbox.paypal.com/v2/payments/captures/${captureId}`,
      },
    ],
  };
}
function dispute(
  captureId: string,
  status = "OPEN",
  outcome = "",
  payout?: string,
  update = "2026-10-08T10:00:00Z",
) {
  return {
    dispute_id: "DISPUTE-1",
    status,
    update_time: update,
    disputed_transactions: [{ seller_transaction_id: captureId }],
    dispute_amount: { value: "29.00", currency_code: "USD" },
    ...(outcome
      ? {
          dispute_outcome: {
            outcome_code: outcome,
            ...(payout
              ? { amount_refunded: { value: payout, currency_code: "USD" } }
              : {}),
          },
        }
      : {}),
  };
}
it("accepts only bounded exact USD minor-unit amounts", () => {
  expect(providerMinorUnits("10.5", "USD", 2900)).toBe(1050);
  for (const value of ["-1", "1e2", "1.999", "NaN", "29.01", "01.00"])
    expect(() => providerMinorUnits(value, "USD", 2900)).toThrow();
  expect(() => providerMinorUnits("10", "EUR", 2900)).toThrow();
});
it("unverified events cannot persist observations or account a refund", async () => {
  const { buyer, captureId } = await setup();
  vi.mocked(verifyWebhook).mockResolvedValue(false);
  await expect(
    acceptWebhook(new Headers(), refundEvent(captureId)),
  ).rejects.toThrow("signature");
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].providerObservations).toBeUndefined();
  expect(state.orders[0].refundedAmount).toBe(0);
});
it("durably wakes completed payments and blocks further remedies before provider reads", async () => {
  const { buyer, reviewer, item, captureId } = await setup();
  const event = disputeEvent(captureId);
  expect(await acceptWebhook(new Headers(), event)).toEqual({
    duplicate: false,
  });
  expect(await acceptWebhook(new Headers(), event)).toEqual({
    duplicate: true,
  });
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].providerObservations?.[0].state).toBe("pending");
  expect(getProviderDispute).not.toHaveBeenCalled();
  await expect(
    resolveCase(reviewer, item.id, "refund", "Customer remedy"),
  ).rejects.toThrow("external PayPal adjustment");
  expect(
    state.operations.filter((operation) => operation.kind === "refund"),
  ).toHaveLength(0);
});
it("records active disputes and ambiguous buyer payouts without inventing merchant refunds", async () => {
  const { buyer, captureId } = await setup();
  await acceptWebhook(new Headers(), disputeEvent(captureId));
  vi.mocked(getProviderDispute).mockResolvedValue(
    dispute(captureId, "RESOLVED", "RESOLVED_WITH_PAYOUT", "29.00"),
  );
  await recoverWorkspace(buyer.workspaceId);
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].providerObservations?.[0]).toMatchObject({
    state: "review",
    reportedCustomerPayout: 2900,
  });
  expect(state.orders[0].refundedAmount).toBe(0);
  expect(
    state.operations.filter((operation) => operation.kind === "refund"),
  ).toHaveLength(0);
  expect(() => assertProviderRemedyReady(state.orders[0])).toThrow();
});
it("clears a matched seller-favour/no-payout dispute but rejects stale reordered facts", async () => {
  const { buyer, captureId } = await setup();
  await acceptWebhook(new Headers(), disputeEvent(captureId));
  vi.mocked(getProviderDispute).mockResolvedValue(
    dispute(captureId, "RESOLVED", "RESOLVED_SELLER_FAVOUR"),
  );
  await recoverWorkspace(buyer.workspaceId);
  const cleared = (await getWorkspace(buyer.workspaceId)).orders[0];
  expect(cleared.providerObservations?.[0].state).toBe("verified");
  expect(() => assertProviderRemedyReady(cleared)).not.toThrow();
  await acceptWebhook(new Headers(), disputeEvent(captureId));
  vi.mocked(getProviderDispute).mockResolvedValue(
    dispute(captureId, "OPEN", "", undefined, "2026-10-07T10:00:00Z"),
  );
  expect((await recoverWorkspace(buyer.workspaceId)).failures).toBeGreaterThan(
    0,
  );
  const current = (await getWorkspace(buyer.workspaceId)).orders[0];
  expect(current.providerObservations?.[0]).toMatchObject({
    state: "review",
    providerStatus: "RESOLVED",
    providerUpdatedAt: "2026-10-08T10:00:00Z",
  });
  expect(current.refundedAmount).toBe(0);
});
it("accounts a read-confirmed external partial refund once across duplicate and distinct wakeups", async () => {
  const { buyer, captureId } = await setup();
  const event = refundEvent(captureId);
  await acceptWebhook(new Headers(), event);
  vi.mocked(getProviderRefund).mockResolvedValue(refund(captureId));
  await recoverWorkspace(buyer.workspaceId);
  await acceptWebhook(new Headers(), event);
  await acceptWebhook(new Headers(), refundEvent(captureId));
  await recoverWorkspace(buyer.workspaceId);
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].refundedAmount).toBe(1000);
  expect(state.orders[0].refund).toMatchObject({
    status: "completed",
    reference: "REFUND-1",
  });
  expect(
    state.operations.filter((operation) => operation.kind === "refund"),
  ).toHaveLength(0);
  expect(state.cases[0].status).not.toBe("resolved");
});
it("does not double-count a completed internal operation observed through a webhook", async () => {
  const { buyer, order, captureId } = await setup();
  await mutateWorkspace(buyer.workspaceId, (state) => {
    state.orders[0].refundedAmount = 1000;
    state.operations.push({
      id: "known-refund",
      orderId: order.id,
      kind: "refund",
      state: "succeeded",
      amount: 1000,
      resultId: "REFUND-1",
    });
  });
  await acceptWebhook(new Headers(), refundEvent(captureId));
  vi.mocked(getProviderRefund).mockResolvedValue(refund(captureId));
  await recoverWorkspace(buyer.workspaceId);
  expect((await getWorkspace(buyer.workspaceId)).orders[0].refundedAmount).toBe(
    1000,
  );
});
it("pending refunds survive recovery and prohibit refund or replacement until confirmed", async () => {
  const { buyer, reviewer, item, captureId } = await setup();
  await acceptWebhook(new Headers(), refundEvent(captureId));
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund(captureId, "REFUND-1", "10.00", "PENDING"),
  );
  await recoverWorkspace(buyer.workspaceId);
  expect(
    (await getWorkspace(buyer.workspaceId)).orders[0].providerObservations?.[0]
      .state,
  ).toBe("pending");
  await expect(
    resolveCase(reviewer, item.id, "refund", "Policy remedy"),
  ).rejects.toThrow("external PayPal adjustment");
  await mutateWorkspace(buyer.workspaceId, (state) => {
    state.cases[0].request = "replacement";
  });
  await expect(
    resolveCase(reviewer, item.id, "replacement", "Policy remedy"),
  ).rejects.toThrow("external PayPal adjustment");
  vi.mocked(getProviderRefund).mockResolvedValue(refund(captureId));
  await recoverWorkspace(buyer.workspaceId, Date.now() + 61000);
  expect((await getWorkspace(buyer.workspaceId)).orders[0].refundedAmount).toBe(
    1000,
  );
});
it.each([
  "wrong_capture",
  "wrong_currency",
  "excess_amount",
  "operation_mismatch",
])(
  "fails closed on %s without applying a financial adjustment",
  async (kind) => {
    const { buyer, order, captureId } = await setup();
    if (kind === "operation_mismatch")
      await mutateWorkspace(buyer.workspaceId, (state) => {
        state.operations.push({
          id: "pending-refund",
          orderId: order.id,
          kind: "refund",
          state: "unknown",
          amount: 2900,
          resultId: "REFUND-1",
        });
      });
    await acceptWebhook(new Headers(), refundEvent(captureId));
    const data = refund(
      kind === "wrong_capture" ? "OTHER-CAPTURE" : captureId,
      "REFUND-1",
      kind === "excess_amount" ? "29.01" : "10.00",
    );
    if (kind === "wrong_currency") data.amount.currency_code = "EUR";
    vi.mocked(getProviderRefund).mockResolvedValue(data);
    await recoverWorkspace(buyer.workspaceId);
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.orders[0].refundedAmount).toBe(0);
    expect(state.orders[0].providerObservations?.[0].state).toBe("review");
  },
);
it("an unavailable provider is retried with durable backoff while the customer claim stays open", async () => {
  const { buyer, captureId } = await setup();
  await acceptWebhook(new Headers(), disputeEvent(captureId));
  vi.mocked(getProviderDispute).mockRejectedValue(
    new Error("provider unavailable"),
  );
  const now = Date.now();
  await recoverWorkspace(buyer.workspaceId, now);
  const observation = (await getWorkspace(buyer.workspaceId)).orders[0]
    .providerObservations![0];
  expect(observation.nextCheckAt).toBeTruthy();
  await recoverWorkspace(buyer.workspaceId, now + 1);
  expect(getProviderDispute).toHaveBeenCalledTimes(1);
  vi.mocked(getProviderDispute).mockResolvedValue(
    dispute(captureId, "RESOLVED", "CANCELED_BY_BUYER"),
  );
  await recoverWorkspace(
    buyer.workspaceId,
    Date.parse(observation.nextCheckAt!) + 1,
  );
  expect(
    (await getWorkspace(buyer.workspaceId)).orders[0].providerObservations?.[0]
      .state,
  ).toBe("verified");
});
it("capture reversals require human reconciliation and cannot fabricate refunds", async () => {
  const { buyer, captureId } = await setup();
  await acceptWebhook(new Headers(), {
    id: randomUUID(),
    event_type: "PAYMENT.CAPTURE.REVERSED",
    resource: { id: captureId },
  });
  vi.mocked(getProviderCapture).mockResolvedValue({
    id: captureId,
    status: "REFUNDED",
    amount: { value: "29.00", currency_code: "USD" },
  });
  await recoverWorkspace(buyer.workspaceId);
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.orders[0].providerObservations?.[0].state).toBe("review");
  expect(state.orders[0].refundedAmount).toBe(0);
});
it("an already authorized refund cannot proceed past a newly persisted external pending receipt", async () => {
  const { buyer, reviewer, order, captureId } = await setup();
  await mutateWorkspace(buyer.workspaceId, (state) => {
    state.cases[0].status = "approved";
    state.cases[0].remedy = "refund";
  });
  await acceptWebhook(new Headers(), disputeEvent(captureId));
  await expect(executeRefund(reviewer, order.id)).rejects.toThrow(
    "external PayPal adjustment",
  );
  expect(
    (await getWorkspace(buyer.workspaceId)).operations.filter(
      (operation) => operation.kind === "refund",
    ),
  ).toHaveLength(0);
});
it("preflight discovers a missed-webhook active dispute before the first refund", async () => {
  const { buyer, reviewer, item, captureId } = await setup();
  vi.mocked(getProviderDisputesForCapture).mockResolvedValue([
    { dispute_id: "DISPUTE-1" },
  ]);
  vi.mocked(getProviderDispute).mockResolvedValue(dispute(captureId));
  await expect(
    resolveCase(reviewer, item.id, "refund", "Customer-policy remedy"),
  ).rejects.toThrow("external PayPal adjustment");
  const state = await getWorkspace(buyer.workspaceId);
  expect(
    state.orders[0].providerObservations?.find(
      (entry) => entry.kind === "dispute",
    ),
  ).toMatchObject({
    trigger: "preflight",
    state: "review",
    reference: "DISPUTE-1",
  });
  expect(
    state.operations.filter((operation) => operation.kind === "refund"),
  ).toHaveLength(0);
  expect(refundPayment).not.toHaveBeenCalled();
});
it.each(["REFUNDED", "PARTIALLY_REFUNDED"])(
  "missed-webhook %s capture cannot authorize another remedy or invent amounts",
  async (status) => {
    const { buyer, reviewer, item, captureId } = await setup();
    vi.mocked(getProviderCapture).mockResolvedValue({
      id: captureId,
      status,
      amount: { value: "29.00", currency_code: "USD" },
    });
    await expect(
      resolveCase(reviewer, item.id, "refund", "Policy remedy"),
    ).rejects.toThrow("external PayPal adjustment");
    expect(
      (await getWorkspace(buyer.workspaceId)).orders[0].refundedAmount,
    ).toBe(0);
    expect(refundPayment).not.toHaveBeenCalled();
  },
);
it("incomplete discovery or an unavailable provider fails closed before any financial POST", async () => {
  const { buyer, reviewer, item } = await setup();
  vi.mocked(getProviderDisputesForCapture).mockRejectedValue(
    new Error("paginated or provider unavailable"),
  );
  await expect(
    resolveCase(reviewer, item.id, "refund", "Policy remedy"),
  ).rejects.toThrow("external PayPal adjustment");
  expect(
    (await getWorkspace(buyer.workspaceId)).orders[0].providerScan?.status,
  ).toBe("review");
  expect(refundPayment).not.toHaveBeenCalled();
});
it("periodic discovery is bounded to one scan per captured order every ten minutes", async () => {
  const { buyer } = await setup();
  const now = Date.now();
  await recoverWorkspace(buyer.workspaceId, now);
  await recoverWorkspace(buyer.workspaceId, now + 1000);
  expect(getProviderDisputesForCapture).toHaveBeenCalledTimes(1);
  await recoverWorkspace(buyer.workspaceId, now + 600001);
  expect(getProviderDisputesForCapture).toHaveBeenCalledTimes(2);
});
it("a reversal notification cannot be cleared solely by a completed capture response", async () => {
  const { buyer, captureId } = await setup();
  await acceptWebhook(new Headers(), {
    id: randomUUID(),
    event_type: "PAYMENT.CAPTURE.REVERSED",
    resource: { id: captureId },
  });
  await recoverWorkspace(buyer.workspaceId);
  const observation = (
    await getWorkspace(buyer.workspaceId)
  ).orders[0].providerObservations?.find((entry) => entry.kind === "capture");
  expect(observation?.state).toBe("review");
  expect(() =>
    assertProviderRemedyReady({ providerObservations: [observation!] }),
  ).toThrow();
});
it("reviewers can supply exact refund references for GET-only completion and capture reconciliation", async () => {
  const { buyer, reviewer, order, captureId } = await setup();
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund(captureId, "KNOWN-REFUND", "29.00"),
  );
  vi.mocked(getProviderCapture).mockResolvedValue({
    id: captureId,
    status: "REFUNDED",
    amount: { value: "29.00", currency_code: "USD" },
  });
  const reconciled = await reconcileExternalOrder(reviewer, order.id, [
    "KNOWN-REFUND",
  ]);
  expect(reconciled.refundedAmount).toBe(2900);
  expect(reconciled.status).toBe("refunded");
  expect(
    reconciled.providerObservations?.every(
      (entry) => entry.state === "verified",
    ),
  ).toBe(true);
  expect(refundPayment).not.toHaveBeenCalled();
  expect(
    (await getWorkspace(buyer.workspaceId)).operations.filter(
      (operation) => operation.kind === "refund",
    ),
  ).toHaveLength(0);
});
it("reviewer references do not bypass provider capture checks, payout review or role/ownership boundaries", async () => {
  const { buyer, reviewer, order, captureId } = await setup();
  await expect(
    reconcileExternalOrder(buyer, order.id, ["KNOWN-REFUND"]),
  ).rejects.toThrow("Reviewer");
  await expect(
    reconcileExternalOrder(
      { ...reviewer, workspaceId: (await createWorkspace()).id },
      order.id,
      [],
    ),
  ).rejects.toThrow("not found");
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund("OTHER-CAPTURE", "KNOWN-REFUND", "29.00"),
  );
  const mismatched = await reconcileExternalOrder(reviewer, order.id, [
    "KNOWN-REFUND",
  ]);
  expect(mismatched.refundedAmount).toBe(0);
  expect(
    mismatched.providerObservations?.find((entry) => entry.kind === "refund")
      ?.state,
  ).toBe("review");
  vi.mocked(getProviderDisputesForCapture).mockResolvedValue([
    { dispute_id: "DISPUTE-1" },
  ]);
  vi.mocked(getProviderDispute).mockResolvedValue(
    dispute(captureId, "RESOLVED", "RESOLVED_BUYER_FAVOUR", "29.00"),
  );
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund(captureId, "KNOWN-REFUND", "29.00"),
  );
  const payout = await reconcileExternalOrder(reviewer, order.id, [
    "KNOWN-REFUND",
  ]);
  expect(
    payout.providerObservations?.find((entry) => entry.kind === "dispute")
      ?.state,
  ).toBe("review");
});
it("a fully referenced partial refund permits only the explicitly approved remaining amount", async () => {
  const { buyer, reviewer, order, item, captureId } = await setup();
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund(captureId, "EXTERNAL-10", "10.00"),
  );
  vi.mocked(getProviderCapture).mockResolvedValue({
    id: captureId,
    status: "PARTIALLY_REFUNDED",
    amount: { value: "29.00", currency_code: "USD" },
  });
  const partial = await reconcileExternalOrder(reviewer, order.id, [
    "EXTERNAL-10",
  ]);
  expect(partial.refundedAmount).toBe(1000);
  expect(() => assertProviderRemedyReady(partial)).not.toThrow();
  expect(refundPayment).not.toHaveBeenCalled();
  vi.mocked(refundPayment).mockResolvedValue({
    id: "REMAINING-19",
    status: "COMPLETED",
  });
  await resolveCase(
    reviewer,
    item.id,
    "refund",
    "Customer requested the remaining merchant-policy refund.",
  );
  expect(vi.mocked(refundPayment).mock.calls[0][2]).toBe(1900);
  expect((await getWorkspace(buyer.workspaceId)).orders[0].refundedAmount).toBe(
    2900,
  );
});
it("an unknown prior full-refund operation is not reissued after an external partial refund", async () => {
  const { buyer, reviewer, order, captureId } = await setup();
  await mutateWorkspace(buyer.workspaceId, (state) => {
    state.cases[0].status = "approved";
    state.cases[0].remedy = "refund";
    state.operations.push({
      id: "UNKNOWN-29",
      orderId: order.id,
      kind: "refund",
      state: "unknown",
      amount: 2900,
      createdAt: new Date().toISOString(),
    });
  });
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund(captureId, "EXTERNAL-10", "10.00"),
  );
  vi.mocked(getProviderCapture).mockResolvedValue({
    id: captureId,
    status: "PARTIALLY_REFUNDED",
    amount: { value: "29.00", currency_code: "USD" },
  });
  await reconcileExternalOrder(reviewer, order.id, ["EXTERNAL-10"]);
  await expect(executeRefund(reviewer, order.id)).rejects.toThrow();
  expect(refundPayment).not.toHaveBeenCalled();
  const state = await getWorkspace(buyer.workspaceId);
  expect(
    state.operations
      .filter((entry) => entry.kind === "refund")
      .map((entry) => entry.id),
  ).toEqual(["UNKNOWN-29"]);
  expect(state.orders[0].refundedAmount).toBe(1000);
});
it("a completed refund reference cannot mutate its already credited amount", async () => {
  const { buyer, reviewer, order, captureId } = await setup();
  vi.mocked(getProviderRefund).mockResolvedValue({
    ...refund(captureId, "IMMUTABLE-REFUND", "10.00"),
    update_time: "2026-10-08T10:00:00Z",
  });
  await reconcileExternalOrder(reviewer, order.id, ["IMMUTABLE-REFUND"]);
  vi.mocked(getProviderRefund).mockResolvedValue({
    ...refund(captureId, "IMMUTABLE-REFUND", "15.00"),
    update_time: "2026-10-08T11:00:00Z",
  });
  await reconcileExternalOrder(reviewer, order.id, ["IMMUTABLE-REFUND"]);
  const current = (await getWorkspace(buyer.workspaceId)).orders[0];
  expect(current.refundedAmount).toBe(1000);
  expect(
    current.providerObservations?.find(
      (entry) => entry.reference === "IMMUTABLE-REFUND",
    ),
  ).toMatchObject({ amount: 1000, state: "review" });
});
it("a full read-confirmed refund resolves only an already approved refund case", async () => {
  const { buyer, reviewer, order, captureId } = await setup();
  await mutateWorkspace(buyer.workspaceId, (state) => {
    state.cases[0].status = "approved";
    state.cases[0].remedy = "refund";
  });
  vi.mocked(getProviderRefund).mockResolvedValue(
    refund(captureId, "APPROVED-REFUND", "29.00"),
  );
  vi.mocked(getProviderCapture).mockResolvedValue({
    id: captureId,
    status: "REFUNDED",
    amount: { value: "29.00", currency_code: "USD" },
  });
  await reconcileExternalOrder(reviewer, order.id, ["APPROVED-REFUND"]);
  expect((await getWorkspace(buyer.workspaceId)).cases[0].status).toBe(
    "resolved",
  );
  expect(refundPayment).not.toHaveBeenCalled();
});
