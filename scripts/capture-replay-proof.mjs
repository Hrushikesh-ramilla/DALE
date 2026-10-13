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

  console.log("Waiting for Replay intro button...");
  await page.waitForSelector("button:has-text('Replay intro ↺')");

  console.log("Triggering Replay intro ↺ with synchronized clock...");
  await page.click("button:has-text('Replay intro ↺')");

  // 1. Letter D emerges (450ms)
  await page.waitForTimeout(450);
  await page.screenshot({ path: "docs/assets/replay_01_d.png" });
  console.log("Captured replay_01_d.png");

  // 2. Letter DA emerges (850ms)
  await page.waitForTimeout(400);
  await page.screenshot({ path: "docs/assets/replay_02_da.png" });
  console.log("Captured replay_02_da.png");

  // 3. Letter DAL emerges (1250ms)
  await page.waitForTimeout(400);
  await page.screenshot({ path: "docs/assets/replay_03_dal.png" });
  console.log("Captured replay_03_dal.png");

  // 4. Wordmark DALE in full glory centered with glow & subtitle (1650ms)
  await page.waitForTimeout(400);
  await page.screenshot({ path: "docs/assets/replay_04_dale.png" });
  console.log("Captured replay_04_dale.png");

  // 5. Wordmark in mid-flight gliding diagonally to top-left corner (2750ms)
  await page.waitForTimeout(1100);
  await page.screenshot({ path: "docs/assets/replay_05_midflight.png" });
  console.log("Captured replay_05_midflight.png");

  // 6. Wordmark settled in top-left logo, backdrop dissolved, page visible (3600ms)
  await page.waitForTimeout(850);
  await page.screenshot({ path: "docs/assets/replay_06_settled.png" });
  console.log("Captured replay_06_settled.png");

  await browser.close();
  console.log("All synchronized frames saved!");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
