import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Uses the already configured local server. No credentials are read or printed.
// Run only against the owner's billing-disabled/free-quota configuration.
const base = "http://localhost:3000";
const report = {
  checkedAt: new Date().toISOString(),
  base,
  provider: null,
  model: null,
  checks: [],
  error: null,
};
await mkdir(".data/concierge-verification", { recursive: true });
const browser = await chromium.launch();
try {
  const readyUntil = Date.now() + 60000;
  for (;;) {
    const ready = await fetch(`${base}/api/health`, {signal: AbortSignal.timeout(10000)}).then(r=>r.ok).catch(()=>false);
    if (ready) break;
    if (Date.now() > readyUntil) throw new Error("Local preview did not become healthy within 60 seconds.");
    await new Promise(r=>setTimeout(r,1000));
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/department/electronics`);
  const started = await context.request.post(`${base}/api/copilot/state`, {
    headers: { Origin: base },
    data: { action: "start" },
  });
  if (!started.ok())
    throw new Error(`Session initialization returned ${started.status()}.`);
  const initial = await started.json();
  report.provider = initial.inference.provider;
  report.model = initial.inference.model;
  if (report.provider !== "gemini")
    throw new Error(
      "This acceptance run requires the configured Gemini provider.",
    );
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  async function search(filters) {
    const r = await context.request.get(
      `${base}/api/copilot/search?filters=${encodeURIComponent(JSON.stringify({ ...filters, limit: 1 }))}`,
    );
    if (!r.ok())
      throw new Error(`Catalog precondition returned ${r.status()}.`);
    const result = await r.json();
    if (!result.products?.length)
      throw new Error("A required published test product is unavailable.");
    return result.products[0];
  }
  async function ask(text, check) {
    const previous = (
      await (await context.request.get(`${base}/api/copilot/state`)).json()
    ).turn?.id;
    const start = Date.now();
    await page.getByLabel("Message DALE").fill(text);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    let state;
    for (;;) {
      if (Date.now() - start > 180000)
        throw new Error("Live action journey timed out.");
      state = await (
        await context.request.get(`${base}/api/copilot/state`)
      ).json();
      if (
        state.turn?.id !== previous &&
        ["completed", "failed", "canceled"].includes(state.turn?.status)
      )
        break;
      if (
        state.actions?.some((a) => a.outcome && a.operation.type === "tabs")
      ) {
        const recovery = page.getByRole("button", {
          name: "Open requested tabs",
          exact: true,
        });
        if (await recovery.isVisible()) await recovery.click();
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    const passed = state.turn.status === "completed" && (await check(state));
    report.checks.push({
      request: text,
      passed,
      latencyMs: Date.now() - start,
      calls: state.turn.calls,
      turnStatus: state.turn.status,
      error: state.turn.error || null,
      reply: state.messages.at(-1)?.text,
      url: page.url(),
      basket: state.basket.cart.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
      receipts: state.receipts.slice(-3),
    });
    if (!passed)
      throw new Error(
        state.turn.error ||
          "The model finished without the requested observed effect.",
      );
  }
  const fragrance = await search({
    categories: ["fragrance"],
    brands: ["Louis Vuitton"],
    query: "Imagination",
    match_mode: "identity",
  });
  await ask(
    `Please take me straight to the listing for ${fragrance.name}.`,
    async () =>
      page.url().endsWith(`/product/${fragrance.id}`) &&
      (await page.locator(".pdp-page").getAttribute("data-product-id")) ===
        fragrance.id,
  );
  await ask(
    "Put two of this exact bottle in my cart, then show me the cart.",
    async (state) =>
      new URL(page.url()).pathname === "/cart" &&
      state.basket.cart.some(
        (i) => i.productId === fragrance.id && i.quantity === 2,
      ),
  );
  const apple = await search({
    categories: ["phones"],
    brands: ["Apple"],
    query: "",
    in_stock: false,
  });
  const samsung = await search({
    categories: ["phones"],
    brands: ["Samsung"],
    query: "",
    in_stock: false,
  });
  await ask(
    `Open ${apple.name} in one new browser tab and ${samsung.name} in another. Keep this cart page here.`,
    async (state) => {
      const targets = state.receipts
        .filter(
          (a) => a.turnId === state.turn.id && a.operation.type === "tabs",
        )
        .flatMap((a) => a.targets || []);
      const rendered = await Promise.all(
        context
          .pages()
          .filter((p) => p !== page)
          .map((p) => p.locator(".pdp-page").getAttribute("data-product-id")),
      );
      return (
        new URL(page.url()).pathname === "/cart" &&
        targets.length === 2 &&
        targets.every((t) => t.status === "ready") &&
        rendered.includes(apple.id) &&
        rendered.includes(samsung.id)
      );
    },
  );
  await page.screenshot({
    path: resolve(".data/concierge-verification/live-website-actions.png"),
    fullPage: false,
  });
} catch (e) {
  report.error = e instanceof Error ? e.message : "Live verification failed.";
  process.exitCode = 1;
} finally {
  await browser.close();
  await mkdir(".data/concierge-verification", { recursive: true });
  await writeFile(
    ".data/concierge-verification/live-website-actions.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      provider: report.provider,
      model: report.model,
      checks: report.checks.map((c) => ({
        passed: c.passed,
        latencyMs: c.latencyMs,
        calls: c.calls,
      })),
      error: report.error,
    }),
  );
}
