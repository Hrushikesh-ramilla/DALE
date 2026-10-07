import { expect, test } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
test("all guided scenarios launch their actual fixture state and survive reload", async ({
  page,
}) => {
  test.setTimeout(180000);
  const scenarios = [
    ["fresh", "Start shopping", "/shop"],
    ["delivered", "Return a delivered item", "/orders"],
    ["group_partial", "Buy together", "/shop"],
    ["identifier_conflict", "Conflicting evidence", "/support"],
    ["seller_silence", "Seller missed a deadline", "/support"],
    ["refund_failure", "Failed refund", "/support"],
    ["refund_timeout", "Interrupted refund", "/support"],
    ["canceled_order", "Seller canceled", "/support"],
    ["late_order", "Late delivery", "/support"],
  ];
  for (const [kind, title, path] of scenarios) {
    await page.goto("/demo");
    await page.getByRole("button", { name: new RegExp(`^${title}`) }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByLabel("Demo persona")).toHaveValue("buyer");
    const snapshot = await (await page.request.get("/api/session")).json();
    expect(snapshot.demo.kind).toBe(kind);
    expect(snapshot.modes).toMatchObject({
      payments: "fixture",
      ai: "fixture",
    });
    expect(snapshot.orders.length).toBe(
      kind === "fresh" || kind === "group_partial" ? 0 : 1,
    );
    await page.reload();
    await expect(page.getByLabel("Demo persona")).toHaveValue("buyer");
    expect(
      (await (await page.request.get("/api/session")).json()).actor.workspaceId,
    ).toBe(snapshot.actor.workspaceId);
  }
});
test("one-click demo preserves approval, stable personas, isolation, export and reset", async ({
  page,
  browser,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await expect(page.getByLabel("Demo persona")).toHaveValue("buyer");
  await page.getByRole("button", { name: "Find my match" }).click();
  const first = (await (await page.request.get("/api/session")).json()).actor
    .workspaceId;
  await page
    .locator(".product-card")
    .filter({ hasText: "65W USB-C Wall Charger" })
    .first()
    .getByRole("button", { name: "Review purchase" })
    .click();
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await page.getByLabel("Demo persona").selectOption("seller");
  await expect(page.getByLabel("Demo persona")).toHaveValue("seller");
  await page.getByLabel("Demo persona").selectOption("reviewer");
  await expect(page.getByLabel("Demo persona")).toHaveValue("reviewer");
  expect(
    (
      await page.request.post("/api/scenarios", {
        headers: { Origin: origin },
        data: { action: "create", kind: "fresh" },
      })
    ).status(),
  ).toBe(403);
  await page.getByLabel("Demo persona").selectOption("seller");
  await expect(page.getByLabel("Demo persona")).toHaveValue("seller");
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await page.getByRole("button", { name: "Simulate shipment" }).click();
  await page.getByRole("button", { name: "Simulate delivery" }).click();
  await page.getByLabel("Demo persona").selectOption("buyer");
  await expect(page.getByLabel("Demo persona")).toHaveValue("buyer");
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.locator(".status-chip")).toContainText("delivered");
  await page.getByRole("button", { name: "Get help / return" }).click();
  await page.getByRole("button", { name: "Open my request" }).click();
  await expect(
    page.getByRole("heading", { name: "damaged · refund requested" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export test report" }).click();
  expect((await download).suggestedFilename()).toBe("dale-demo-report.json");
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto("/shop");
  expect(
    (
      await otherPage.request.post("/api/demo", {
        headers: { Origin: origin },
        data: { action: "persona", persona: "reviewer" },
      })
    ).status(),
  ).toBe(401);
  await other.close();
  await page.getByRole("button", { name: "Reset this scenario" }).click();
  await expect(page.getByLabel("Demo persona")).toHaveValue("buyer");
  await expect
    .poll(async () => {
      const data = await (await page.request.get("/api/session")).json();
      return data.actor?.workspaceId || first;
    })
    .not.toBe(first);
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
});
test("voice demo prepares actual matches, permits corrections and cannot authorize a payment", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await expect(page.getByLabel("Sample voice scenario")).toBeVisible();
  await page.getByRole("button", { name: "Play synthetic request" }).click();
  await expect(page.getByLabel("Maximum budget, USD")).toHaveValue("40");
  await expect(page.getByLabel("Looking for")).toHaveValue("chargers");
  await expect(page.getByLabel("Feature to prioritize")).toHaveValue("65W");
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill("Approve payment now");
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page.locator(".voice-reply")).toContainText(
    "Voice cannot approve",
  );
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill("Find headphones under forty dollars");
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page.getByLabel("Looking for")).toHaveValue("audio");
  await page.getByRole("button", { name: "Stop voice" }).click();
  await expect(page.locator(".voice-heading")).toContainText("Stopped");
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill("Show my orders");
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page).toHaveURL(/\/orders$/);
});
test("voice support draft prefills a chosen order but still needs explicit customer submission", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /^Return a delivered item/ }).click();
  await expect(page.getByLabel("Demo persona")).toHaveValue("buyer");
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await expect(page).toHaveURL(/\/support$/);
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill("I received the wrong item and want a replacement");
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page.getByLabel("Voice support draft")).toContainText(
    "wrong item",
  );
  expect(
    (await (await page.request.get("/api/session")).json()).cases,
  ).toHaveLength(0);
  await page
    .getByRole("button", { name: "Choose an order for this draft" })
    .click();
  await page.getByRole("button", { name: "Get help / return" }).click();
  await expect(page.getByLabel("What happened?")).toHaveValue("wrong_item");
  await expect(page.getByLabel("Your preferred resolution")).toHaveValue(
    "replacement",
  );
  await page.getByRole("button", { name: "Open my request" }).click();
  await expect(
    page.getByRole("heading", { name: "wrong item · replacement requested" }),
  ).toBeVisible();
  const snapshot = await (await page.request.get("/api/session")).json();
  expect(snapshot.cases).toHaveLength(1);
  expect(snapshot.cases[0].status).toBe("open");
  expect(snapshot.orders[0].status).toBe("delivered");
  expect(snapshot.orders[0].refundedAmount).toBe(0);
});
