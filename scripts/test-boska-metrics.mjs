import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @font-face {
          font-family: 'Boska';
          src: url('http://localhost:3000/fonts/boska/Boska-Bold.woff2') format('woff2');
          font-weight: 700;
          font-display: swap;
        }
        body {
          background: #000000;
          color: #FFFFFF;
          margin: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wordmark {
          font-family: 'Boska', Georgia, serif;
          font-weight: 700;
          font-size: 72px;
          letter-spacing: 0.16em;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="wordmark" id="target">DALE</div>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const rect = await page.evaluate(() => document.getElementById('target').getBoundingClientRect());
  console.log('BOSKA DALE RECT:', JSON.stringify(rect));
  await page.screenshot({ path: "docs/assets/boska_preview.png" });
  await browser.close();
}

main().catch(console.error);
