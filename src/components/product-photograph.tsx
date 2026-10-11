"use client";
import { useState } from "react";
import Image from "next/image";
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
        <Image
          src={product.media.url}
          alt={product.media.alt}
          width={768}
          height={768}
          sizes="(max-width: 640px) 85vw, (max-width: 1200px) 45vw, 25vw"
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
