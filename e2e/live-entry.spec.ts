import { expect, test } from "@playwright/test";
test("live entry explains disabled providers and keeps guided fixtures separate", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("link", { name: "Test the live agent and PayPal ↗" })
    .click();
  await expect(page).toHaveURL(/\/live$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your shopping agent",
  );
  await expect(page.getByRole("status")).toContainText("Live AI is not ready");
  await expect(
    page.getByRole("button", { name: "Start live shopping" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Guided fixture tests ↗" }).click();
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(
    page.getByRole("complementary", { name: "Guided engineer demo" }),
  ).toBeVisible();
  const response = await page.request.get("/api/session");
  expect(response.ok()).toBe(true);
  const state = await response.json();
  expect(state.fixtureWorkspace).toBe(true);
  expect(state.modes.ai).toBe("fixture");
  expect(state.modes.payments).toBe("fixture");
});
