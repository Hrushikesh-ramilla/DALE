"use client";
import dynamic from "next/dynamic";
import type { Product } from "@/domain/catalog";
import { ProductArt } from "./product-art";
const Scene = dynamic(() => import("./product-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" aria-label="Loading product view" />
  ),
});
export function ProductViewer({ product }: { product: Product }) {
  return (
    <div className="product-viewer">
      <div className="scene-loading-art" aria-hidden="true">
        <ProductArt product={product} />
      </div>
      <Scene product={product} />
    </div>
  );
}
