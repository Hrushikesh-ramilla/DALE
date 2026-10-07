"use client";
import dynamic from "next/dynamic";
import type { Product } from "@/domain/catalog";
const Scene = dynamic(() => import("./product-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" aria-label="Loading product view" />
  ),
});
export function ProductViewer({ product }: { product: Product }) {
  return (
    <div className="product-viewer">
      <Scene product={product} />
    </div>
  );
}
