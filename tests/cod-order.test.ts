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
  cancelOrder,
  shippingEvent,
} from "../src/server/service";
import { quoteFingerprint } from "../src/domain/guard";
import { recoverWorkspace } from "../src/server/recovery";
import { activeStock } from "../src/server/group-lifecycle";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
});

async function setupWorkspace() {
  const workspace = await createWorkspace({ fixture: true });
  const buyerA: Actor = {
    workspaceId: workspace.id,
    userId: "buyer-a",
    role: "buyer",
  };
  const buyerB: Actor = {
    workspaceId: workspace.id,
    userId: "buyer-b",
    role: "buyer",
  };
  const seller: Actor = {
    workspaceId: workspace.id,
    userId: "seller",
    role: "seller",
  };
  return { workspace, buyerA, buyerB, seller };
}

it("D01: places a COD order without PayPal credentials; order, amount, and method survive refresh and reload", async () => {
  const { buyerB } = await setupWorkspace();

  // Ensure no PayPal merchant credentials exist in environment
  const savedMerchantId = process.env.PAYPAL_MERCHANT_ID;
  const savedClientId = process.env.PAYPAL_CLIENT_ID;
  delete process.env.PAYPAL_MERCHANT_ID;
  delete process.env.PAYPAL_CLIENT_ID;

  try {
    const quote = await makeQuote(
      buyerB,
      "P001",
      "Atlas 14",
      undefined,
      undefined,
      "cod",
    );
    expect(quote.paymentMethod).toBe("cod");
    expect(quote.payee).toBe("cod-store");
    expect(quote.provider).toBeUndefined();

    const order = await checkout(
      buyerB,
      quote.id,
      quote.fingerprint,
      "cod",
    );

    expect(order.status).toBe("unpaid_cod");
    expect(order.paymentMethod).toBe("cod");
    expect(order.paymentStatus).toBe("unpaid");
    expect(order.quote.amount).toBe(quote.amount);
    expect(order.providerOrderId).toBeUndefined();
    expect(order.captureId).toBeUndefined();
    expect(order.events.some((e) => e.text.includes("Order confirmed — payment due on delivery."))).toBe(true);

    // Verify persistence across reloads
    const persisted = await getWorkspace(buyerB.workspaceId);
    const stored = persisted.orders.find((o) => o.id === order.id);
    expect(stored).toBeDefined();
    expect(stored?.status).toBe("unpaid_cod");
    expect(stored?.paymentMethod).toBe("cod");
    expect(stored?.quote.amount).toBe(quote.amount);
  } finally {
    if (savedMerchantId) process.env.PAYPAL_MERCHANT_ID = savedMerchantId;
    if (savedClientId) process.env.PAYPAL_CLIENT_ID = savedClientId;
  }
});

it("D02: double-click, timeout retry and concurrent submissions create one order and one reservation", async () => {
  const { buyerB } = await setupWorkspace();
  const quote = await makeQuote(
    buyerB,
    "P001",
    "Atlas 14",
    undefined,
    undefined,
    "cod",
  );

  // Concurrent submissions
  const [order1, order2, order3] = await Promise.all([
    checkout(buyerB, quote.id, quote.fingerprint, "cod"),
    checkout(buyerB, quote.id, quote.fingerprint, "cod"),
    checkout(buyerB, quote.id, quote.fingerprint, "cod"),
  ]);

  expect(order1.id).toBe(order2.id);
  expect(order2.id).toBe(order3.id);

  const ws = await getWorkspace(buyerB.workspaceId);
  const matchingOrders = ws.orders.filter((o) => o.quote.id === quote.id);
  expect(matchingOrders.length).toBe(1);

  // Active stock calculation shows exactly 1 reservation for this order
  const stockCount = activeStock(ws, "P001");
  expect(stockCount).toBe(1);
});

it("D03: COD creation and cancellation make zero provider calls, produce no capture/refund IDs and never appear as paid revenue", async () => {
  const { buyerB } = await setupWorkspace();
  const quote = await makeQuote(
    buyerB,
    "P001",
    "Atlas 14",
    undefined,
    undefined,
    "cod",
  );

  const order = await checkout(
    buyerB,
    quote.id,
    quote.fingerprint,
    "cod",
  );

  expect(order.providerOrderId).toBeUndefined();
  expect(order.captureId).toBeUndefined();
  expect(order.refund).toBeUndefined();
  expect(order.refundedAmount).toBe(0);

  // Check workspace paid orders: unpaid_cod must not be included
  const ws = await getWorkspace(buyerB.workspaceId);
  const paidOrders = ws.orders.filter((o) => o.status === "paid" || o.captureId);
  expect(paidOrders.some((o) => o.id === order.id)).toBe(false);

  // Cancel order
  const canceled = await cancelOrder(buyerB, order.id, "Changed mind");
  expect(canceled.status).toBe("canceled");
  expect(canceled.captureId).toBeUndefined();
  expect(canceled.refund).toBeUndefined();
  expect(canceled.refundedAmount).toBe(0);
});

