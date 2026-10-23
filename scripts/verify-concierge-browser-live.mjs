import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Real local inference, browser, and persistent application services. No provider
// interception, payment calls, or predefined product IDs. Run after the local launcher.
const base = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const checks = [];
const started = Date.now();
try {
  const filters = { categories: ["headphones"], sort: "price_asc", limit: 1 };
  const response = await context.request.get(
    `${base}/api/copilot/search?filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );
  if (!response.ok()) throw new Error("Live catalog request failed");
  const product = (await response.json()).products[0];
  if (!product)
    throw new Error("No independently selected live product available");
  await page.goto(`${base}/search`);
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  async function turn(message) {
    const at = Date.now();
    await page.getByLabel("Message DALE").fill(message);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    let view;
    // The application may suspend for a browser receipt and resume a new bounded
    // inference request. Measure the complete journey rather than stopping after
    // one request's time budget. Long latency remains visible in the report.
    while (Date.now() - at < 420000) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const result = await context.request.get(`${base}/api/copilot/state`);
      if (!result.ok())
        throw new Error(
          `Owned state unavailable (HTTP ${result.status()}); no model outcome claimed.`,
        );
      view = await result.json();
      if (
        view.messages.some((m) => m.sender === "user" && m.text === message) &&
        ["completed", "failed", "canceled"].includes(view.turn?.status)
      )
        break;
    }
    if (!view) throw new Error("No owned turn state observed");
    return {
      elapsedMs: Date.now() - at,
      status: view.turn?.status,
      error: view.turn?.error,
      reply: view.messages.filter((m) => m.sender === "assistant").at(-1)?.text,
      view,
    };
  }
  const lookup = await turn(
    `Check whether you carry ${product.name}. Give me its recorded offer price and source link. Do not purchase it.`,
  );
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price / 100);
  checks.push({
    capability: "live catalog lookup through browser and native model",
    productId: product.id,
    expectedPrice: money,
    elapsedMs: lookup.elapsedMs,
    status: lookup.status,
    error: lookup.error,
    reply: lookup.reply,
    passed:
      lookup.status === "completed" &&
      lookup.reply?.includes(money) &&
      lookup.view.products.some((p) => p.id === product.id),
  });
  if (lookup.status === "completed") {
    const add = await turn(
      "Add that same item to my cart, quantity one. Do not prepare checkout or make any payment.",
    );
    const item = add.view.basket.cart.find((i) => i.productId === product.id);
    checks.push({
      capability: "contextual reference and persistent cart mutation",
      elapsedMs: add.elapsedMs,
      status: add.status,
      error: add.error,
      reply: add.reply,
      cart: add.view.basket.cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      passed:
        add.status === "completed" &&
        item?.quantity === 1 &&
        add.view.confirmations.length === 0,
    });
    await page.reload();
    const reloaded = await (
      await context.request.get(`${base}/api/copilot/state`)
    ).json();
    checks.push({
      capability: "browser reload preserves actual cart",
      passed: reloaded.basket.cart.some(
        (i) => i.productId === product.id && i.quantity === 1,
      ),
    });
    await page.getByRole("button", { name: "Open DALE assistant" }).click();
    await page.getByRole("complementary", { name: "DALE assistant" }).waitFor();
  }
  await page.screenshot({
    path: ".data/concierge-verification/live-browser.png",
    fullPage: false,
  });
} catch (error) {
  checks.push({
    passed: false,
    error: error instanceof Error ? error.message : "Live browser check failed",
  });
} finally {
  await browser.close();
}
await mkdir(".data/concierge-verification", { recursive: true });
const report = {
  at: new Date().toISOString(),
  elapsedMs: Date.now() - started,
  provider: "self_hosted",
  transport: "actual browser and production HTTP; no inference mocks",
  checks,
  scope:
    "Two functional live-model checks and reload persistence only; not performance, generalization or production acceptance.",
  functionalJourneyPassed: checks.length >= 3 && checks.every((c) => c.passed),
};
await writeFile(
  ".data/concierge-verification/live-browser.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.functionalJourneyPassed) process.exitCode = 1;
