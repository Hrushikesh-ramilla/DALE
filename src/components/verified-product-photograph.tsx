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
  const imageUrl = resolved.url || product.media?.url;
  const available = !!imageUrl && failedSource !== imageUrl;
  return (
    <figure
      className={`product-art product-photograph ${styles.frame} ${compact ? "compact" : ""}`}
      data-product-id={product.id}
      data-image-verification={imageUrl ? "verified" : "unverified"}
      style={{
        position: "relative",
        margin: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.45) 0%, rgba(10, 13, 19, 0.95) 100%)",
        width: "100%",
        height: "100%",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
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
            src={imageUrl!}
            alt={product.name}
            width={resolved.width || 600}
            height={resolved.height || 600}
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
              filter: "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.55))",
            }}
            onError={() => setFailedSource(imageUrl!)}
          />
        ) : (
          <div
            role="status"
            aria-label={`Photograph unavailable for ${product.name}`}
            style={{
              color: "#94a3b8",
              textAlign: "center",
              padding: "24px",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            <span style={{ display: "block", fontWeight: 600, color: "#f8fafc" }}>
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
            color: "#64748b",
            padding: "2px 8px 6px",
            textAlign: "center",
            width: "100%",
          }}
        >
          {resolved.source || product.media?.source ? (
            <a
              href={resolved.source || product.media?.source}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              Verified Manufacturer Packshot
            </a>
          ) : (
            "Verified Catalog Asset"
          )}
        </figcaption>
      )}
    </figure>
  );
}
