"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { Product } from "@/domain/catalog";
import {
  leafTitles,
  getDepartmentForLeaf,
  type LeafTypeKey,
} from "@/domain/departments";
import { ProductArt } from "./product-art";
import { Breadcrumbs } from "./breadcrumbs";
import { LuxuryArchitectureCard } from "./luxury-architecture-card";
import { useStore } from "./store-context";
import { useCopilot } from "./copilot/copilot-context";
import { formatMoney } from "@/domain/money";

export function ProductDetailView({ product }: { product: Product }) {
  const store = useStore();
  const copilot = useCopilot();

  const leaf =
    (product.attributes?.leafType as LeafTypeKey) ||
    (product.category as LeafTypeKey);
  const department = getDepartmentForLeaf(leaf);
  const categoryTitle = leafTitles[leaf] || product.category;

  return (
    <div className="pdp-page" data-product-id={product.id}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(department
            ? [
                {
                  label: department.title,
                  href: `/department/${department.id}`,
                },
              ]
            : []),
          { label: categoryTitle, href: `/category/${leaf}` },
          { label: product.name },
        ]}
      />

      {/* Main 2-Column Hero */}
      <div className="pdp-grid">
        {/* Left: Visual Frame */}
        <div className="pdp-visual-pane">
          <ProductArt product={product} />
        </div>

        {/* Right: Purchase & Provenance Rail */}
        <div className="pdp-details-pane">
          <div className="pdp-brand-tag">
            {product.brand || "AUTHENTICATED LUXURY HOUSE"}
          </div>

          <h1 className="pdp-title">{product.name}</h1>

          <p className="pdp-desc">{product.description}</p>

          <div className="pdp-price-row">
            <span className="pdp-price-value">
              {formatMoney(product.price)}
            </span>
            <span className="pdp-price-meta">
              USD · Insured Express Shipping Included
            </span>
          </div>

          {/* Key Facts */}
          <ul className="product-facts" style={{ margin: "16px 0 24px" }}>
            {product.specs.map((spec) => (
              <li key={spec}>
                <Check size={14} />
                <span>{spec}</span>
              </li>
            ))}
          </ul>

          {/* Action Buttons */}
          <div className="pdp-actions-wrap">
            <button
              type="button"
              className="pdp-button-concierge"
              disabled={product.comparisonOnly || product.stock < 1}
              onClick={() => copilot.addToCart(product)}
            >
              <ShoppingBag size={18} />
              <span>Add to cart</span>
            </button>
            <button
              type="button"
              className="pdp-button-concierge"
              onClick={() =>
                void copilot
                  .mutateCollection("wishlist", "add", product.id)
                  .catch(() => {})
              }
            >
              Save to wishlist
            </button>
            <button
              type="button"
              className="pdp-button-checkout"
              data-agent-control="Review this product's PayPal quote"
              onClick={() => void store.choose(product)}
            >
              <ShoppingBag size={18} />
              <span>PayPal Fast Checkout · {formatMoney(product.price)}</span>
            </button>

            <button
              type="button"
              className="pdp-button-concierge"
              onClick={() => {
                void copilot.sendMessage(
                  `Explain the recorded facts and missing information for product ${product.id}.`,
                );
              }}
            >
              <Sparkles size={16} />
              <span>Inquire with DALE Concierge</span>
            </button>
          </div>

          {/* Buyer Protection Guarantee */}
          <div className="pdp-guarantee-box">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              <ShieldCheck size={16} color="#0070ba" />
              <span>PayPal sandbox checkout</span>
            </div>
            <p style={{ margin: 0, fontSize: 12 }}>
              Review the recorded product specifications and missing facts
              before approval. The demo merchant offers a 30-day return request
              policy from recorded delivery, with review where needed.
              Fulfillment is simulated.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Luxury Architecture Card */}
      <div className="pdp-architecture-wrap">
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "#888",
            }}
          >
            CRAFTSMANSHIP & SPECIFICATIONS
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-serif, "Playfair Display", serif)',
              fontSize: 30,
              margin: "6px 0 0",
            }}
          >
            Technical Luxury Architecture
          </h2>
        </div>

        <LuxuryArchitectureCard product={product} />
      </div>

      {/* Complete Specifications Table */}
      {product.attributes && Object.keys(product.attributes).length > 0 && (
        <div className="pdp-specs-table-wrap">
          <h3>Recorded Technical Specifications</h3>
          <table className="pdp-specs-table">
            <tbody>
              {Object.entries(product.attributes).map(([key, val]) => (
                <tr key={key}>
                  <th>
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </th>
                  <td>{String(val)}</td>
                </tr>
              ))}
              {product.brand && (
                <tr>
                  <th>Brand House</th>
                  <td>{product.brand}</td>
                </tr>
              )}
              {product.compatibleModels &&
                product.compatibleModels.length > 0 && (
                  <tr>
                    <th>Compatible Profiles</th>
                    <td>{product.compatibleModels.join(", ")}</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}

      {/* Back to Category Link */}
      <div
        style={{
          marginTop: 40,
          paddingTop: 24,
          borderTop: "1px solid #dcd8ce",
        }}
      >
        <Link
          href={`/category/${leaf}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#111",
            textDecoration: "none",
          }}
        >
          <span>Return to {categoryTitle} Collection</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
