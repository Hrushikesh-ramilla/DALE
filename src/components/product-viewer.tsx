"use client";
import dynamic from "next/dynamic";
import type { Product } from "@/domain/catalog";
import { ProductPhotograph } from "./product-photograph";
const Scene = dynamic(() => import("./product-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" aria-label="Loading product view" />
  ),
});
export function ProductViewer({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  if (product.media || product.brand || product.category) {
    return (
      <div className="product-viewer">
        <ProductPhotograph product={product} priority={priority} />
      </div>
    );
  }
  return (
    <div className="product-viewer">
      <Scene product={product} />
    </div>
  );
}
