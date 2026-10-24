import camera from "../../catalog/facts/samsung-s25-ultra-camera.json";
import type { Product } from "./catalog";

// Reviewed source facts, never a prompt-to-product routing table. Existing offers,
// images and customer choices are independent of specification enrichment.
export const reviewedProductFacts = [camera];
export function withReviewedProductFacts(product: Product): Product {
  const entry = reviewedProductFacts.find((f) => f.productId === product.id);
  if (!entry) return product;
  if (
    product.brand !== entry.brand ||
    product.attributes?.modelName !== entry.modelName ||
    product.source !== entry.sourceUrl
  )
    return product;
  return {
    ...product,
    attributes: { ...product.attributes, ...entry.facts },
    specs: [...new Set([...product.specs, ...entry.specs])],
  };
}
