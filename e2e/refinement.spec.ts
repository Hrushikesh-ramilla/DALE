import {
  test,
  expect,
  devices,
  type Page,
  type Locator,
} from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3130";
test.use({ baseURL, reducedMotion: "no-preference" });

async function hoverAfterScroll(page: Page, card: Locator) {
  await card.scrollIntoViewIfNeeded();
  // Browser auto-scroll can emit its final scroll event after hover resolves.
  // Exercise pointer depth only after native scrolling has reached rest.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = scrollY,
          stable = 0;
        const frame = () => {
          stable = Math.abs(scrollY - last) < 0.1 ? stable + 1 : 0;
          last = scrollY;
          if (stable >= 6) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  const box = await card.boundingBox();
  if (!box) throw new Error("Collection card is not laid out");
  await page.mouse.move(box.x + 300, box.y + 100, { steps: 3 });
}

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
  await hoverAfterScroll(page, card);
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
  await hoverAfterScroll(page, card);
  await expect(card).toHaveAttribute("data-depth-active", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scroll-engine",
    "lenis",
  );
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

test("Lenis interpolates wheel input and preserves keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator("[data-department-card]").first();
  await card.scrollIntoViewIfNeeded();
  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-engine",
    "lenis",
  );
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(2, 2);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(before + 100);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(before + 400);
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
    const launcher = page.getByRole("button", {
      name: "Open DALE assistant",
      exact: true,
    });
    await expect(launcher).toHaveCount(1);
    await launcher.tap();
    await expect(
      page.getByRole("complementary", { name: "DALE assistant" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close assistant" }).tap();
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

test("collection cards visibly overlap and the outgoing surface recedes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const slots = page.locator("[data-collection-slot]");
  await expect(slots.first().locator("..")).toHaveAttribute(
    "data-stack-ready",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
  const secondTop = await slots
    .nth(1)
    .evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.evaluate(
    (y) => window.scrollTo({ top: y - 240, behavior: "instant" }),
    secondTop,
  );
  const outgoing = slots.first().locator("[data-stack-surface]");
  await expect
    .poll(() =>
      outgoing.evaluate((e) =>
        Number(getComputedStyle(e).getPropertyValue("--stack-scale")),
      ),
    )
    .toBeLessThan(0.98);
  const firstBox = await slots.first().boundingBox(),
    secondBox = await slots.nth(1).boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  expect(secondBox!.y).toBeLessThan(firstBox!.y + firstBox!.height - 80);
  expect(
    await slots.first().evaluate((e) => getComputedStyle(e).position),
  ).toBe("sticky");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => slots.first().evaluate((e) => getComputedStyle(e).position))
    .toBe("relative");
  expect(await outgoing.evaluate((e) => getComputedStyle(e).transform)).toBe(
    "none",
  );
});

test("hero foreground and background travel at different scroll speeds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-engine",
    "lenis",
  );
  await page.locator(".cinematic-intro-root").waitFor({ state: "detached" });
  await page.evaluate(() => window.scrollTo({ top: 450, behavior: "instant" }));
  await expect
    .poll(() =>
      page
        .locator("[data-hero-copy]")
        .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42),
    )
    .toBeLessThan(-20);
  await expect
    .poll(() =>
      page
        .locator("[data-hero-display]")
        .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42),
    )
    .toBeGreaterThan(20);
});

test("collection anchor starts Lenis and reaches the real collection", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-engine",
    "lenis",
  );
  await page
    .getByRole("link", { name: "Explore the collection", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(700);
  const heading = page.locator("#collection-title");
  await expect
    .poll(() =>
      heading.evaluate((e) => Math.abs(e.getBoundingClientRect().top)),
    )
    .toBeLessThan(350);
});
