import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const directory = ".data/concierge-verification";
// Keep earlier failures and screenshots before replacing the latest receipt.
const archive = `${directory}/camera-history/${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
await mkdir(archive, { recursive: true });
for (const name of [
  "camera-buyer-live.json",
  "camera-buyer-live.log",
  "camera-buyer-live-current.log",
  "camera-live-100x.png",
  "camera-live-optical.png",
  "camera-regression-report.html",
  "camera-quota.json",
])
  await copyFile(`${directory}/${name}`, `${archive}/${name}`).catch(
    (error) => {
      if (error.code !== "ENOENT") throw error;
    },
  );
const browser = await chromium.launch({ headless: true });
const checks = [];
const build = JSON.parse(await readFile(".next/preview-build.json", "utf8"));
const base = "http://localhost:3000";
let inference;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/department/electronics`);
  const started = await context.request.post(`${base}/api/copilot/state`, {
    data: { action: "start" },
    headers: { origin: base },
  });
  if (!started.ok()) throw new Error("Guest session could not be started.");
  inference = (await started.json()).inference;
  if (
    inference?.provider !== "gemini" ||
    inference.model !== "gemini-3.5-flash"
  )
    throw new Error(
      "Camera verification requires the authorized full gemini-3.5-flash model. No generation requested.",
    );
  const candidatesResponse = await context.request.get(
    `${base}/api/copilot/search?filters=${encodeURIComponent(JSON.stringify({ categories: ["phones"], attributes: { digitalZoomMaxX: { min: 100 } }, limit: 12 }))}`,
  );
  if (!candidatesResponse.ok())
    throw new Error("Recorded camera facts could not be read.");
  const candidates = (await candidatesResponse.json()).products;
  if (!candidates.length)
    throw new Error(
      "No catalog phone has recorded 100x digital zoom evidence.",
    );
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  async function turn(message, label) {
    await page.getByLabel("Message DALE").fill(message);
    const answered = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/copilot/chat" &&
        r.request().method() === "POST",
      { timeout: 180000 },
    );
    const start = Date.now();
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    // The customer client now streams and can resume after UI receipts. Observe
    // the saved terminal turn instead of treating the first SSE POST as JSON.
    const response = await answered;
    const turnId = response.request().postDataJSON().turn_id;
    let view;
    for (;;) {
      const state = await context.request.get(`${base}/api/copilot/state`);
      if (!state.ok())
        throw new Error(
          `Saved customer state returned HTTP ${state.status()}.`,
        );
      view = await state.json();
      if (
        view.turn?.id === turnId &&
        ["completed", "failed", "canceled"].includes(view.turn.status)
      )
        break;
      if (Date.now() - start > 180000) {
        await page
          .getByRole("button", { name: "Stop", exact: true })
          .click()
          .catch(() => {});
        throw new Error(
          "Camera verification exceeded its deadline; the customer task was stopped.",
        );
      }
      await delay(800);
    }
    inference = view.inference;
    const user = view.messages.findLastIndex(
      (m) => m.sender === "user" && m.id === view.turn?.id,
    );
    const reply = (user < 0 ? [] : view.messages.slice(user + 1))
      .filter((m) => m.sender === "assistant")
      .at(-1);
    if (reply?.text)
      await page
        .locator(`[data-message-id="${reply.id}"] .dale-msg-bubble`)
        .waitFor({ state: "visible" });
    const elapsedMs = Date.now() - start;
    const normalize = (text) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const text = normalize(reply?.text || "");
    // Internal RAG reads intentionally do not create product cards. Verify the
    // named recommendation against current catalog facts without adding cards.
    const referenced = candidates.filter((p) => {
      const model = normalize(p.modelName || p.attributes?.modelName || "");
      return model && text.includes(model);
    });
    await page.screenshot({ path: `${directory}/camera-live-${label}.png` });
    const result = {
      message,
      elapsedMs,
      status: view.turn?.status,
      error: view.turn?.error,
      reply: reply?.text,
      referencedProducts: referenced.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        attributes: p.attributes,
        source: p.source,
      })),
      products: view.products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        attributes: p.attributes,
        source: p.source,
      })),
      view,
    };
    console.log(JSON.stringify({ ...result, view: undefined }));
    return result;
  }
  const camera = await turn(
    "hey which do you think is the best mobile for camera which can zoom 100x",
    "100x",
  );
  checks.push({
    ...camera,
    view: undefined,
    passed:
      camera.status === "completed" &&
      inference?.provider === "gemini" &&
      inference?.model === "gemini-3.5-flash" &&
      camera.referencedProducts.length > 0 &&
      [...camera.products, ...camera.referencedProducts].every(
        (p) =>
          p.category === "phones" &&
          Number(p.attributes?.digitalZoomMaxX) >= 100,
      ) &&
      /100\s*[x×]/i.test(camera.reply || "") &&
      /digital/i.test(camera.reply || "") &&
      /optical/i.test(camera.reply || "") &&
      !/100\s*[x×]\s+optical/i.test(
        (camera.reply || "").replace(/not\s+100\s*[x×]\s+optical/gi, ""),
      ) &&
      camera.view.basket.cart.length === 0,
  });
  if (camera.status === "completed") {
    await delay(15000);
    const optical = await turn(
      "I mean at least 100x optical zoom, not digital. Which of those actually meets that requirement? Do not offer accessories or silently reduce the requirement.",
      "optical",
    );
    const clear = (optical.reply || "").replace(/\*|_/g, "");
    checks.push({
      ...optical,
      view: undefined,
      passed:
        optical.status === "completed" &&
        inference?.provider === "gemini" &&
        inference?.model === "gemini-3.5-flash" &&
        optical.products.every((p) => p.category === "phones") &&
        /no|none|not|cannot|can't|doesn.t|don.t|unverified|unable/i.test(
          clear,
        ) &&
        /optical/i.test(clear) &&
        !optical.products.some(
          (p) => Number(p.attributes?.opticalZoomMaxX) >= 100,
        ) &&
        optical.view.basket.cart.length === 0,
    });
  }
} catch (error) {
  checks.push({ passed: false, error: String(error) });
} finally {
  await browser.close();
}
const report = {
  at: new Date().toISOString(),
  build: build.commit,
  inference,
  scope:
    "Actual local production browser and configured Gemini. Fresh independent guest, exact screenshot request plus stricter contextual optical correction. No inference mocks, payment calls or catalog writes.",
  evidenceScope:
    "The named recommendation is checked against current catalog facts. Internal retrieval candidates are not displayed as cards. This verifies the two customer-visible answers, not whether Gemini performed a native catalog lookup or every ancillary claim in its prose.",
  passed: checks.length === 2 && checks.every((c) => c.passed),
  checks,
};
await writeFile(
  `${directory}/camera-buyer-live.json`,
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    passed: report.passed,
    checks: checks.map((c) => ({
      passed: c.passed,
      message: c.message,
      elapsedMs: c.elapsedMs,
      error: c.error,
    })),
  }),
);
if (!report.passed) process.exitCode = 1;
