import type { Product } from "./catalog";
import { isLeafTypeKey, type LeafTypeKey } from "./departments";

/** Taxonomy from an already recorded identity/type, not a new product fact.
 * Broad categories are never assigned an arbitrary default leaf. */
export function catalogLeaf(product: Product): LeafTypeKey | undefined {
  if (product.leafType && isLeafTypeKey(product.leafType))
    return product.leafType;
  if (isLeafTypeKey(product.category)) return product.category;
  const type = String(product.attributes?.productType || "")
    .toLowerCase()
    .trim();
  const types: Record<string, LeafTypeKey> = {
    keyboard: "keyboards",
    mouse: "mice",
    headphones: "headphones",
    "t-shirt": "t-shirts",
    tote: "handbags",
    "crossbody bag": "handbags",
    "key pouch": "wallets",
    mug: "kitchenware",
  };
  if (types[type]) return types[type];
  if (product.category === "storage" && /\bportable SSD\b/i.test(product.name))
    return "portable-ssds";
  if (
    product.category === "chargers" &&
    /\b(?:power adapter|adapter\s*\+)/i.test(product.name)
  )
    return "wall-chargers";
  return undefined;
}
