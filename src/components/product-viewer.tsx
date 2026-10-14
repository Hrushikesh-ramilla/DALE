"use client";
import dynamic from "next/dynamic";
import type { Product } from "@/domain/catalog";
import { FeaturedProductArt } from "./featured-product-art";
import { ProductPhotograph } from "./product-photograph";
const Scene = dynamic(() => import("./product-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" aria-label="Loading product view" />
  ),
});
export function ProductViewer({ product }: { product: Product }) {
  if (product.media) return <div className="product-viewer"><ProductPhotograph key={product.media.url} product={product} /></div>;
  if (product.brand)
    return (
      <div className="product-viewer">
        <FeaturedProductArt product={product} />
      </div>
    );
  return (
    <div className="product-viewer">
      <Scene product={product} />
    </div>
  );
}
