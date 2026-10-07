import { test, expect } from "@playwright/test";

test("store routes support direct links, browser history and saved shopper context", async ({
  page,
}) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  await page.getByLabel("Feature to prioritize").fill("100W");
  await page.getByRole("button", { name: "Find my match" }).click();
  const workspace = (await (await page.request.get("/api/session")).json())
    .actor.workspaceId;
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await expect(page).toHaveURL(/\/support$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/orders$/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Every order. Looked after." }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/session")).json()).actor.workspaceId,
  ).toBe(workspace);
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByLabel("Feature to prioritize")).toHaveValue("100W");
  await page.getByRole("button", { name: "Group deals", exact: true }).click();
  await expect(page).toHaveURL(/\/groups$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A little buying power." }),
  ).toBeVisible();
});

test("collection discovery, search and detail review preserve approval boundaries", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
  await page
    .locator(".collection-tile")
    .filter({ hasText: "Sound & focus" })
    .click();
  await expect(page.getByLabel("Looking for")).toHaveValue("audio");
  await page
    .getByRole("button", { name: "Review purchase", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Save your updated brief" }),
  ).toContainText("Save your updated brief");
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Find my match" }).click();
  await expect(page.locator(".product-card")).toHaveCount(5);
  await page
    .getByLabel("Search matched products")
    .fill("not-a-catalog-product");
  await expect(
    page.getByRole("heading", { name: "Nothing in this selection" }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.getByLabel("Search matched products").fill("Bluetooth");
  await expect(page.locator(".product-card")).toHaveCount(5);
  const details = page.getByRole("button", {
    name: "View details for Quiet Wireless Headphones",
    exact: true,
  });
  await details.click();
  await expect(page.getByRole("dialog")).toContainText("catalog:6:v1");
  await expect(page.getByRole("dialog")).toContainText("Sponsored listing");
  await expect(page.getByRole("dialog")).toContainText("$59.00");
  expect(await page.locator("main").evaluate((element) => (element as HTMLElement).inert)).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(details).toBeFocused();
  await details.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Review purchase" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("$59.00");
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await expect(
    page.getByText("Fixture payment recorded.", { exact: false }),
  ).toBeVisible();
  const snapshot = await (await page.request.get("/api/session")).json();
  expect(snapshot.orders).toHaveLength(1);
  expect(snapshot.orders[0].quote.productId).toBe("P006");
  expect(snapshot.orders[0].quote.amount).toBe(5900);
});

test("featured discovery cannot bypass a changed budget", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Maximum budget, USD").fill("20");
  await page
    .getByRole("button", {
      name: "View Quiet Wireless Headphones",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Review purchase" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Match this collection to my device" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Looking for")).toHaveValue("audio");
  await expect(
    page.getByRole("heading", { name: "Let's refine your search" }),
  ).toBeVisible();
});

test("editorial storefront and product dialog fit desktop, tablet and mobile with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", {
        name: "Considered choices. Complete confidence.",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    ).toBe("auto");
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: `.data/reports/editorial-${width === 1440 ? "desktop" : "mobile"}.png`,
        fullPage: width === 390,
      });
    await page
      .getByRole("button", {
        name: "View Quiet Wireless Headphones",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const bounds = await page.getByRole("dialog").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
    ).toBe("hidden");
    if (width === 1440)
      await page.screenshot({ path: ".data/reports/editorial-product.png" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(
      await page.locator("main").evaluate((element) => (element as HTMLElement).inert),
    ).toBe(false);
  }
});
