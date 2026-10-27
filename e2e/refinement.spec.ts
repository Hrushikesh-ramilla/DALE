import { test, expect, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3130";
test.use({ baseURL, reducedMotion: "no-preference" });

test("editorial controls use the real assistant and exact featured listing", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start a conversation", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "DALE assistant" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close assistant" }).click();
  const listing = page
    .locator("[data-hero-depth]")
    .locator("..")
    .locator('a[href^="/product/"]')
    .first();
  const original = await listing.getAttribute("href");
  await page.getByRole("button", { name: "Next featured product" }).click();
  await expect(listing).not.toHaveAttribute("href", original!);
  await page.getByRole("button", { name: "Previous featured product" }).click();
  await expect(listing).toHaveAttribute("href", original!);
});

test("depth follows the pointer, settles, and releases temporary promotion", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator("[data-department-card]").first();
  await expect(card).toHaveAttribute("data-depth-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await card.scrollIntoViewIfNeeded();
  await card.hover({ position: { x: 300, y: 100 } });
  await expect(card).toHaveAttribute("data-depth-active", "true");
  await expect
    .poll(() =>
      card.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).is2D),
    )
    .toBe(false);
  await page.mouse.move(2, 2);
  await expect(card).not.toHaveAttribute("data-depth-active", "true", {
    timeout: 5000,
  });
  expect(await card.evaluate((e) => e.style.willChange)).toBe("");
});

test("changing reduced motion immediately removes depth and scroll animation", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator("[data-department-card]").first();
  await expect(card).toHaveAttribute("data-depth-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await card.scrollIntoViewIfNeeded();
  await card.hover({ position: { x: 300, y: 100 } });
  await expect(card).toHaveAttribute("data-depth-active", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).not.toHaveAttribute("data-depth-active", "true");
  expect(await card.evaluate((e) => getComputedStyle(e).transform)).toBe(
    "none",
  );
  expect(
    await card
      .locator("img")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});

test("native wheel and keyboard navigation remain usable without a scroll ticker", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator("[data-department-card]").first();
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(2, 2);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(before + 100);
  expect(await page.evaluate(() => "__lenis" in window)).toBe(false);
  await card.scrollIntoViewIfNeeded();
  const destination = await card.getAttribute("href");
  await card.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(`**${destination}`);
});

test("touch layout has no horizontal overflow or hover-only requirements", async ({
  browser,
}) => {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    baseURL,
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const card = page.locator("[data-department-card]").first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).not.toHaveAttribute("data-depth-active", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await card.tap();
    await page.waitForURL("**/department/electronics");
  } finally {
    await context.close();
  }
});