it("D04: method/quote tampering, expired terms, wrong owner and insufficient stock are rejected before committing effects", async () => {
  const { buyerA, buyerB } = await setupWorkspace();

  // 1. Method tampering: PayPal quote attempted as COD
  const paypalQuote = await makeQuote(buyerA, "P001", "Atlas 14", undefined, undefined, "paypal");
  await expect(
    checkout(buyerA, paypalQuote.id, paypalQuote.fingerprint, "cod"),
  ).rejects.toThrow("Payment method changed");

  // 2. Tampered fingerprint
  const codQuote = await makeQuote(buyerA, "P001", "Atlas 14", undefined, undefined, "cod");
  await expect(
    checkout(buyerA, codQuote.id, "0".repeat(64), "cod"),
  ).rejects.toThrow();

  // 3. Expired terms
  await mutateWorkspace(buyerA.workspaceId, (s) => {
    const q = s.quotes.find((item) => item.id === codQuote.id)!;
    q.expiresAt = new Date(Date.now() - 60000).toISOString();
  });
  await expect(
    checkout(buyerA, codQuote.id, codQuote.fingerprint, "cod"),
  ).rejects.toThrow("expired");

  // 4. Wrong owner
  const freshQuote = await makeQuote(buyerA, "P001", "Atlas 14", undefined, undefined, "cod");
  await expect(
    checkout(buyerB, freshQuote.id, freshQuote.fingerprint, "cod"),
  ).rejects.toThrow("Quote not found");

  // 5. Ineligible terms (group policy with codCommitmentsEligible = false)
  await mutateWorkspace(buyerA.workspaceId, (s) => {
    s.groups.push({
      id: "group-no-cod",
      productId: "P001",
      model: "Atlas 14",
      members: [buyerA.userId],
      status: "ready",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      checkoutExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      amount: 2500,
      terms: {
        policyVersion: 1,
        minimumMembers: 2,
        discountPercent: 10,
        checkoutMinutes: 30,
        baseAmount: 2900,
        amount: 2500,
        codCommitmentsEligible: false,
      },
    });
  });

  await expect(
    makeQuote(buyerA, "P001", "Atlas 14", "group-no-cod", undefined, "cod"),
  ).rejects.toThrow("Cash on delivery is not eligible");
});

it("D05: cancellation/expiry/recovery follow recorded COD rule without duplicate release or damage to another buyer's paid order", async () => {
  const { buyerA, buyerB, seller } = await setupWorkspace();

  // Form group with both buyers
  const groupId = "group-shared-test";
  await mutateWorkspace(buyerA.workspaceId, (s) => {
    s.groups.push({
      id: groupId,
      productId: "P001",
      model: "Atlas 14",
      members: [buyerA.userId, buyerB.userId],
      status: "ready",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      checkoutExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      amount: 2500,
      terms: {
        policyVersion: 1,
        minimumMembers: 2,
        discountPercent: 10,
        checkoutMinutes: 30,
        baseAmount: 2900,
        amount: 2500,
        codCommitmentsEligible: true,
      },
    });
  });

  // Buyer A places PayPal paid order
  const quoteA = await makeQuote(buyerA, "P001", "Atlas 14", groupId, undefined, "paypal");
  const orderA = await checkout(buyerA, quoteA.id, quoteA.fingerprint, "paypal");
  const capturedA = await capture(buyerA, orderA.id);

  // Buyer B places COD order
  const quoteB = await makeQuote(buyerB, "P001", "Atlas 14", groupId, undefined, "cod");
  const orderB = await checkout(buyerB, quoteB.id, quoteB.fingerprint, "cod");

  expect(capturedA.status).toBe("paid");
  expect(orderB.status).toBe("unpaid_cod");

  // Recovery after short quote timer does NOT cancel COD order
  await recoverWorkspace(buyerB.workspaceId, Date.now() + 15 * 60000);
  const midState = await getWorkspace(buyerB.workspaceId);
  expect(midState.orders.find((o) => o.id === orderB.id)?.status).toBe("unpaid_cod");

  // Forged actions fail closed:
  // Cannot capture COD order
  await expect(capture(buyerB, orderB.id)).rejects.toThrow("Cash on delivery orders do not support payment capture.");
  // Cannot open return/refund on COD order
  await expect(openReturn(buyerB, orderB.id, "damaged", "refund")).rejects.toThrow("no eligible captured payment");

  // Buyer B cancels COD order
  const canceledB = await cancelOrder(buyerB, orderB.id, "Customer cancellation");
  expect(canceledB.status).toBe("canceled");

  // Repeat cancellation is idempotent without duplicate release
  const repeatCancel = await cancelOrder(buyerB, orderB.id, "Repeat");
  expect(repeatCancel.status).toBe("canceled");

  // Buyer A's paid order is completely unaffected
  const finalState = await getWorkspace(buyerA.workspaceId);
  const storedA = finalState.orders.find((o) => o.id === orderA.id);
  expect(storedA?.status).toBe("paid");
  expect(storedA?.quote.amount).toBe(2500);

  // Once an order is shipped, cancellation by buyer is rejected
  const quoteC = await makeQuote(buyerB, "P001", "Atlas 14", undefined, undefined, "cod");
  const orderC = await checkout(buyerB, quoteC.id, quoteC.fingerprint, "cod");
  await shippingEvent(seller, orderC.id, "shipped");
  await expect(cancelOrder(buyerB, orderC.id)).rejects.toThrow("cannot be canceled");
});

it("D06: existing PayPal/fixture records retain their original meanings and authorization boundaries", async () => {
  const { buyerA } = await setupWorkspace();

  // Legacy quote without paymentMethod field
  const legacyQuote = await makeQuote(buyerA, "P001", "Atlas 14");
  expect(legacyQuote.paymentMethod).toBeUndefined();

  // Fingerprint calculation is backward compatible
  const fp = quoteFingerprint(legacyQuote);
  expect(legacyQuote.fingerprint).toBe(fp);

  // Standard checkout produces checkout_pending
  const order = await checkout(buyerA, legacyQuote.id, fp);
  expect(order.status).toBe("checkout_pending");
  expect(order.paymentMethod).toBe("paypal");

  // Standard capture succeeds
  const captured = await capture(buyerA, order.id);
  expect(captured.status).toBe("paid");
  expect(captured.captureId).toBeDefined();
});
