"use client";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./verified-product-photograph.module.css";
import type { Product } from "@/domain/catalog";
import { getVerifiedProductImage } from "@/domain/verified-product-image-registry";

export function VerifiedProductPhotograph({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const resolved = getVerifiedProductImage(product);
  const detailPage = usePathname()?.startsWith("/product/");
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const available = !!resolved.url && failedSource !== resolved.url;
  return (
    <figure
      className={`product-art product-photograph ${styles.frame} ${compact ? "compact" : ""}`}
      data-product-id={product.id}
      data-image-verification={resolved.url ? "verified" : "unverified"}
      style={{
        position: "relative",
        margin: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #fbfbfb 0%, #f4f3ef 100%)",
        width: "100%",
        height: "100%",
        borderRadius: "4px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: compact ? "100%" : "calc(100% - 22px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: compact ? "8px" : "16px",
        }}
      >
        {available ? (
          <Image
            src={resolved.url}
            alt={product.name}
            width={resolved.width}
            height={resolved.height}
            sizes={
              detailPage
                ? "(max-width: 640px) 90vw, 50vw"
                : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            }
            quality={75}
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
            onError={() => setFailedSource(resolved.url)}
          />
        ) : (
          <div
            role="status"
            aria-label={`Photograph unavailable for ${product.name}`}
            style={{
              color: "#57534e",
              textAlign: "center",
              padding: "24px",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            <span style={{ display: "block", fontWeight: 600 }}>
              {product.name}
            </span>
            {resolved.url
              ? "Manufacturer photograph unavailable."
              : "Exact product photograph awaiting verification."}
          </div>
        )}
      </div>
      {!compact && (
        <figcaption
          style={{
            fontSize: "9px",
            letterSpacing: "0.06em",
            color: "#69645b",
            padding: "2px 8px 6px",
            textAlign: "center",
            width: "100%",
          }}
        >
          {resolved.source ? (
            <a href={resolved.source} target="_blank" rel="noopener noreferrer">
              Product image source
            </a>
          ) : (
            "Image review pending"
          )}
        </figcaption>
      )}
    </figure>
  );
}
