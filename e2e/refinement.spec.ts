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

test("editorial shopping form sends once through the current assistant", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Your shopping request")
    .fill("Browser slow streamed reply");
  await page.getByRole("button", { name: "Ask DALE", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "DALE assistant" }),
  ).toBeVisible();
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Genuine first streamed words; the complete reply is now saved.",
  );
  const saved = await (await page.request.get("/api/copilot/state")).json();
  expect(
    saved.messages.filter(
      (message: { text: string }) =>
        message.text === "Browser slow streamed reply",
    ),
  ).toHaveLength(1);
  await expect(page.getByLabel("Your shopping request")).toHaveValue("");
});

test("footer invitation opens the assistant without submitting a task", async ({
  page,
}) => {
  await page.goto("/");
  let sent = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("/api/copilot/chat") &&
      request.method() === "POST"
    )
      sent++;
  });
  await page.getByRole("button", { name: "Meet your shopping agent" }).click();
  await expect(
    page.getByRole("complementary", { name: "DALE assistant" }),
  ).toBeVisible();
  expect(sent).toBe(0);
});

test("late initial session snapshots do not cancel the first shopping request", async ({
  page,
}) => {
  let releaseInitial!: () => void;
  let releaseOwned!: () => void;
  const initial = new Promise<void>((resolve) => {
    releaseInitial = resolve;
  });
  const owned = new Promise<void>((resolve) => {
    releaseOwned = resolve;
  });
  let sessionReads = 0;
  await page.route("**/api/session", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const first = ++sessionReads === 1;
    const response = await route.fetch();
    await (first ? initial : owned);
    await route.fulfill({ response });
  });
  try {
    await page.goto("/");
    await page
      .getByLabel("Your shopping request")
      .fill("Browser slow streamed reply");
    await page.getByRole("button", { name: "Ask DALE", exact: true }).click();
    await expect(page.locator('[data-message-id^="stream:"]')).toContainText(
      "Genuine first streamed words",
    );
    releaseInitial();
    await expect(page.locator(".dale-messages-feed")).toContainText(
      "Genuine first streamed words; the complete reply is now saved.",
    );
    const saved = await (await page.request.get("/api/copilot/state")).json();
    expect(saved.turn.status).toBe("completed");
  } finally {
    releaseInitial();
    releaseOwned();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("an initial owned session snapshot cannot interrupt assistant bootstrap", async ({
  page,
}) => {
  await page.request.post("/api/copilot/state", {
    data: { action: "start" },
    headers: { origin: baseURL },
  });
  let releaseSession!: () => void;
  let releaseEnsure!: () => void;
  let releaseReads!: () => void;
  const session = new Promise<void>((resolve) => {
    releaseSession = resolve;
  });
  const ensure = new Promise<void>((resolve) => {
    releaseEnsure = resolve;
  });
  const reads = new Promise<void>((resolve) => {
    releaseReads = resolve;
  });
  await page.route("**/api/session", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    await session;
    await route.fulfill({ response });
  });
  await page.route("**/api/copilot/state", async (route) => {
    const response = await route.fetch();
    if (route.request().method() === "POST") {
      releaseSession();
      await ensure;
    } else await reads;
    await route.fulfill({ response });
  });
  try {
    await page.goto("/");
    await page
      .getByLabel("Your shopping request")
      .fill("Browser slow streamed reply");
    await page.getByRole("button", { name: "Ask DALE", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /Shopper.*Sign out/ }),
    ).toBeVisible();
    releaseEnsure();
    await expect(page.locator(".dale-messages-feed")).toContainText(
      "Genuine first streamed words; the complete reply is now saved.",
    );
  } finally {
    releaseSession();
    releaseEnsure();
    releaseReads();
    await page.unrouteAll({ behavior: "wait" });
  }
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
  const wheelSamples = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        window.addEventListener(
          "wheel",
          () => {
            const values: number[] = [];
            const sample = () => {
              values.push(scrollY);
              if (values.length === 24) resolve(values);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          },
          { once: true, passive: true },
        );
      }),
  );
  await page.mouse.wheel(0, 500);
  const positions = await wheelSamples;
  expect(new Set(positions.map(Math.round)).size).toBeGreaterThan(4);
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
    .toBeGreaterThan(20);
  await expect
    .poll(() =>
      page
        .locator("[data-hero-display]")
        .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42),
    )
    .toBeLessThan(-3);
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
  const section = page.locator("#collections");
  await expect
    .poll(() =>
      section.evaluate((e) => {
        const margin = parseFloat(getComputedStyle(e).scrollMarginTop) || 0;
        const padding =
          parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop,
          ) || 0;
        return Math.abs(e.getBoundingClientRect().top - margin - padding);
      }),
    )
    .toBeLessThan(2);
  await expect(page.locator("html")).not.toHaveClass(/lenis-smooth/);
  const heading = await page.locator("#collection-title").boundingBox();
  expect(heading).not.toBeNull();
  expect(heading!.y).toBeGreaterThan(60);
  expect(heading!.y + heading!.height).toBeLessThan(720);
});

