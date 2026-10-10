"use client";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  Sparkles,
  SlidersHorizontal,
  X,
  Search,
  LoaderCircle,
  ShieldCheck,
  ChevronDown,
  Camera,
} from "lucide-react";

interface ShoppingBriefMenuProps {
  model: string;
  models: readonly string[];
  setModel: (m: string) => void;
  deviceLabel: (m: string) => string;
  category: string;
  setCategory: (c: string) => void;
  budget: string;
  setBudget: (b: string) => void;
  message: string;
  setMessage: (m: string) => void;
  preference: string;
  setPreference: (p: string) => void;
  priority: "price" | "features";
  setPriority: (p: "price" | "features") => void;
  weights: { price: number; features: number } | undefined;
  setWeights: (w: { price: number; features: number } | undefined) => void;
  briefDirty: boolean;
  setBriefDirty: (d: boolean) => void;
  busy: boolean;
  restoring: boolean;
  findProducts: (confirm?: boolean) => Promise<void>;
  onIdentify: () => void;
  compatibleCount: number;
}

export function ShoppingBriefMenu({
  model,
  models,
  setModel,
  deviceLabel,
  category,
  setCategory,
  budget,
  setBudget,
  message,
  setMessage,
  preference,
  setPreference,
  priority,
  setPriority,
  weights,
  setWeights,
  briefDirty,
  setBriefDirty,
  busy,
  restoring,
  findProducts,
  onIdentify,
  compatibleCount,
}: ShoppingBriefMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const clearTimer = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (isPinned) return;
    clearTimer();
    hoverTimeout.current = setTimeout(() => {
      setIsOpen(true);
    }, 70);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    clearTimer();
    hoverTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 240);
  };

  const toggleOpen = () => {
    clearTimer();
    if (isOpen) {
      setIsOpen(false);
      setIsPinned(false);
    } else {
      setIsOpen(true);
      setIsPinned(true);
    }
  };

  const handleClose = useCallback(() => {
    clearTimer();
    setIsOpen(false);
    setIsPinned(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClose]);

  return (
    <div
      className="brief-menu-root"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button (Apple-Style Glass Pill) */}
      <button
        ref={triggerRef}
        type="button"
        className={`brief-menu-trigger ${isOpen ? "active" : ""}`}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Filter products and adjust shopping brief"
      >
        <span className="trigger-icon-wrap">
          <span className="apple-hamburger-lines" aria-hidden="true">
            <span className="line line-1" />
            <span className="line line-2" />
            <span className="line line-3" />
          </span>
        </span>
        <span className="trigger-text">
          <span className="trigger-title">Brief & Filters</span>
          <span className="trigger-badge">
            {deviceLabel(model).split("(")[0].trim()} · ${budget}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`trigger-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {/* Flyout Glass Menu Overlay */}
      {isOpen && (
        <>
          <div
            className={`brief-menu-backdrop ${isOpen ? "visible" : ""}`}
            onClick={handleClose}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            className={`brief-menu-flyout ${isOpen ? "open" : ""}`}
            role="dialog"
            aria-label="Shopping brief and filters"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header */}
            <div className="flyout-header">
              <div className="flyout-title-wrap">
                <span className="flyout-sparkle">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3>Your shopping brief & specifications</h3>
                  <p className="flyout-subtitle">
                    Exact device profiles, connectors, and power constraints are
                    verified against live catalog data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flyout-close-btn"
                onClick={handleClose}
                aria-label="Close filters menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* 3-Column Apple Grid */}
            <div className="flyout-grid">
              {/* Column 1: Device Profile */}
              <div className="flyout-column">
                <span className="column-eyebrow">DEVICE & COMPATIBILITY</span>
                <label className="flyout-label">
                  Your device
                  <select
                    className="flyout-select"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setBriefDirty(true);
                    }}
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {deviceLabel(m)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="button secondary small flyout-identify-btn"
                  onClick={() => {
                    handleClose();
                    onIdentify();
                  }}
                  disabled={restoring}
                >
                  <Camera size={14} /> Identify device from label
                </button>
                <div className="flyout-tip">
                  <span>
                    Power wattage, port standards, and certified protocols
                    guaranteed before purchase.
                  </span>
                </div>
              </div>

              {/* Column 2: Category & Budget */}
              <div className="flyout-column">
                <span className="column-eyebrow">CATEGORY & BUDGET</span>
                <label className="flyout-label">
                  Looking for
                  <select
                    className="flyout-select"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setBriefDirty(true);
                    }}
                  >
                    {Object.entries({
                      chargers: "Chargers",
                      docks: "Docks & hubs",
                      storage: "Storage",
                      audio: "Headphones",
                      accessories: "Accessories",
                      "": "Everything",
                    }).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flyout-label">
                  Maximum budget, USD
                  <div className="money-input">
                    <span>$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={budget}
                      onChange={(e) => {
                        setBudget(e.target.value);
                        setBriefDirty(true);
                      }}
                    />
                  </div>
                </label>
                <div className="flyout-category-pills">
                  {[
                    ["", "All"],
                    ["chargers", "Chargers"],
                    ["docks", "Docks"],
                    ["audio", "Audio"],
                    ["storage", "Storage"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`pill-btn ${category === id ? "active" : ""}`}
                      onClick={() => {
                        setCategory(id);
                        setBriefDirty(true);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: Preferences & Priorities */}
              <div className="flyout-column">
                <span className="column-eyebrow">PREFERENCES & RANKING</span>
                <label className="flyout-label">
                  Feature to prioritize
                  <input
                    value={preference}
                    maxLength={80}
                    placeholder="65W, Ethernet, braided cable…"
                    onChange={(e) => {
                      setPreference(e.target.value);
                      setBriefDirty(true);
                    }}
                  />
                </label>
                <label className="flyout-label">
                  Anything else?
                  <textarea
                    placeholder="A lighter charger for my commute…"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setBriefDirty(true);
                    }}
                    rows={2}
                  />
                </label>
                <label className="flyout-label">
                  Rank by
                  <select
                    className="flyout-select"
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value as "price" | "features");
                      setBriefDirty(true);
                    }}
                  >
                    <option value="price">
                      Lowest price, then matching features
                    </option>
                    <option value="features">
                      Matching features, then lowest price
                    </option>
                  </select>
                </label>
                <label className="flyout-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!weights}
                    onChange={(event) => {
                      setWeights(
                        event.target.checked
                          ? { price: 50, features: 50 }
                          : undefined,
                      );
                      setBriefDirty(true);
                    }}
                  />
                  <span>Fine preference weights</span>
                </label>
                {weights && (
                  <div className="flyout-range-wrap">
                    <label className="flyout-range-label">
                      <span>Price weight: {weights.price}%</span>
                      <span>Features: {weights.features}%</span>
                    </label>
                    <input
                      aria-label="Price preference weight"
                      type="range"
                      min="0"
                      max="100"
                      value={weights.price}
                      onChange={(event) => {
                        const price = Number(event.target.value);
                        setWeights({ price, features: 100 - price });
                        setBriefDirty(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="flyout-footer">
              <div className="flyout-foot-left">
                <ShieldCheck size={16} />
                <span>
                  Paid placement never improves organic ranking · Zero
                  sponsored ads
                </span>
              </div>
              <div className="flyout-foot-right">
                <span className="flyout-count">
                  {compatibleCount} compatible options
                </span>
                <button
                  type="button"
                  className="button primary flyout-submit-btn"
                  disabled={busy}
                  onClick={() => {
                    handleClose();
                    void findProducts();
                  }}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Search size={16} />
                  )}{" "}
                  Find my match
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
