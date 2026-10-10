import { afterEach, expect, it, vi } from "vitest";
import {
  getProviderCapture,
  getProviderDispute,
  getProviderDisputesForCapture,
  getProviderRefund,
} from "../src/server/payments";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function provider(data: unknown) {
  vi.stubEnv("PAYPAL_CLIENT_ID", "mock-client");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "mock-secret");
  vi.stubEnv("PAYPAL_MERCHANT_ID", "mock-merchant");
  const fetch = vi
    .fn()
    .mockImplementation(async (url: string) =>
      Response.json(
        url.endsWith("/v1/oauth2/token")
          ? { access_token: "mock-token", expires_in: 300 }
          : data,
      ),
    );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
it("dispute discovery filters the exact capture with GET and fails closed on pagination or missing list fields", async () => {
  const fetch = provider({ items: [{ dispute_id: "D-1" }], links: [] });
  expect(await getProviderDisputesForCapture("CAPTURE-1")).toEqual([
    { dispute_id: "D-1" },
  ]);
  const requests = fetch.mock.calls.filter(
    ([url]) => !url.endsWith("/v1/oauth2/token"),
  );
  expect(requests[0][0]).toContain(
    "disputed_transaction_id=CAPTURE-1&page_size=50",
  );
  expect(
    requests.every(([, init]) => !init.method || init.method === "GET"),
  ).toBe(true);
  provider({
    items: [],
    links: [
      {
        rel: "next",
        href: "https://api-m.sandbox.paypal.com/v1/customer/disputes?next_page_token=example",
      },
    ],
  });
  await expect(getProviderDisputesForCapture("CAPTURE-1")).rejects.toThrow(
    "paginated",
  );
  provider({});
  await expect(getProviderDisputesForCapture("CAPTURE-1")).rejects.toThrow();
});
it("reads typed dispute/capture/refund facts without a financial POST", async () => {
  const fetch = provider({
    dispute_id: "D-1",
    status: "OPEN",
    disputed_transactions: [{ seller_transaction_id: "CAPTURE-1" }],
    dispute_amount: { currency_code: "USD", value: "10.00" },
  });
  expect((await getProviderDispute("D-1")).dispute_id).toBe("D-1");
  expect(fetch.mock.calls.at(-1)?.[0]).toContain("/v1/customer/disputes/D-1");
  provider({
    id: "CAPTURE-1",
    status: "COMPLETED",
    amount: { currency_code: "USD", value: "10.00" },
  });
  expect((await getProviderCapture("CAPTURE-1")).id).toBe("CAPTURE-1");
  provider({
    id: "R-1",
    status: "COMPLETED",
    amount: { currency_code: "USD", value: "10.00" },
    links: [],
  });
  expect((await getProviderRefund("R-1")).id).toBe("R-1");
});
it("typed read adapters reject unexpected provider references", async () => {
  provider({
    id: "OTHER",
    status: "COMPLETED",
    amount: { currency_code: "USD", value: "10.00" },
    links: [],
  });
  await expect(getProviderRefund("R-1")).rejects.toThrow("reference mismatch");
  await expect(getProviderCapture("CAPTURE-1")).rejects.toThrow(
    "reference mismatch",
  );
});
