import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });

  const artifactDir = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  console.log("Testing 3D dial at Full HD 1920x1080...");
  const context1080 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page1080 = await context1080.newPage();

  await page1080.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page1080.waitForTimeout(2800);

  // Focus on dial
  const dialElement = page1080.locator(".horological-dial-circle");
  if (await dialElement.isVisible()) {
    await dialElement.scrollIntoViewIfNeeded();
    await page1080.waitForTimeout(400);
  }

  // 1. Initial 3D Pop-Out View (Blancpain centered, no est year, elevated stage)
  await page1080.screenshot({
    path: `${artifactDir}/horological-dial-3d-popout.png`,
    fullPage: false,
  });
  console.log("Saved: horological-dial-3d-popout.png");

  // 2. Interactive 3D Parallax Tilt: Hover top-right of dial
  const box = await dialElement.boundingBox();
  if (box) {
    console.log("Simulating 3D mouse parallax tilt (top-right)...");
    await page1080.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.22);
    await page1080.waitForTimeout(400);
    await page1080.screenshot({
      path: `${artifactDir}/horological-dial-3d-tilt-topright.png`,
      fullPage: false,
    });
    console.log("Saved: horological-dial-3d-tilt-topright.png");

    console.log("Simulating 3D mouse parallax tilt (bottom-left)...");
    await page1080.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
    await page1080.waitForTimeout(400);
    await page1080.screenshot({
      path: `${artifactDir}/horological-dial-3d-tilt-bottomleft.png`,
      fullPage: false,
    });
    console.log("Saved: horological-dial-3d-tilt-bottomleft.png");
  }

  // 3. Hover over the center brand emblem to verify 3D extrusion zoom
  const centerEmblem = page1080.locator(".stage-brand-emblem");
  if (await centerEmblem.isVisible()) {
    console.log("Hovering center brand emblem...");
    await centerEmblem.hover();
    await page1080.waitForTimeout(400);
    await page1080.screenshot({
      path: `${artifactDir}/horological-dial-3d-emblem-hover.png`,
      fullPage: false,
    });
    console.log("Saved: horological-dial-3d-emblem-hover.png");
  }

  await context1080.close();
  await browser.close();
  console.log("3D dial verification completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
