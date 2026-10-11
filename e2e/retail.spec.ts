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
    .fill("Find a linen shirt in size M under $60 and use group buying");
  await chat.getByRole("button", { name: "Send message", exact: true }).click();
  const result = chat.getByLabel("DALE task result");
  await expect(result).toContainText("Linen Short-Sleeve Shirt · M");
  await expect(result).toContainText("merchant-authored engineering offers");
  await expect(page.getByLabel("Size", { exact: true })).toHaveValue("M");
  const stored = await (await page.request.get(origin + "/api/session")).json();
  expect(stored.brief.input.requirements).toEqual({
    size: "M",
    material: "linen",
    productType: "shirt",
  });
  expect(stored.orders).toEqual([]);
  await result
    .getByRole("button", { name: /Review agent option/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Linen Short-Sleeve Shirt · M");
  await expect(dialog).toContainText("Approve simulated purchase");
  await dialog
    .getByRole("button", { name: "Approve simulated purchase", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const purchased = await (
    await page.request.get(origin + "/api/session")
  ).json();
  expect(purchased.orders).toHaveLength(1);
  expect(purchased.orders[0].quote.productId).toBe("L005");
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
  expect(catalog.total).toBe(223);
  expect(catalog.departments).toHaveLength(6);
  expect(catalog.products).toHaveLength(48);
  const filtered = await request.get(
    "/api/catalog?category=fragrance&scent=citrus&volumeMl=50&budget=4000",
  );
  const result = await filtered.json();
  expect(result.total).toBe(2);
  expect(
    result.products.every(
      (product: { attributes: { scent: string; volumeMl: number } }) =>
        product.attributes.scent === "citrus" &&
        product.attributes.volumeMl === 50,
    ),
  ).toBe(true);
  expect((await request.get("/api/catalog?category=unknown")).ok()).toBe(false);
});
