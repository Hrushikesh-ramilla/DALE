import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("MFK exact-model task uses published volume/concentration evidence and a decoded bottle photograph", async ({
  page,
}) => {
  expect(
    (
      await page.request.post(origin + "/api/account", {
        headers: { Origin: origin },
        data: { action: "guest" },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/shop");
  const task =
    "Find MFK APOM eau de parfum 70ml under $400 and use group buying";
  await page.getByPlaceholder(/^Ask DALE:/).fill(task);
  await page.getByRole("button", { name: "Ask DALE", exact: true }).click();
  const chat = page.locator("#dale-chat");
  await chat.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    chat
      .getByLabel("DALE task result")
      .getByRole("button", {
        name: /Review agent option Maison Francis Kurkdjian APOM/,
      }),
  ).toBeVisible();
  const state = await (await page.request.get("/api/session")).json();
  expect(state.agentRuns.at(-1).productIds).toEqual(["FRAGRANCE-MFK-RA120421"]);
  expect(state.orders).toHaveLength(0);
  expect(
    state.catalogReferences.find(
      (p: { id: string }) => p.id === "FRAGRANCE-MFK-RA120421",
    ).attributes,
  ).toMatchObject({ volumeMl: 70, concentration: "eau de parfum" });
  await page.goto("/shop");
  await page
    .getByRole("button", { name: "Explore Fragrance", exact: true })
    .click();
  await page
    .getByLabel("Brand", { exact: true })
    .selectOption("maison francis kurkdjian");
  const photograph = page
    .locator(".product-grid .product-photograph img")
    .first();
  await expect(photograph).toBeVisible();
  await photograph.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      photograph.evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  const products = await (
    await page.request.get(
      "/api/catalog?category=fragrance&brand=maison%20francis%20kurkdjian",
    )
  ).json();
  expect(products.total).toBe(15);
  expect(
    new Set(
      products.products.map(
        (p: { familyId?: string; id: string }) => p.familyId || p.id,
      ),
    ).size,
  ).toBe(15);
});
