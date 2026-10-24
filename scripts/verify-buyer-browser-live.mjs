import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
const qualityOnly = process.argv.includes("--quality-only");
const quality = process.argv.includes("--gemini-quality") || qualityOnly;
const paceMs = quality ? 15000 : 0;
const requestTimeout = Number(
  process.argv
    .find((arg) => arg.startsWith("--request-timeout-ms="))
    ?.split("=")[1] || 180000,
);
if (
  !Number.isFinite(requestTimeout) ||
  requestTimeout < 1000 ||
  requestTimeout > 180000
)
  throw new Error(
    "Request timeout must be between 1000 and 180000 milliseconds.",
  );
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
if (process.argv.includes("--trace-network")) {
  page.on("request", (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith("/api/copilot/"))
      console.log(
        JSON.stringify({ event: "browser.request", method: r.method(), path }),
      );
  });
  page.on("response", (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith("/api/copilot/"))
      console.log(
        JSON.stringify({ event: "browser.response", status: r.status(), path }),
      );
  });
  page.on("pageerror", (e) =>
    console.log(JSON.stringify({ event: "browser.error", error: e.message })),
  );
}
const base = "http://localhost:3000";
const checks = [];
let inference;
await page.addInitScript(() => {
  const NativeEvents = globalThis.EventSource;
  globalThis.EventSource = class extends NativeEvents {
    constructor(...args) {
      super(...args);
      this.addEventListener("state", (event) => {
        try {
          const timing = globalThis.__buyerTiming;
          const view = JSON.parse(event.data);
          if (
            timing &&
            timing.firstResultMs === null &&
            view.catalog_match_status &&
            view.messages.some(
              (m) => m.sender === "user" && m.text === timing.message,
            )
          )
            timing.firstResultMs = Math.round(performance.now() - timing.start);
        } catch {
          /* Ordinary UI errors are checked through the actual chat response. */
        }
      });
    }
  };
});
try {
  await page.goto(`${base}/department/electronics`);
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  async function turn(message, label) {
    if (paceMs) await delay(paceMs);
    await page.getByLabel("Message DALE").fill(message);
    const start = Date.now();
    await page.evaluate((message) => {
      globalThis.__buyerTiming = {
        message,
        start: performance.now(),
        firstResultMs: null,
      };
    }, message);
    const answered = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/copilot/chat" &&
        response.request().method() === "POST",
      { timeout: requestTimeout },
    );
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    const response = await answered;
    const view = await response.json();
    inference = view?.inference;
    const httpCompleteMs = Date.now() - start;
    const userIndex =
      view?.messages?.findLastIndex(
        (m) => m.sender === "user" && m.id === view.turn?.id,
      ) ?? -1;
    const assistant = (userIndex < 0 ? [] : view.messages.slice(userIndex + 1))
      .filter((m) => m.sender === "assistant")
      .at(-1);
    const reply = assistant?.text;
    if (reply)
      await page
        .locator(`[data-message-id="${assistant.id}"] .dale-msg-bubble`)
        .waitFor({ state: "visible", timeout: 10000 });
    const elapsedMs = Date.now() - start;
    const firstResultMs = await page.evaluate(
      () => globalThis.__buyerTiming?.firstResultMs ?? null,
    );
    console.log(
      JSON.stringify({
        event: "buyer.browser.turn",
        message,
        elapsedMs,
        status: view?.turn?.status,
        provider: inference?.provider,
        reply,
      }),
    );
    await page.screenshot({
      path: `.data/concierge-verification/buyer-browser-${quality ? "gemini-" : ""}${label}.png`,
    });
    return {
      message,
      elapsedMs,
      httpCompleteMs,
      firstResultMs,
      status: view?.turn?.status,
      error: view?.turn?.error,
      reply,
      view,
    };
  }
  if (!qualityOnly) {
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
    const saved = await turn(
      "Save that exact fragrance to my wishlist. Do not add it to my cart.",
      "wishlist",
    );
    checks.push({
      ...saved,
      view: undefined,
      passed:
        saved.status === "completed" &&
        saved.view.basket.wishlist.some(
          (item) => item.productId === product.id,
        ) &&
        saved.view.basket.cart.length === 0,
    });
    const moved = await turn(
      "Move that fragrance from my wishlist to my cart, quantity one. Do not checkout.",
      "cart",
    );
    checks.push({
      ...moved,
      view: undefined,
      passed:
        moved.status === "completed" &&
        !moved.view.basket.wishlist.some(
          (item) => item.productId === product.id,
        ) &&
        moved.view.basket.cart.some(
          (item) => item.productId === product.id && item.quantity === 1,
        ) &&
        moved.view.confirmations.length === 0,
    });
    await page.reload();
    const persisted = await (
      await context.request.get(`${base}/api/copilot/state`)
    ).json();
    checks.push({
      message: "Reload preserves actual cart and wishlist changes",
      elapsedMs: 0,
      passed:
        persisted.basket.cart.some(
          (item) => item.productId === product.id && item.quantity === 1,
        ) &&
        !persisted.basket.wishlist.some(
          (item) => item.productId === product.id,
        ),
    });
  }
  if (quality) {
    const opener = page.getByRole("button", { name: "Open DALE assistant" });
    if (await opener.isVisible()) await opener.click();
    const preference = await turn(
      "hmm any tom forb that smells like baby powder",
      "preferences",
    );
    await page.getByText("Powered by Gemini", { exact: true }).waitFor();
    checks.push({
      ...preference,
      view: undefined,
      products: preference.view.products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        description: p.description,
      })),
      passed:
        preference.status === "completed" &&
        preference.view.inference?.provider === "gemini" &&
        (preference.view.products.length > 0 ||
          (/tom ford/i.test(preference.reply || "") &&
            /not|no|cannot|can't|unavailable|don't/i.test(
              preference.reply || "",
            ))) &&
        preference.view.products.every(
          (p) =>
            p.brand.toLowerCase() === "tom ford" && p.category === "fragrance",
        ) &&
        !/tom forrest/i.test(preference.reply || "") &&
        !/\bitem:\d+\b/i.test(preference.reply || "") &&
        /powder|soft|talc|iris|cosmetic|musk|suede/i.test(
          preference.reply || "",
        ),
    });
    const explanation = await turn(
      "What does powdery mean in a perfume? Explain casually, I'm new to fragrances.",
      "conversation",
    );
    checks.push({
      ...explanation,
      view: undefined,
      passed:
        explanation.status === "completed" &&
        /soft|talc|powder|makeup|cosmetic/i.test(explanation.reply || "") &&
        explanation.reply.length > 100 &&
        JSON.stringify(explanation.view.basket) ===
          JSON.stringify(preference.view.basket),
    });
  }
} catch (error) {
  await page
    .screenshot({
      path: ".data/concierge-verification/buyer-browser-gemini-error.png",
    })
    .catch(() => undefined);
  checks.push({ passed: false, error: String(error) });
} finally {
  await browser.close();
}
const report = {
  at: new Date().toISOString(),
  inference,
  paceMs,
  scope:
    "Actual production browser, configured model and owned persisted application state. No provider interception or payment calls. Optional pacing happens before the click timer, to respect free API rate limits.",
  passed: checks.every((c) => c.passed),
  latency: {
    targetMs: 1000,
    measurement:
      "Click-to-visible complete response, excluding typing and screenshot encoding. httpCompleteMs is measured directly from the actual POST response; no one-second polling quantization. firstResultMs is a real committed-state SSE event, when observed.",
    measuredCases: checks.filter((c) => c.elapsedMs > 0).length,
    withinTarget: checks.filter(
      (c) =>
        c.passed &&
        c.status === "completed" &&
        c.elapsedMs > 0 &&
        c.elapsedMs < 1000,
    ).length,
    allWithinTarget:
      checks.some((c) => c.elapsedMs > 0) &&
      checks
        .filter((c) => c.elapsedMs > 0)
        .every(
          (c) => c.passed && c.status === "completed" && c.elapsedMs < 1000,
        ),
  },
  checks,
};
await writeFile(
  `.data/concierge-verification/buyer-browser${quality ? "-gemini" : ""}${qualityOnly ? "-quality-only" : ""}.json`,
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
