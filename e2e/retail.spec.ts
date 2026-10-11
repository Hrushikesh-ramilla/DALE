import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("manufacturer photographs render in watches and sunglasses with a visible failure state", async ({
  page,
}) => {
  for (const department of ["Watches", "Sunglasses"]) {
    await page.goto("/shop");
    await page
      .getByRole("button", { name: `Explore ${department}`, exact: true })
      .click();
    const photo = page.locator(".product-photograph img").first();
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(
      page.locator(".product-photograph figcaption a").first(),
    ).toBeVisible();
  }
  await page.route("https://assets2.oakley.com/**", (route) => route.abort());
  await page.reload();
  await page
    .getByRole("button", { name: "Explore Sunglasses", exact: true })
    .click();
  await expect(
    page.getByText("Manufacturer photograph unavailable.").first(),
  ).toBeVisible();
});
test("reviewed watches flow from agent recommendations through independent group purchases", async ({
  browser,
}) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    for (const context of [first, second]) {
      expect(
        (
          await context.request.post(origin + "/api/account", {
            headers: { Origin: origin },
            data: { action: "guest" },
          })
        ).ok(),
      ).toBe(true);
    }
    const page = await first.newPage();
    await page.goto("/shop");
    await page
      .getByRole("button", { name: "Explore Watches", exact: true })
      .click();
    const photo = page.locator(".product-photograph img").first();
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    const chat = page.locator("#dale-chat");
    await chat
      .getByLabel("Your conversation with DALE")
      .fill(
        "Find a Tissot quartz watch with a 40mm case under $600 and use group buying",
      );
    await chat
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    const result = chat.getByLabel("DALE task result");
    await expect(
      result
        .getByRole("button", { name: /Review agent option Tissot/ })
        .first(),
    ).toBeVisible();
    await expect(
      result
        .getByRole("button", { name: /Commit to group for Tissot/ })
        .first(),
    ).toBeVisible();
    const state = await (
      await first.request.get(origin + "/api/session")
    ).json();
    const run = state.agentRuns.at(-1);
    expect(
      state.catalogReferences.some(
        (product: { id: string }) => product.id === run.productIds[0],
      ),
    ).toBe(true);
    expect(state.brief.input.requirements).toMatchObject({
      brand: "tissot",
      movement: "quartz",
      caseDiameterMm: 40,
    });
    expect(state.orders).toEqual([]);
    await result
      .getByRole("button", { name: /Commit to group for Tissot/ })
      .first()
      .click();
    const committed = await (
      await first.request.get(origin + "/api/session")
    ).json();
    const group = committed.groups.find(
      (item: { joined: boolean; productId: string }) =>
        item.joined && item.productId.startsWith("WATCH-"),
    );
    expect(group).toBeTruthy();
    expect(
      (
        await second.request.post(origin + "/api/actions", {
          headers: { Origin: origin },
          data: {
            action: "join_group",
            productId: group.productId,
            model: group.model,
          },
        })
      ).ok(),
    ).toBe(true);
    const other = await (
      await second.request.get(origin + "/api/session")
    ).json();
    expect(other.agentRuns).toEqual([]);
    expect(other.orders).toEqual([]);
    expect(
      other.groups.find((item: { id: string }) => item.id === group.id)
        .memberCount,
    ).toBe(2);
    await page.reload();
    await expect(
      result.getByRole("button", { name: /Review group offer Tissot/ }).first(),
    ).toBeVisible();
    await result
      .getByRole("button", { name: /Review group offer Tissot/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Tissot");
    await dialog
      .getByRole("button", { name: "Approve simulated purchase", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    const bought = await (
      await first.request.get(origin + "/api/session")
    ).json();
    expect(bought.orders.at(-1)).toMatchObject({
      quote: { productId: group.productId, groupId: group.id },
    });
    expect(bought.orders.at(-1).captureId).toBeTruthy();
    expect(
      (await (await second.request.get(origin + "/api/session")).json()).orders,
    ).toEqual([]);
  } finally {
    await first.close();
    await second.close();
  }
});
test("retail agent, variant filters and protected checkout", async ({
  page,
}) => {
  const account = await page.request.post(origin + "/api/account", {
    headers: { Origin: origin },
    data: { action: "guest" },
  });
  expect(account.ok()).toBe(true);
  await page.goto("/shop");
  await expect(
    page.getByRole("button", { name: "Explore Clothing", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore Fragrance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore Beauty & Care", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore Clothing", exact: true })
    .click();
  const chat = page.locator("#dale-chat");
  await chat
    .getByLabel("Your conversation with DALE")
    .fill(
      "Find a Givenchy cotton t-shirt in size M under $600 and use group buying",
    );
  await chat.getByRole("button", { name: "Send message", exact: true }).click();
  const result = chat.getByLabel("DALE task result");
  await expect(result).toContainText("Givenchy");
  await expect(result).toContainText("Product identities and recorded facts");
  await expect(page.getByLabel("Size", { exact: true })).toHaveValue("M");
  const stored = await (await page.request.get(origin + "/api/session")).json();
  expect(stored.brief.input.requirements).toEqual({
    size: "M",
    brand: "givenchy",
    material: "cotton",
    productType: "t-shirt",
  });
  expect(stored.orders).toEqual([]);
  await result
    .getByRole("button", { name: /Review agent option/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Givenchy");
  await expect(dialog).toContainText("Approve simulated purchase");
  await dialog
    .getByRole("button", { name: "Approve simulated purchase", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const purchased = await (
    await page.request.get(origin + "/api/session")
  ).json();
  expect(purchased.orders).toHaveLength(1);
  expect(purchased.orders[0].quote.productId).toBe("B23");
  expect(purchased.orders[0].captureId).toBeTruthy();
  await page.reload();
  expect(
    (await (await page.request.get(origin + "/api/session")).json()).orders[0]
      .id,
  ).toBe(purchased.orders[0].id);
});
test("public catalog supports all departments and strict paginated attribute queries", async ({
  request,
}) => {
  const response = await request.get("/api/catalog");
  expect(response.ok()).toBe(true);
  const catalog = await response.json();
  expect(catalog.total).toBe(65);
  expect(catalog.departments).toHaveLength(8);
  expect(catalog.products).toHaveLength(48);
  const filtered = await request.get(
    "/api/catalog?category=fragrance&brand=tom%20ford&volumeMl=50&budget=40000",
  );
  const result = await filtered.json();
  expect(result.total).toBe(1);
  expect(
    result.products.every(
      (product: { attributes: { brand: string; volumeMl: number } }) =>
        product.attributes.brand === "tom ford" &&
        product.attributes.volumeMl === 50,
    ),
  ).toBe(true);
  expect((await request.get("/api/catalog?category=unknown")).ok()).toBe(false);
});

test("featured products render visible artwork on desktop and mobile", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/shop");
    const hero = page.getByRole("region", { name: "The everyday edit" });
    for (const name of [
      "Apple",
      "Maison Francis Kurkdjian",
      "Louis Vuitton",
      "Givenchy",
    ]) {
      const illustration = hero.getByRole("img", {
        name: new RegExp(`${name}.*original category illustration`),
      });
      await expect(illustration).toBeVisible();
      const bounds = await illustration.boundingBox();
      expect(bounds!.width).toBeGreaterThan(200);
      expect(bounds!.height).toBeGreaterThan(200);
      // A drawn silhouette is required; typographic identity cards caused the regression.
      expect(
        await illustration.locator("path, rect, circle").count(),
      ).toBeGreaterThan(3);
      await expect(hero.locator(".stage-caption")).toContainText(
        "Original category illustration",
      );
      await hero
        .getByRole("button", { name: "Next featured product", exact: true })
        .click();
    }
    await expect(
      hero.getByRole("img", { name: /Apple.*original category illustration/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("electronics opens a nested device browser on desktop and mobile", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/shop");
    await expect(
      page.getByRole("region", { name: "The everyday edit" }),
    ).toContainText("iPhone 17");
    await page
      .getByRole("button", { name: "Explore Electronics", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Choose a category above",
        exact: true,
      }),
    ).toBeVisible();
    const browser = page.getByRole("region", {
      name: "Browse departments and categories",
    });
    await expect(browser.getByRole("button", { name: /Phones/ })).toBeVisible();
    await expect(
      browser.getByRole("button", { name: /Laptops/ }),
    ).toBeVisible();
    await expect(
      browser.getByRole("button", { name: /Tablets/ }),
    ).toBeVisible();
    await browser.getByRole("button", { name: /Phones/ }).click();
    await expect(page.locator(".product-grid")).not.toContainText(
      "Best price for your brief",
    );
    await expect(page.getByLabel("Brand", { exact: true })).toBeVisible();
    await page.getByLabel("Brand", { exact: true }).selectOption("apple");
    await expect(page.locator(".product-grid")).toContainText("iPhone 17");
    await expect(page.locator(".product-grid")).not.toContainText("OnePlus");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
