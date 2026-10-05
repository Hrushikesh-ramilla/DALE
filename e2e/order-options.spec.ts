import { test, expect } from "@playwright/test";
test("seller cancellation keeps payment recorded and lets the shopper choose refund over replacement", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await page.getByRole("button", { name: "Review purchase" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Delivery promise:");
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await page.getByRole("button", { name: "Get help / return" }).waitFor();
  const session = await (await page.request.get("/api/session")).json();
  const sellerContext = await browser.newContext();
  const seller = await sellerContext.newPage();
  await seller.goto("/");
  await seller.getByRole("button", { name: "Operator workspace" }).click();
  await seller
    .getByLabel("Customer workspace ID")
    .fill(session.actor.workspaceId);
  await seller.getByLabel("Operator access code").fill("e2e-operator");
  await seller.getByRole("button", { name: "Enter workspace" }).click();
  await seller.getByRole("button", { name: "Cancel fulfillment" }).click();
  await seller
    .getByLabel("Cancellation reason")
    .fill("Inventory damaged before shipment.");
  await seller.getByRole("button", { name: "Record cancellation" }).click();
  await expect(
    seller.getByText("Fulfillment canceled", { exact: true }),
  ).toBeVisible();
  await expect(seller.locator(".status-chip")).toHaveText("paid");
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await page.getByRole("button", { name: "Get help / return" }).click();
  await page.getByLabel("What happened?").selectOption("canceled");
  await page
    .getByLabel("Your preferred resolution")
    .selectOption("replacement");
  await page.getByRole("button", { name: "Open my request" }).click();
  await page.getByRole("button", { name: "Choose refund instead" }).click();
  await expect(
    page.getByRole("heading", { name: "canceled · refund requested" }),
  ).toBeVisible();
  const updated = await (await page.request.get("/api/session")).json();
  expect(updated.orders[0].refundedAmount).toBe(0);
  expect(updated.orders).toHaveLength(1);
  await sellerContext.close();
});
