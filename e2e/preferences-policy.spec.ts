import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("shopper weights persist and reviewer-approved group terms appear and freeze", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  expect(
    (
      await page.request.post("/api/demo", {
        headers: { Origin: origin },
        data: { action: "launch", kind: "fresh" },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await page
    .getByRole("combobox", { name: "Looking for", exact: true })
    .selectOption("chargers");
  await page.getByLabel("Feature to prioritize", { exact: true }).fill("100W");
  await page.getByLabel("Use explicit preference weights").check();
  await page.getByLabel("Price preference weight").focus();
  await page.getByLabel("Price preference weight").press("Home");
  await expect(
    page.getByText("Matching feature weight: 100%.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Find my match", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/session")).json()).brief?.input
          .weights,
    )
    .toEqual({ price: 0, features: 100 });
  await page.reload();
  await expect(page.getByLabel("Price preference weight")).toHaveValue("0", { timeout: 60000 });
  const forbidden = await page.request.post("/api/actions", {
    headers: { Origin: origin },
    data: {
      action: "group_policy",
      expectedVersion: 1,
      policy: {
        minimumMembers: 3,
        discountPercent: 20,
        formingMinutes: 1440,
        checkoutMinutes: 45,
        productTiers: [],
      },
    },
  });
  expect(forbidden.status()).toBe(403);
  await page.request.post("/api/demo", {
    headers: { Origin: origin },
    data: { action: "persona", persona: "reviewer" },
  });
  await page.reload();
  await page.getByText("Environment details", { exact: true }).click();
  await page
    .getByText("Merchant group pricing · policy 1", { exact: true })
    .click();
  await page.getByLabel("Default minimum shoppers").fill("3");
  await page.getByLabel("Default discount, percent").fill("20");
  await page.getByLabel("Locked checkout window, minutes").fill("45");
  await page
    .getByRole("button", { name: "Approve group policy", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/session")).json()).groupPolicy
          .version,
    )
    .toBe(2);
  await page.request.post("/api/demo", {
    headers: { Origin: origin },
    data: { action: "persona", persona: "buyer" },
  });
  const joined = await page.request.post("/api/actions", {
    headers: { Origin: origin },
    data: { action: "join_group", productId: "P001", model: "Atlas 14" },
  });
  expect(joined.ok()).toBe(true);
  const joinedState = await joined.json();
  expect(joinedState.snapshot.groups[0].terms).toMatchObject({
    minimumMembers: 3,
    discountPercent: 20,
    amount: 2320,
    checkoutMinutes: 45,
  });
  expect(joinedState.snapshot.orders).toHaveLength(0);
  await page.goto("/groups");
  await expect(page.getByText("1 of 3", { exact: false })).toBeVisible();
  await expect(
    page.getByText("20% off if the threshold is met.", { exact: false }),
  ).toBeVisible();
});
