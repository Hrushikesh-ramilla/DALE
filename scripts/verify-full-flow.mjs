import { chromium } from "playwright";

const ARTIFACT_DIR = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

async function main() {
  console.log("Launching browser for comprehensive E2E luxury verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Department: Clothing
  console.log("1. Visiting /department/clothing...");
  await page.goto("http://127.0.0.1:3000/department/clothing", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // wait for cinematic intro
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-dept-clothing.png`, fullPage: false });
  console.log("   -> Saved e2e-dept-clothing.png");

  // 2. Department: Electronics
  console.log("2. Visiting /department/electronics...");
  await page.goto("http://127.0.0.1:3000/department/electronics", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-dept-electronics.png`, fullPage: false });
  console.log("   -> Saved e2e-dept-electronics.png");

  // 3. Category: Suits (Brand Showcase Hub)
  console.log("3. Visiting /category/suits (Brand Showcase Hub)...");
  await page.goto("http://127.0.0.1:3000/category/suits", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-category-suits-hub.png`, fullPage: false });
  console.log("   -> Saved e2e-category-suits-hub.png");

  // 4. Click Brand "Brioni" in Suits
  console.log("4. Visiting /category/suits?brand=Brioni (Filtered Brand Space)...");
  await page.goto("http://127.0.0.1:3000/category/suits?brand=Brioni", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-category-suits-brand-brioni.png`, fullPage: false });
  console.log("   -> Saved e2e-category-suits-brand-brioni.png");

  // 5. Category: Suits Explore All
  console.log("5. Visiting /category/suits?view=all (See All Models)...");
  await page.goto("http://127.0.0.1:3000/category/suits?view=all", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-category-suits-all.png`, fullPage: false });
  console.log("   -> Saved e2e-category-suits-all.png");

  // 6. Category: Phones (Brand Showcase Hub)
  console.log("6. Visiting /category/phones (Brand Showcase Hub)...");
  await page.goto("http://127.0.0.1:3000/category/phones", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-category-phones-hub.png`, fullPage: false });
  console.log("   -> Saved e2e-category-phones-hub.png");

  // 7. Category: Fragrance (Brand Showcase Hub)
  console.log("7. Visiting /category/fragrance (Brand Showcase Hub)...");
  await page.goto("http://127.0.0.1:3000/category/fragrance", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-category-fragrance-hub.png`, fullPage: false });
  console.log("   -> Saved e2e-category-fragrance-hub.png");

  // 8. Test AI Filter interaction in UI
  console.log("8. Testing live AI interaction on /category/suits?view=all...");
  await page.goto("http://127.0.0.1:3000/category/suits?view=all", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  // Find AI input and type "Under $3,500"
  const aiInput = page.locator(".concierge-input-form input");
  if (await aiInput.count() > 0) {
    await aiInput.fill("Under $3,500");
    await page.locator(".concierge-input-form button").click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e-category-suits-ai-filtered.png`, fullPage: false });
    console.log("   -> Saved e2e-category-suits-ai-filtered.png with AI feedback!");
  }

  await browser.close();
  console.log("Comprehensive E2E verification complete!");
}

main().catch(console.error);
