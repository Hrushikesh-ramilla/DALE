import "dotenv/config";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse } from "dotenv";
import { getPayment, getRefund, paypalRequest } from "../src/server/payments";
import type { snapshot } from "../src/server/service";
type Snapshot = Awaited<ReturnType<typeof snapshot>>;
type PrivateRun = {
  base: string;
  cookie: string;
  workspaceId: string;
  buyerId: string;
  orderId: string;
  providerOrderId: string;
  amount: number;
  merchantId: string;
  approvalUrl: string;
  caseId?: string;
};
const phase = process.argv[2] || "prepare";
assert.ok(
  ["prepare", "capture", "refund", "receipts"].includes(phase),
  "Use prepare, capture, refund or receipts.",
);
const config = parse(await readFile(".data/deploy/production.env"));
const base = process.env.VERIFY_BASE_URL || config.APP_URL;
assert.ok(
  base.startsWith("https://") ||
    /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(base),
  "HTTPS or local verification required.",
);
const privatePath = ".data/reports/paypal-journey-private.json";
const reportPath = ".data/reports/paypal-journey.json";
let cookie = "";
const report: {
  checkedAt: string;
  environment: string;
  phase: string;
  checks: { scenario: string; passed: boolean }[];
  error?: string;
} = {
  checkedAt: new Date().toISOString(),
  environment: "sandbox",
  phase,
  checks: [],
};
function check(scenario: string, passed: boolean) {
  report.checks.push({ scenario, passed });
  assert.ok(passed, scenario);
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      `DALE ${path} returned HTTP ${response.status}; no financial success recorded.`,
    );
  return data as T;
}
const action = async (body: unknown) =>
  (
    await api<{ result: Snapshot["orders"][number] & { id: string } }>(
      "/api/actions",
      body,
    )
  ).result;
