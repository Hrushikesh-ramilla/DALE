export type ProductImageResolution = {
  url: string;
  alt: string;
  source: string;
  attribution: string;
  reviewedAt: string;
  width: number;
  height: number;
};
export type ProductQuery = {
  id?: string;
  name: string;
  brand?: string;
  color?: string;
  attributes?: Record<string, unknown>;
  media?: { url?: string };
};
export type VerifiedImage = {
  productName: string;
  brand: string;
  url: string;
  alt: string;
  sourcePage: string;
  sourceImage: string;
  attribution: string;
  reviewedAt: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  verified: boolean;
  attributes?: Record<string, unknown>;
  color?: string;
};
const normalize = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase();
function publicSource(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !/^(localhost|\d+\.)/.test(url.hostname) &&
      !url.hostname.includes(":")
    );
  } catch {
    return false;
  }
}
export function resolveVerifiedProductImage(
  product: ProductQuery,
  entries: Record<string, VerifiedImage>,
): ProductImageResolution {
  const entry = product.id ? entries[product.id] : undefined;
  const matches =
    entry?.verified === true &&
    normalize(entry.productName) === normalize(product.name) &&
    normalize(entry.brand) === normalize(product.brand || "") &&
    /^\/images\/verified\/[a-z0-9._-]+\.webp$/.test(entry.url) &&
    /^[a-f0-9]{64}$/.test(entry.sha256) &&
    entry.url.endsWith(`${entry.sha256.slice(0, 16)}.webp`) &&
    publicSource(entry.sourcePage) &&
    publicSource(entry.sourceImage) &&
    entry.width > 0 &&
    entry.width <= 960 &&
    entry.height > 0 &&
    entry.height <= 960 &&
    (entry.color === undefined ||
      normalize(entry.color) === normalize(product.color || "")) &&
    entry.bytes > 0 &&
    entry.bytes <= 140000 &&
    Object.entries(entry.attributes || {}).every(
      ([key, value]) => product.attributes?.[key] === value,
    );
  if (matches)
    return {
      url: entry.url,
      alt: product.name,
      source: entry.sourcePage,
      attribution: entry.attribution,
      reviewedAt: entry.reviewedAt,
      width: entry.width,
      height: entry.height,
    };
  return {
    url: "",
    alt: product.name,
    source: "",
    attribution: "Exact product photograph awaiting verification",
    reviewedAt: "",
    width: 600,
    height: 600,
  };
}
