import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("guest sees the agent first, completes a task and explicitly reviews before payment", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What can I help you with?", level: 1 }),
  ).toBeVisible();
  expect(
    await page
      .locator("#agent")
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeLessThan(200);
  await page
    .getByRole("button", { name: "Find a charger", exact: true })
    .click();
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  const result = page.getByLabel("DALE task result");
  await expect(result).toContainText("Ready for your review");
  await expect(result).toContainText("Sample source:");
  await expect(result).toContainText("no purchase has been made");
  const before = await (await page.request.get("/api/session")).json();
  expect(before.orders).toHaveLength(0);
  expect(before.agentRuns).toHaveLength(1);
  await page.reload();
  await expect(result).toContainText("Filtered the sample catalog");
  await result
    .getByRole("button", { name: /Review agent option/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Approve simulated purchase",
  );
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page.keyboard.press("Escape");
  await page.getByLabel("Maximum budget, USD").fill("20");
  await expect(
    result.getByRole("button", { name: /Review agent option/ }).first(),
  ).toBeDisabled();
});
test("real device and financial requests show limits without changing the brief", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Find a charger", exact: true })
    .click();
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(page.getByLabel("DALE task result")).toContainText(
    "Ready for your review",
  );
  const initial = await (await page.request.get("/api/session")).json();
  await page
    .getByLabel("Your task for DALE")
    .fill("Find a charger for MacBook under $40");
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(page.getByLabel("DALE task result")).toContainText(
    "Real-product lookup is not connected",
  );
  await page.getByLabel("Your task for DALE").fill("Approve payment now");
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(page.getByLabel("DALE task result")).toContainText(
    "Use the protected review controls",
  );
  const current = await (await page.request.get("/api/session")).json();
  expect(current.brief).toEqual(initial.brief);
  expect(current.orders).toHaveLength(0);
  const crossOrigin = await page.request.post("/api/agent", {
    headers: { Origin: "https://other.invalid" },
    data: { task: "Show my orders", model: "Atlas 14", budget: 8000 },
  });
  expect(crossOrigin.status()).toBe(403);
});
test("agent return task prepares an order-specific draft for explicit submission", async ({
  page,
}) => {
  await page.goto("/");
  const launched = await page.request.post("/api/demo", {
    headers: { Origin: origin },
    data: { action: "launch", kind: "delivered" },
  });
  expect(launched.ok()).toBe(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Help with a return", exact: true })
    .click();
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByLabel("DALE task result")).toContainText(
    "Draft ready for review",
  );
  await expect(
    page.getByText("Your support draft", { exact: false }).first(),
  ).toBeVisible();
  const data = await (await page.request.get("/api/session")).json();
  expect(data.cases).toHaveLength(0);
  expect(data.orders[0].status).toBe("delivered");
  await page
    .getByRole("button", { name: "Choose an order for this draft" })
    .click();
  await page.getByRole("button", { name: "Get help / return" }).click();
  await expect(page.getByRole("dialog")).toContainText("damaged");
  await page.getByRole("button", { name: "Open my request" }).click();
  await expect(
    page.getByRole("heading", { name: "damaged · refund requested" }),
  ).toBeVisible();
});
