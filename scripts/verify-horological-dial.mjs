import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });

  const artifactDir = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  // 1. Test at Full HD 1920x1080 (matching user's display in image 2)
  console.log("Testing at Full HD 1920x1080...");
  const context1080 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page1080 = await context1080.newPage();

  await page1080.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page1080.waitForTimeout(2800);

  await page1080.screenshot({
    path: `${artifactDir}/horological-dial-grand-size-1080p.png`,
    fullPage: false,
  });
  console.log("Saved: horological-dial-grand-size-1080p.png");

  // Also take screenshot of dial area scrolled to fill screen (exact Image 2 view)
  const dialElement = page1080.locator(".horological-dial-circle");
  if (await dialElement.isVisible()) {
    await dialElement.scrollIntoViewIfNeeded();
    await page1080.waitForTimeout(300);
    await page1080.screenshot({
      path: `${artifactDir}/horological-dial-grand-size-1080p-focused.png`,
      fullPage: false,
    });
    console.log("Saved: horological-dial-grand-size-1080p-focused.png");
  }

  // 2. Test Right Crown Wind (Next House) at 1080p
  const rightCrown = page1080.locator(".right-crown .watch-crown-knob");
  if (await rightCrown.isVisible()) {
    await rightCrown.click();
    await page1080.waitForTimeout(800);
  }
  await page1080.screenshot({
    path: `${artifactDir}/horological-dial-grand-size-next.png`,
    fullPage: false,
  });
  console.log("Saved: horological-dial-grand-size-next.png");

  await context1080.close();

  // 3. Test at Standard Laptop 1366x768
  console.log("Testing at Standard Laptop 1366x768...");
  const context768 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page768 = await context768.newPage();
  await page768.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page768.waitForTimeout(2800);

  await page768.screenshot({
    path: `${artifactDir}/horological-dial-grand-size-laptop.png`,
    fullPage: false,
  });
  console.log("Saved: horological-dial-grand-size-laptop.png");

  await context768.close();

  await browser.close();
  console.log("Grand size verification completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
