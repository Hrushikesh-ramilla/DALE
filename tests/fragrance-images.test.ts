import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { resolveFragranceImage } from "../src/domain/product-images/fragrance";
import { getProductImage } from "../src/domain/product-images";

describe("Fragrance Specialist Image Verification", () => {
  const publicDir = path.resolve(process.cwd(), "public/images/products");
  const standaloneDir = path.resolve(process.cwd(), ".next/standalone/public/images/products");

  const distinctFlacons = [
    // Chanel cluster fixes
    { brand: "Chanel", name: "Bleu de Chanel Eau de Parfum", modelName: "Bleu de Chanel", expectedFile: "fragrance-chanel-bleu.webp" },
    { brand: "Chanel", name: "Chanel Allure Homme Sport Eau Extrême", modelName: "Allure Homme Sport Eau Extrême", expectedFile: "fragrance-chanel-allure-homme-sport.webp" },
    { brand: "Chanel", name: "Chanel Chance Eau Tendre Eau de Parfum", modelName: "Chance Eau Tendre", expectedFile: "fragrance-chanel-chance.webp" },
    { brand: "Chanel", name: "Chanel Coco Mademoiselle Eau de Parfum", modelName: "Coco Mademoiselle", expectedFile: "fragrance-chanel-coco-mademoiselle.webp" },

    // Dior cluster fixes
    { brand: "Dior", name: "Dior Fahrenheit Eau de Toilette", modelName: "Fahrenheit", expectedFile: "fragrance-dior-fahrenheit.webp" },
    { brand: "Dior", name: "Dior Homme Intense Eau de Parfum", modelName: "Dior Homme Intense", expectedFile: "fragrance-dior-homme.webp" },
    { brand: "Dior", name: "Miss Dior Eau de Parfum", modelName: "Miss Dior", expectedFile: "fragrance-dior-miss-dior.webp" },

    // Valentino cluster fixes
    { brand: "Valentino", name: "Born in Roma Uomo Eau de Toilette", modelName: "Born in Roma Uomo", expectedFile: "fragrance-valentino-born-in-roma.webp" },
    { brand: "Valentino", name: "Born in Roma Donna Eau de Parfum", modelName: "Born in Roma Donna", expectedFile: "fragrance-valentino-donna-born-in-roma.webp" },
    { brand: "Valentino", name: "Valentino Uomo Intense Eau de Parfum", modelName: "Valentino Uomo Intense", expectedFile: "fragrance-valentino-uomo-intense.webp" },

    // Creed cluster fixes
    { brand: "Creed", name: "Creed Silver Mountain Water Eau de Parfum", modelName: "Silver Mountain Water", expectedFile: "fragrance-creed-silver-mountain-water.webp" },
    { brand: "Creed", name: "Creed Virgin Island Water Eau de Parfum", modelName: "Virgin Island Water", expectedFile: "fragrance-creed-virgin-island-water.webp" },

    // Versace cluster fixes
    { brand: "Versace", name: "Versace Bright Crystal Eau de Toilette", modelName: "Bright Crystal", expectedFile: "fragrance-versace-bright-crystal.webp" },
    { brand: "Versace", name: "Versace Pour Homme Dylan Blue Eau de Toilette", modelName: "Dylan Blue", expectedFile: "fragrance-versace-dylan-blue.webp" },

    // Bvlgari Aqva duplicate fixes
    { brand: "Bvlgari", name: "Bvlgari Aqva Pour Homme Eau de Toilette", modelName: "Aqva Pour Homme", expectedFile: "fragrance-bvlgari-aqva-pour-homme.webp" },
    { brand: "Bvlgari", name: "Bvlgari Aqva Amara Eau de Toilette", modelName: "Aqva Amara", expectedFile: "fragrance-bvlgari-aqva-amara.webp" },
  ];

  it("resolves all distinct fragrance flacons accurately via resolveFragranceImage", () => {
    for (const item of distinctFlacons) {
      const res = resolveFragranceImage({
        name: item.name,
        brand: item.brand,
        leafType: "fragrance",
        modelName: item.modelName,
      });

      expect(res, `Model ${item.name} must resolve`).not.toBeNull();
      expect(res!.url).toBe(`/images/products/${item.expectedFile}`);
    }
  });

  it("resolves all distinct fragrance flacons accurately via getProductImage", () => {
    for (const item of distinctFlacons) {
      const res = getProductImage({
        name: item.name,
        brand: item.brand,
        leafType: "fragrance",
        modelName: item.modelName,
      });

      expect(res.url).toBe(`/images/products/${item.expectedFile}`);
    }
  });

  it("verifies that all files exist in public/ and .next/standalone/ with valid WebP specifications", async () => {
    for (const item of distinctFlacons) {
      const publicFilePath = path.join(publicDir, item.expectedFile);
      expect(fs.existsSync(publicFilePath), `File ${publicFilePath} must exist`).toBe(true);

      const standaloneFilePath = path.join(standaloneDir, item.expectedFile);
      expect(fs.existsSync(standaloneFilePath), `Standalone file ${standaloneFilePath} must exist`).toBe(true);

      const stats = fs.statSync(publicFilePath);
      expect(stats.size, `File ${item.expectedFile} size must be > 1KB`).toBeGreaterThan(1024);
      expect(stats.size, `File ${item.expectedFile} size must be < 40KB (under 40 KB specification)`).toBeLessThan(40 * 1024);

      const meta = await sharp(publicFilePath).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(600);
      expect(meta.height).toBe(600);
    }
  });

  it("ensures ZERO SHA-256 hash collisions among distinct flacon images", () => {
    const hashes = new Map<string, string>();
    for (const item of distinctFlacons) {
      const filePath = path.join(publicDir, item.expectedFile);
      const buf = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");

      expect(
        hashes.has(hash),
        `Duplicate hash found! ${item.expectedFile} has identical content to ${hashes.get(hash)}`
      ).toBe(false);

      hashes.set(hash, item.expectedFile);
    }
  });

  it("verifies distinct resolution for Bvlgari Aqva Pour Homme vs Bvlgari Aqva Amara", () => {
    const pourHomme = getProductImage({
      name: "Bvlgari Aqva Pour Homme Eau de Toilette",
      brand: "Bvlgari",
      leafType: "fragrance",
      modelName: "Aqva Pour Homme Eau de Toilette",
    });

    const amara = getProductImage({
      name: "Bvlgari Aqva Amara Eau de Toilette",
      brand: "Bvlgari",
      leafType: "fragrance",
      modelName: "Aqva Amara Eau de Toilette",
    });

    expect(pourHomme.url).toBe("/images/products/fragrance-bvlgari-aqva-pour-homme.webp");
    expect(amara.url).toBe("/images/products/fragrance-bvlgari-aqva-amara.webp");
    expect(pourHomme.url).not.toBe(amara.url);
  });
});
