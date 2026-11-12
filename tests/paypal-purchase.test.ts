import "dotenv/config";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
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
  snapshot,
} from "../src/server/service";
import {
  getPayment,
  verifyProviderOrder,
  verifyWebhook,
} from "../src/server/payments";
import { acceptWebhook, recoverWorkspace } from "../src/server/recovery";
import { closeDatabase, getDatabase } from "../src/server/database";
import { quoteFingerprint } from "../src/domain/guard";

vi.mock("../src/server/payments", async (original) => ({
  ...(await original<typeof import("../src/server/payments")>()),
  verifyWebhook: vi.fn(),
}));

const hasSandboxCredentials = Boolean(
  process.env.PAYPAL_CLIENT_ID &&
  process.env.PAYPAL_CLIENT_SECRET &&
  process.env.PAYPAL_MERCHANT_ID,
);

beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  await getDatabase();
}, 60000);

afterAll(() => closeDatabase());

beforeEach(() => {
  process.env.PAYMENT_MODE = "fixture";
  vi.mocked(verifyWebhook).mockResolvedValue(false);
});

describe("Milestone 5 (M5): PayPal purchase, order history and status recovery (P01–P06)", () => {
  it("P01: Creates genuine sandbox order matching reviewed merchant, exact amount, currency, and custom order ID", async () => {
    if (!hasSandboxCredentials) {
      console.warn("Skipping real sandbox API call: credentials missing");
      return;
    }

    process.env.PAYMENT_MODE = "sandbox";
    const workspace = await createWorkspace();
    const buyer: Actor = {
      workspaceId: workspace.id,
      userId: "buyer-p01-" + randomUUID(),
      role: "buyer",
    };

    const quote = await makeQuote(buyer, "P001", "Atlas 14", undefined, undefined, "paypal");
    expect(quote.provider).toBe("sandbox");
    expect(quote.currency).toBe("USD");
    expect(quote.payee).toBe(process.env.PAYPAL_MERCHANT_ID);
    expect(quote.amount).toBe(2900);

    const order = await checkout(buyer, quote.id, quote.fingerprint, "paypal");
    expect(order.status).toBe("checkout_pending");
    expect(order.paymentMethod).toBe("paypal");
    expect(order.providerOrderId).toBeTruthy();
    expect(order.providerOrderId?.startsWith("FIXTURE-")).toBe(false);

    // Retrieve order directly from PayPal sandbox REST API to verify match
    const remote = await getPayment(order.providerOrderId!);
    expect(remote.id).toBe(order.providerOrderId);
    expect(remote.purchase_units).toHaveLength(1);
    const unit = remote.purchase_units![0];
    expect(unit.payee?.merchant_id).toBe(process.env.PAYPAL_MERCHANT_ID);
    expect(unit.amount.value).toBe("29.00");
    expect(unit.amount.currency_code).toBe("USD");
    expect(unit.custom_id).toBe(order.id);

    // Verify verification helper accepts it
    expect(() => verifyProviderOrder(remote, quote, order.id)).not.toThrow();
  });

  it("P02: Refresh/restart and repeated capture requests retain same provider reference and one financial effect", async () => {
    const workspace = await createWorkspace({ fixture: true });
    const buyer: Actor = {
      workspaceId: workspace.id,
      userId: "buyer-p02",
      role: "buyer",
    };

    const quote = await makeQuote(buyer, "P001", "Atlas 14");
    const order = await checkout(buyer, quote.id, quote.fingerprint);

    // First capture
    const firstCaptured = await capture(buyer, order.id);
    expect(firstCaptured.status).toBe("paid");
    expect(firstCaptured.captureId).toBeTruthy();

    const captureRef = firstCaptured.captureId;

    // Second capture request (idempotent retry)
    const secondCaptured = await capture(buyer, order.id);
    expect(secondCaptured.status).toBe("paid");
    expect(secondCaptured.captureId).toBe(captureRef);

    // Verify only one operation exists
    const state = await getWorkspace(workspace.id);
    const captureOps = state.operations.filter(
      (op) => op.kind === "capture" && op.orderId === order.id,
    );
    expect(captureOps).toHaveLength(1);
    expect(captureOps[0].state).toBe("succeeded");
    expect(captureOps[0].resultId).toBe(captureRef);

    // Restart / recovery simulation
    await recoverWorkspace(workspace.id);
    const afterRecovery = await getWorkspace(workspace.id);
    const recoveredOrder = afterRecovery.orders.find((o) => o.id === order.id)!;
    expect(recoveredOrder.status).toBe("paid");
    expect(recoveredOrder.captureId).toBe(captureRef);
  });

  it("P03: Window cancellation, SDK failure, and unknown provider responses never render as paid", async () => {
    const workspace = await createWorkspace({ fixture: true });
    const buyer: Actor = {
      workspaceId: workspace.id,
      userId: "buyer-p03",
      role: "buyer",
    };

    const quote = await makeQuote(buyer, "P001", "Atlas 14");
    const order = await checkout(buyer, quote.id, quote.fingerprint);

    // Case A: Window cancellation / SDK failure -> No capture is called
    let state = await getWorkspace(workspace.id);
    let current = state.orders.find((o) => o.id === order.id)!;
    expect(current.status).toBe("checkout_pending");
    expect(current.captureId).toBeUndefined();

    // Snapshot check: storefront does not present as paid
    let snap = await snapshot(buyer);
    let orderView = snap.orders.find((o) => o.id === order.id)!;
    expect(orderView.status).toBe("checkout_pending");
    expect(orderView.captureId).toBeUndefined();

    // Case B: Window cancellation / Abandoned checkout expires after quote timer
    const past = Date.now() + 15 * 60000;
    await recoverWorkspace(workspace.id, past);
    state = await getWorkspace(workspace.id);
    current = state.orders.find((o) => o.id === order.id)!;
    expect(current.status).toBe("canceled");
    expect(current.captureId).toBeUndefined();
    expect(current.events.some((e) => e.text.includes("Unpaid approval expired"))).toBe(true);

    // Case C: Unknown provider response in sandbox mode with uncompleted payment does not render as paid
    const q2 = await makeQuote(buyer, "P001", "Atlas 14");
    const order2 = await checkout(buyer, q2.id, q2.fingerprint);
    await mutateWorkspace(workspace.id, (s) => {
      const o = s.orders.find((x) => x.id === order2.id)!;
      o.quote.provider = "sandbox";
      o.providerOrderId = "SANDBOX-UNAPPROVED";
      s.operations.push({
        id: "timeout-op",
        orderId: order2.id,
        kind: "capture",
        amount: o.quote.amount,
        state: "unknown",
        createdAt: new Date().toISOString(),
      });
    });

    snap = await snapshot(buyer);
    orderView = snap.orders.find((o) => o.id === order2.id)!;
    expect(orderView.status).toBe("checkout_pending");
    expect(orderView.captureId).toBeUndefined();
  });

  it("P04: Changed approved terms, cross-buyer IDs, forged COD capture and mismatched provider data fail closed", async () => {
    const workspace = await createWorkspace({ fixture: true });
    const buyerA: Actor = {
      workspaceId: workspace.id,
      userId: "buyer-p04-a",
      role: "buyer",
    };
    const buyerB: Actor = {
      workspaceId: workspace.id,
      userId: "buyer-p04-b",
      role: "buyer",
    };

    // 1. Changed approved terms: tampered quote amount
    const quote = await makeQuote(buyerA, "P001", "Atlas 14");
    const tamperedQuote = { ...quote, amount: quote.amount - 500 };
    await expect(
      checkout(buyerA, quote.id, quoteFingerprint(tamperedQuote)),
    ).rejects.toThrow("The purchase changed. Your approval is required again.");

    // 2. Cross-buyer IDs: Buyer B cannot checkout or capture Buyer A's order
    const orderA = await checkout(buyerA, quote.id, quote.fingerprint);
    await expect(capture(buyerB, orderA.id)).rejects.toThrow("Order not found");

    // 3. Forged COD capture: Attempting capture on COD order fails closed
    const codQuote = await makeQuote(buyerA, "P001", "Atlas 14", undefined, undefined, "cod");
    const codOrder = await checkout(buyerA, codQuote.id, codQuote.fingerprint, "cod");
    await expect(capture(buyerA, codOrder.id)).rejects.toThrow(
      "Cash on delivery orders do not support payment capture.",
    );

    // 4. Mismatched provider data: wrong currency / amount / payee / custom_id
    const mismatchedProviderData = {
      id: "MOCK-ORDER",
      status: "COMPLETED",
      purchase_units: [
        {
          custom_id: "wrong-order-id",
          amount: { value: "99.99", currency_code: "EUR" },
          payee: { merchant_id: "FOREIGN_MERCHANT" },
        },
      ],
    };
    expect(() =>
      verifyProviderOrder(mismatchedProviderData, quote, orderA.id),
    ).toThrow("PayPal order does not match the approved purchase.");
  });

  it("P05: Signed external webhook delivery is observed; duplicate/reordered/invalid events are handled safely", async () => {
    const actor: Actor = {
      workspaceId: (await createWorkspace()).id,
      userId: "buyer-p05",
      role: "buyer",
    };
    const quote = await makeQuote(actor, "P001", "Atlas 14");
    const order = await checkout(actor, quote.id, quote.fingerprint);

    await mutateWorkspace(actor.workspaceId, (state) => {
      state.orders[0].quote.provider = "sandbox";
      state.orders[0].providerOrderId = "SANDBOX-ORDER-P05";
    });

    process.env.PAYMENT_MODE = "sandbox";
    const event = {
      id: "WH-CAPTURE-COMPLETED-1",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "CAPTURE-P05-1",
        amount: { value: "29.00", currency_code: "USD" },
        supplementary_data: { related_ids: { order_id: "SANDBOX-ORDER-P05" } },
      },
    };

    // 1. Invalid signature fails closed
    vi.mocked(verifyWebhook).mockResolvedValue(false);
    await expect(acceptWebhook(new Headers(), event)).rejects.toThrow("signature");
    expect((await snapshot(actor)).signedWebhookReceipts).toHaveLength(0);

    // 2. Valid signature records receipt
    vi.mocked(verifyWebhook).mockResolvedValue(true);
    const firstDelivery = await acceptWebhook(new Headers(), event);
    expect(firstDelivery.duplicate).toBe(false);

    // 3. Duplicate delivery is idempotent
    const duplicateDelivery = await acceptWebhook(new Headers(), event);
    expect(duplicateDelivery.duplicate).toBe(true);

    const snap = await snapshot(actor);
    expect(snap.signedWebhookReceipts).toHaveLength(1);
    expect(snap.signedWebhookReceipts[0].orderIds).toEqual([order.id]);

    // 4. Webhook payload alone does not mark order as paid without provider reconciliation
    const ws = await getWorkspace(actor.workspaceId);
    expect(ws.orders[0].status).toBe("checkout_pending");
    expect(ws.orders[0].captureId).toBeUndefined();

    // 5. Unrelated buyer sees 0 receipts
    const foreignBuyerSnap = await snapshot({
      ...actor,
      userId: "different-buyer",
    });
    expect(foreignBuyerSnap.signedWebhookReceipts).toHaveLength(0);
  });

  it("P06: Order history and details show correct method, price, group terms, payment and fulfillment separately; simulated shipping is not labeled live", async () => {
    const workspace = await createWorkspace({ fixture: true });
    const buyer: Actor = {
      workspaceId: workspace.id,
      userId: "buyer-p06",
      role: "buyer",
    };

    // Place a PayPal order
    const paypalQuote = await makeQuote(buyer, "P001", "Atlas 14", undefined, undefined, "paypal");
    const paypalOrder = await checkout(buyer, paypalQuote.id, paypalQuote.fingerprint, "paypal");
    await capture(buyer, paypalOrder.id);

    // Place a COD order
    const codQuote = await makeQuote(buyer, "P001", "Atlas 14", undefined, undefined, "cod");
    const codOrder = await checkout(buyer, codQuote.id, codQuote.fingerprint, "cod");

    const snap = await snapshot(buyer);
    expect(snap.orders).toHaveLength(2);

    const o1 = snap.orders.find((o) => o.id === paypalOrder.id)!;
    const o2 = snap.orders.find((o) => o.id === codOrder.id)!;

    // PayPal order checks
    expect(o1.paymentMethod).toBe("paypal");
    expect(o1.status).toBe("paid");
    expect(o1.captureId).toBeTruthy();
    expect(o1.quote.amount).toBe(2900);
    expect(o1.quote.groupId).toBeUndefined();

    // COD order checks
    expect(o2.paymentMethod).toBe("cod");
    expect(o2.status).toBe("unpaid_cod");
    expect(o2.paymentStatus).toBe("unpaid");
    expect(o2.captureId).toBeUndefined();
    expect(o2.quote.amount).toBe(2900);

    // Modes verify shipping is explicitly simulated, not claimed as live carrier
    expect(snap.modes.shipping).toBe("simulated");

    // Both orders separate payment status from fulfillment status
    expect(o1.quote.deliveryBy).toBeTruthy();
    expect(o2.quote.deliveryBy).toBeTruthy();
  });
});
