import { chromium } from "playwright";
import { resolve } from "node:path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const artifactDir = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  console.log("Navigating to http://127.0.0.1:3000/category/watches ...");
  await page.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Screenshot of the Horological Dial (Default View)
  await page.screenshot({
    path: `${artifactDir}/horological-dial-movement-view.png`,
    fullPage: false,
  });
  console.log("Saved: horological-dial-movement-view.png");

  // 2. Click the Watch Crown (Wind Calibre) to advance
  console.log("Winding Watch Crown...");
  const crown = page.locator(".watch-crown-knob");
  if (await crown.isVisible()) {
    await crown.click();
    await page.waitForTimeout(800);
  }

  // Screenshot after winding
  await page.screenshot({
    path: `${artifactDir}/horological-dial-wound-state.png`,
    fullPage: false,
  });
  console.log("Saved: horological-dial-wound-state.png");

  // 3. Switch to "All 21 Houses" view
  console.log("Switching to All 21 Houses matrix...");
  const matrixBtn = page.locator("button:has-text('All 21 Houses')");
  if (await matrixBtn.isVisible()) {
    await matrixBtn.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({
    path: `${artifactDir}/watches-houses-clean-matrix.png`,
    fullPage: false,
  });
  console.log("Saved: watches-houses-clean-matrix.png");

  // Hover on Apple logo in matrix to verify no merging and pure emblem
  const appleTile = page.locator("a[href*='brand=Apple']");
  if (await appleTile.isVisible()) {
    await appleTile.hover();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${artifactDir}/watches-apple-emblem-hover.png`,
      fullPage: false,
    });
    console.log("Saved: watches-apple-emblem-hover.png");
  }

  // 4. Navigate into catalog space to verify AI text removal
  console.log("Navigating to catalog space ?view=all ...");
  await page.goto("http://127.0.0.1:3000/category/watches?view=all", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: `${artifactDir}/watches-catalog-clean-concierge.png`,
    fullPage: false,
  });
  console.log("Saved: watches-catalog-clean-concierge.png");

  await browser.close();
  console.log("Verification finished successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
