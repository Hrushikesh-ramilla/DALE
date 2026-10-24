import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { resolveWatchesEyewearImage } from "../src/domain/product-images/watches-eyewear";
import { getProductImage } from "../src/domain/product-images";

describe("Horology & Eyewear Image Specialist Verification", () => {
  const productsDir = path.resolve(process.cwd(), "public/images/products");

  const requiredWatchModels = [
    { brand: "Rolex", name: "Rolex Submariner Date 41", modelName: "Submariner Date 41" },
    { brand: "Rolex", name: "Rolex Cosmograph Daytona 40", modelName: "Cosmograph Daytona 40" },
    { brand: "Rolex", name: "Rolex GMT-Master II 40", modelName: "GMT-Master II 40" },
    { brand: "Rolex", name: "Rolex Datejust 41", modelName: "Datejust 41" },
    { brand: "Rolex", name: "Rolex Day-Date 40", modelName: "Day-Date 40" },
    { brand: "Rolex", name: "Rolex Oyster Perpetual 41", modelName: "Oyster Perpetual 41" },
    { brand: "Omega", name: "Omega Speedmaster Professional Moonwatch 42mm", modelName: "Speedmaster Professional Moonwatch" },
    { brand: "Omega", name: "Omega Seamaster Diver 300M Co-Axial Master Chronometer", modelName: "Seamaster Diver 300M" },
    { brand: "Omega", name: "Omega Seamaster Aqua Terra 150M 41mm", modelName: "Seamaster Aqua Terra 150M" },
    { brand: "Omega", name: "Omega Constellation Co-Axial Master Chronometer 39mm", modelName: "Constellation" },
    { brand: "Cartier", name: "Santos de Cartier Large", modelName: "Santos de Cartier" },
    { brand: "Cartier", name: "Tank Must de Cartier Large", modelName: "Tank Must" },
    { brand: "Cartier", name: "Ballon Bleu de Cartier 40mm", modelName: "Ballon Bleu" },
    { brand: "Cartier", name: "Panthère de Cartier Medium", modelName: "Panthère" },
    { brand: "Patek Philippe", name: "Patek Philippe Nautilus Date 41mm", modelName: "Nautilus 5711" },
    { brand: "Patek Philippe", name: "Patek Philippe Aquanaut Date 40.8mm", modelName: "Aquanaut 5167" },
    { brand: "Patek Philippe", name: "Patek Philippe Calatrava Small Seconds 39mm", modelName: "Calatrava 6119G" },
    { brand: "Audemars Piguet", name: "Audemars Piguet Royal Oak Jumbo Extra-Thin 39mm", modelName: "Royal Oak Jumbo" },
    { brand: "Audemars Piguet", name: "Audemars Piguet Royal Oak Chronograph 41mm", modelName: "Royal Oak Chronograph" },
    { brand: "Jaeger-LeCoultre", name: "Reverso Classic Monoface Small Seconds", modelName: "Reverso Classic" },
    { brand: "Jaeger-LeCoultre", name: "Polaris Chronograph 42mm", modelName: "Polaris" },
    { brand: "Tissot", name: "Tissot PRX Powermatic 80 40mm", modelName: "PRX Powermatic 80" },
    { brand: "Tissot", name: "Tissot Gentleman Powermatic 80 Silicium", modelName: "Gentleman" },
    { brand: "Tudor", name: "Tudor Black Bay 58 39mm", modelName: "Black Bay 58" },
    { brand: "Tudor", name: "Tudor Pelagos 39 Titanium", modelName: "Pelagos" },
    { brand: "Breitling", name: "Breitling Navitimer B01 Chronograph 43", modelName: "Navitimer B01" },
    { brand: "Breitling", name: "Breitling Superocean Automatic 42", modelName: "Superocean" },
    { brand: "IWC", name: "IWC Portugieser Chronograph 41", modelName: "Portugieser Chronograph" },
    { brand: "IWC", name: "IWC Pilot's Watch Mark XX", modelName: "Pilot's Watch Mark XX" },
  ];

  const requiredEyewearModels = [
    { brand: "Ray-Ban", name: "Ray-Ban Aviator Classic RB3025", modelName: "Aviator Classic" },
    { brand: "Ray-Ban", name: "Ray-Ban Original Wayfarer Classic RB2140", modelName: "Original Wayfarer" },
    { brand: "Ray-Ban", name: "Ray-Ban Clubmaster Classic RB3016", modelName: "Clubmaster Classic" },
    { brand: "Ray-Ban", name: "Ray-Ban Round Metal RB3447", modelName: "Round Metal" },
    { brand: "Cartier", name: "Santos de Cartier Aviator Sunglasses", modelName: "Santos de Cartier Aviator" },
    { brand: "Cartier", name: "Première de Cartier Rectangular Sunglasses", modelName: "Première de Cartier" },
    { brand: "Chanel", name: "Chanel Classic Quilted Cat-Eye Sunglasses", modelName: "Classic Quilted Cat-Eye" },
    { brand: "Chanel", name: "Chanel Shield Sunglasses with Lambskin Temples", modelName: "Shield" },
    { brand: "Dior", name: "DiorBlackSuit S3I Square Sunglasses", modelName: "BlackSuit" },
    { brand: "Dior", name: "DiorMidnight S1I Cat-Eye Sunglasses", modelName: "DiorMidnight" },
    { brand: "Dior", name: "30Montaigne S2U Square Sunglasses", modelName: "30Montaigne" },
    { brand: "Celine", name: "Celine Triomphe Metal 01 Oval Sunglasses", modelName: "Triomphe Oval" },
    { brand: "Celine", name: "Celine Bold 3 Dots Rectangular Sunglasses", modelName: "Bold 3 Dots" },
    { brand: "Versace", name: "Versace VE4361 Medusa Biggie Sunglasses", modelName: "Medusa Biggie" },
    { brand: "Versace", name: "Versace VE2207 Greca Navigator Sunglasses", modelName: "Greca" },
    { brand: "Tom Ford", name: "Tom Ford Snowdon Sunglasses", modelName: "Snowdon" },
    { brand: "Tom Ford", name: "Tom Ford FT0237 Snowdon Sunglasses", modelName: "FT0237" },
    { brand: "Tom Ford", name: "Tom Ford Marko Aviator Sunglasses", modelName: "Marko" },
    { brand: "Prada", name: "Prada Symbole Rectangular Sunglasses", modelName: "Prada Symbole" },
    { brand: "Prada", name: "Prada PR 17WS Symbole Sunglasses", modelName: "PR 17WS" },
    { brand: "Oliver Peoples", name: "Oliver Peoples Gregory Peck Sun", modelName: "Gregory Peck" },
    { brand: "Oliver Peoples", name: "Oliver Peoples Cary Grant Sun", modelName: "Cary Grant" },
    { brand: "Persol", name: "Persol 714 Folding Steve McQueen Sunglasses", modelName: "714 Steve McQueen" },
    { brand: "Persol", name: "Persol 649 Original Sunglasses", modelName: "649 Original" },
  ];

  it("resolves all required watch models to existing authentic images", async () => {
    for (const item of requiredWatchModels) {
      const resolved = resolveWatchesEyewearImage({
        name: item.name,
        brand: item.brand,
        modelName: item.modelName,
        leafType: "watches",
      });

      expect(resolved).not.toBeNull();
      expect(resolved?.url).toMatch(/^\/images\/products\/(watches|sunglasses)-/);

      const filePath = path.join(productsDir, resolved!.url.replace("/images/products/", ""));
      expect(fs.existsSync(filePath), `File exists: ${filePath}`).toBe(true);

      const metadata = await sharp(filePath).metadata();
      expect(metadata.width).toBe(600);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe("webp");
    }
  });

  it("resolves all required eyewear models to existing authentic images", async () => {
    for (const item of requiredEyewearModels) {
      const resolved = resolveWatchesEyewearImage({
        name: item.name,
        brand: item.brand,
        modelName: item.modelName,
        leafType: "sunglasses",
      });

      expect(resolved).not.toBeNull();
      expect(resolved?.url).toMatch(/^\/images\/products\/(eyewear|sunglasses)-/);

      const filePath = path.join(productsDir, resolved!.url.replace("/images/products/", ""));
      expect(fs.existsSync(filePath), `File exists: ${filePath}`).toBe(true);

      const metadata = await sharp(filePath).metadata();
      expect(metadata.width).toBe(600);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe("webp");
    }
  });

  it("delegates from getProductImage to resolveWatchesEyewearImage", () => {
    const watchImg = getProductImage({
      name: "Rolex Cosmograph Daytona",
      brand: "Rolex",
      leafType: "watches",
    });
    expect(watchImg.url).toBe("/images/products/watches-rolex-daytona.webp");

    const eyewearImg = getProductImage({
      name: "Ray-Ban Aviator Classic",
      brand: "Ray-Ban",
      leafType: "sunglasses",
    });
    expect(eyewearImg.url).toBe("/images/products/eyewear-ray-ban-aviator.webp");
  });
});
