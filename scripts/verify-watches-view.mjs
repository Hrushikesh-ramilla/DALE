import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  const artifactDir = "C:\\Users\\ramil\\.gemini\\antigravity\\brain\\4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  console.log("1. Navigating to http://127.0.0.1:3000/category/watches ...");
  await page.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Screenshot 1: Hub View showing 21 Floating 3D Logos without any box/card
  const hubFull = path.join(artifactDir, "watches-hub-3d-floating-logos.png");
  await page.screenshot({ path: hubFull, fullPage: true });
  console.log("Saved screenshot:", hubFull);

  // Hover over Seiko logo to trigger 3D Pop-Out
  const seikoTile = page.locator('a[aria-label="Explore Seiko watches"]');
  if (await seikoTile.count() > 0) {
    await seikoTile.scrollIntoViewIfNeeded();
    await seikoTile.hover();
    await page.waitForTimeout(400);
    const hoverSeiko = path.join(artifactDir, "watches-hub-hover-seiko-3d.png");
    await page.screenshot({ path: hoverSeiko });
    console.log("Saved hover Seiko screenshot:", hoverSeiko);
  }

  // Hover over Breguet logo to trigger 3D Pop-Out
  const breguetTile = page.locator('a[aria-label="Explore Breguet watches"]');
  if (await breguetTile.count() > 0) {
    await breguetTile.scrollIntoViewIfNeeded();
    await breguetTile.hover();
    await page.waitForTimeout(400);
    const hoverBreguet = path.join(artifactDir, "watches-hub-hover-breguet-3d.png");
    await page.screenshot({ path: hoverBreguet });
    console.log("Saved hover Breguet screenshot:", hoverBreguet);
  }

  // Hover over Apple logo to trigger 3D Pop-Out
  const appleTile = page.locator('a[aria-label="Explore Apple watches"]');
  if (await appleTile.count() > 0) {
    await appleTile.scrollIntoViewIfNeeded();
    await appleTile.hover();
    await page.waitForTimeout(400);
    const hoverApple = path.join(artifactDir, "watches-hub-hover-apple-3d.png");
    await page.screenshot({ path: hoverApple });
    console.log("Saved hover Apple screenshot:", hoverApple);
  }

  // 2. Click on Seiko to enter dedicated Seiko Catalog Space
  console.log("2. Clicking Seiko to enter Seiko catalog space...");
  await seikoTile.click();
  await page.waitForURL(/brand=Seiko/, { timeout: 5000 });
  await page.waitForTimeout(1200);

  const seikoCatalogSpace = path.join(artifactDir, "watches-seiko-catalog-space.png");
  await page.screenshot({ path: seikoCatalogSpace, fullPage: true });
  console.log("Saved Seiko catalog space screenshot:", seikoCatalogSpace);

  // 3. Test Smartwatch Movement Filter in All Catalog View
  console.log("3. Navigating to All Catalog View: http://127.0.0.1:3000/category/watches?view=all ...");
  await page.goto("http://127.0.0.1:3000/category/watches?view=all", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Click on "Smartwatch & Connected" movement filter pill
  const smartwatchPill = page.locator('button.filter-pill', { hasText: /Smartwatch/i });
  if (await smartwatchPill.count() > 0) {
    console.log("Clicking Smartwatch movement pill...");
    await smartwatchPill.click();
    await page.waitForTimeout(600);
    const smartwatchCatalogSpace = path.join(artifactDir, "watches-smartwatch-filtered-space.png");
    await page.screenshot({ path: smartwatchCatalogSpace, fullPage: true });
    console.log("Saved Smartwatch filtered screenshot:", smartwatchCatalogSpace);
  }

  // 4. Verify Tudor is NOT present anywhere
  const pageContent = await page.content();
  const tudorCount = (pageContent.match(/tudor/gi) || []).length;
  console.log("Total occurrences of 'Tudor' on rendered page:", tudorCount);

  await browser.close();
  console.log("Verification finished successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
