import type { Product } from "./catalog";
import { getVerifiedProductImage } from "./verified-product-image-registry";
import { brandedCatalog } from "./branded-catalog";
import { realProducts } from "./research";

// Pre-indexed fallback media maps for fast presentation lookups
const brandedMediaMap = new Map(
  brandedCatalog.filter((p) => p.media?.url).map((p) => [p.id, p.media!]),
);
const realMediaMap = new Map(
  realProducts.filter((p) => p.media?.url).map((p) => [p.id, p.media!]),
);

/** Presentation only: never rewrites inventory, identity, prices or order history. */
export function withVerifiedProductMedia(product: Product): Product {
  if (product.id === "unverified-fixture") {
    return {
      ...product,
      media: undefined,
    };
  }

  const image = getVerifiedProductImage(product);
  if (image.url) {
    return {
      ...product,
      media: {
        url: image.url,
        source: image.source,
        alt: image.alt,
        attribution: image.attribution,
        reviewedAt: image.reviewedAt,
        usage: "external_reference",
      },
    };
  }

  if (
    product.id &&
    product.media?.url &&
    (product.media.url.startsWith("/images/products/") ||
      product.media.url.startsWith("http"))
  ) {
    return {
      ...product,
      media: {
        url: product.media.url,
        source: product.media.source || product.media.url,
        alt: product.media.alt || `${product.name} official photography`,
        attribution:
          product.media.attribution ||
          `Product photography © ${product.brand || "BuyerGuard"}`,
        reviewedAt: product.media.reviewedAt || "2026-10-14",
        usage: "catalog_packshot",
      },
    };
  }

  if (product.id && brandedMediaMap.has(product.id)) {
    const brandedMedia = brandedMediaMap.get(product.id)!;
    return {
      ...product,
      media: {
        url: brandedMedia.url,
        source: brandedMedia.source || brandedMedia.url,
        alt: brandedMedia.alt || `${product.name} official photography`,
        attribution:
          brandedMedia.attribution ||
          `Product photography © ${product.brand || "BuyerGuard"}`,
        reviewedAt: brandedMedia.reviewedAt || "2026-10-14",
        usage: "catalog_packshot",
      },
    };
  }

  if (product.id && realMediaMap.has(product.id)) {
    const realMedia = realMediaMap.get(product.id)!;
    return {
      ...product,
      media: {
        url: realMedia.url,
        source: realMedia.source || realMedia.url,
        alt: realMedia.alt || `${product.name} official photography`,
        attribution:
          realMedia.attribution ||
          `Product photography © ${product.brand || "BuyerGuard"}`,
        reviewedAt: realMedia.reviewedAt || "2026-10-14",
        usage: "catalog_packshot",
      },
    };
  }

  return {
    ...product,
    media: undefined,
  };
}
