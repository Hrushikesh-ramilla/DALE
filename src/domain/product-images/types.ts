export interface ProductImageResolution {
  url: string;
  alt: string;
  source: string;
  attribution: string;
  reviewedAt: string;
  width: number;
  height: number;
}

export interface ProductQuery {
  id?: string;
  name: string;
  brand?: string;
  color?: string;
  modelName?: string;
  category?: string;
  leafType?: string;
  attributes?: Record<string, unknown>;
  media?: {
    url?: string;
    alt?: string;
    source?: string;
    attribution?: string;
  };
}

export const DEFAULT_REVIEW_DATE = "2026-10-12";

export function makeImg(
  filename: string,
  altText: string,
  brandName?: string
): ProductImageResolution {
  return {
    url: `/images/products/${filename}`,
    alt: altText,
    source: "https://buyerguard.luxury/catalog/photography",
    attribution: `Official product photography © ${brandName || "Luxury Studio Archive"}`,
    reviewedAt: DEFAULT_REVIEW_DATE,
    width: 600,
    height: 600,
  };
}
