import { chromium } from "playwright";

const ARTIFACTS_DIR = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x Retina resolution
  });

  const page = await context.newPage();

  console.log("Navigating to http://127.0.0.1:3000/shop...");
  await page.goto("http://127.0.0.1:3000/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(3800);

  // 1. Initial Hero DALE Card State (scrollY = 980, e = 0.0)
  console.log("Capturing 01: Hero horizontal DALE card (e = 0.0)...");
  await page.evaluate(() => window.scrollTo(0, 980));
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/proof_01_hero_dale.png`,
    fullPage: false,
  });

  // 2. Mid-morph state (scrollY = 1600, e ≈ 0.50)
  console.log("Capturing 02: Mid-morph transition without ghosting (e ≈ 0.50)...");
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/proof_02_mid_morph.png`,
    fullPage: false,
  });

  // 3. Fully settled in sticky sidebar beside catalog (scrollY = 2100, e = 1.0)
  console.log("Capturing 03: Settled sidebar DALE chat beside catalog (e = 1.0)...");
  await page.evaluate(() => window.scrollTo(0, 2100));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/proof_03_sidebar_docked.png`,
    fullPage: false,
  });

  // 4. Hover over Brief & Filters button in catalog controls while docked
  console.log("Capturing 04: Apple-fluid Brief & Filters flyout while DALE is docked...");
  const briefBtn = page.locator(".catalog-heading-controls").getByRole("button", {
    name: "Filter products and adjust shopping brief",
  });
  await briefBtn.hover();
  await page.waitForTimeout(600); // Allow fluid spring warp to settle
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/proof_04_brief_flyout.png`,
    fullPage: false,
  });

  // Close flyout
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // 5. Reverse scroll back to hero horizontal card (scrollY = 980)
  console.log("Capturing 05: Reverse scroll back to hero horizontal card...");
  await page.evaluate(() => window.scrollTo(0, 980));
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/proof_05_reverse_settled.png`,
    fullPage: false,
  });

  // 6. Mobile Viewport (iPhone 14 Pro: 393 x 852)
  console.log("Capturing 06: Mobile responsive hero layout...");
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://127.0.0.1:3000/shop", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(3800);
  await mobilePage.evaluate(() => window.scrollTo(0, 500));
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({
    path: `${ARTIFACTS_DIR}/proof_06_mobile_hero.png`,
    fullPage: false,
  });

  // 7. Scroll mobile to catalog to view mobile dock capsule
  console.log("Capturing 07: Mobile catalog with floating DALE dock capsule...");
  await mobilePage.evaluate(() => window.scrollTo(0, 1800));
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({
    path: `${ARTIFACTS_DIR}/proof_07_mobile_catalog_dock.png`,
    fullPage: false,
  });

  await browser.close();
  console.log("All visual proof captures complete!");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