test("headline letters react locally, spring home, and release their animation hints", async ({
  page,
}) => {
  await page.goto("/");
  const type = page.locator("[data-hero-copy] [data-living-type]").first();
  await expect(type).toHaveAttribute("data-type-ready", "true");
  await expect(
    page.getByRole("heading", { name: "A better everyday." }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const letter = type.locator("[data-living-letter]").nth(2);
  const box = await letter.boundingBox();
  if (!box) throw new Error("Headline letter is not laid out");
  await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height * 0.7);
  await expect(type).toHaveAttribute("data-type-active", "true");
  await expect
    .poll(() =>
      type.evaluate((el) =>
        Math.max(
          ...[...el.querySelectorAll("[data-living-letter]")].map((letter) => {
            const m = new DOMMatrix(getComputedStyle(letter).transform);
            return Math.hypot(m.m41, m.m42);
          }),
        ),
      ),
    )
    .toBeGreaterThan(5);
  await page.mouse.move(2, 2);
  await expect(type).not.toHaveAttribute("data-type-active", "true");
  expect(
    await type
      .locator("[data-living-letter]")
      .evaluateAll((letters) =>
        letters.every(
          (el) =>
            !(el as HTMLElement).style.transform &&
            !(el as HTMLElement).style.willChange,
        ),
      ),
  ).toBe(true);
});

test("the whole opening responds in separate planes and stops for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.locator(".editorial-hero");
  const atmosphere = page.locator("[data-hero-atmosphere]");
  await expect(hero).toHaveAttribute("data-depth-ready", "true");
  await page.mouse.move(1300, 600);
  await expect(hero).toHaveAttribute("data-scene-active", "true");
  await expect
    .poll(() =>
      atmosphere.evaluate((el) =>
        Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41),
      ),
    )
    .toBeGreaterThan(5);
  expect(await hero.evaluate((el) => getComputedStyle(el).transform)).toBe(
    "none",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).not.toHaveAttribute("data-scene-active", "true");
  expect(
    await atmosphere.evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
  expect(
    await page
      .locator("[data-hero-entrance]")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".living-glyph")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("opening parallax responds to the first short scroll", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-engine",
    "lenis",
  );
  const copy = page.locator("[data-hero-copy]");
  const before = await copy.evaluate(
    (el) => new DOMMatrix(getComputedStyle(el).transform).m42,
  );
  await page.mouse.move(10, 120);
  await page.mouse.wheel(0, 70);
  await expect
    .poll(() =>
      copy.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42),
    )
    .toBeGreaterThan(before + 4);
});

