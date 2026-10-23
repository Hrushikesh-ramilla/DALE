import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const base = "http://localhost:3000";
const checks = [];
try {
  await page.goto(`${base}/department/electronics`);
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  async function turn(message, label) {
    const start = Date.now();
    let firstResultMs = null;
    await page.getByLabel("Message DALE").fill(message);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    let view;
    while (Date.now() - start < 180000) {
      await new Promise((done) => setTimeout(done, 1000));
      const response = await context.request.get(`${base}/api/copilot/state`);
      if (!response.ok()) continue;
      view = await response.json();
      if (!view.messages.some((m) => m.sender === "user" && m.text === message))
        continue;
      if (firstResultMs === null && view.catalog_match_status)
        firstResultMs = Date.now() - start;
      if (["completed", "failed", "canceled"].includes(view.turn?.status))
        break;
    }
    const reply = view?.messages
      .filter((m) => m.sender === "assistant")
      .at(-1)?.text;
    await page.screenshot({
      path: `.data/concierge-verification/buyer-browser-${label}.png`,
    });
    return {
      message,
      elapsedMs: Date.now() - start,
      firstResultMs,
      status: view?.turn?.status,
      error: view?.turn?.error,
      reply,
      view,
    };
  }
  const absent = await turn("get me lv imagination perfume", "lv");
  checks.push({
    ...absent,
    view: undefined,
    products: absent.view?.products.map((p) => ({ id: p.id, name: p.name })),
    passed:
      absent.status === "completed" &&
      absent.view.catalog_match_status === "not_found" &&
      absent.view.products.length === 0 &&
      /not|no|couldn.t|unable/i.test(absent.reply || ""),
  });
  const omega = await turn(
    "get me omega peedmater and wat the cost ??",
    "omega",
  );
  checks.push({
    ...omega,
    view: undefined,
    products: omega.view?.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    passed:
      omega.status === "completed" &&
      omega.view.catalog_match_status === "choose_variant" &&
      omega.view.products.length > 0 &&
      omega.view.products.every(
        (p) => p.brand === "Omega" && /Speedmaster/i.test(p.name),
      ) &&
      /which|choose|variant|options/i.test(omega.reply || ""),
  });
  const response = await context.request.get(
    `${base}/api/copilot/search?filters=${encodeURIComponent(JSON.stringify({ categories: ["fragrance"], offset: 7, limit: 1 }))}`,
  );
  const product = (await response.json()).products?.[0];
  if (!product) throw new Error("Independent fragrance sample unavailable");
  const exact = await turn(
    `Do you have ${product.name}, and what does it cost?`,
    "fragrance",
  );
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price / 100);
  checks.push({
    ...exact,
    view: undefined,
    expectedId: product.id,
    expectedPrice: price,
    products: exact.view?.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    passed:
      exact.status === "completed" &&
      exact.view.products.length === 1 &&
      exact.view.products[0].id === product.id &&
      exact.reply?.includes(price),
  });
} catch (error) {
  checks.push({ passed: false, error: String(error) });
} finally {
  await browser.close();
}
const report = {
  at: new Date().toISOString(),
  scope:
    "Actual production browser, private self-hosted model and owned persisted application state. No provider interception or payment calls.",
  passed: checks.every((c) => c.passed),
  checks,
};
await writeFile(
  ".data/concierge-verification/buyer-browser.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
