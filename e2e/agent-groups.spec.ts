import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("a compound task discovers a complete discounted bundle and separates commitment from checkout", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Your task for DALE")
    .fill(
      "Find a charger for my MacBook Air M2 13-inch under $53. I need a cable included, normal charging. Use grouping to reduce the cost.",
    );
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  const result = page.getByLabel("DALE task result");
  await expect(result).toContainText("conditional total is $52.20");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  const before = await (await page.request.get("/api/session")).json();
  expect(before.groups).toHaveLength(0);
  expect(before.orders).toHaveLength(0);
  await result.getByRole("button", { name: /Commit to group for/ }).click();
  await expect(result).toContainText("Committed without payment");
  const committed = await (await page.request.get("/api/session")).json();
  expect(committed.groups[0].memberCount).toBe(1);
  expect(committed.orders).toHaveLength(0);
  const persona = await page.request.post("/api/demo", {
    headers: { Origin: origin },
    data: { action: "persona", persona: "second_buyer" },
  });
  expect(persona.ok()).toBe(true);
  const second = await page.request.post("/api/actions", {
    headers: { Origin: origin },
    data: {
      action: "join_group",
      productId: "R003",
      model: "MacBook Air (13-inch, M2, 2022)",
    },
  });
  expect(second.ok()).toBe(true);
  const shopper = await page.request.post("/api/demo", {
    headers: { Origin: origin },
    data: { action: "persona", persona: "buyer" },
  });
  expect(shopper.ok()).toBe(true);
  await page.reload();
  await expect(
    result.getByRole("button", { name: /Review group offer/ }),
  ).toBeEnabled();
  await result.getByRole("button", { name: /Review group offer/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("$52.20");
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await dialog
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await expect(page).toHaveURL(/\/orders$/);
  const final = await (await page.request.get("/api/session")).json();
  expect(final.orders[0].quote.amount).toBe(5220);
  expect(final.orders[0].status).toBe("paid");
  expect((await context.cookies()).length).toBeGreaterThan(0);
});