async function save(run: PrivateRun) {
  await writeFile(privatePath, JSON.stringify(run, null, 2) + "\n", {
    mode: 0o600,
  });
}
try {
  await mkdir(".data/reports", { recursive: true });
  if (phase === "prepare") {
    try {
      await readFile(privatePath);
      throw new Error(
        "An existing journey is saved. Resume it, or deliberately archive its private file before starting a separate test.",
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const state = await api<Snapshot>("/api/session", {
      role: "buyer",
      accessCode: config.DEMO_ACCESS_CODE,
    });
    check(
      "Ordinary sandbox workspace; no fixture payment",
      !state.fixtureWorkspace && state.modes.payments === "sandbox",
    );
    check(
      "Local credential identifies the deployed PayPal app",
      state.paypalClientId === process.env.PAYPAL_CLIENT_ID,
    );
    const quote = (
      await api<{ result: Snapshot["orders"][number]["quote"] }>(
        "/api/actions",
        { action: "quote", productId: "P001", model: "Atlas 14" },
      )
    ).result;
    check(
      "Exact USD sandbox merchant quote",
      quote.provider === "sandbox" &&
        quote.currency === "USD" &&
        quote.payee === process.env.PAYPAL_MERCHANT_ID &&
        quote.amount === 2900,
    );
    const order = await action({
      action: "checkout",
      quoteId: quote.id,
      fingerprint: quote.fingerprint,
    });
    check(
      "Protected application creates a genuine sandbox order",
      Boolean(order.providerOrderId) &&
        !order.providerOrderId!.startsWith("FIXTURE-"),
    );
    const provider = (await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(order.providerOrderId!)}/confirm-payment-source`,
      {
        method: "POST",
        headers: { "PayPal-Request-Id": randomUUID() },
        body: JSON.stringify({
          payment_source: {
            paypal: {
              experience_context: {
                return_url: base + "/orders",
                cancel_url: base + "/orders",
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
              },
            },
          },
        }),
      },
    )) as { links: { rel: string; href: string }[] };
    const approvalUrl = provider.links.find((link) =>
      ["approve", "payer-action"].includes(link.rel),
    )?.href;
    assert.ok(
      approvalUrl && new URL(approvalUrl).hostname === "www.sandbox.paypal.com",
      "Sandbox buyer approval link required.",
    );
    const run: PrivateRun = {
      base,
      cookie,
      workspaceId: state.actor.workspaceId,
      buyerId: state.actor.userId,
      orderId: order.id,
      providerOrderId: order.providerOrderId!,
      amount: quote.amount,
      merchantId: quote.payee,
      approvalUrl,
    };
    await save(run);
    console.log(
      `Approve the $29.00 USD test purchase with the distinct sandbox buyer: ${approvalUrl}`,
    );
    console.log(
      "No capture or refund was issued. After approval run verify:paypal:journey -- capture.",
    );
  } else {
    const run = JSON.parse(await readFile(privatePath, "utf8")) as PrivateRun;
    check(
      "Resuming the same host and merchant",
      run.base === base && run.merchantId === process.env.PAYPAL_MERCHANT_ID,
    );
    cookie = run.cookie;
    let state = await api<Snapshot>("/api/session");
    check(
      "Private buyer session still owns the saved order",
      state.actor.workspaceId === run.workspaceId &&
        state.actor.userId === run.buyerId &&
        state.orders.some((order) => order.id === run.orderId),
    );
    if (phase === "capture") {
      const provider = await getPayment(run.providerOrderId);
      check(
        "Buyer actually approved at PayPal",
        ["APPROVED", "COMPLETED"].includes(provider.status),
      );
      const order = await action({ action: "capture", orderId: run.orderId });
      check(
        "Application records exact completed capture",
        order.status === "paid" && Boolean(order.captureId),
      );
      const repeated = await action({
        action: "capture",
        orderId: run.orderId,
      });
      check(
        "Repeated capture returns original capture reference",
        repeated.captureId === order.captureId,
      );
    } else if (phase === "refund") {
      const order = state.orders.find((order) => order.id === run.orderId)!;
      check(
        "Captured sandbox order required for refund",
        Boolean(order.captureId),
      );
      const buyerCookie = cookie;
      await api<Snapshot>("/api/session", {
        role: "seller",
        workspaceId: run.workspaceId,
        accessCode: config.OPERATOR_ACCESS_CODE,
      });
      await action({
        action: "cancel_fulfillment",
        orderId: run.orderId,
        reason:
          "Sandbox acceptance: seller cancels the test order; customer requests a full refund.",
      });
      cookie = buyerCookie;
      if (!run.caseId) {
        const item = await action({
          action: "return",
          orderId: run.orderId,
          reason: "canceled",
          request: "refund",
        });
        run.caseId = item.id;
        await save(run);
      }
      await api<Snapshot>("/api/session", {
        role: "reviewer",
        workspaceId: run.workspaceId,
        accessCode: config.OPERATOR_ACCESS_CODE,
      });
      const request = {
        action: "resolve",
        caseId: run.caseId,
        remedy: "refund",
        note: "Sandbox acceptance: merchant cancellation; honor the customer's full refund choice; no physical return is required.",
      };
      await action(request);
      await action(request);
      cookie = buyerCookie;
      state = await api<Snapshot>("/api/session");
      const refunded = state.orders.find((item) => item.id === run.orderId)!;
      check(
        "Application confirms the full refund once",
        refunded.status === "refunded" &&
          refunded.refundedAmount === run.amount &&
          Boolean(refunded.refund?.reference),
      );
      const provider = await getRefund(refunded.refund!.reference!, {
        captureId: refunded.captureId!,
        amount: run.amount,
      });
      check(
        "PayPal GET confirms matching completed refund",
        provider.status === "COMPLETED",
      );
    } else {
      for (let attempt = 0; attempt < 6; attempt++) {
        state = await api<Snapshot>("/api/session");
        const receipts = state.signedWebhookReceipts || [];
        if (
          ["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.REFUNDED"].every(
            (type) =>
              receipts.some(
                (receipt) =>
                  receipt.type === type &&
                  receipt.orderIds.includes(run.orderId),
              ),
          )
        )
          break;
        if (attempt < 5)
          await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      for (const type of [
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.REFUNDED",
      ])
        check(
          `Actual signature-verified ${type} receipt linked to the order`,
          state.signedWebhookReceipts.some(
            (receipt) =>
              receipt.type === type && receipt.orderIds.includes(run.orderId),
          ),
        );
    }
  }
} catch (error) {
  report.error =
    error instanceof Error ? error.message : "Journey verification failed.";
  console.error(report.error);
  process.exitCode = 1;
} finally {
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  await writeFile(
    `.data/reports/paypal-journey-${phase}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `${report.checks.filter((check) => check.passed).length}/${report.checks.length} ${phase} checks passed. A completed phase does not imply the remaining phases passed.`,
  );
}