test("hero holds its layered scene through a viewport of scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.locator("[data-collection-slot]").first().locator(".."),
  ).toHaveAttribute("data-stack-ready", "true");
  await page.locator("[data-hero-entrance]").evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await expect(page.locator("[data-hero-track]")).toHaveAttribute(
    "data-hero-held",
    "true",
  );
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
  await expect
    .poll(async () =>
      Math.round((await page.locator(".editorial-hero").boundingBox())!.y),
    )
    .toBe(78);
  const before = await page
    .locator("[data-hero-forward]")
    .evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a);
  await page.evaluate(() => window.scrollTo({ top: 950, behavior: "instant" }));
  await expect
    .poll(async () =>
      Math.round((await page.locator(".editorial-hero").boundingBox())!.y),
    )
    .toBe(78);
  await expect
    .poll(() =>
      page
        .locator("[data-hero-forward]")
        .evaluate(
          (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
        ),
    )
    .toBeGreaterThan(before + 0.04);
  for (const selector of ["[data-hero-copy]", "[data-hero-display]"]) {
    const shape = await page.locator(selector).evaluate((e) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
      return { a: m.a, b: m.b, c: m.c, d: m.d };
    });
    expect(shape.b).toBe(0);
    expect(shape.c).toBe(0);
    expect(shape.a).toBeCloseTo(shape.d, 5);
    expect(shape.a).toBeGreaterThanOrEqual(1);
  }
  const caption = await page
    .locator("[data-hero-depth]")
    .locator("..")
    .locator('a[href^="/product/"]')
    .first()
    .boundingBox();
  expect(caption!.y).toBeGreaterThan(78);
  expect(caption!.y + caption!.height).toBeLessThan(1000);
  const action = await page
    .getByRole("button", { name: "Start a conversation", exact: true })
    .boundingBox();
  expect(action!.y).toBeGreaterThan(78);
  expect(action!.y + action!.height).toBeLessThan(1000);
  const separation = await page.evaluate(() => {
    const copy = new DOMMatrixReadOnly(
      getComputedStyle(document.querySelector("[data-hero-copy]")!).transform,
    );
    const glass = new DOMMatrixReadOnly(
      getComputedStyle(document.querySelector("[data-hero-display]")!)
        .transform,
    );
    const object = new DOMMatrixReadOnly(
      getComputedStyle(document.querySelector("[data-hero-forward]")!)
        .transform,
    );
    return {
      copyY: copy.m42,
      glassY: glass.m42,
      glassScale: glass.a,
      objectScale: object.a,
    };
  });
  expect(separation.copyY - separation.glassY).toBeGreaterThan(60);
  expect(separation.objectScale).toBeGreaterThan(separation.glassScale + 0.06);
  await page.getByRole("button", { name: "Next featured product" }).click();
  await expect
    .poll(() =>
      page
        .locator("[data-hero-forward]")
        .evaluate(
          (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
        ),
    )
    .toBeGreaterThan(1.1);
});

test("agent and closing invitation hold with opposing layers and collapse for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.locator("[data-collection-slot]").first().locator(".."),
  ).toHaveAttribute("data-stack-ready", "true");
  await page.locator("[data-hero-entrance]").evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  for (const [kind, surface, foreground] of [
    ["agent", ".hero-dale-bar", "[data-agent-parallax-title]"],
    ["footer", ".footer-invitation", ".footer-invitation p"],
  ]) {
    const track = page.locator(`[data-editorial-scroll-track="${kind}"]`);
    await expect(track).toHaveAttribute("data-parallax-ready", "true");
    const top = await track.evaluate(
      (e) => e.getBoundingClientRect().top + scrollY - 78,
    );
    await page.evaluate(
      (y) => scrollTo({ top: y + 50, behavior: "instant" }),
      top,
    );
    await expect
      .poll(async () =>
        Math.round((await page.locator(surface).boundingBox())!.y),
      )
      .toBe(78);
    // Native scrolling updates geometry before ScrollTrigger's next frame.
    await expect
      .poll(() =>
        page
          .locator(foreground)
          .evaluate(
            (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42,
          ),
      )
      .toBeGreaterThan(-25);
    const before = await page
      .locator(foreground)
      .evaluate(
        (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42,
      );
    await page.evaluate(
      (y) => scrollTo({ top: y + 350, behavior: "instant" }),
      top,
    );
    await expect
      .poll(() =>
        page
          .locator(foreground)
          .evaluate(
            (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42,
          ),
      )
      .toBeLessThan(before - 25);
    await expect
      .poll(async () =>
        Math.round((await page.locator(surface).boundingBox())!.y),
      )
      .toBe(78);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-hero-track]")).not.toHaveAttribute(
    "data-hero-held",
    "true",
  );
  await expect(
    page.locator('[data-editorial-scroll-track="footer"]'),
  ).not.toHaveAttribute("data-parallax-ready", "true");
  expect(
    await page
      .locator(".footer-invitation")
      .evaluate((e) => getComputedStyle(e).position),
  ).toBe("relative");
  expect(
    await page
      .locator("[data-agent-parallax-title]")
      .evaluate((e) => getComputedStyle(e).transform),
  ).toBe("none");
});

