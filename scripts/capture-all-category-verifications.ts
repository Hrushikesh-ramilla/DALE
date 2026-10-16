import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const routes = [
    { url: 'http://127.0.0.1:3000/category/handbags', name: 'category-handbags-verified.png' },
    { url: 'http://127.0.0.1:3000/category/suits', name: 'category-suits-verified.png' },
    { url: 'http://127.0.0.1:3000/category/fragrance', name: 'category-fragrance-verified.png' },
    { url: 'http://127.0.0.1:3000/category/loafers', name: 'category-loafers-verified.png' },
    { url: 'http://127.0.0.1:3000/category/phones', name: 'category-phones-verified.png' },
    { url: 'http://127.0.0.1:3000/department/clothing', name: 'department-clothing-verified.png' },
    { url: 'http://127.0.0.1:3000/department/bags', name: 'department-bags-verified.png' },
    { url: 'http://127.0.0.1:3000/', name: 'homepage-storefront-verified.png' }
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route.url}...`);
    await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for cinematic intro to fully complete and detach
    await page.waitForSelector('.cinematic-intro-root', { state: 'detached', timeout: 8000 }).catch(() => {});
    // Wait for Next.js images to finish loading and rendering
    await page.waitForTimeout(2500);

    const outPath = path.join(ARTIFACT_DIR, route.name);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot to ${outPath}`);
  }

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

capture().catch(console.error);
