"use client";
import { useState } from "react";
import type { Product } from "@/domain/catalog";
export function ProductPhotograph({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!product.media) return null;
  return (
    <figure
      className={`product-art product-photograph ${compact ? "compact" : ""}`}
    >
      {failed ? (
        <div role="status">
          <strong>{product.name}</strong>
          <p>Manufacturer photograph unavailable.</p>
        </div>
      ) : (
        <img
          src={product.media.url}
          alt={product.media.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        <a
          href={product.media.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          {product.media.attribution}
        </a>
      </figcaption>
    </figure>
  );
}
