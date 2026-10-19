import { expect, it } from "vitest";
import type { Product } from "../src/domain/catalog";
import { withVerifiedProductMedia } from "../src/domain/product-media-presentation";

it("removes unverified media from public data without changing the stored record or commerce facts", () => {
  const product = {
    id: "unverified-fixture",
    name: "Unverified product",
    price: 125,
    stock: 8,
    media: {
      url: "/images/products/actor.webp",
      source: "/images/products/actor.webp",
    },
  } as Product;
  const result = withVerifiedProductMedia(product);
  expect(result.media).toBeUndefined();
  expect(product.media?.url).toBe("/images/products/actor.webp");
  expect(result.id).toBe(product.id);
  expect(result.price).toBe(product.price);
  expect(result.stock).toBe(product.stock);
});
