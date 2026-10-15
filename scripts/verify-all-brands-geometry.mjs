import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe";

  console.log("Launching test on 1366x768 viewport (User laptop geometry)...");
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const keyBrands = [
    "Vacheron Constantin",
    "Girard-Perregaux",
    "Jaeger-LeCoultre",
    "A. Lange & Söhne",
    "Ulysse Nardin",
    "Grand Seiko",
    "Samsung"
  ];

  const brandReport = [];
  const rightCrown = page.locator(".right-crown .watch-crown-knob");

  for (let i = 0; i < 21; i++) {
    const box = await page.locator(".dial-center-stage").boundingBox();
    const activeNode = page.locator(".dial-brand-node.active-node");
    const brandText = (await activeNode.innerText()).replace(/\n/g, " ").trim();
    const ratio = box.width / box.height;
    const isCircle = Math.abs(box.width - box.height) <= 1;

    brandReport.push({
      i,
      brand: brandText,
      width: Math.round(box.width),
      height: Math.round(box.height),
      ratio: ratio.toFixed(3),
      isCircle
    });

    // Capture screenshot if it's one of the user's flagged brands
    for (const kb of keyBrands) {
      if (brandText.toLowerCase().includes(kb.toLowerCase())) {
        const slug = kb.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await page.locator(".horological-dial-circle").screenshot({
          path: `${artifactDir}/watches-dial-${slug}-concentric-verified.png`
        });
        console.log(`Saved screenshot: watches-dial-${slug}-concentric-verified.png`);
      }
    }

    await rightCrown.click();
    await page.waitForTimeout(350);
  }

  console.table(brandReport);

  const allCircles = brandReport.every((b) => b.isCircle);
  console.log("All 21 brands are 100% perfect circles:", allCircles);

  // Also capture full hero on 1920x1080 desktop
  const page1080 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page1080.goto("http://127.0.0.1:3000/category/watches", { waitUntil: "networkidle" });
  await page1080.waitForTimeout(2500);

  // Advance 1 click to Vacheron Constantin
  await page1080.locator(".right-crown .watch-crown-knob").click();
  await page1080.waitForTimeout(600);

  await page1080.screenshot({
    path: `${artifactDir}/watches-hero-vacheron-concentric-1080p.png`,
    fullPage: false
  });
  console.log("Saved: watches-hero-vacheron-concentric-1080p.png");

  await browser.close();

  if (!allCircles) {
    throw new Error("Some brands still deformed into an oval!");
  }

  console.log("Verification finished with 100% geometric success!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