test("indexed navigation keeps its names, keyboard access and mobile brief control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const support = nav.getByRole("button", { name: "Support", exact: true });
  await expect(support).toBeEnabled();
  await support.focus();
  await page.keyboard.press("Enter");
  await expect(support).toHaveAttribute("aria-current", "page");
  const brief = page.getByRole("button", {
    name: "Filter products and adjust shopping brief",
  });
  await brief.click();
  await expect(brief).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(brief).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  for (const button of await nav.getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
});

test("late catalog category changes cannot remove the hero scroll scene", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/catalog/summary", async (route) => {
    const response = await route.fetch();
    const summary = await response.json();
    await gate;
    const category = Object.keys(summary.counts).find(
      (key) => summary.counts[key] > 0,
    )!;
    await route.fulfill({
      json: { ...summary, counts: { [category]: summary.counts[category] } },
    });
  });
  try {
    await page.goto("/");
    const hero = page.locator("[data-hero-track]");
    await expect(hero).toHaveAttribute("data-hero-held", "true");
    expect(
      await page.locator("[data-collection-slot]").count(),
    ).toBeGreaterThan(1);
    release();
    await expect(page.locator("[data-collection-slot]")).toHaveCount(1);
    await expect(hero).toHaveAttribute("data-hero-held", "true");
    await page.evaluate(() =>
      window.scrollTo({ top: 600, behavior: "instant" }),
    );
    await expect
      .poll(() =>
        page
          .locator("[data-hero-forward]")
          .evaluate(
            (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
          ),
      )
      .toBeGreaterThan(1.1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(hero).not.toHaveAttribute("data-hero-held", "true");
    expect(
      await page
        .locator("[data-hero-forward]")
        .evaluate((e) => getComputedStyle(e).willChange),
    ).toBe("auto");
  } finally {
    release();
  }
});

test("hero contracts evenly on four sides while its product advances, and resets for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const track = page.locator("[data-hero-track]");
  await expect(track).toHaveAttribute("data-hero-held", "true");
  await page.evaluate(() => document.fonts.ready);
  const portal = page.locator("[data-hero-portal]");
  const start = await track.evaluate(
    (e) => e.getBoundingClientRect().top + scrollY - 78,
  );
  await page.evaluate(
    (y) => scrollTo({ top: y + 900, behavior: "instant" }),
    start,
  );
  await expect
    .poll(() =>
      portal.evaluate(
        (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
      ),
    )
    .toBeLessThan(0.8);
  const geometry = await portal.evaluate((e) => {
    const frame = e.getBoundingClientRect();
    const root = e.parentElement!.getBoundingClientRect();
    const object = new DOMMatrixReadOnly(
      getComputedStyle(document.querySelector("[data-hero-forward]")!)
        .transform,
    );
    return {
      left: frame.left - root.left,
      right: root.right - frame.right,
      top: frame.top - root.top,
      bottom: root.bottom - frame.bottom,
      productScale: object.a,
    };
  });
  expect(geometry.left).toBeGreaterThan(130);
  expect(geometry.top).toBeGreaterThan(80);
  expect(Math.abs(geometry.left - geometry.right)).toBeLessThan(1);
  expect(Math.abs(geometry.top - geometry.bottom)).toBeLessThan(1);
  expect(geometry.productScale).toBeGreaterThan(1.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(track).not.toHaveAttribute("data-hero-held", "true");
  expect(await portal.evaluate((e) => getComputedStyle(e).transform)).toBe(
    "none",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
