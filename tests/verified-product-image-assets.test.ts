import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import registry from "../catalog/media/verified-product-images.json";
it("every approved image decodes, matches its immutable hash/dimensions and stays within budget", async () => {
  const entries = Object.values(registry.entries).filter((e) => e.verified);
  expect(entries.length).toBeGreaterThan(0);
  for (const entry of entries) {
    const bytes = await readFile("public" + entry.url);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(entry.sha256);
    expect(bytes.length).toBe(entry.bytes);
    expect(bytes.length).toBeLessThanOrEqual(140000);
    expect(new URL(entry.sourcePage).protocol).toBe("https:");
    expect(new URL(entry.sourceImage).protocol).toBe("https:");
    const meta = await sharp(bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(entry.width);
    expect(meta.height).toBe(entry.height);
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(960);
    expect(meta.exif).toBeUndefined();
  }
}, 30000);
