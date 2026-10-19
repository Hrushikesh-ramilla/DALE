"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Check, ShoppingBag, Search, SlidersHorizontal } from "lucide-react";
import {
  leafTitles,
  leafToParentCategory,
  getDepartmentForLeaf,
  type LeafTypeKey,
} from "@/domain/departments";
import { usePublishedCatalog } from "./use-published-catalog";
import { ProductArt } from "./product-art";
import { Breadcrumbs } from "./breadcrumbs";
import { useStore } from "./store-context";
import { formatMoney } from "@/domain/money";
import type { Product } from "@/domain/catalog";

export function CategoryCatalogView({ leaf }: { leaf: LeafTypeKey }) {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"featured" | "price-asc" | "price-desc" | "brand-asc">("featured");

  const store = useStore();
  const parentCat = leafToParentCategory[leaf] || leaf;
  const department = getDepartmentForLeaf(leaf);

  // Fetch catalog from live database
  const catalog = usePublishedCatalog({
    enabled: true,
    leafType: leaf,
    brand: selectedBrand,
    query: searchQuery,
  });

  const allProducts = catalog.products;

  // Extract unique brands from loaded products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const p of allProducts) {
      if (p.brand) brands.add(p.brand);
    }
    return Array.from(brands).sort();
  }, [allProducts]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...allProducts];
    if (sortOrder === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "brand-asc") {
      list.sort((a, b) => (a.brand || "").localeCompare(b.brand || ""));
    }
    return list;
  }, [allProducts, sortOrder]);

  const title = leafTitles[leaf] || leaf;

  return (
    <div className="category-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(department
            ? [{ label: department.title, href: `/department/${department.id}` }]
            : []),
          { label: title },
        ]}
      />

      <header className="category-page-header">
        <span className="eyebrow">
          {department ? department.title.toUpperCase() : "THE COLLECTION"} / {parentCat.toUpperCase()}
        </span>
        <h1>{title}</h1>
        <p>
          {catalog.total > 0 ? `${catalog.total} authenticated models` : "Authenticated luxury models"} · 100% verified merchant provenance · Technical architecture cards included.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="category-filter-toolbar">
        {availableBrands.length > 0 && (
          <div className="brand-pill-bar">
            <span className="brand-pill-bar-label">Brands:</span>
            <div className="brand-pills-wrap">
              <button
                type="button"
                className={`brand-filter-pill ${selectedBrand === "" ? "active" : ""}`}
                onClick={() => setSelectedBrand("")}
              >
                All Brands ({allProducts.length})
              </button>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className={`brand-filter-pill ${selectedBrand === brand ? "active" : ""}`}
                  onClick={() => setSelectedBrand(brand === selectedBrand ? "" : brand)}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="category-filter-secondary">
          <div style={{ position: "relative", flexGrow: 1, maxWidth: 420 }}>
            <input
              type="text"
              placeholder={`Search in ${title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="category-search-input"
              style={{ width: "100%", paddingLeft: 34 }}
            />
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ fontSize: 13, color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
              <SlidersHorizontal size={14} /> Sort:
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 4,
                  border: "1px solid #d2cdc2",
                  background: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="featured">Featured Sequence</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="brand-asc">Brand: A to Z</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {catalog.loading && sortedProducts.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#777" }}>
          Loading collection...
        </div>
      ) : sortedProducts.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#777" }}>
          No models matching the selected criteria.
        </div>
      ) : (
        <section aria-label="Product list">
          <div className="product-grid">
            {sortedProducts.map((product) => (
              <article className="product-card" key={product.id}>
                {/* Visual Card Link */}
                <div className="card-visual">
                  <Link
                    href={`/product/${product.id}`}
                    style={{ display: "block", textDecoration: "none" }}
                    aria-label={`View ${product.name}`}
                  >
                    <ProductArt product={product} />
                  </Link>

                  <Link
                    href={`/product/${product.id}`}
                    className="product-view"
                    aria-label={`View details for ${product.name}`}
                  >
                    <ArrowRight size={17} />
                  </Link>
                </div>

                <div className="card-details">
                  <div className="product-topline">
                    <span className="fit-label">
                      <Check size={12} /> {product.brand || "Authenticated House"}
                    </span>
                    {product.sponsored && (
                      <span className="sponsored">Sponsored</span>
                    )}
                  </div>

                  <h3>
                    <Link
                      href={`/product/${product.id}`}
                      className="product-title"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {product.name}
                    </Link>
                  </h3>

                  <p>{product.description}</p>

                  <div className="spec-tags">
                    {product.specs.slice(0, 2).map((spec) => (
                      <span key={spec}>{spec}</span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "auto",
                      paddingTop: 16,
                      borderTop: "1px solid #dedbd2",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 18, fontWeight: 700 }}>
                        {formatMoney(product.price)}
                      </strong>
                      <small style={{ display: "block", fontSize: 11, color: "#777" }}>
                        USD · Insured Delivery
                      </small>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="button primary small"
                        onClick={() => void store.choose(product)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <ShoppingBag size={13} />
                        <span>Buy Now</span>
                      </button>

                      <Link
                        href={`/product/${product.id}`}
                        className="button secondary small"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <span>Details</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {catalog.loadMore && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button
                type="button"
                className="button secondary"
                onClick={catalog.loadMore}
                disabled={catalog.loading}
              >
                {catalog.loading ? "Loading more..." : "Load More Models"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
