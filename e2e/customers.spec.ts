import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("independent devices share live group commitments and retain private customer state", async ({
  browser,
}) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    const a = await first.request.post(origin + "/api/account", {
      headers: { Origin: origin },
      data: { action: "guest" },
    });
    const b = await second.request.post(origin + "/api/account", {
      headers: { Origin: origin },
      data: { action: "guest" },
    });
    expect(a.ok()).toBe(true);
    expect(b.ok()).toBe(true);
    const ownerA = await a.json(),
      ownerB = await b.json();
    expect(ownerA.actor.userId).not.toBe(ownerB.actor.userId);
    expect(ownerA.actor.workspaceId).toBe(ownerB.actor.workspaceId);
    expect(ownerA.demo).toBeUndefined();
    const join = await first.request.post(origin + "/api/actions", {
      headers: { Origin: origin },
      data: { action: "join_group", productId: "P001", model: "Atlas 14" },
    });
    expect(join.ok()).toBe(true);
    const pageA = await first.newPage(),
      pageB = await second.newPage();
    await pageA.goto(origin + "/groups");
    await pageB.goto(origin + "/groups");
    const cardB = pageB
      .locator(".group-card")
      .filter({ hasText: "65W USB-C Wall Charger" })
      .first();
    await expect(cardB).toContainText("1 of 2");
    await cardB.getByRole("button", { name: "Join this group" }).click();
    const cardA = pageA
      .locator(".group-card")
      .filter({ hasText: "65W USB-C Wall Charger" })
      .first();
    await expect(cardA).toContainText("2 of 2", { timeout: 12000 });
    await expect(cardA).toContainText("DISCOUNT UNLOCKED");
    const privateB = await (
      await second.request.get(origin + "/api/session")
    ).json();
    expect(privateB.orders).toEqual([]);
    expect(JSON.stringify(privateB.groups)).not.toContain(ownerA.actor.userId);
    await pageA.getByRole("button", { name: "Account / sign in" }).click();
    await pageA.getByLabel("Name", { exact: true }).fill("Device One");
    const email = `device-${Date.now()}@example.test`;
    await pageA.getByLabel("Email", { exact: true }).fill(email);
    await pageA
      .getByLabel("Password", { exact: true })
      .fill("a-private-passphrase-42");
    await pageA
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(pageA.getByRole("dialog")).not.toBeVisible();
    const third = await browser.newContext();
    try {
      const login = await third.request.post(origin + "/api/account", {
        headers: { Origin: origin },
        data: { action: "login", email, password: "a-private-passphrase-42" },
      });
      expect(login.ok()).toBe(true);
      expect((await login.json()).actor.userId).toBe(ownerA.actor.userId);
    } finally {
      await third.close();
    }
    const forbidden = await second.request.post(origin + "/api/account", {
      headers: { Origin: "https://foreign.example" },
      data: { action: "guest" },
    });
    expect(forbidden.status()).toBe(403);
  } finally {
    await first.close();
    await second.close();
  }
});
