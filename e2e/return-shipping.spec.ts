import { test, expect, type Page } from "@playwright/test";
test("prepaid return handoff and seller receipt precede a customer-selected refund", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await page.getByRole("button", { name: "Review purchase" }).first().click();
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await page.getByRole("button", { name: "Get help / return" }).click();
  await page.getByRole("button", { name: "Open my request" }).click();
  const session = await (await page.request.get("/api/session")).json();
  const reviewerContext = await browser.newContext();
  const reviewer = await reviewerContext.newPage();
  async function operator(target: Page, role: string) {
    await target.goto("/");
    await target.getByRole("button", { name: "Operator workspace" }).click();
    await target.getByRole("combobox", { name: /^Role/ }).selectOption(role);
    await target
      .getByLabel("Customer workspace ID")
      .fill(session.actor.workspaceId);
    await target.getByLabel("Operator access code").fill("e2e-operator");
    await target.getByRole("button", { name: "Enter workspace" }).click();
    await target.getByRole("button", { name: "Support", exact: true }).click();
  }
  await operator(reviewer, "reviewer");
  await reviewer
    .getByRole("button", { name: "Approve requested refund" })
    .click();
  await reviewer
    .getByLabel("Return arrangement", { exact: true })
    .selectOption("prepaid");
  await reviewer.getByLabel("Prepaid label reference").fill("DEMO-LABEL-100");
  await reviewer
    .getByLabel("Reason and customer policy")
    .fill("Merchant damage policy covers all return shipping.");
  await reviewer
    .getByRole("button", { name: "Authorize refund", exact: true })
    .click();
  await expect(reviewer.getByRole("status")).toContainText(
    "Prepaid return arranged",
  );
  await page.reload();
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await expect(
    page.getByText("Customer return shipping cost: $0.00.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Record return handoff" }).click();
  await page.getByLabel("Return tracking reference").fill("DEMO-TRACK-100");
  await page.getByRole("button", { name: "Save return checkpoint" }).click();
  const sellerContext = await browser.newContext();
  const seller = await sellerContext.newPage();
  await operator(seller, "seller");
  await seller.getByRole("button", { name: "Record return receipt" }).click();
  await seller.getByRole("button", { name: "Save return checkpoint" }).click();
  await expect(seller.getByText("Return arrangement · received")).toBeVisible();
  await reviewer.reload();
  await reviewer.getByRole("button", { name: "Support", exact: true }).click();
  await reviewer
    .getByRole("button", { name: "Approve requested refund" })
    .click();
  await reviewer
    .getByLabel("Reason and customer policy")
    .fill("Returned item received; customer policy refund approved.");
  await reviewer
    .getByRole("button", { name: "Authorize refund", exact: true })
    .click();
  await expect(reviewer.locator(".status-chip")).toHaveText("resolved");
  await reviewerContext.close();
  await sellerContext.close();
});
