import { expect, test } from "@playwright/test";

test("3D product selection, rotation and context-loss fallback retain catalog access", async ({
  page,
}) => {
  await page.goto("/shop");
  expect(
    await page
      .locator(".editorial-hero")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(245, 245, 247)");
  expect(
    await page
      .locator(".hero-type h2")
      .evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("DM Sans");
  const canvas = page.locator("canvas[data-scene=ready]");
  await page.locator(".product-viewer").scrollIntoViewIfNeeded();
  await expect(canvas).toBeVisible();
  const before = await canvas.screenshot();
  await page.getByRole("button", { name: "Rotate product right" }).click();
  await expect(async () =>
    expect((await canvas.screenshot()).equals(before)).toBe(false),
  ).toPass();
  await page.locator(".closing-wordmark").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveCount(0);
  await page
    .getByRole("button", { name: "Next featured product" })
    .scrollIntoViewIfNeeded();
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "Next featured product" }).click();
  await expect(page.locator(".stage-caption")).toContainText(
    "512GB Portable SSD",
  );
  await expect(
    page.getByLabel("Interactive 3D illustration of 512GB Portable SSD"),
  ).toBeVisible();
  await canvas.evaluate((element) =>
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
  );
  await expect(page.locator("[data-scene=fallback]")).toBeVisible();
  await page
    .getByRole("button", { name: "View 512GB Portable SSD", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("$79.00");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "View 512GB Portable SSD", exact: true }),
  ).toBeFocused();
});

test("monochrome controls and isolated teal footer remain readable at narrow widths", async ({
  page,
}) => {
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/support");
    await expect(
      page.getByRole("button", { name: "Start shopping" }),
    ).toBeVisible();
    expect(
      await page
        .locator("body")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(0, 0, 0)");
    expect(
      await page
        .locator(".site-header")
        .evaluate((el) => getComputedStyle(el).boxShadow),
    ).toBe("none");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".closing-wordmark").scrollIntoViewIfNeeded();
    await expect(page.locator(".closing-wordmark")).toBeVisible();
    expect(
      await page
        .locator(".closing-wordmark")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(41, 71, 69)");
  }
});
