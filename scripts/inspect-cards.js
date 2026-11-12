const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".parallax-category-card")).map(card => {
      const title = card.querySelector(".parallax-card-title")?.innerText;
      const img = card.querySelector("img");
      return { title, src: img?.src, alt: img?.alt };
    });
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
