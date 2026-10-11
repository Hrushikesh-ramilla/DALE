import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("six departments, retail agent, variant filters and protected checkout", async ({
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
  expect(catalog.total).toBe(35);
  expect(catalog.departments).toHaveLength(6);
  expect(catalog.products).toHaveLength(35);
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
