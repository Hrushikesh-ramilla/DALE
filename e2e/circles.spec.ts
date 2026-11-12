import { expect, test, type BrowserContext, type Page } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
async function guest(context: BrowserContext) {
  const response = await context.request.post(origin + "/api/account", {
    headers: { Origin: origin },
    data: { action: "guest" },
  });
  expect(response.ok()).toBe(true);
  return response.json();
}
async function view(context: BrowserContext, query: string) {
  const response = await context.request.get(origin + "/api/circles?" + query);
  expect(response.ok()).toBe(true);
  return response.json();
}
async function post(context: BrowserContext, data: unknown) {
  return context.request.post(origin + "/api/circles", {
    headers: { Origin: origin },
    data,
  });
}
function join(
  offer: { product: { id: string }; model: string; review: object },
  circleId?: string,
) {
  return {
    action: "join",
    productId: offer.product.id,
    model: offer.model,
    ...offer.review,
    circleId,
    consent: true,
  };
}
async function enter(page: Page) {
  await page
    .getByRole("button", { name: "Start shopping to join", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue as guest", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
test.beforeAll(async ({ request }) => {
  expect((await request.get("/api/copilot/products?ids=B033")).ok()).toBe(true);
});
test("exact invitation, independent guest consent, live progress and isolated decline on desktop/mobile", async ({
  browser,
}, info) => {
  const first = await browser.newContext({
      viewport: { width: 1280, height: 1000 },
    }),
    second = await browser.newContext({
      viewport: { width: 390, height: 900 },
    });
  try {
    const a = await first.newPage(),
      b = await second.newPage();
    await a.goto(origin + "/product/B033");
    await a
      .getByRole("link", { name: "Review buying circle", exact: true })
      .click();
    const initial = a.locator('[data-circle-offer="B033"]');
    await expect(initial).toContainText("Conditional group price");
    await enter(a);
    await initial.getByRole("checkbox").check();
    await initial
      .getByRole("button", { name: "Commit to this offer", exact: true })
      .click();
    await expect(a).toHaveURL(/\/groups\?circle=[0-9a-f-]+/);
    const id = new URL(a.url()).searchParams.get("circle")!;
    const cardA = a.locator(`[data-circle-id="${id}"]`);
    await expect(cardA).toContainText("1 of 2 commitments");
    const invitation = await cardA
      .getByRole("link", { name: "Open shareable circle link", exact: true })
      .getAttribute("href");
    expect(invitation).toBe("/groups?circle=" + id);
    await b.goto(origin + invitation);
    const cardB = b.locator(`[data-circle-id="${id}"]`);
    await expect(cardB).toContainText("1 of 2 commitments");
    await expect(cardB).toContainText("Cash-on-delivery commitments qualify");
    const publicView = (await view(second, "circle=" + id)).circles[0];
    expect(publicView.joined).toBe(false);
    await enter(b);
    await expect(
      cardB.getByRole("button", { name: "Join this group", exact: true }),
    ).toBeDisabled();
    await cardB.getByRole("checkbox").check();
    await cardB
      .getByRole("button", { name: "Join this group", exact: true })
      .click();
    await expect(cardA).toContainText("2 of 2 commitments", { timeout: 12000 });
    await expect(cardA).toContainText("DISCOUNT UNLOCKED");
    await expect(cardB).toContainText("DISCOUNT UNLOCKED");
    const ownA = await (
        await first.request.get(origin + "/api/session")
      ).json(),
      ownB = await (await second.request.get(origin + "/api/session")).json();
    expect(ownA.actor.userId).not.toBe(ownB.actor.userId);
    expect(ownA.actor.workspaceId).toBe(ownB.actor.workspaceId);
    expect(ownA.orders).toEqual([]);
    expect(ownB.orders).toEqual([]);
    expect(JSON.stringify(ownB.groups)).not.toContain(ownA.actor.userId);
    await cardA
      .getByRole("button", { name: "Review group purchase", exact: true })
      .click();
    await expect(a.getByRole("dialog")).toContainText("$314.10");
    await a.keyboard.press("Escape");
    await cardA.screenshot({
      path: info.outputPath("circle-ready-desktop.png"),
    });
    await cardB.screenshot({
      path: info.outputPath("circle-ready-mobile.png"),
    });
    expect(
      await b.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await cardB
      .getByRole("button", {
        name: "Decline checkout and release my unit",
        exact: true,
      })
      .click();
    await expect(cardA).toContainText("1 of 2 commitments", { timeout: 12000 });
    await expect(cardA).toContainText("DISCOUNT UNLOCKED");
    await expect(
      cardA.getByRole("button", { name: "Review group purchase", exact: true }),
    ).toBeVisible();
    await expect(
      cardB.getByRole("button", { name: "Review group purchase", exact: true }),
    ).toHaveCount(0);
    await a.reload();
    await expect(a.locator(`[data-circle-id="${id}"]`)).toContainText(
      "Originally qualified with 2 shoppers",
    );
    expect(
      (await (await first.request.get(origin + "/api/session")).json()).orders,
    ).toEqual([]);
    expect(JSON.stringify(await view(second, "circle=" + id))).not.toContain(
      ownA.actor.userId,
    );
  } finally {
    await first.close();
    await second.close();
  }
});
test("HTTP consent/origin guards, concurrent exact-circle joining and aggregate privacy", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext(),
    c = await browser.newContext(),
    anonymous = await browser.newContext();
  try {
    const [ownerA, ownerB] = await Promise.all([guest(a), guest(b), guest(c)]);
    const offer = (await view(a, "product=B010")).offer;
    expect((await post(a, { ...join(offer), consent: false })).status()).toBe(
      400,
    );
    expect(
      (
        await anonymous.request.post(origin + "/api/circles", {
          headers: { Origin: origin },
          data: join(offer),
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await a.request.post(origin + "/api/circles", {
          headers: { Origin: "https://foreign.example" },
          data: join(offer),
        })
      ).status(),
    ).toBe(403);
    const made = await post(a, join(offer));
    expect(made.ok()).toBe(true);
    const id = (await made.json()).circleId;
    const bv = (await view(b, "circle=" + id)).circles[0],
      cv = (await view(c, "circle=" + id)).circles[0];
    const results = await Promise.all([
      post(b, join(bv, id)),
      post(c, join(cv, id)),
    ]);
    expect(results.filter((r) => r.ok())).toHaveLength(1);
    const publicRead = await view(anonymous, "circle=" + id);
    expect(publicRead.circles[0].memberCount).toBe(2);
    expect(publicRead.circles[0].status).toBe("ready");
    expect(JSON.stringify(publicRead)).not.toContain(ownerA.actor.userId);
    expect(JSON.stringify(publicRead)).not.toContain(ownerB.actor.userId);
    expect(
      (
        await anonymous.request.get(
          origin + "/api/circles?circle=00000000-0000-4000-8000-000000000000",
        )
      ).status(),
    ).toBe(404);
  } finally {
    await Promise.all([a.close(), b.close(), c.close(), anonymous.close()]);
  }
});
test("a failed circle refresh shows recovery and resumes real updates", async ({
  browser,
}) => {
  const context = await browser.newContext();
  try {
    await guest(context);
    const offer = (await view(context, "product=B011")).offer;
    const created = await post(context, join(offer));
    expect(created.ok()).toBe(true);
    const id = (await created.json()).circleId;
    const page = await context.newPage();
    await page.goto(origin + "/groups?circle=" + id);
    await expect(page.locator("[data-circle-id]")).toContainText(
      "1 of 2 commitments",
    );
    await page.route("**/api/circles?*", (route) => route.abort("failed"));
    await expect(
      page.getByRole("region", { name: "Buying circles" }).getByRole("alert"),
    ).toContainText("Updates are unavailable", { timeout: 12000 });
    await page.unroute("**/api/circles?*");
    await page
      .getByRole("button", { name: "Retry circle updates", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Buying circles" }).getByRole("alert"),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Leave commitment", exact: true })
      .click();
    await expect(page.locator("[data-circle-id]")).toContainText(
      "0 of 2 commitments",
    );
  } finally {
    await context.close();
  }
});
