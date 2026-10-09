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
        }
        body { background: #000; color: #fff; margin: 40px; }
      </style>
    </head>
    <body>
      <svg id="svg1" viewBox="0 0 240 60" width="240" height="60">
        <text id="fullText" x="0" y="46" font-family="'Boska', serif" font-weight="700" font-size="52" letter-spacing="4" fill="#fff">DALE</text>
      </svg>
      <svg id="svg2" viewBox="0 0 240 60" width="240" height="60">
        <text id="tD" x="0" y="46" font-family="'Boska', serif" font-weight="700" font-size="52" fill="#fff">D</text>
        <text id="tA" x="54" y="46" font-family="'Boska', serif" font-weight="700" font-size="52" fill="#fff">A</text>
        <text id="tL" x="110" y="46" font-family="'Boska', serif" font-weight="700" font-size="52" fill="#fff">L</text>
        <text id="tE" x="156" y="46" font-family="'Boska', serif" font-weight="700" font-size="52" fill="#fff">E</text>
      </svg>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const full = document.getElementById('fullText');
    const d = document.getElementById('tD');
    const a = document.getElementById('tA');
    const l = document.getElementById('tL');
    const e = document.getElementById('tE');
    return {
      fullLength: full.getComputedTextLength(),
      subStringLengths: {
        d: full.getSubStringLength(0, 1),
        da: full.getSubStringLength(0, 2),
        dal: full.getSubStringLength(0, 3),
        dale: full.getSubStringLength(0, 4),
      },
      positions: {
        dStart: full.getStartPositionOfChar(0).x,
        aStart: full.getStartPositionOfChar(1).x,
        lStart: full.getStartPositionOfChar(2).x,
        eStart: full.getStartPositionOfChar(3).x,
      }
    };
  });
  console.log('SVG TEXT POSITIONS:', JSON.stringify(info, null, 2));
  await page.screenshot({ path: "docs/assets/svg_boska_test.png" });
  await browser.close();
}

main().catch(console.error);
