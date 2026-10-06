import { test, expect, type Page } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start shopping" }).click();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Shopper · Sign out" }),
  ).toBeVisible();
}
async function buy(page: Page) {
  await page.getByRole("button", { name: "Review purchase" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("$29.00");
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await expect(
    page.getByText("Fixture payment recorded.", { exact: false }),
  ).toBeVisible();
}
test("customer purchase, evidence, operator refund, and persistent status", async ({
  page,
  browser,
}) => {
  await start(page);
  await buy(page);
  const session = await (await page.request.get("/api/session")).json();
  const sellerContext = await browser.newContext();
  const seller = await sellerContext.newPage();
  await seller.goto("/");
  await seller.getByRole("button", { name: "Operator workspace" }).click();
  await seller
    .getByLabel("Customer workspace ID")
    .fill(session.actor.workspaceId);
  await seller.getByLabel("Operator access code").fill("e2e-operator");
  await seller.getByRole("button", { name: "Enter workspace" }).click();
  await seller.getByRole("button", { name: "Record dispatch" }).click();
  await seller.getByLabel("Item serial / identifier").fill("SER-101");
  await seller
    .getByLabel("What does this record show?")
    .fill("Recorded condition before dispatch.");
  await seller.getByRole("button", { name: "Record evidence" }).click();
  await seller.getByRole("button", { name: "Simulate shipment" }).click();
  await seller.getByRole("button", { name: "Simulate delivery" }).click();
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.locator(".status-chip")).toHaveText("delivered");
  await page.getByRole("button", { name: "Get help / return" }).click();
  await page.getByRole("button", { name: "Open my request" }).click();
  await expect(
    page.getByRole("heading", { name: "damaged · refund requested" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add your evidence" }).click();
  await page.getByLabel("Item serial / identifier").fill("SER-101");
  await page
    .getByLabel("What does this record show?")
    .fill("The housing arrived cracked.");
  await page
    .getByRole("button", { name: "Get capture code (optional)" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Capture code:");
  await page.getByLabel("Photo (optional, up to 4 MB)").setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Record evidence" }).click();
  const original = await page
    .getByRole("link", { name: "View original image" })
    .getAttribute("href");
  expect((await page.request.get(original!)).headers()["content-type"]).toBe(
    "image/png",
  );
  const reportURL = await page
    .getByRole("link", { name: "Download private case report" })
    .getAttribute("href");
  const report = await (await page.request.get(reportURL!)).json();
  expect(
    report.submittedRecords.some(
      (r: { integrity: string; provenance: { source: string } }) =>
        r.integrity === "verified_at_export" &&
        r.provenance.source === "challenge_associated_upload",
    ),
  ).toBe(true);
  expect(report.transactionRecords.adapter).toBe("fixture");
  await page.getByRole("button", { name: "Review evidence" }).click();
  await expect(page.locator(".analysis-panel")).toContainText(
    "cannot be established",
  );
  const reviewerContext = await browser.newContext();
  const reviewer = await reviewerContext.newPage();
  await reviewer.goto("/");
  await reviewer.getByRole("button", { name: "Operator workspace" }).click();
  await reviewer
    .getByRole("combobox", { name: /^Role/ })
    .selectOption("reviewer");
  await reviewer
    .getByLabel("Customer workspace ID")
    .fill(session.actor.workspaceId);
  await reviewer.getByLabel("Operator access code").fill("e2e-operator");
  await reviewer.getByRole("button", { name: "Enter workspace" }).click();
  await reviewer.getByRole("button", { name: "Support", exact: true }).click();
  await reviewer
    .getByRole("button", { name: "Approve requested refund" })
    .click();
  await reviewer
    .getByLabel("Reason and customer policy")
    .fill(
      "Customer damage policy: refund approved after reviewing the recorded evidence.",
    );
  await reviewer.getByRole("button", { name: "Authorize refund" }).click();
  await expect(reviewer.locator(".status-chip")).toHaveText("resolved");
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.locator(".status-chip")).toHaveText("refunded");
  await expect(
    page.getByText("Fixture refund completed.", { exact: false }),
  ).toBeVisible();
  await sellerContext.close();
  await reviewerContext.close();
});
test("two shoppers unlock a discount with private individual checkout", async ({
  page,
  browser,
}) => {
  await start(page);
  await page
    .getByRole("button", {
      name: "Join group deal for Everyday USB-C Charger",
      exact: true,
    })
    .click();
  const first = await (await page.request.get("/api/session")).json();
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  await second.goto("/");
  await second.getByRole("button", { name: "Start shopping" }).click();
  await second.getByLabel("Group invitation").fill(first.invite);
  await second.getByRole("button", { name: "Enter workspace" }).click();
  await second
    .getByRole("button", {
      name: "Join group deal for Everyday USB-C Charger",
      exact: true,
    })
    .click();
  await expect(second.getByText("DISCOUNT UNLOCKED")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Group deals", exact: true }).click();
  await page.getByRole("button", { name: "Review group purchase" }).click();
  await expect(page.getByRole("dialog")).toContainText("$26.10");
  await page
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await second.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(second.getByText("A good find is waiting")).toBeVisible();
  await secondContext.close();
});
test("checks a suspicious message and refuses a forged approval", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Something feel off?" }).click();
  await page
    .getByLabel("Seller message")
    .fill(
      "Send your verification code and pay with gift cards immediately or your account will be suspended",
    );
  await page.getByRole("button", { name: "Check this message" }).click();
  await expect(
    page.getByText("Pause and verify", { exact: true }),
  ).toBeVisible();
  const response = await page.request.post("/api/actions", {
    headers: { Origin: origin },
    data: { action: "quote", productId: "P001", model: "Atlas 14" },
  });
  const data = await response.json();
  const forged = await page.request.post("/api/actions", {
    headers: { Origin: origin },
    data: {
      action: "checkout",
      quoteId: data.result.id,
      fingerprint: "0".repeat(64),
    },
  });
  expect(forged.status()).toBe(400);
});
test("mobile storefront and compatibility search", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page.getByLabel("Your device").selectOption("Slate 11");
  await page.getByRole("button", { name: "Find my match" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Precision Barrel Charger",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Everyday USB-C Charger", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".data/reports/mobile-storefront.png",
    fullPage: true,
  });
});

test("changed brief revokes a previous unpaid approval and persists preferences", async ({
  page,
}) => {
  await start(page);
  const headers = { Origin: origin };
  const quote = (
    await (
      await page.request.post("/api/actions", {
        headers,
        data: { action: "quote", productId: "P001", model: "Atlas 14" },
      })
    ).json()
  ).result;
  await page.getByLabel("Feature to prioritize").fill("100W");
  await page.getByLabel("Rank by").selectOption("features");
  await page.getByRole("button", { name: "Find my match" }).click();
  await expect(page.locator(".product-card").first()).toContainText(
    "Power USB-C Charger",
  );
  const old = await page.request.post("/api/actions", {
    headers,
    data: {
      action: "checkout",
      quoteId: quote.id,
      fingerprint: quote.fingerprint,
    },
  });
  expect(old.status()).toBe(400);
  expect((await old.json()).error).toContain("brief changed");
  await page.reload();
  await expect(page.getByLabel("Feature to prioritize")).toHaveValue("100W");
  await expect(page.getByLabel("Rank by")).toHaveValue("features");
  await expect(page.locator(".product-card").first()).toContainText(
    "Power USB-C Charger",
  );
});
