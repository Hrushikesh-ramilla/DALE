import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const directory = ".data/concierge-verification";
const browser = await chromium.launch({ headless: true });
const checks = [];
const build = JSON.parse(await readFile(".next/preview-build.json", "utf8"));
const base = "http://localhost:3000";
let inference;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/department/electronics`);
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
    const view = await (await answered).json();
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
    await page.screenshot({ path: `${directory}/camera-live-${label}.png` });
    const result = {
      message,
      elapsedMs,
      status: view.turn?.status,
      error: view.turn?.error,
      reply: reply?.text,
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
      camera.products.length > 0 &&
      camera.products.every(
        (p) =>
          p.category === "phones" &&
          Number(p.attributes?.digitalZoomMaxX) >= 100,
      ) &&
      /100\s*[x×]/i.test(camera.reply || "") &&
      /digital/i.test(camera.reply || "") &&
      /optical/i.test(camera.reply || "") &&
      !/100\s*[x×]\s+optical/i.test(
        (camera.reply || "").replace(/not\s+100\s*[x×]\s+optical/gi, ""),
      ),
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
