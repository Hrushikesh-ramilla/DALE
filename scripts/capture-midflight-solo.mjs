import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--ignore-certificate-errors"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  await page.goto("https://65.0.19.200.sslip.io/demo", { waitUntil: "networkidle" });
  await page.waitForSelector("button:has-text('Replay intro ↺')");
  await page.click("button:has-text('Replay intro ↺')");

  // Flight starts at 2400ms. At 2650ms, it is in mid-flight transit diagonally towards top-left!
  await page.waitForTimeout(2650);
  await page.screenshot({ path: "docs/assets/replay_midflight_diagonal.png" });

  await browser.close();
  console.log("Captured diagonal mid-flight frame!");
}

main().catch(console.error);
