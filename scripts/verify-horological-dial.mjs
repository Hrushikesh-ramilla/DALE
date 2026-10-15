import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  console.log("1. Testing 3-Column Editorial Hero at 1920x1080 Full HD...");
  const context1080 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page1080 = await context1080.newPage();

  await page1080.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  // Wait for 360 rotation entrance animation to complete and settle
  await page1080.waitForTimeout(2800);

  // Capture full 3-column hero layout
  await page1080.screenshot({
    path: `${artifactDir}/watches-hero-editorial-1080p.png`,
    fullPage: false,
  });
  console.log("Saved: watches-hero-editorial-1080p.png");

  // Focus on Dial and capture close-up
  const dialElement = page1080.locator(".horological-dial-circle");
  if (await dialElement.isVisible()) {
    await dialElement.scrollIntoViewIfNeeded();
    await page1080.waitForTimeout(300);
    await dialElement.screenshot({
      path: `${artifactDir}/horological-dial-closeup-platinum-silver.png`,
    });
    console.log("Saved: horological-dial-closeup-platinum-silver.png");
  }

  // 1b. Test Left Crown (PREV / Rewind) -> From Blancpain (index 0) rewind 1 click to Apple (index 20)
  const leftCrown = page1080.locator(".left-crown .watch-crown-knob");
  if (await leftCrown.isVisible()) {
    console.log("1b. Rewinding 1 click with Left Crown to Apple...");
    await leftCrown.click();
    await page1080.waitForTimeout(700);
    await page1080.screenshot({
      path: `${artifactDir}/watches-hero-apple-silver-active.png`,
      fullPage: false,
    });
    console.log("Saved: watches-hero-apple-silver-active.png");

    const centerStage = page1080.locator(".dial-center-stage");
    if (await centerStage.isVisible()) {
      await centerStage.screenshot({
        path: `${artifactDir}/watches-center-apple-upright-closeup.png`,
      });
      console.log("Saved: watches-center-apple-upright-closeup.png");
    }

    // Rewind 1 more click to Blancpain again to continue right-crown progression
    console.log("Rewinding forward back to Blancpain...");
    const rightCrownInit = page1080.locator(".right-crown .watch-crown-knob");
    await rightCrownInit.click();
    await page1080.waitForTimeout(600);
  }

  // 2. Click NEXT crown to advance through houses, checking Vacheron Constantin & Ulysse Nardin specifically
  const rightCrown = page1080.locator(".right-crown .watch-crown-knob");
  if (await rightCrown.isVisible()) {
    // Click 1: Advance to Vacheron Constantin (index 1)
    console.log("2a. Advancing 1 click to Vacheron Constantin...");
    await rightCrown.click();
    await page1080.waitForTimeout(500);
    await page1080.screenshot({
      path: `${artifactDir}/watches-hero-vacheron-3d-active.png`,
      fullPage: false,
    });
    console.log("Saved: watches-hero-vacheron-3d-active.png");

    // Click 7 more times: Advance to Ulysse Nardin (index 8)
    console.log("2b. Advancing to Ulysse Nardin (index 8)...");
    for (let i = 0; i < 7; i++) {
      await rightCrown.click();
      await page1080.waitForTimeout(360);
    }
    await page1080.waitForTimeout(500);
    await page1080.screenshot({
      path: `${artifactDir}/watches-hero-ulysse-nardin-3d-active.png`,
      fullPage: false,
    });
    console.log("Saved: watches-hero-ulysse-nardin-3d-active.png");

    // Advance 2 more clicks to reach Omega (index 10)
    console.log("2c. Advancing to Omega (index 10)...");
    for (let i = 0; i < 2; i++) {
      await rightCrown.click();
      await page1080.waitForTimeout(360);
    }
    await page1080.waitForTimeout(500);
    await page1080.screenshot({
      path: `${artifactDir}/watches-hero-omega-active-match.png`,
      fullPage: false,
    });
    console.log("Saved: watches-hero-omega-active-match.png");

    // Advance 2 more clicks to reach TAG Heuer (index 12)
    console.log("2d. Advancing to TAG Heuer (index 12)...");
    for (let i = 0; i < 2; i++) {
      await rightCrown.click();
      await page1080.waitForTimeout(360);
    }
    await page1080.waitForTimeout(500);
    await page1080.screenshot({
      path: `${artifactDir}/watches-hero-tag-heuer-3d-active.png`,
      fullPage: false,
    });
    console.log("Saved: watches-hero-tag-heuer-3d-active.png");

    // Hover over the center 3D medallion
    const centerMedallion = page1080.locator(".dial-center-stage");
    if (await centerMedallion.isVisible()) {
      await centerMedallion.hover();
      await page1080.waitForTimeout(300);
      await page1080.screenshot({
        path: `${artifactDir}/watches-dial-3d-medallion-hover.png`,
        fullPage: false,
      });
      console.log("Saved: watches-dial-3d-medallion-hover.png");
    }
  }

  // 3. Hover over Cartier brand node on the orbital track
  console.log("3. Hovering over a brand node...");
  const brandNode = page1080.locator(".dial-brand-node").first();
  if (await brandNode.isVisible()) {
    await brandNode.hover();
    await page1080.waitForTimeout(300);
    await page1080.screenshot({
      path: `${artifactDir}/watches-brand-node-hover.png`,
      fullPage: false,
    });
    console.log("Saved: watches-brand-node-hover.png");
  }

  await context1080.close();

  // 4. Test Laptop Viewport (1440x900)
  console.log("4. Testing laptop viewport (1440x900)...");
  const contextLaptop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageLaptop = await contextLaptop.newPage();
  await pageLaptop.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await pageLaptop.waitForTimeout(2800);

  await pageLaptop.screenshot({
    path: `${artifactDir}/watches-hero-laptop-1440x900.png`,
    fullPage: false,
  });
  console.log("Saved: watches-hero-laptop-1440x900.png");

  await contextLaptop.close();
  await browser.close();
  console.log("All verification screenshots captured successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
