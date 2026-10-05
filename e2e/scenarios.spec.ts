import { test, expect, type Page } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
async function operatorLogin(page: Page, workspaceId: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Operator workspace" }).click();
  await page.getByRole("combobox", { name: /^Role/ }).selectOption("reviewer");
  await page.getByLabel("Customer workspace ID").fill(workspaceId);
  await page.getByLabel("Operator access code").fill("e2e-operator");
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Reviewer · Sign out" }),
  ).toBeVisible();
}

test("restricted scenario console shows a failed refund truthfully and archives with audit intact", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  const initial = await (await page.request.get("/api/session")).json();
  const denied = await page.request.post("/api/scenarios", {
    headers: { Origin: origin },
    data: { action: "create", kind: "refund_failure" },
  });
  expect(denied.status()).toBe(403);
  await page.getByRole("button", { name: "Shopper · Sign out" }).click();
  await operatorLogin(page, initial.actor.workspaceId);
  await page.getByText("Environment details", { exact: true }).click();
  await page.getByLabel("Engineering scenario").selectOption("refund_failure");
  await page
    .getByRole("button", { name: "Open new fixture scenario as shopper" })
    .click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await expect(page.locator(".status-chip")).toHaveText("refund failed");
  await expect(
    page.getByText("Provider reference: FIXTURE-REFUND-", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Your request remains open.", { exact: false }).last(),
  ).toBeVisible();
  const failed = await (await page.request.get("/api/session")).json();
  expect(failed.modes.payments).toBe("fixture");
  await page.getByRole("button", { name: "Shopper · Sign out" }).click();
  await operatorLogin(page, failed.actor.workspaceId);
  await page.getByText("Environment details", { exact: true }).click();
  await page
    .getByRole("button", { name: "Archive fixture and start fresh" })
    .click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  await expect(
    page.getByText("Previous fixture archived with audit history preserved.", {
      exact: false,
    }),
  ).toBeVisible();
  const fresh = await (await page.request.get("/api/session")).json();
  expect(fresh.actor.workspaceId).not.toBe(failed.actor.workspaceId);
  expect(fresh.orders).toHaveLength(0);
});
test("a declined group participant does not reprice the customer's completed purchase", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  const initial = await (await page.request.get("/api/session")).json();
  await page.getByRole("button", { name: "Shopper · Sign out" }).click();
  await operatorLogin(page, initial.actor.workspaceId);
  await page.getByText("Environment details", { exact: true }).click();
  await page.getByLabel("Engineering scenario").selectOption("group_partial");
  await page
    .getByRole("button", { name: "Open new fixture scenario as shopper" })
    .click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Group deals", exact: true }).click();
  await expect(page.getByText("DISCOUNT UNLOCKED")).toBeVisible();
  await page.getByRole("button", { name: "Review group purchase" }).click();
  await expect(page.getByRole("dialog")).toContainText("$26.10");
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await expect(
    page.getByText("Fixture payment recorded.", { exact: false }),
  ).toBeVisible();
  const state = await (await page.request.get("/api/session")).json();
  expect(state.orders).toHaveLength(1);
  expect(state.orders[0].status).toBe("paid");
  expect(state.orders[0].quote.amount).toBe(2610);
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.locator(".order-card")).toContainText("$26.10");
});
