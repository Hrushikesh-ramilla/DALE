// Real local Gemini + customer UI. No payment, provider mocks or existing-user data.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
if (!process.argv.includes("--live"))
  throw new Error("Pass --live for bounded live browser checks.");
const base = "http://localhost:3000";
let probeAttempts = 0;
try {
  probeAttempts = JSON.parse(
    await readFile(
      ".data/concierge-verification/latency/provider-experiment.json",
      "utf8",
    ),
  ).attempts;
} catch {}
let priorBrowserAttempts = 0,
  nativeAttempts = 0;
try {
  const previous = JSON.parse(
    await readFile(
      ".data/concierge-verification/latency/browser-live.json",
      "utf8",
    ),
  );
  priorBrowserAttempts =
    previous.cumulative_browser_attempts ??
    previous.results?.at(-1)?.attempts_so_far ??
    0;
} catch {}
try {
  await readFile(".data/concierge-verification/latency/native-comparison.json");
  nativeAttempts = 1;
} catch {}
const tabsOnly = process.argv.includes("--tabs-only");
const cap = tabsOnly
  ? 4
  : Math.min(6, 12 - probeAttempts - priorBrowserAttempts - nativeAttempts);
if (cap < 2)
  throw new Error("Insufficient verification attempt budget. No request sent.");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: base });
const page = await context.newPage();
const results = [];
await context.addInitScript(
  ({ cap }) => {
    const ledger = {
      attempts: 0,
      textAt: null,
      started: null,
      requests: [],
      stopped: false,
    };
    window.__daleLatency = ledger;
    const original = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (
        String(args[0]).endsWith("/api/copilot/chat") &&
        response.headers.get("content-type")?.includes("text/event-stream")
      ) {
        const clone = response.clone();
        void (async () => {
          const reader = clone.body.getReader(),
            decoder = new TextDecoder();
          let buffer = "";
          const stop = () => {
            ledger.stopped = true;
            [...document.querySelectorAll("button")]
              .find((b) => b.textContent.trim() === "Stop")
              ?.click();
          };
          try {
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              let end;
              while ((end = buffer.indexOf("\n\n")) >= 0) {
                const frame = buffer.slice(0, end);
                buffer = buffer.slice(end + 2);
                if (!frame.startsWith("data: ")) continue;
                const event = JSON.parse(frame.slice(6));
                if (event.type === "model.started") {
                  ledger.attempts++;
                  if (ledger.attempts > cap) stop();
                }
                if (
                  event.type === "assistant.delta" &&
                  event.text &&
                  ledger.textAt === null
                )
                  ledger.textAt = performance.now();
                if (event.type === "provider.wait") {
                  if (ledger.attempts >= cap) stop();
                  else ledger.attempts++;
                }
                if (
                  event.type === "model.finished" &&
                  event.has_tools &&
                  ledger.attempts >= cap
                )
                  stop();
                if (event.type === "request.completed")
                  ledger.requests.push({
                    timings: event.timings,
                    server_timing: response.headers.get("server-timing"),
                  });
              }
            }
          } catch {
          } finally {
            await reader.cancel().catch(() => {});
          }
        })();
      }
      return response;
    };
  },
  { cap },
);
try {
  const products = [];
  for (const query of ["Imagination", "Ombre Nomade"]) {
    const r = await context.request.get(
      `${base}/api/catalog?query=${encodeURIComponent(query)}`,
    );
    if (!r.ok()) throw new Error("Public catalog read failed.");
    const item = (await r.json()).products.find((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (!item) throw new Error("Public product sample unavailable.");
    products.push(item);
  }
  await page.goto(`/product/${products[0].id}`);
  await page.request.post(`${base}/api/copilot/state`, {
    data: { action: "start" },
    headers: { origin: base },
  });
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  async function task(label, prompt, observe) {
    await page.evaluate(() => {
      window.__daleLatency.started = performance.now();
      window.__daleLatency.textAt = null;
    });
    const started = performance.now();
    const requestOffset = await page.evaluate(
      () => window.__daleLatency.requests.length,
    );
    let effectMs = null;
    await page.getByLabel("Message DALE").fill(prompt);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    let state;
    for (;;) {
      if (effectMs === null && (await observe()))
        effectMs = performance.now() - started;
      const response = await context.request.get(`${base}/api/copilot/state`);
      state = response.ok() ? await response.json() : null;
      if (
        state?.messages.some((m) => m.sender === "user" && m.text === prompt) &&
        ["completed", "failed", "canceled"].includes(state.turn?.status)
      )
        break;
      if (performance.now() - started > 120000) {
        await page
          .getByRole("button", { name: "Stop", exact: true })
          .click()
          .catch(() => {});
        throw new Error("Live task exceeded its verification deadline.");
      }
      await page.waitForTimeout(150);
    }
    if (effectMs === null && (await observe()))
      effectMs = performance.now() - started;
    const ledger = await page.evaluate(() => window.__daleLatency);
    results.push({
      label,
      total_ms: performance.now() - started,
      first_effect_ms: effectMs,
      first_text_ms:
        ledger.textAt === null ? null : ledger.textAt - ledger.started,
      status: state.turn?.status,
      error: state.turn?.error,
      passed: state.turn?.status === "completed" && effectMs !== null,
      attempts_so_far: ledger.attempts,
      requests: ledger.requests.slice(requestOffset),
    });
    if (!results.at(-1).passed)
      throw new Error(
        state.turn?.error ||
          "Live task did not complete with the correct observed effect.",
      );
    await page.getByLabel("Message DALE").waitFor({ state: "visible" });
  }
  if (!tabsOnly)
    await task(
      "add-two-and-show-real-cart",
      "Add two of this product to my cart and show me the cart. Do not check out or pay.",
      async () =>
        page.url().endsWith("/cart") &&
        (await page.locator(`[data-product-id="${products[0].id}"]`).count()) >
          0 &&
        (
          await (await context.request.get(`${base}/api/copilot/state`)).json()
        ).basket.cart.some(
          (item) => item.productId === products[0].id && item.quantity === 2,
        ),
    );
  const origin = page.url();
  await task(
    "open-two-real-browser-tabs",
    `Open ${products[0].name} and ${products[1].name} in separate new browser tabs. Keep this original page open.`,
    async () => {
      const children = context.pages().filter((p) => p !== page);
      return (
        page.url() === origin &&
        (await Promise.all(
          products.map(async (product) => {
            for (const child of children)
              if (
                await child
                  .locator(`.pdp-page[data-product-id="${product.id}"]`)
                  .count()
              )
                return true;
            return false;
          }),
        ).then((values) => values.every(Boolean)))
      );
    },
  );
} catch (error) {
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await mkdir(".data/concierge-verification/latency", { recursive: true });
  await writeFile(
    `.data/concierge-verification/latency/${tabsOnly ? "browser-tabs-followup" : "browser-live"}.json`,
    JSON.stringify(
      {
        scope:
          "Bounded live customer tasks, not a percentile benchmark or matched old-build comparison",
        provider: "gemini",
        cap,
        followup: tabsOnly,
        cumulative_browser_attempts:
          priorBrowserAttempts + (results.at(-1)?.attempts_so_far || 0),
        results,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify(
      results.map((result) => ({
        label: result.label,
        total_ms: result.total_ms,
        first_effect_ms: result.first_effect_ms,
        first_text_ms: result.first_text_ms,
        status: result.status,
        error: result.error,
        passed: result.passed,
        attempts_so_far: result.attempts_so_far,
      })),
    ),
  );
  await browser.close();
}
