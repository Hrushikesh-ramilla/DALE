import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/department/electronics");
  await page.request.post("/api/copilot/state", {
    data: { action: "start" },
    headers: { origin: "http://127.0.0.1:3130" },
  });
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
});
async function say(page: Page, message: string) {
  await page.getByLabel("Message DALE").fill(message);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}
test("navigates to the exact rendered listing and preserves chat on refresh", async ({
  page,
}) => {
  await say(page, "Browser action: open the perfume");
  await expect(page).toHaveURL(/\/product\/browser-rag-fragrance$/);
  await expect(page.locator(".pdp-page h1")).toHaveText(
    "Browser-only Oud and Incense Perfume",
  );
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action: open the perfume",
  );
});
test("opens two actual independent browser tabs and retains the source page", async ({
  page,
  context,
}) => {
  await say(page, "Browser action: two separate product tabs");
  await expect.poll(() => context.pages().length).toBe(3);
  const children = context.pages().filter((p) => p !== page);
  await expect(children[0].locator(".pdp-page")).toHaveAttribute(
    "data-product-id",
    "browser-rag-fragrance",
  );
  await expect(children[1].locator(".pdp-page")).toHaveAttribute(
    "data-product-id",
    "browser-rag-fragrance-two",
  );
  await expect(page).toHaveURL(/\/department\/electronics$/);
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.turn.status).toBe("completed");
  expect(state.products.map((p: { id: string }) => p.id)).toEqual([
    "browser-rag-fragrance",
    "browser-rag-fragrance-two",
  ]);
  expect(
    state.receipts.at(-1).targets.map((t: { status: string }) => t.status),
  ).toEqual(["ready", "ready"]);
  await say(page, "Browser action: add from the second opened tab");
  await expect(page.getByLabel("Message DALE")).toBeEnabled();
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/copilot/state")).json()).basket
          .cart,
    )
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "browser-rag-fragrance-two",
          quantity: 2,
        }),
      ]),
    );
  await say(page, "Browser action: compare the opened listings");
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await expect(
    page.locator('[data-concierge-page="/compare"]'),
  ).toHaveAttribute("data-ready", "true");
  await expect(
    page.locator(".concierge-page thead th[data-product-id]"),
  ).toHaveCount(2);
  await expect(page.getByLabel("Message DALE")).toBeEnabled();
  await say(
    page,
    "Browser action: navigate the second tab to the first listing",
  );
  await expect(children[1].locator(".pdp-page")).toHaveAttribute(
    "data-product-id",
    "browser-rag-fragrance",
  );
  await say(page, "Browser action: close the tabs you opened");
  await expect.poll(() => context.pages().length).toBe(1);
  expect(page.isClosed()).toBe(false);
});
test("blocked popups stay pending, recover with one gesture and do not multiply on replay", async ({
  page,
  context,
}) => {
  await page.evaluate(() => {
    const original = window.open;
    Object.assign(window, { __realOpen: original });
    window.open = () => null;
  });
  await say(page, "Browser action: two separate product tabs");
  await expect(
    page.getByRole("button", { name: "Open requested tabs", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  expect(context.pages()).toHaveLength(1);
  let state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.turn.status).toBe("awaiting_ui");
  await page.evaluate(() => {
    window.open = (
      window as unknown as { __realOpen: typeof window.open }
    ).__realOpen;
  });
  await page
    .getByRole("button", { name: "Open requested tabs", exact: true })
    .click();
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  expect(context.pages()).toHaveLength(3);
  state = await (await page.request.get("/api/copilot/state")).json();
  expect(
    state.receipts
      .at(-1)
      .targets.every((t: { status: string }) => t.status === "ready"),
  ).toBe(true);
});
test("updates the real basket and cart UI, survives reload and agrees in another tab", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await other.goto("/cart");
  await expect(
    other.getByText("Your cart is empty.", { exact: true }),
  ).toBeVisible();
  await say(page, "Browser action: add two and show my cart");
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  let state = await (await page.request.get("/api/copilot/state")).json();
  expect(
    state.basket.cart.find(
      (i: { productId: string }) => i.productId === "browser-rag-fragrance",
    ).quantity,
  ).toBe(2);
  await expect(other.getByLabel("Quantity browser-rag-fragrance")).toHaveValue(
    "2",
  );
  await page.reload();
  state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.basket.cart[0].quantity).toBe(2);
  await other.close();
});

test("discovers live component controls, opens the menu and sets its real input", async ({
  page,
}) => {
  await say(page, "Browser action: open menu and change budget");
  await expect(page.locator(".brief-menu-flyout")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(
    page.locator('[data-agent-control="Shopping brief maximum budget USD"]'),
  ).toHaveValue("250");
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser controls completed from observed results.",
  );
});

