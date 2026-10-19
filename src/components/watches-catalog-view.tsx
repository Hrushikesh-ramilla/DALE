"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Sparkles,
  Clock,
  RotateCcw,
  Send,
  X,
  Shield,
  Layers,
  Compass,
} from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { ProductArt } from "./product-art";
import { useStore } from "./store-context";
import { useCopilot } from "./copilot/copilot-context";
import { formatMoney } from "@/domain/money";
import type { Product } from "@/domain/catalog";
import { WatchBrandLogo } from "./watch-brand-logos";
import { HorologicalDial } from "./horological-dial";

// The 14 Authentic Horology Houses
export interface WatchBrandInfo {
  name: string;
  origin: string;
  est: number;
  tagline: string;
  count: number;
  signatureCalibre: string;
}

export const WATCH_BRANDS: WatchBrandInfo[] = [
  {
    name: "Blancpain",
    origin: "Le Brassus, Switzerland",
    est: 1735,
    tagline: "The World's Oldest Watchmaker & Fifty Fathoms",
    count: 5,
    signatureCalibre: "Manufacture Calibre 1315 (5 Days)",
  },
  {
    name: "Vacheron Constantin",
    origin: "Geneva, Switzerland",
    est: 1755,
    tagline: "Uninterrupted Horological Mastery Since 1755",
    count: 8,
    signatureCalibre: "Hallmark of Geneva Calibres",
  },
  {
    name: "Breguet",
    origin: "Vallée de Joux, Switzerland",
    est: 1775,
    tagline: "The Inventor of the Tourbillon & Pomme Hands",
    count: 5,
    signatureCalibre: "Calibre 777Q / 505SR1 Inverted",
  },
  {
    name: "Girard-Perregaux",
    origin: "La Chaux-de-Fonds, Switzerland",
    est: 1791,
    tagline: "Laureato Integrated Sport & Three Gold Bridges",
    count: 5,
    signatureCalibre: "Calibre GP01800 / GP03300",
  },
  {
    name: "Longines",
    origin: "Saint-Imier, Switzerland",
    est: 1832,
    tagline: "Elegance is an Attitude · Spirit Zulu Time",
    count: 8,
    signatureCalibre: "L844.4 COSC GMT Calibre",
  },
  {
    name: "Jaeger-LeCoultre",
    origin: "Le Sentier, Switzerland",
    est: 1833,
    tagline: "The Watchmaker of Watchmakers · Reverso",
    count: 10,
    signatureCalibre: "Calibre 822 / 853 Manual",
  },
  {
    name: "Patek Philippe",
    origin: "Geneva, Switzerland",
    est: 1839,
    tagline: "The Pinnacle of Holy Trinity Haute Horlogerie",
    count: 10,
    signatureCalibre: "Calibre 26-330 & 30-255 PS",
  },
  {
    name: "A. Lange & Söhne",
    origin: "Glashütte, Germany",
    est: 1845,
    tagline: "Saxon Fine Horology · Lange 1 & Datograph",
    count: 5,
    signatureCalibre: "Calibre L121.1 / L951.6 Hand-Wound",
  },
  {
    name: "Ulysse Nardin",
    origin: "Le Locle, Switzerland",
    est: 1846,
    tagline: "Freak Flying Carrousel & Marine Chronometers",
    count: 5,
    signatureCalibre: "Calibre UN-230 / UN-118 Silicium",
  },
  {
    name: "Cartier",
    origin: "Paris, France",
    est: 1847,
    tagline: "Iconic Santos, Tank & Panthère Silhouettes",
    count: 10,
    signatureCalibre: "1847 MC In-House & Quartz",
  },
  {
    name: "Omega",
    origin: "Biel/Bienne, Switzerland",
    est: 1848,
    tagline: "Speedmaster Moonwatch & Master Chronometer",
    count: 10,
    signatureCalibre: "Co-Axial Master Chronometer 3861",
  },
  {
    name: "Tissot",
    origin: "Le Locle, Switzerland",
    est: 1853,
    tagline: "Innovators by Tradition · Accessible Luxury",
    count: 20,
    signatureCalibre: "Powermatic 80 Silicium",
  },
  {
    name: "TAG Heuer",
    origin: "La Chaux-de-Fonds, Switzerland",
    est: 1860,
    tagline: "Carrera Glassbox & Monaco Chronographs",
    count: 8,
    signatureCalibre: "TH20-00 Heuer 02 & Solargraph",
  },
  {
    name: "IWC",
    origin: "Schaffhausen, Switzerland",
    est: 1868,
    tagline: "Precision Engineering & Portugieser Chronographs",
    count: 10,
    signatureCalibre: "Calibre 69355 / 82100 Pellaton",
  },
  {
    name: "Audemars Piguet",
    origin: "Le Brassus, Switzerland",
    est: 1875,
    tagline: "Royal Oak & Avant-Garde Complications",
    count: 8,
    signatureCalibre: "Calibre 4302 / 4401 Flyback",
  },
  {
    name: "Seiko",
    origin: "Tokyo, Japan",
    est: 1881,
    tagline: "Prospex Divers & Presage Mechanical Artistry",
    count: 6,
    signatureCalibre: "Calibre 6R55 / 6L35 Slimline",
  },
  {
    name: "Breitling",
    origin: "Grenchen, Switzerland",
    est: 1884,
    tagline: "Navitimer Aviation Slide Rule & Chronographs",
    count: 10,
    signatureCalibre: "Manufacture B01 / SuperQuartz",
  },
  {
    name: "Rolex",
    origin: "Geneva, Switzerland",
    est: 1905,
    tagline: "Oyster Perpetual & Superlative Chronometers",
    count: 20,
    signatureCalibre: "Calibre 4131 / 3235",
  },
  {
    name: "Grand Seiko",
    origin: "Shizukuishi, Japan",
    est: 1960,
    tagline: "The Nature of Time · Spring Drive & Hi-Beat",
    count: 10,
    signatureCalibre: "Spring Drive 9R65 / 9F Quartz",
  },
  {
    name: "Samsung",
    origin: "Suwon, South Korea",
    est: 2013,
    tagline: "Galaxy Watch Ultra & Classic Rotating Bezel",
    count: 6,
    signatureCalibre: "Exynos W1000 3nm 5-Core",
  },
  {
    name: "Apple",
    origin: "Cupertino, California, USA",
    est: 2015,
    tagline: "Apple Watch Ultra 2 & Series 10 Precision OLED",
    count: 6,
    signatureCalibre: "Apple S10 / S9 SiP Dual-Core",
  },
];

