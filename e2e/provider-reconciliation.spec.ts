import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";

test("provider receipt UI separates customer payout from refunds and restricts read-refresh to reviewers", async ({
  page,
}) => {
  await page.goto("/");
  await page.request.post("/api/demo", {
    headers: { Origin: origin },
    data: { action: "launch", kind: "delivered" },
  });
  const snapshot = await (await page.request.get("/api/session")).json();
  // Synthetic browser transport only: provider adapter verification and financial guards are separately contract-tested.
  const order = snapshot.orders[0];
  order.quote.provider = "sandbox";
  order.captureId = "CAPTURE-MOCK";
  order.providerObservations = [
    {
      kind: "dispute",
      reference: "DISPUTE-MOCK",
      captureId: "CAPTURE-MOCK",
      state: "review",
      eventIds: [],
      observedAt: "2026-10-08T10:00:00Z",
      attempts: 1,
      reportedCustomerPayout: 2900,
      explanation:
        "Provider payout requires human reconciliation; it does not establish a merchant refund.",
    },
  ];
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await page.goto("/orders");
  await page
    .getByText("PayPal reconciliation · human follow-up needed", {
      exact: true,
    })
    .click();
  const panel = page.locator(".provider-reconciliation");
  await expect(panel).toContainText(
    "Verified merchant refunds recorded: $0.00",
  );
  await expect(panel).toContainText(
    "Provider-reported customer payout: $29.00",
  );
  await expect(panel).toContainText("not added to merchant refunds");
  await expect(
    page.getByRole("button", { name: "Refresh provider facts" }),
  ).toHaveCount(0);
  snapshot.actor.role = "reviewer";
  await page.reload();
  await page
    .getByText("PayPal reconciliation · human follow-up needed", {
      exact: true,
    })
    .click();
  await page
    .getByLabel("Known PayPal refund references")
    .fill("REFUND-MOCK-1, REFUND-MOCK-2");
  let requestSeen = false;
  await page.route("**/api/actions", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      action: "provider_reconcile",
      orderId: order.id,
      refundReferences: ["REFUND-MOCK-1", "REFUND-MOCK-2"],
    });
    requestSeen = true;
    await route.fulfill({ json: { result: order, snapshot } });
  });
  await page.getByRole("button", { name: "Refresh provider facts" }).click();
  await expect.poll(() => requestSeen).toBe(true);
  await expect(panel).toContainText("human reconciliation");
  await expect(
    page.getByText("Provider facts refreshed.", { exact: false }),
  ).toBeVisible();
});
