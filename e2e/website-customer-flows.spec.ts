import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function start(page: Page) {
  await page.goto("/department/electronics");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
}
async function say(page: Page, text: string) {
  await page.getByLabel("Message DALE").fill(text);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}

for (const kind of ["cancel", "return"] as const) {
  test(`prepares an owned ${kind} and waits for the customer's existing confirmation`, async ({
    page,
    context,
  }) => {
    const seed = JSON.parse(
      await readFile(
        resolve(process.env.CHAT_MEMORY_BROWSER_DIR!, "browser-session.json"),
        "utf8",
      ),
    );
    const record = seed.customerOrders[kind === "cancel" ? 0 : 1];
    await context.addCookies([
      {
        name: "bg_session",
        value: record.token,
        url: "http://127.0.0.1:3130",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await start(page);
    await say(
      page,
      kind === "cancel"
        ? "Browser action: cancel my unpaid order"
        : "Browser action: return my damaged order",
    );
    const approve = page
      .locator("[data-copilot-panel]")
      .getByRole("button", {
        name:
          kind === "cancel" ? "Cancel unpaid order" : "Submit return request",
        exact: true,
      });
    await expect(approve).toBeVisible();
    let state = await (await page.request.get("/api/session")).json();
    expect(state.cases).toHaveLength(0);
    expect(state.orders[0].status).not.toBe("canceled");
    await approve.click();
    await expect(approve).toHaveCount(0);
    state = await (await page.request.get("/api/session")).json();
    if (kind === "cancel") expect(state.orders[0].status).toBe("canceled");
    else {
      expect(state.cases).toHaveLength(1);
      expect(state.cases[0]).toMatchObject({
        orderId: record.orderId,
        reason: "damaged",
        request: "refund",
      });
      expect(state.orders[0].status).not.toBe("refunded");
    }
  });
}
test("starts a guest from chat without aborting the first task or requiring a sign-in form", async ({
  page,
}) => {
  await start(page);
  await say(page, "Browser action: open the perfume");
  await expect(page).toHaveURL(/\/product\/browser-rag-fragrance$/);
  await expect(
    page.getByRole("button", { name: /Shopper.*Sign out/i }),
  ).toBeVisible();
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
});
test("opens a direct-product quote with the general-purchase profile and no payment", async ({
  page,
}) => {
  await start(page);
  await say(page, "Browser action: open the perfume");
  await expect(page).toHaveURL(/\/product\/browser-rag-fragrance$/);
  await say(page, "Browser action: review this product checkout");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Your choice. Fully reviewed." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("$37.50");
  const state = await (await page.request.get("/api/session")).json();
  expect(state.orders).toHaveLength(0);
});
test("two independent browser customers join a real shared group only after their own confirmation", async ({
  browser,
}) => {
  const first = await browser.newContext(),
    second = await browser.newContext();
  try {
    const a = await first.newPage(),
      b = await second.newPage();
    for (const page of [a, b]) {
      await start(page);
      await say(page, "Browser action: join the perfume group");
      const confirm = page.getByRole("button", {
        name: "Confirm group commitment",
        exact: true,
      });
      await expect(confirm).toBeVisible();
      const s = await (await page.request.get("/api/session")).json();
      expect(s.orders).toHaveLength(0);
      expect(s.groups.some((g: { joined: boolean }) => g.joined)).toBe(false);
      await confirm.click();
      await expect(confirm).toHaveCount(0);
    }
    const ownA = await (await a.request.get("/api/session")).json(),
      ownB = await (await b.request.get("/api/session")).json();
    expect(ownA.actor.userId).not.toBe(ownB.actor.userId);
    const groupA = ownA.groups.find((g: { joined: boolean }) => g.joined),
      groupB = ownB.groups.find((g: { joined: boolean }) => g.joined);
    expect(groupA.id).toBe(groupB.id);
    expect(groupA.memberCount).toBe(2);
    expect(groupA.status).toBe("ready");
    expect(ownA.orders).toHaveLength(0);
    expect(ownB.orders).toHaveLength(0);
  } finally {
    await first.close();
    await second.close();
  }
});
test("prepares exact quantity quotes, then creates unpaid orders only after the customer's approval", async ({
  page,
}) => {
  await start(page);
  await say(page, "Browser action: add and open in one step");
  await expect(page).toHaveURL(/\/cart$/);
  await say(page, "Browser action: prepare my cart checkout");
  await expect(
    page
      .locator(".concierge-page")
      .getByRole("heading", { name: "Review your checkout", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".concierge-page")).toContainText("$75.00");
  let s = await (await page.request.get("/api/session")).json();
  expect(s.orders).toHaveLength(0);
  await page
    .locator(".concierge-page")
    .getByRole("button", { name: "Create PayPal approvals", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Checkout preparation recorded" }),
  ).toBeVisible();
  s = await (await page.request.get("/api/session")).json();
  expect(s.orders).toHaveLength(2);
  expect(
    s.orders.every(
      (o: { status: string; captureId?: string }) =>
        o.status === "checkout_pending" && !o.captureId,
    ),
  ).toBe(true);
});
test("signing out clears the shopper and chat in another already-open browser tab", async ({
  page,
  context,
}) => {
  await start(page);
  await say(page, "Hello there");
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser contract reply",
  );
  const other = await context.newPage();
  await other.goto("/orders");
  await other.getByRole("button", { name: "Open DALE assistant" }).click();
  await expect(other.locator(".dale-messages-feed")).toContainText(
    "Hello there",
  );
  await page.getByRole("button", { name: /Shopper.*Sign out/i }).click();
  await expect(
    other.getByRole("button", { name: "Start shopping", exact: true }),
  ).toBeVisible();
  await other.getByRole("button", { name: "Open DALE assistant" }).click();
  await expect(other.locator(".dale-messages-feed")).not.toContainText(
    "Hello there",
  );
  expect((await other.request.get("/api/copilot/state")).status()).toBe(401);
});
