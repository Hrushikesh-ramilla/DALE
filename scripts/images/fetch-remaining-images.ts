import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const REMAINING_TARGETS = [
  {
    filename: "clothing-tom-ford-classic-poplin-shirt.webp",
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "clothing-saint-laurent-d02-skinny-denim.webp",
    url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "beauty-cle-de-peau-la-creme.webp",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "beauty-guerlain-orchidee-imperiale.webp",
    url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "beauty-augustinus-bader-the-serum.webp",
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "beauty-augustinus-bader-cleansing-gel.webp",
    url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "beauty-cle-de-peau-softening-cleansing-foam.webp",
    url: "https://images.unsplash.com/photo-1556228722-d0b5de73171c?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "beauty-dior-prestige-mineral-uv-protector.webp",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "home-le-creuset-round-dutch-oven.webp",
    url: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "home-baccarat-eye-vase.webp",
    url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
  },
  {
    filename: "home-sferra-giza-45-sateen-set.webp",
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
  },
];

async function main() {
  const targetDir = path.resolve(process.cwd(), "public/images/products");
  for (const item of REMAINING_TARGETS) {
    const dest = path.join(targetDir, item.filename);
    try {
      const res = await fetch(item.url, {
        headers: { "User-Agent": "BuyerGuardProductCatalog/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const webp = await sharp(buf)
        .resize(600, 600, {
          fit: "contain",
          background: { r: 251, g: 251, b: 251, alpha: 1 },
        })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();
      fs.writeFileSync(dest, webp);
      console.log(`[SUCCESS] ${item.filename} -> ${(webp.length / 1024).toFixed(1)} KB`);
    } catch (err: any) {
      console.error(`[ERROR] ${item.filename}: ${err.message}`);
    }
  }
}

main().catch(console.error);
