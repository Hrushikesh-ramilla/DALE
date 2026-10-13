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

  console.log("Navigating to https://65.0.19.200.sslip.io/demo...");
  await page.goto("https://65.0.19.200.sslip.io/demo", { waitUntil: "networkidle" });
  await page.waitForSelector("button:has-text('Replay intro ↺')");

  // Helper to capture a frame from replay
  const captureAt = async (delayMs, filename) => {
    await page.click("button:has-text('Replay intro ↺')");
    await page.waitForTimeout(delayMs);
    await page.screenshot({ path: `docs/assets/${filename}` });
    console.log(`Captured ${filename} at ${delayMs}ms`);
    // Wait for animation to finish before next replay
    await page.waitForTimeout(Math.max(0, 2100 - delayMs));
  };

  // 1. Fluid wave emergence (160ms) - D blooming, A entering
  await captureAt(160, "boska_01_wave_da.png");

  // 2. Cascading flow (260ms) - D, A, L emerging into E
  await captureAt(260, "boska_02_wave_dal.png");

  // 3. Full DALE title assembled in Boska (600ms)
  await captureAt(600, "boska_03_title_full.png");

  // 4. Silky diagonal flight (1350ms) - gliding to top-left corner
  await captureAt(1350, "boska_04_midflight.png");

  // 5. Settled in header logo (1900ms) - docked, page revealed
  await captureAt(1900, "boska_05_settled.png");

  await browser.close();
  console.log("All Boska cinematic frames captured successfully!");
}

main().catch(console.error);
