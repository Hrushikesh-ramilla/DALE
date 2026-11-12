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
  priority = false,
}: {
  product: Product;
  compact?: boolean;
  priority?: boolean;
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
        background: "transparent",
        width: compact ? "120px" : "100%",
        height: compact ? "120px" : "100%",
        minWidth: compact ? "120px" : undefined,
        maxWidth: compact ? "120px" : undefined,
        flexShrink: compact ? 0 : undefined,
        borderRadius: "0px",
        border: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
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
            unoptimized
            sizes={
              detailPage
                ? "(max-width: 640px) 90vw, 50vw"
                : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            }
            quality={75}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
            onError={() => setFailedSource(imageUrl!)}
          />
        ) : (
          <div
            role="status"
            aria-label={`${product.name} presentation`}
            style={{
              color: "#c9cbcf",
              textAlign: "center",
              padding: "24px",
              fontSize: "12px",
              lineHeight: 1.6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "1px",
                color: "#f8fafc",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {(product.brand || product.name || "D").slice(0, 2).toUpperCase()}
            </div>
            <span
              style={{ display: "block", fontWeight: 600, color: "#f8fafc", fontSize: "13px" }}
            >
              {product.name}
            </span>
            <span style={{ fontSize: "11px", color: "#8a909a", letterSpacing: "0.5px" }}>
              {product.brand || "Authentic Selection"}
            </span>
          </div>
        )}
      </div>
    </figure>
  );
}
