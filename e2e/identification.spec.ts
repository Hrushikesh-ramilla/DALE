import { test, expect } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("clarifies conflicting constraints and explicitly confirms a device label", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  const need = page.getByLabel("Anything else?");
  await need.fill("A charger for Orbit 13 under $20");
  await page.getByRole("button", { name: "Find my match" }).click();
  await expect(page.getByText("Let's confirm the details.")).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(0);
  const blocked = await page.request.post("/api/actions", {
    headers: { Origin: origin },
    data: { action: "quote", productId: "P001", model: "Atlas 14" },
  });
  expect(blocked.status()).toBe(400);
  await page
    .getByRole("button", { name: "Use selected device and budget" })
    .click();
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page.getByText("Compare catalog facts", { exact: true }).click();
  await expect(page.locator(".catalog-comparison")).toContainText("catalog:");
  await page
    .getByRole("button", { name: "Identify device from label" })
    .click();
  await page
    .getByLabel("Device label photo")
    .setInputFiles("fixtures/device-labels/label-4.png");
  await page.getByRole("button", { name: "Read model label" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "selected model is Atlas 14",
  );
  await expect(
    page.getByRole("combobox", { name: "Your device", exact: true }),
  ).toHaveValue("Atlas 14");
  await page.getByRole("button", { name: "Use Slate 11", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Your device", exact: true }),
  ).toHaveValue("Slate 11");
  await need.fill("A charger");
  await page.getByRole("button", { name: "Find my match" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Precision Barrel Charger",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Your device", exact: true }),
  ).toHaveValue("Slate 11");
  await page
    .getByRole("button", { name: "Identify device from label" })
    .click();
  await page
    .getByLabel("Device label photo")
    .setInputFiles("fixtures/device-labels/label-6.png");
  await page.getByRole("button", { name: "Read model label" }).click();
  await expect(page.getByRole("dialog")).toContainText("multiple models");
  await expect(
    page.getByRole("button", { name: /^Use (Atlas|Orbit|Slate)/ }),
  ).toHaveCount(0);
});
