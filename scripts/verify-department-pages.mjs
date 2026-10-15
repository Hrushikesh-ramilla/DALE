import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("Navigating to /department/clothing...");
  await page.goto("http://127.0.0.1:3000/department/clothing", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe/department-clothing-verified.png", fullPage: false });
  console.log("Saved department-clothing-verified.png");

  console.log("Navigating to /department/electronics...");
  await page.goto("http://127.0.0.1:3000/department/electronics", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe/department-electronics-verified.png", fullPage: false });
  console.log("Saved department-electronics-verified.png");

  console.log("Navigating to /department/beauty...");
  await page.goto("http://127.0.0.1:3000/department/beauty", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe/department-beauty-verified.png", fullPage: false });
  console.log("Saved department-beauty-verified.png");

  await browser.close();
  console.log("Done verifying department pages!");
}

main().catch(console.error);
