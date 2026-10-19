import type { Product } from "./catalog";
import { getVerifiedProductImage } from "./verified-product-image-registry";

/** Presentation only: never rewrites inventory, identity, prices or order history. */
export function withVerifiedProductMedia(product: Product): Product {
  const image = getVerifiedProductImage(product);
  return {
    ...product,
    media: image.url
      ? {
          url: image.url,
          source: image.source,
          alt: image.alt,
          attribution: image.attribution,
          reviewedAt: image.reviewedAt,
          usage: "external_reference",
        }
      : undefined,
  };
}
