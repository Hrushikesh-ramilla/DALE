"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Layers,
} from "lucide-react";
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
import { useCopilot } from "./copilot/copilot-context";
import { formatMoney } from "@/domain/money";
import type { CategoryBrandSummary } from "@/server/catalog-store";

function getSmartChipsForLeaf(leaf: LeafTypeKey): string[] {
  switch (leaf) {
    case "suits":
      return ["Under $3,500", "Under $5,000", "Brioni", "Canali", "Wool & Silk", "Dinner Suit", "Clear All"];
    case "t-shirts":
      return ["Under $400", "Under $600", "Balenciaga", "Brunello Cucinelli", "Mercerized Cotton", "Clear All"];
    case "phones":
      return ["Apple", "Samsung", "OnePlus", "Google", "Under $800", "Under $1,200", "Foldable Displays", "Clear All"];
    case "laptops":
      return ["Apple", "Dell", "Lenovo", "Under $1,500", "Under $2,500", "Workstation", "Clear All"];
    case "fragrance":
      return ["Under $300", "Amouage", "Creed", "Maison Francis Kurkdjian", "Eau de Parfum", "Clear All"];
    case "handbags":
    case "backpacks":
    case "wallets":
      return ["Hermès", "Goyard", "Louis Vuitton", "Under $2,500", "Leather", "Clear All"];
    case "loafers":
    case "formal-shoes":
    case "boots":
      return ["Berluti", "John Lobb", "Loro Piana", "Under $1,500", "Goodyear Welt", "Clear All"];
    case "serums":
    case "cleansers":
    case "moisturizers":
      return ["Augustinus Bader", "La Mer", "La Prairie", "Cellular", "Under $300", "Clear All"];
    default:
      return ["Under $500", "Under $1,500", "Luxury Tier", "Top Rated", "Clear All"];
  }
}

