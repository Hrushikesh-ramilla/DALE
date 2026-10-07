import { z } from "zod";
import type { Quote } from "../domain/guard";
import { paypalAmount } from "../domain/money";
export const paymentMode = () =>
  process.env.PAYMENT_MODE === "sandbox" ? "sandbox" : "fixture";
const BASE = "https://api-m.sandbox.paypal.com";
let cachedToken: { value: string; expires: number } | undefined;
const orderSchema = z.object({
  id: z.string(),
  status: z.string(),
  purchase_units: z
    .array(
      z.object({
        custom_id: z.string().optional(),
        amount: z.object({ value: z.string(), currency_code: z.string() }),
        payee: z.object({ merchant_id: z.string().optional() }).optional(),
        payments: z
          .object({
            captures: z
              .array(
                z.object({
                  id: z.string(),
                  status: z.string(),
                  amount: z.object({
                    value: z.string(),
                    currency_code: z.string(),
                  }),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});
const refundSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.object({ value: z.string(), currency_code: z.string() }),
  links: z.array(z.object({ rel: z.string(), href: z.string() })),
});
export function verifyProviderRefund(
  data: z.infer<typeof refundSchema>,
  expected: { captureId: string; amount: number; refundId?: string },
) {
  const up = data.links.find((link) => link.rel === "up");
  let correctCapture = false;
  try {
    const url = new URL(up?.href || "");
    correctCapture =
      url.protocol === "https:" &&
      url.hostname === "api-m.sandbox.paypal.com" &&
      url.pathname ===
        `/v2/payments/captures/${encodeURIComponent(expected.captureId)}`;
  } catch {
    /* Missing or malformed provider references remain unconfirmed. */
  }
  if (
    !correctCapture ||
    data.amount.value !== paypalAmount(expected.amount) ||
    data.amount.currency_code !== "USD" ||
    (expected.refundId && data.id !== expected.refundId)
  )
    throw new Error(
      "Provider refund does not match the authorized amount, currency, capture, or reference.",
    );
  return data;
}
export async function paypalRequest(endpoint: string, init: RequestInit = {}) {
  if (
    !process.env.PAYPAL_CLIENT_ID ||
    !process.env.PAYPAL_CLIENT_SECRET ||
    !process.env.PAYPAL_MERCHANT_ID
  )
    throw new Error("PayPal sandbox credentials and merchant ID are required.");
  if (!cachedToken || cachedToken.expires <= Date.now()) {
    const result = await fetch(`${BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15000),
    });
    if (!result.ok) throw new Error("PayPal authentication failed.");
    const token = z
      .object({ access_token: z.string(), expires_in: z.number() })
      .parse(await result.json());
    cachedToken = {
      value: token.access_token,
      expires: Date.now() + Math.max(0, token.expires_in - 60) * 1000,
    };
  }
  const response = await fetch(`${BASE}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cachedToken.value}`,
      ...init.headers,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `PayPal returned HTTP ${response.status}. The operation must be reconciled before retrying.`,
    );
  return response.json();
}
export async function createPayment(
  quote: Quote,
  operationId: string,
  internalOrderId: string,
  mode = paymentMode(),
) {
  if (mode === "fixture") return { id: `FIXTURE-ORDER-${operationId}` };
  const data = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    headers: { "PayPal-Request-Id": operationId },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: internalOrderId,
          description: `DALE ${quote.productId}`,
          payee: { merchant_id: quote.payee },
          amount: {
            currency_code: quote.currency,
            value: paypalAmount(quote.amount),
          },
        },
      ],
    }),
  });
  return orderSchema.parse(data);
}
export async function getPayment(providerOrderId: string) {
  return orderSchema.parse(
    await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(providerOrderId)}`,
    ),
  );
}
export function verifyProviderOrder(
  data: z.infer<typeof orderSchema>,
  quote: Quote,
  internalOrderId: string,
) {
  const units = data.purchase_units;
  if (
    units?.length !== 1 ||
    units[0].amount.value !== paypalAmount(quote.amount) ||
    units[0].amount.currency_code !== quote.currency ||
    units[0].payee?.merchant_id !== quote.payee ||
    units[0].custom_id !== internalOrderId
  )
    throw new Error("PayPal order does not match the approved purchase.");
}
export async function capturePayment(
  providerOrderId: string,
  operationId: string,
  quote: Quote,
  internalOrderId: string,
  mode = paymentMode(),
) {
  if (mode === "fixture") return { id: `FIXTURE-CAPTURE-${operationId}` };
  const before = await getPayment(providerOrderId);
  verifyProviderOrder(before, quote, internalOrderId);
  const data = orderSchema.parse(
    before.status === "COMPLETED"
      ? before
      : await paypalRequest(
          `/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`,
          {
            method: "POST",
            headers: { "PayPal-Request-Id": operationId },
            body: "{}",
          },
        ),
  );
  verifyProviderOrder(data, quote, internalOrderId);
  const captures = data.purchase_units?.[0].payments?.captures;
  if (
    captures?.length !== 1 ||
    captures[0].status !== "COMPLETED" ||
    captures[0].amount.value !== paypalAmount(quote.amount) ||
    captures[0].amount.currency_code !== quote.currency
  )
    throw new Error("Payment is not yet confirmed. Please check its status.");
  return { id: captures[0].id };
}
export async function refundPayment(
  captureId: string,
  operationId: string,
  amount: number,
  mode = paymentMode(),
) {
  if (mode === "fixture")
    return { id: `FIXTURE-REFUND-${operationId}`, status: "COMPLETED" };
  return verifyProviderRefund(
    refundSchema.parse(
      await paypalRequest(
        `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
        {
          method: "POST",
          headers: {
            "PayPal-Request-Id": operationId,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            amount: { value: paypalAmount(amount), currency_code: "USD" },
          }),
        },
      ),
    ),
    { captureId, amount },
  );
}
export async function getRefund(
  refundId: string,
  expected: { captureId: string; amount: number },
) {
  return verifyProviderRefund(
    refundSchema.parse(
      await paypalRequest(
        `/v2/payments/refunds/${encodeURIComponent(refundId)}`,
      ),
    ),
    { ...expected, refundId },
  );
}
export async function verifyWebhook(headers: Headers, event: unknown) {
  if (!process.env.PAYPAL_WEBHOOK_ID)
    throw new Error("PayPal webhook ID is not configured.");
  const result = z.object({ verification_status: z.string() }).parse(
    await paypalRequest("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      }),
    }),
  );
  return result.verification_status === "SUCCESS";
}
