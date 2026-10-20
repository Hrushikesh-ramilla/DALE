import { test, expect } from "@playwright/test";

test("reviews an actual microphone transcript before running its website task", async ({
  page,
}) => {
  await page.goto("/department/electronics");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page.getByRole("button", { name: "Voice input", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Stop voice input" }),
  ).toBeVisible();
  // Capture the owned audio fixture through Chromium's real microphone pipeline.
  await page.waitForTimeout(6500);
  await page.getByRole("button", { name: "Stop voice input" }).click();
  await expect(page.getByLabel("Message DALE")).toHaveValue(/orders/i, {
    timeout: 60000,
  });
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Review the transcript",
  );
  const before = await (await page.request.get("/api/copilot/state")).json();
  expect(before.messages).toHaveLength(0);
  expect(before.actions).toHaveLength(0);
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
});
