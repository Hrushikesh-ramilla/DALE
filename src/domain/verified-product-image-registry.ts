import registry from "../../catalog/media/verified-product-images.json";
import {
  resolveVerifiedProductImage,
  type ProductQuery,
  type VerifiedImage,
} from "./verified-product-image";
export function getVerifiedProductImage(product: ProductQuery) {
  return resolveVerifiedProductImage(
    product,
    registry.entries as Record<string, VerifiedImage>,
  );
}
