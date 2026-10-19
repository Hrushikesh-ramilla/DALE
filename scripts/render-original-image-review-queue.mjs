import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const root = ".data/product-media-audit";
const report = JSON.parse(
  await readFile(root + "/original-image-classification.json", "utf8"),
);
const records = report.records.filter(
  (r) => r.status === "visual-review-required" && !r.replacement,
);
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const pages = [];
for (let offset = 0; offset < records.length; offset += 24) {
  const page = records.slice(offset, offset + 24);
  const cells = await Promise.all(
    page.map(async (r, index) => {
      const x = (index % 4) * 400,
        y = Math.floor(index / 4) * 290;
      const photo = await sharp("public" + r.originalImage)
        .resize(390, 210, { fit: "contain", background: "white" })
        .png()
        .toBuffer();
      const title = escape(r.name),
        id = escape(r.id);
      const label = Buffer.from(
        `<svg width="400" height="80"><rect width="400" height="80" fill="white"/><text x="4" y="14" font-size="11">${title.slice(0, 60)}</text><text x="4" y="29" font-size="11">${title.slice(60, 120)}</text><text x="4" y="47" font-size="9">${id.slice(0, 70)}</text><text x="4" y="62" font-size="9">${id.slice(70)}</text></svg>`,
      );
      return [
        { input: photo, left: x, top: y },
        { input: label, left: x, top: y + 210 },
      ];
    }),
  );
  const filename = `original-review-${String(offset / 24 + 1).padStart(3, "0")}.png`;
  await sharp({
    create: {
      width: 1600,
      height: Math.ceil(page.length / 4) * 290,
      channels: 3,
      background: "white",
    },
  })
    .composite(cells.flat())
    .png()
    .toFile(root + "/" + filename);
  pages.push({
    filename,
    products: page.map((r) => ({
      id: r.id,
      name: r.name,
      originalImage: r.originalImage,
    })),
  });
}
await writeFile(
  root + "/original-review-pages.json",
  JSON.stringify(pages, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    requiresVisualReview: records.length,
    sheets: pages.length,
  }),
);