test("recovers after a committed add loses its HTTP response and the shopper reloads", async ({
  page,
}) => {
  let dropped = false;
  await page.route("**/api/copilot/chat", async (route) => {
    if (dropped) return route.continue();
    dropped = true;
    await route.fetch();
    await route.abort("connectionreset");
  });
  await say(page, "Browser action: add two and show my cart");
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/copilot/state")).json()).turn
          ?.status,
    )
    .toBe("awaiting_ui");
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page
    .getByRole("button", { name: "Resume browser action", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(
    state.basket.cart.find(
      (i: { productId: string }) => i.productId === "browser-rag-fragrance",
    ).quantity,
  ).toBe(2);
});
test("renders canonical filters and correctly ordered matching results", async ({
  page,
}) => {
  await say(page, "Browser action: cheapest perfume results");
  await expect(page).toHaveURL(/\/search\?filters=/);
  await expect(page.locator('[data-concierge-page="/search"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
  const query = JSON.parse(new URL(page.url()).searchParams.get("filters")!);
  expect(query).toMatchObject({
    categories: ["fragrance"],
    brands: ["Browser contract"],
    sort: "price_asc",
  });
  await expect(page.locator(".concierge-grid article h2")).toHaveText([
    "Browser-only Oud and Incense Perfume",
    "Second Browser-only Perfume",
  ]);
});

test("opens the real account form and fills non-secret fields without submitting credentials", async ({
  page,
}) => {
  await say(page, "Browser action: open account and fill my name");
  await expect(
    page.getByRole("dialog").getByLabel("Name", { exact: true }),
  ).toHaveValue("Browser Shopper");
  await expect(
    page.getByRole("dialog").getByLabel("Password", { exact: true }),
  ).toHaveValue("");
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser account controls completed from observed results.",
  );
});

test("batches add and display in one model call before the browser observation", async ({
  page,
}) => {
  await say(page, "Browser action: add and open in one step");
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByLabel("Quantity browser-rag-fragrance")).toHaveValue(
    "2",
  );
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.turn.calls).toBe(1);
});

test("uses browser back and forward between real DALE pages", async ({
  page,
}) => {
  await say(page, "Browser action: open the perfume");
  await expect(page).toHaveURL(/\/product\/browser-rag-fragrance$/);
  await say(page, "Browser action: add and open in one step");
  await expect(page).toHaveURL(/\/cart$/);
  await say(page, "Browser action: go back");
  await expect(page).toHaveURL(/\/product\/browser-rag-fragrance$/);
  await say(page, "Browser action: go forward");
  await expect(page).toHaveURL(/\/cart$/);
});

test("operates the real category sort and pagination controls", async ({
  page,
}) => {
  await page.goto("/category/phones?view=all");
  await expect(
    page.locator('[data-concierge-page="/category/phones"]'),
  ).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  const cards = page.locator(".product-grid article[data-product-id]");
  const before = await cards.count();
  expect(before).toBeGreaterThan(0);
  await say(page, "Browser action: sort and load more models");
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser component task completed from observed results.",
  );
  await expect(
    page.locator('[data-agent-control="Sort category models"]'),
  ).toHaveValue("price-desc");
  await expect.poll(() => cards.count()).toBeGreaterThan(before);
});

test("preserves a manual field edit made after an agent action was planned", async ({
  page,
}) => {
  const budget = page.locator(
    '[data-agent-control="Shopping brief maximum budget USD"]',
  );
  await page.route("**/api/copilot/chat", async (route) => {
    const response = await route.fetch();
    const view = await response.json();
    if (
      view.actions?.some(
        (a: { operation: { type: string }; controlValue?: string }) =>
          a.operation.type === "control" && /^\d/.test(a.controlValue || ""),
      )
    )
      await budget.fill("175");
    await route.fulfill({ response });
  });
  await say(page, "Browser action: open menu and change budget");
  await expect
    .poll(async () => {
      const view = await (await page.request.get("/api/copilot/state")).json();
      return view.receipts.some(
        (a: { status: string; outcome: string }) =>
          a.status === "failed" && a.outcome.includes("field changed"),
      );
    })
    .toBe(true);
  await expect(budget).toHaveValue("175");
});

test("accepts a keyboard task on a narrow mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const input = page.getByLabel("Message DALE");
  await input.fill("Browser action: add and open in one step");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByLabel("Quantity browser-rag-fragrance")).toHaveValue(
    "2",
  );
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser action completed from observed results.",
  );
  const panel = await page.locator("[data-copilot-panel]").boundingBox();
  expect(panel).not.toBeNull();
  expect(panel!.x).toBeGreaterThanOrEqual(0);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(391);
  await expect(input).toBeFocused();
});

test("selects real comparison checkboxes and activates the existing comparison button", async ({
  page,
}) => {
  const filters = {
    categories: ["fragrance"],
    brands: ["Browser contract"],
    sort: "price_asc",
  };
  await page.goto(
    `/search?filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );
  await expect(page.locator('[data-concierge-page="/search"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await say(page, "Browser action: compare the two shown products");
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await expect(
    page.locator(".concierge-page thead th[data-product-id]"),
  ).toHaveCount(2);
  expect(new URL(page.url()).searchParams.get("ids")!.split(",")).toEqual([
    "browser-rag-fragrance",
    "browser-rag-fragrance-two",
  ]);
});

test("expands real page details and scrolls the page to its footer", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await say(page, "Browser action: expand details and scroll to the bottom");
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser details and scroll completed from observed results.",
  );
  await expect(page.locator("main details").first()).toHaveAttribute(
    "open",
    "",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(
          document.documentElement.scrollHeight -
            window.innerHeight -
            window.scrollY,
        ),
      ),
    )
    .toBeLessThan(20);
});