function CategoryCatalogContent({
  leaf,
  initialBrands = [],
}: {
  leaf: LeafTypeKey;
  initialBrands?: CategoryBrandSummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useStore();
  const copilot = useCopilot();

  const brandParam = searchParams.get("brand") || "";
  const viewParam = searchParams.get("view") || "";

  // Catalog Space is active when a brand is selected OR view="all" is requested
  const isCatalogSpace = Boolean(brandParam || viewParam === "all" || viewParam === "catalog");

  const [searchQuery, setSearchQuery] = useState("");
  const budgetParameter = searchParams.get("budget");
  const [budgetOverride, setBudgetOverride] = useState<{parameter:string|null;value:number|null}|null>(null);
  const parsedBudget = Number(budgetParameter);
  const maxBudget = budgetOverride?.parameter === budgetParameter
    ? budgetOverride.value
    : Number.isFinite(parsedBudget) && parsedBudget > 0 ? Math.floor(parsedBudget * 100+1e-7) : null;
  const setMaxBudget = (value:number|null) => setBudgetOverride({parameter:budgetParameter,value});
  const [sortOrder, setSortOrder] = useState<"featured" | "price-asc" | "price-desc" | "brand-asc">("featured");

  // AI Assistant state
  const [aiInput, setAiInput] = useState("");
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAiFiltering, setIsAiFiltering] = useState(false);

  const parentCat = leafToParentCategory[leaf] || leaf;
  const department = getDepartmentForLeaf(leaf);
  const title = leafTitles[leaf] || leaf;

  // Fetch catalog products from live database
  const catalog = usePublishedCatalog({
    enabled: true,
    leafType: leaf,
    brand: brandParam,
    query: searchQuery,
    budget: maxBudget || undefined,
  });

  // Combine initialBrands with live categoryBrands
  const brandsList: CategoryBrandSummary[] = useMemo(() => {
    if (initialBrands.length > 0) return initialBrands;
    if (catalog.categoryBrands && catalog.categoryBrands.length > 0) {
      return catalog.categoryBrands;
    }
    return [];
  }, [initialBrands, catalog.categoryBrands]);

  // Total items across all brands
  const totalModelsAcrossHouses = useMemo(() => {
    if (brandsList.length > 0) {
      return brandsList.reduce((sum, b) => sum + (b.count || 0), 0);
    }
    return catalog.total || 0;
  }, [brandsList, catalog.total]);

  // Filter products by maxBudget if set
  const filteredProducts = useMemo(() => {
    let list = catalog.products;
    if (maxBudget) {
      list = list.filter((p) => p.price <= maxBudget);
    }
    return list;
  }, [catalog.products, maxBudget]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortOrder === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "brand-asc") {
      list.sort((a, b) => (a.brand || "").localeCompare(b.brand || ""));
    }
    return list;
  }, [filteredProducts, sortOrder]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("dale:ui-state", {detail: {categories:[leaf],brands:brandParam?[brandParam]:[],query:searchQuery,max_price:maxBudget,sort:sortOrder === "price-asc" ? "price_asc" : sortOrder === "price-desc" ? "price_desc" : sortOrder === "brand-asc" ? "brand_asc" : "relevance"}}));
    return () => { window.dispatchEvent(new CustomEvent("dale:ui-state", {detail:{}})); };
  }, [leaf,brandParam,searchQuery,maxBudget,sortOrder]);
  const handleAiFilter = async (text: string) => {
    if (!text.trim()) return;
    setIsAiFiltering(true);
    setAiFeedback(null);
    try { await copilot.sendMessage(text); } finally { setIsAiFiltering(false); }
  };

  const smartChips = getSmartChipsForLeaf(leaf);

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
          Explore authenticated models across prestigious luxury houses. 100% verified merchant provenance and complete technical specifications.
        </p>
        <div className="category-stats-bar">
          <span className="pill">{totalModelsAcrossHouses} Models</span>
          <span>{brandsList.length} Authenticated Houses</span>
        </div>
      </header>

      {/* Universal DALE AI Shopping Assistant Concierge Bar - Prominently visible at top */}
      <section
        className="category-ai-concierge-panel"
        aria-label="AI Shopping Concierge"
      >
        <div className="concierge-header-row">
          <div className="concierge-badge">
            <Sparkles size={15} className="sparkle-icon" />
            <span>DALE AI Shopping Concierge · Live Dynamic Filter</span>
          </div>
          {aiFeedback && (
            <div className="concierge-feedback-tag">
              {aiFeedback}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAiFilter(aiInput);
          }}
          className="concierge-input-form"
        >
          <input
            type="text"
            placeholder={`Ask DALE to filter ${title} (e.g. "Apple iPhone", "Under $800", "Foldable Displays", "Samsung Galaxy")...`}
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
          <button type="submit" disabled={isAiFiltering}>
            {isAiFiltering ? "Filtering..." : "Filter with AI"}
          </button>
        </form>

        <div className="ai-concierge-chips">
          <span className="ai-concierge-chip-label">Quick AI Filters:</span>
          {smartChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="ai-concierge-chip"
              onClick={() => handleAiFilter(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Active Filters Bar */}
        {(brandParam || maxBudget || searchQuery) && (
          <div className="concierge-active-filters-bar">
            <span className="active-filters-label">Active Filters:</span>
            {brandParam && (
              <span className="active-filter-pill">
                <span>House: {brandParam}</span>
                <button
                  type="button"
                  onClick={() => router.push(`/category/${leaf}?view=all`)}
                  aria-label="Remove brand filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {maxBudget && (
              <span className="active-filter-pill">
                <span>Max: {formatMoney(maxBudget)}</span>
                <button
                  type="button"
                  onClick={() => setMaxBudget(null)}
                  aria-label="Remove budget filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="active-filter-pill">
                <span>"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Remove search filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              className="clear-all-filters-btn"
              onClick={() => {
                setMaxBudget(null);
                setSearchQuery("");
                router.push(`/category/${leaf}?view=all`);
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* MODE 1: THE BRAND SHOWCASE HUB */}
      {!isCatalogSpace ? (
        <div className="category-houses-hub">

          {/* Top Utility Bar with Prominent "Explore All" Button */}
          <div className="hub-top-utility-bar">
            <div>
              <div className="utility-text">Complete {title} Collection</div>
              <div className="utility-subtext">
                Browse all {totalModelsAcrossHouses} authenticated models directly or select a house below
              </div>
            </div>
            <Link
              href={`/category/${leaf}?view=all`}
              className="explore-all-top-btn"
            >
              <span>Explore All ({totalModelsAcrossHouses})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Brand Showcase Grid */}
          <section aria-label={`${title} Brands`}>
            <div className="category-brand-grid">
              {brandsList.map((brand) => (
                <Link
                  key={brand.name}
                  href={`/category/${leaf}?brand=${encodeURIComponent(brand.name)}`}
                  className="category-brand-card"
                >
                  <div className="card-top-row">
                    <h3 className="brand-name">{brand.name}</h3>
                    <span className="brand-count-pill">{brand.count} Models</span>
                  </div>

                  <div className="brand-preview-visual">
                    <div className="brand-preview-stage-dome" />
                    <div className="brand-preview-shadow" />
                    {brand.heroImage ? (
                      <Image
                        src={brand.heroImage}
                        alt={`${brand.name} ${title}`}
                        width={360}
                        height={240}
                        quality={90}
                        className="brand-hero-img"
                      />
                    ) : brand.sampleProduct ? (
                      <ProductArt product={brand.sampleProduct} compact />
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>{brand.name}</div>
                    )}
                  </div>

                  <div className="card-bottom-row">
                    <span className="brand-price-tag">
                      {brand.minPrice ? `From ${formatMoney(brand.minPrice)}` : "Verified House"}
                    </span>
                    <span className="brand-action-link">
                      <span>View House</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Hub Bottom CTA Banner */}
          <section className="hub-bottom-banner" aria-label="Explore Full Collection">
            <h2>Explore the Entire {title} Portfolio</h2>
            <p>
              Compare verified models across all {brandsList.length} houses with detailed material, sizing, and architectural specifications.
            </p>
            <Link
              href={`/category/${leaf}?view=all`}
              className="button primary explore-all-top-btn"
              style={{ display: "inline-flex" }}
            >
              <span>See All {totalModelsAcrossHouses} Models</span>
              <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      ) : (
        /* MODE 2: FILTERED CATALOG SPACE */
        <div className="category-catalog-space">
          {/* Top Return Bar */}
          <div className="catalog-space-topbar">
            <Link href={`/category/${leaf}`} className="back-to-hub-link">
              <ArrowLeft size={14} />
              <span>← Return to All {title} Houses</span>
            </Link>
          </div>

          {/* Catalog Header */}
          <header className="catalog-space-header">
            <div className="header-info">
              <div className="eyebrow">
                {brandParam ? "AUTHENTICATED HOUSE" : "COMPLETE COLLECTION"}
              </div>
              <h1>{brandParam || `All ${title}`}</h1>
              <p>
                Showing {sortedProducts.length} authenticated model{sortedProducts.length === 1 ? "" : "s"}
                {brandParam ? ` from ${brandParam}` : ` across ${brandsList.length} houses`}
                {maxBudget ? ` · Under ${formatMoney(maxBudget)}` : ""}
              </p>
            </div>

            {brandParam && (
              <Link
                href={`/category/${leaf}?view=all`}
                className="button secondary small"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Layers size={13} />
                <span>View All Houses ({totalModelsAcrossHouses})</span>
              </Link>
            )}
          </header>

          {/* Horizontal Luxury Brand Bar */}
          {brandsList.length > 0 && (
            <div className="category-brand-bar">
              <span className="category-brand-bar-label">Houses:</span>
              <div className="category-brand-bar-pills">
                <button
                  type="button"
                  className={`category-brand-pill ${!brandParam ? "active" : ""}`}
                  onClick={() => router.push(`/category/${leaf}?view=all`)}
                >
                  All ({totalModelsAcrossHouses})
                </button>
                {brandsList.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    className={`category-brand-pill ${brandParam === b.name ? "active" : ""}`}
                    onClick={() =>
                      router.push(
                        b.name === brandParam
                          ? `/category/${leaf}?view=all`
                          : `/category/${leaf}?brand=${encodeURIComponent(b.name)}`,
                      )
                    }
                  >
                    {b.name} ({b.count})
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Secondary Filter & Sort Toolbar */}
          <div className="category-filter-secondary">
            <div style={{ position: "relative", flexGrow: 1, maxWidth: 420 }}>
              <input
                type="text"
                placeholder={`Search models in ${brandParam || title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="category-search-input"
              />
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label
                style={{
                  fontSize: 13,
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <SlidersHorizontal size={14} /> Sort:
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="category-sort-select"
                >
                  <option value="featured">Featured Sequence</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="brand-asc">Brand: A to Z</option>
                </select>
              </label>
            </div>
          </div>

          {/* Product Grid */}
          {catalog.loading && sortedProducts.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              Loading collection...
            </div>
          ) : sortedProducts.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              No models matching the selected criteria.
            </div>
          ) : (
            <section aria-label="Product list">
              <div className="product-grid">
                {sortedProducts.map((product) => (
                  <article className="product-card" key={product.id} data-product-id={product.id}>
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
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>
                            {formatMoney(product.price)}
                          </strong>
                          <small style={{ display: "block", fontSize: 11, color: "#64748b" }}>
                            USD · Sandbox offer
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
      )}
    </div>
  );
}

export function CategoryCatalogView({
  leaf,
  initialBrands = [],
}: {
  leaf: LeafTypeKey;
  initialBrands?: CategoryBrandSummary[];
}) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
          Loading collection...
        </div>
      }
    >
      <CategoryCatalogContent leaf={leaf} initialBrands={initialBrands} />
    </Suspense>
  );
}
