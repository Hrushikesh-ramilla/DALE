import { afterEach, describe, expect, it, vi } from "vitest";
import { createPayment, verifyProviderOrder } from "../src/server/payments";
import { evidenceHash, validateImage } from "../src/server/storage";
import { shoppingSummary } from "../src/server/ai";
import { catalog } from "../src/domain/catalog";
const quote = { id: "q1", productId: "P001", model: "Atlas 14", payee: "M123", amount: 2900, currency: "USD" as const, expiresAt: "2099-01-01", version: 1 };
afterEach(() => { vi.unstubAllGlobals(); process.env.PAYMENT_MODE = "fixture"; process.env.AI_MODE = "fixture"; });
describe("provider contracts", () => {
  it("sends the exact merchant, amount and stable operation ID", async () => {
    process.env.PAYMENT_MODE = "sandbox"; process.env.PAYPAL_CLIENT_ID = "test-client"; process.env.PAYPAL_CLIENT_SECRET = "test-secret"; process.env.PAYPAL_MERCHANT_ID = "M123";
    const mocked = vi.fn().mockResolvedValueOnce(Response.json({ access_token: "test-token", expires_in: 300 })).mockResolvedValueOnce(Response.json({ id: "remote-order", status: "CREATED" })); vi.stubGlobal("fetch", mocked);
    await createPayment(quote, "operation-1", "order-1"); const options = mocked.mock.calls[1][1]; expect(options.headers["PayPal-Request-Id"]).toBe("operation-1"); const payload = JSON.parse(options.body); expect(payload.purchase_units[0].amount.value).toBe("29.00"); expect(payload.purchase_units[0].payee.merchant_id).toBe("M123");
  });
  it("rejects tampered provider order facts", () => { expect(() => verifyProviderOrder({ id: "o", status: "APPROVED", purchase_units: [{ custom_id: "order-1", amount: { value: "29.00", currency_code: "USD" }, payee: { merchant_id: "attacker" } }] }, quote, "order-1")).toThrow("does not match"); });
  it("rejects invented model citations", async () => {
    process.env.AI_MODE = "live"; process.env.AI_API_KEY = "test-only"; process.env.AI_MODEL = "test-model";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify({ summary: "Buy it", sources: ["invented"] }) } }] })));
    await expect(shoppingSummary("charger", catalog, "Atlas 14")).rejects.toThrow("unknown catalog source");
  });
});
describe("evidence bytes", () => {
  it("changes hash when the file changes", () => { expect(evidenceHash(Buffer.from("original"))).not.toBe(evidenceHash(Buffer.from("changed"))); });
  it("rejects HTML disguised as a photo", () => { expect(() => validateImage(Buffer.from("<script>evil</script>"), "image/png")).toThrow("matching file type"); });
  it("rejects oversized evidence", () => { expect(() => validateImage(Buffer.alloc(4 * 1024 * 1024 + 1), "image/png")).toThrow("4 MB"); });
});
