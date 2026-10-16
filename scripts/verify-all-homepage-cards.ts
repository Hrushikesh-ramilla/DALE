import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to http://127.0.0.1:3000 ...");
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle", timeout: 60000 });

  // Wait for cinematic intro overlay to completely finish and unmount (2 seconds)
  await page.waitForTimeout(2500);

  // Wait for parallax category cards
  await page.waitForSelector(".parallax-category-card", { timeout: 30000 });

  const cards = await page.$$(".parallax-category-card");
  console.log(`Found ${cards.length} parallax category cards.`);

  const outDir = "C:\\Users\\ramil\\.gemini\\antigravity\\brain\\4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const titleEl = await card.$(".parallax-card-title");
    const title = titleEl ? (await titleEl.innerText()).trim() : `card-${i}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Scroll card into view
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const shotPath = path.join(outDir, `homepage-card-${i + 1}-${slug}.png`);
    await card.screenshot({ path: shotPath });
    console.log(`Captured [${title}] -> ${shotPath}`);
  }

  // Also take full homepage section screenshot
  const stack = await page.$(".parallax-stack");
  if (stack) {
    const stackPath = path.join(outDir, "homepage-parallax-all-departments-stack.png");
    await stack.screenshot({ path: stackPath });
    console.log(`Captured full stack -> ${stackPath}`);
  }

  await browser.close();
  console.log("All department card screenshots captured successfully!");
}

main().catch(console.error);
