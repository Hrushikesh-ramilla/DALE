import { expect, it } from "vitest";
import {
  resolveVerifiedProductImage,
  hasConsistentBottleVolume,
  type VerifiedImage,
} from "../src/domain/verified-product-image";
it("rejects contradictions between bottle specifications and selected/displayed variants", () => {
  expect(
    hasConsistentBottleVolume({
      name: "Perfume",
      color: "75ml",
      skuVariant: "75ml",
      attributes: { volumeMl: 125 },
    }),
  ).toBe(false);
  expect(
    hasConsistentBottleVolume({
      name: "Perfume · 70ml",
      skuVariant: "35ml",
      attributes: { volumeMl: 70 },
    }),
  ).toBe(false);
  expect(
    hasConsistentBottleVolume({
      name: "Perfume · 70ml",
      skuVariant: "70ml-spray",
      attributes: { volumeMl: 70 },
    }),
  ).toBe(true);
});
const product = {
  id: "A",
  name: "Exact 65W Charger",
  brand: "Example",
  attributes: { wattage: 65 },
};
const entry: VerifiedImage = {
  productName: product.name,
  brand: product.brand,
  url: "/images/verified/a-aaaaaaaaaaaaaaaa.webp",
  alt: "Exact charger",
  sourcePage: "https://example.com/products/a",
  sourceImage: "https://example.com/a.webp",
  attribution: "Product page",
  reviewedAt: "2026-10-13",
  width: 800,
  height: 800,
  bytes: 50000,
  sha256: "a".repeat(64),
  verified: true,
  attributes: { wattage: 65 },
};
it("renders only the reviewed exact identity and variant within the image budget", () => {
  expect(resolveVerifiedProductImage(product, { A: entry }).url).toBe(
    entry.url,
  );
  for (const wrong of [
    { ...product, id: "B" },
    { ...product, name: "Different charger" },
    { ...product, brand: "Other" },
    { ...product, attributes: { wattage: 100 } },
  ])
    expect(resolveVerifiedProductImage(wrong, { A: entry }).url).toBe("");
});
it("never uses claimed local media, generic mappings or an unreviewed candidate as proof", () => {
  expect(
    resolveVerifiedProductImage(
      { ...product, media: { url: "/images/products/random-actor.webp" } },
      {},
    ).url,
  ).toBe("");
  expect(
    resolveVerifiedProductImage(product, { A: { ...entry, verified: false } })
      .url,
  ).toBe("");
});
it("rejects oversized, unsafe and corrupted asset references", () => {
  for (const bad of [
    { ...entry, bytes: 140001 },
    { ...entry, url: "https://unknown.test/photo.jpg" },
    { ...entry, url: "/images/verified/../../secret.webp" },
    { ...entry, sha256: "bad" },
  ])
    expect(resolveVerifiedProductImage(product, { A: bad }).url).toBe("");
});
