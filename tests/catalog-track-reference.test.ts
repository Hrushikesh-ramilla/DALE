import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import plan from "../catalog/repairs/track-reference-2026-10-24.json";
import registry from "../catalog/media/verified-product-images.json";
import { resolveVerifiedProductImage } from "../src/domain/verified-product-image";

it("consolidates the exact Track reference into lifestyle footwear and removes unsupported running claims", () => {
  const [correction, duplicate] = plan.operations;
  expect(correction.oldId).toBe(correction.product.id);
  expect(duplicate.oldId).not.toBe(duplicate.product.id);
  expect(duplicate.product).toEqual(correction.product);
  expect(duplicate.expected.source).toBe(correction.expected.source);
  const {product}=correction;
  expect(product.leafType).toBe("lifestyle-sneakers");
  expect(product.attributes.sourceSku).toBe("542023W1GB11000");
  for (const key of ["heelDropMm", "stackHeightMm", "pronationSupport", "weightGrams", "cushioningTechnology", "shoeSize"])
    expect(product.attributes).not.toHaveProperty(key);
  expect(product.description).not.toMatch(/trail|road hybrid|176 panels|performance/i);
  expect(product.description).toContain("A shoe size has not been selected");
  const image=resolveVerifiedProductImage(product,registry.entries);
  expect(image.url).toBe(product.media.url);
  const entry=registry.entries[product.id as keyof typeof registry.entries];
  expect(createHash("sha256").update(readFileSync("public"+image.url)).digest("hex")).toBe(entry.sha256);
});