type MovementType = "all" | "automatic" | "mechanical" | "quartz" | "smartwatch";

function classifyMovement(movement: string = "", specs: string[] = []): "automatic" | "mechanical" | "quartz" | "smartwatch" {
  const text = `${movement} ${specs.join(" ")}`.toLowerCase();
  if (
    text.includes("smartwatch") ||
    text.includes("sip") ||
    text.includes("exynos") ||
    text.includes("apple watch") ||
    text.includes("galaxy watch") ||
    text.includes("neural engine")
  ) {
    return "smartwatch";
  }
  if (text.includes("quartz") || text.includes("solargraph") || text.includes("superquartz") || text.includes("solar")) {
    return "quartz";
  }
  if (
    text.includes("hand-wound") ||
    text.includes("manual") ||
    text.includes("hand wound") ||
    text.includes("hand wind") ||
    text.includes("l121.1") ||
    text.includes("l093.1") ||
    text.includes("l951") ||
    text.includes("l043")
  ) {
    return "mechanical";
  }
  if (text.includes("automatic") || text.includes("powermatic") || text.includes("self-winding")) {
    return "automatic";
  }
  if (text.includes("mechanical")) {
    return "mechanical";
  }
  return "automatic";
}

function WatchesCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useStore();
  const copilot = useCopilot();

  // Read URL parameters
  const brandParam = searchParams.get("brand") || "";
  const viewParam = searchParams.get("view") || "";

  // isCatalogSpace is true ONLY when a specific brand is selected OR view="all" is requested!
  const isCatalogSpace = Boolean(brandParam || viewParam === "all" || viewParam === "catalog");

  // Hub display mode: "dial" (interactive watch movement) or "matrix" (all 21 houses)
  const [hubDisplayMode, setHubDisplayMode] = useState<"dial" | "matrix">("dial");

  // Filter state in catalog space
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedBrand = brandParam;
  const [selectedMovement, setSelectedMovement] = useState<MovementType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"featured" | "price-asc" | "price-desc" | "brand-asc">("featured");
  const [priceTier, setPriceTier] = useState<"all" | "sub1k" | "1k-5k" | "5k-15k" | "15k+">("all");
  const [maxBudget, setMaxBudget] = useState<number | "">("");


  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  // Fetch all watches on mount
  useEffect(() => {
    let cancelled = false;
    async function loadWatches() {
      setLoading(true);
      try {
        const pages: {products:Product[];nextCursor:string|null}[]=[];
        let cursor:string|null=null;
        do {
          const response:Response=await fetch(`/api/catalog?category=watches${cursor?`&cursor=${encodeURIComponent(cursor)}`:""}`);
          if(!response.ok)throw new Error("Watch catalog request failed.");
          const data:{products:Product[];nextCursor:string|null}=await response.json();pages.push(data);cursor=data.nextCursor;
        } while(cursor&&!cancelled);
        if (cancelled) return;
        const combined: Product[] = pages.flatMap((p) => p.products || []);
        const unique = Array.from(new Map(combined.map((p) => [p.id, p])).values());
        setAllProducts(unique);
      } catch (err) {
        console.error("Failed to load watches catalog:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadWatches();
    return () => {
      cancelled = true;
    };
  }, []);

  // Movement counts computed across all loaded watches
  const movementCounts = useMemo(() => {
    const counts = { all: allProducts.length, automatic: 0, mechanical: 0, quartz: 0, smartwatch: 0 };
    for (const p of allProducts) {
      const mv = classifyMovement(p.attributes?.movement, p.specs);
      counts[mv]++;
    }
    return counts;
  }, [allProducts]);

  // Brand counts computed across loaded watches
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      const b = p.brand || p.attributes?.brand || "Other";
      counts[b] = (counts[b] || 0) + 1;
    }
    return counts;
  }, [allProducts]);

  const handleAiCommand = async (command: string) => {
    if (!command.trim()) return;
    setAiThinking(true);setAiMessage(null);
    try { await copilot.sendMessage(command);setAiPrompt(""); } finally { setAiThinking(false); }
  };
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("dale:ui-state",{detail:{categories:["watches"],brands:selectedBrand?[selectedBrand]:[],query:searchQuery,max_price:typeof maxBudget==="number"?maxBudget*100:null,attributes:selectedMovement==="all"?{}:{movement:selectedMovement}}}));
    return()=>{window.dispatchEvent(new CustomEvent("dale:ui-state",{detail:{}}));};
  },[selectedBrand,searchQuery,maxBudget,selectedMovement]);

  // Filtered & Sorted products (for Catalog Space)
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Brand filter
      if (selectedBrand && product.brand?.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Movement filter
      if (selectedMovement !== "all") {
        const mv = classifyMovement(product.attributes?.movement, product.specs);
        if (mv !== selectedMovement) return false;
      }

      // Price Tier filter
      const priceDollars = product.price / 100;
      if (priceTier === "sub1k" && priceDollars >= 1000) return false;
      if (priceTier === "1k-5k" && (priceDollars < 1000 || priceDollars >= 5000)) return false;
      if (priceTier === "5k-15k" && (priceDollars < 5000 || priceDollars >= 15000)) return false;
      if (priceTier === "15k+" && priceDollars < 15000) return false;

      // Custom Max Budget
      if (typeof maxBudget === "number" && maxBudget > 0 && priceDollars > maxBudget) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const haystack = [
          product.name,
          product.brand,
          product.description,
          ...(product.specs || []),
          String(product.attributes?.modelName || ""),
          String(product.attributes?.movement || ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [allProducts, selectedBrand, selectedMovement, priceTier, maxBudget, searchQuery]);

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

  const hasActiveFilters = Boolean(
    selectedBrand || selectedMovement !== "all" || priceTier !== "all" || maxBudget || searchQuery
  );

  // =========================================================================
  // VIEW 1: HOROLOGY HOUSES DIRECTORY (Brand Hub with Official Brand Logos)
  // When no brand is selected and not in ?view=all. NO PRODUCT GRID ON THIS PAGE!
  // =========================================================================
  if (!isCatalogSpace) {
    return (
      <div className="watches-category-experience houses-hub-view">
        {/* Top Navigation & Hub Utility Bar */}
        <div className="hub-top-utility-bar">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Watches" },
            ]}
          />

          {/* Mode Switcher: Dial vs All 21 Houses */}
          <div className="hub-mode-switcher">
            <button
              type="button"
              className={`mode-switch-btn ${hubDisplayMode === "dial" ? "active" : ""}`}
              onClick={() => setHubDisplayMode("dial")}
              title="Interactive Movement Dial"
            >
              <Compass size={13} />
              <span>Horological Dial</span>
            </button>
            <button
              type="button"
              className={`mode-switch-btn ${hubDisplayMode === "matrix" ? "active" : ""}`}
              onClick={() => setHubDisplayMode("matrix")}
              title="All 21 Manufacture Houses"
            >
              <Layers size={13} />
              <span>All 21 Houses</span>
            </button>
          </div>

          {/* Direct Unfiltered Catalog Action */}
          <Link
            href="/category/watches?view=all"
            className="button primary explore-all-top-btn"
          >
            <span>Explore All ({allProducts.length || 185})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* VIEW A: Grand Horological Watch Dial Showcase (Screen-Filling Hero) */}
        {hubDisplayMode === "dial" ? (
          <section className="watches-dial-hero" aria-label="Haute Horlogerie Showcase">
            <HorologicalDial
              brands={WATCH_BRANDS}
              brandCounts={brandCounts}
              onSelectBrand={(brandName) => router.push(`/category/watches?brand=${encodeURIComponent(brandName)}`)}
            />
          </section>
        ) : (
          /* VIEW B: Floating 3D Vector Logos (All 21 Houses Grid) */
          <section className="watches-houses-section" aria-label="All 21 Horological Houses">
            <div className="brand-logos-grid">
              {WATCH_BRANDS.map((brand) => (
                <Link
                  key={brand.name}
                  href={`/category/watches?brand=${encodeURIComponent(brand.name)}`}
                  className="brand-logo-tile"
                  aria-label={`Explore ${brand.name} watches`}
                >
                  <div className="brand-logo-3d-wrapper">
                    <WatchBrandLogo brand={brand.name} size={110} className="brand-tile-svg" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom Explore All CTA */}
            <div className="hub-bottom-cta">
              <div className="hub-bottom-card">
                <div>
                  <h3>Complete Horology Collection</h3>
                  <p>Filter by movement calibre, complication, or manufacture house.</p>
                </div>
                <Link
                  href="/category/watches?view=all"
                  className="button primary see-all-button"
                >
                  <span>Explore All Timepieces ({allProducts.length || 185} Watches)</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: THE DEDICATED WATCHES CATALOG SPACE
  // Entered via clicking any Brand Card OR clicking "Explore All Timepieces"
  // =========================================================================
  const activeBrandTitle = selectedBrand ? `${selectedBrand} Timepieces` : "All Precision & Luxury Timepieces";

  return (
    <div className="watches-category-experience catalog-space-view">
      {/* Navigation Top Bar */}
      <div className="catalog-space-topbar">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Watches", href: "/category/watches" },
            { label: selectedBrand || "All Timepieces" },
          ]}
        />

        <Link
          href="/category/watches"
          className="back-to-hub-link"
        >
          <ArrowLeft size={15} />
          <span>Back to All Horology Houses</span>
        </Link>
      </div>

      {/* Catalog Space Header */}
      <header className="catalog-space-header">
        <div className="catalog-header-main">
          {selectedBrand && (
            <div className="catalog-brand-logo-wrap">
              <WatchBrandLogo brand={selectedBrand} size={60} />
            </div>
          )}
          <div>
            <div className="eyebrow">
              {selectedBrand ? `RECORDED MANUFACTURE COLLECTION · ${selectedBrand.toUpperCase()}` : "COMPLETE HOROLOGY CATALOG"}
            </div>
            <h1>{activeBrandTitle}</h1>
            <p>
              {selectedBrand
                ? `${brandCounts[selectedBrand] || 0} recorded models from ${selectedBrand} with recorded movements and technical specifications.`
                : `${allProducts.length || 185} recorded models across 21 prestigious horological houses and smart manufactures.`}
            </p>
          </div>
        </div>

        <div className="catalog-header-actions">
          <Link
            href="/category/watches"
            className="button secondary small"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Compass size={14} />
            <span>Switch House</span>
          </Link>
        </div>
      </header>

      {/* HOROLOGY CONCIERGE (Filter & Search) */}
      <section className="dale-watch-concierge-panel" aria-label="Horology Concierge">
        <div className="concierge-header" style={{ marginBottom: 12 }}>
          <div className="concierge-title-row" style={{ marginBottom: 0 }}>
            <div className="concierge-badge">
              <Sparkles size={15} className="sparkle-icon" />
              <span>HOROLOGY CONCIERGE &amp; INTELLIGENT FILTER</span>
            </div>
          </div>
        </div>

        <form
          className="concierge-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAiCommand(aiPrompt);
          }}
        >
          <div className="concierge-input-wrap">
            <Search size={17} className="input-search-icon" />
            <input
              type="text"
              className="concierge-input"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder='Search references or ask: e.g. "Rolex under $15,000", "Automatic movements", "Filter by quartz"'
              disabled={aiThinking}
            />
            <button
              type="submit"
              className="button primary concierge-submit-btn"
              disabled={aiThinking || !aiPrompt.trim()}
            >
              {aiThinking ? <Clock size={15} className="spin" /> : <Send size={15} />}
              <span>{aiThinking ? "Filtering..." : "Ask DALE"}</span>
            </button>
          </div>
        </form>

        {/* Quick Action Prompt Chips */}
        <div className="concierge-chips-row">
          <span className="chips-label">Quick Prompts:</span>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Show Rolex under $15,000")}
          >
            &ldquo;Rolex under $15k&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Show automatic watches")}
          >
            &ldquo;Automatic movements&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Show quartz watches")}
          >
            &ldquo;Quartz timepieces&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Show manual mechanical watches")}
          >
            &ldquo;Mechanical / Hand-wound&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Show smartwatches")}
          >
            &ldquo;Smartwatches&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Show Tissot under $1,000")}
          >
            &ldquo;Tissot under $1,000&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill"
            onClick={() => handleAiCommand("Sort by price low to high")}
          >
            &ldquo;Sort: Low to High&rdquo;
          </button>
          <button
            type="button"
            className="concierge-prompt-pill reset"
            onClick={() => handleAiCommand("Reset filters")}
          >
            &ldquo;Reset all&rdquo;
          </button>
        </div>

        {/* AI Feedback Banner */}
        {aiMessage && (
          <div className="concierge-response-banner" role="status">
            <Sparkles size={15} />
            <p>{aiMessage}</p>
            <button
              type="button"
              className="close-response-btn"
              onClick={() => setAiMessage(null)}
              aria-label="Dismiss message"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </section>

      {/* FILTER TOOLBAR & GRID */}
      <section id="timepieces-grid" className="watches-grid-section" aria-label="Watches Catalog Grid">
        <div className="watches-filter-toolbar">
          {/* Movement Filter Bar */}
          <div className="filter-group-block">
            <div className="filter-group-label">
              <Layers size={13} />
              <span>Movement Type:</span>
            </div>
            <div className="filter-pills-wrap">
              <button
                type="button"
                className={`filter-pill ${selectedMovement === "all" ? "active" : ""}`}
                onClick={() => setSelectedMovement("all")}
              >
                All Movements ({movementCounts.all})
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedMovement === "automatic" ? "active" : ""}`}
                onClick={() => setSelectedMovement("automatic")}
              >
                Automatic Self-Winding ({movementCounts.automatic})
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedMovement === "mechanical" ? "active" : ""}`}
                onClick={() => setSelectedMovement("mechanical")}
              >
                Mechanical / Hand-Wound ({movementCounts.mechanical})
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedMovement === "quartz" ? "active" : ""}`}
                onClick={() => setSelectedMovement("quartz")}
              >
                Quartz &amp; Solargraph ({movementCounts.quartz})
              </button>
              <button
                type="button"
                className={`filter-pill ${selectedMovement === "smartwatch" ? "active" : ""}`}
                onClick={() => setSelectedMovement("smartwatch")}
              >
                Smartwatch &amp; Connected ({movementCounts.smartwatch})
              </button>
            </div>
          </div>

          {/* House / Brand Switcher Pills */}
          <div className="filter-group-block">
            <div className="filter-group-label">
              <Shield size={13} />
              <span>Filter By House:</span>
            </div>
            <div className="filter-pills-wrap scrollable">
              <button
                type="button"
                className={`filter-pill ${selectedBrand === "" ? "active" : ""}`}
                onClick={() => {
                  router.push("/category/watches?view=all");
                }}
              >
                All Houses ({allProducts.length})
              </button>
              {WATCH_BRANDS.map((brand) => (
                <button
                  key={brand.name}
                  type="button"
                  className={`filter-pill ${selectedBrand.toLowerCase() === brand.name.toLowerCase() ? "active" : ""}`}
                  onClick={() => {
                    const newBrand = selectedBrand.toLowerCase() === brand.name.toLowerCase() ? "" : brand.name;
                    if (newBrand) {
                      router.push(`/category/watches?brand=${encodeURIComponent(newBrand)}`);
                    } else {
                      router.push("/category/watches?view=all");
                    }
                  }}
                >
                  {brand.name} ({brandCounts[brand.name] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Price Tier, Search, and Sort */}
          <div className="filter-secondary-row">
            {/* Price Tier Pills */}
            <div className="price-tier-pills">
              <span className="sub-label">Price Range:</span>
              <button
                type="button"
                className={`tier-pill ${priceTier === "all" && !maxBudget ? "active" : ""}`}
                onClick={() => {
                  setPriceTier("all");
                  setMaxBudget("");
                }}
              >
                All
              </button>
              <button
                type="button"
                className={`tier-pill ${priceTier === "sub1k" ? "active" : ""}`}
                onClick={() => {
                  setPriceTier("sub1k");
                  setMaxBudget("");
                }}
              >
                Under $1,000
              </button>
              <button
                type="button"
                className={`tier-pill ${priceTier === "1k-5k" ? "active" : ""}`}
                onClick={() => {
                  setPriceTier("1k-5k");
                  setMaxBudget("");
                }}
              >
                $1k – $5k
              </button>
              <button
                type="button"
                className={`tier-pill ${priceTier === "5k-15k" ? "active" : ""}`}
                onClick={() => {
                  setPriceTier("5k-15k");
                  setMaxBudget("");
                }}
              >
                $5k – $15k
              </button>
              <button
                type="button"
                className={`tier-pill ${priceTier === "15k+" ? "active" : ""}`}
                onClick={() => {
                  setPriceTier("15k+");
                  setMaxBudget("");
                }}
              >
                $15,000+
              </button>
            </div>

            {/* Direct Model / Reference Search */}
            <div className="filter-search-field">
              <input
                type="text"
                placeholder="Search Daytona, Moonwatch, PRX, Tank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="category-search-input"
              />
              <Search size={14} className="search-field-icon" />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="filter-sort-field">
              <SlidersHorizontal size={14} />
              <label htmlFor="watches-sort-select">Sort:</label>
              <select
                id="watches-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="sort-select"
              >
                <option value="featured">Featured Sequence</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="brand-asc">Manufacture: A to Z</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="active-filters-bar">
              <span className="active-label">Active Filters:</span>
              <div className="active-chips">
                {selectedBrand && (
                  <span className="active-chip">
                    House: {selectedBrand}
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/category/watches?view=all");
                      }}
                      aria-label="Remove brand filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedMovement !== "all" && (
                  <span className="active-chip">
                    Movement: {selectedMovement}
                    <button type="button" onClick={() => setSelectedMovement("all")} aria-label="Remove movement filter">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {priceTier !== "all" && (
                  <span className="active-chip">
                    Tier: {priceTier === "sub1k" ? "Under $1k" : priceTier === "1k-5k" ? "$1k - $5k" : priceTier === "5k-15k" ? "$5k - $15k" : "$15k+"}
                    <button type="button" onClick={() => setPriceTier("all")} aria-label="Remove price tier">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {typeof maxBudget === "number" && maxBudget > 0 && (
                  <span className="active-chip">
                    Max: ${maxBudget.toLocaleString()}
                    <button type="button" onClick={() => setMaxBudget("")} aria-label="Remove max budget">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="active-chip">
                    Query: &ldquo;{searchQuery}&rdquo;
                    <button type="button" onClick={() => setSearchQuery("")} aria-label="Remove search query">
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="clear-all-filters-btn"
                  onClick={() => {
                    setSelectedMovement("all");
                    setPriceTier("all");
                    setMaxBudget("");
                    setSearchQuery("");
                    router.push("/category/watches?view=all");
                  }}
                >
                  <RotateCcw size={12} /> Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count Banner */}
        <div className="grid-count-banner">
          <span>
            Showing <strong>{sortedProducts.length}</strong> {selectedBrand ? `models from ${selectedBrand}` : "recorded timepieces"}
          </span>
          {selectedBrand && <span className="brand-focus-tag">{selectedBrand} Collection</span>}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="catalog-loading-state">
            <Clock size={28} className="spin icon-gold" />
            <p>Loading recorded horology collection...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="catalog-empty-state">
            <Clock size={36} className="empty-icon" />
            <h3>No Timepieces Match Your Filters</h3>
            <p>Try clearing your active filters or asking DALE to search across all manufacture houses.</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setSelectedMovement("all");
                setPriceTier("all");
                setMaxBudget("");
                setSearchQuery("");
                router.push("/category/watches?view=all");
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {sortedProducts.map((product) => {
              const mv = classifyMovement(product.attributes?.movement, product.specs);
              const diameter = product.attributes?.caseDiameterMm;
              const waterResistance = product.attributes?.waterResistanceM;

              return (
                <article className="product-card watch-card" key={product.id} data-product-id={product.id}>
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
                        <Check size={12} /> {product.brand || "Swiss Manufacture"}
                      </span>
                      <span className={`movement-tag ${mv}`}>
                        {mv === "automatic" ? "Automatic" : mv === "mechanical" ? "Manual-Wind" : "Quartz"}
                      </span>
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
                      {diameter && <span>{diameter}mm Case</span>}
                      {waterResistance && <span>{waterResistance}m Water Resistance</span>}
                      {product.specs.slice(0, 1).map((spec) => (
                        <span key={spec}>{spec}</span>
                      ))}
                    </div>

                    <div className="card-footer-action">
                      <div>
                        <strong className="price-display">
                          {formatMoney(product.price)}
                        </strong>
                        <small className="price-sub">
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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function WatchesCatalogView() {
  return (
    <Suspense fallback={<div className="watches-category-experience" style={{ padding: 40, color: "#f7f5f0" }}>Loading Haute Horlogerie...</div>}>
      <WatchesCatalogContent />
    </Suspense>
  );
}
