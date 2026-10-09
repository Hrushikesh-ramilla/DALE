"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandWordmark } from "./brand-wordmark";
import { CinematicIntro } from "./cinematic-intro";

const scenarios = [
  [
    "fresh",
    "Start shopping",
    "Find a compatible product, review the quote, and approve a simulated payment.",
  ],
  [
    "delivered",
    "Return a delivered item",
    "Open a return, submit both-party evidence, and follow a prepaid return to a remedy.",
  ],
  [
    "group_partial",
    "Buy together",
    "A second shopper declined payment. The remaining shopper keeps the quoted discount.",
  ],
  [
    "identifier_conflict",
    "Conflicting evidence",
    "Different identifiers require human review. The customer’s case stays open.",
  ],
  [
    "seller_silence",
    "Seller missed a deadline",
    "The response deadline has passed; the case escalates for customer-first review.",
  ],
  [
    "refund_failure",
    "Failed refund",
    "The refund request stays visible; no completed refund is claimed.",
  ],
  [
    "refund_timeout",
    "Interrupted refund",
    "Recovery reconciles the original operation without refunding twice.",
  ],
  [
    "canceled_order",
    "Seller canceled",
    "A recorded payment remains visible with cancellation remedy choices.",
  ],
  [
    "late_order",
    "Late delivery",
    "A missed delivery promise exposes the customer’s remedy choices.",
  ],
] as const;

export function DemoLauncher() {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [introKey, setIntroKey] = useState(0);
  const [pageVisible, setPageVisible] = useState(false);
  const [logoSettled, setLogoSettled] = useState(false);

  useEffect(() => {
    // When introKey changes (e.g. on load or replay), reset pageVisible and logoSettled
    setPageVisible(false);
    setLogoSettled(false);
    const timer = setTimeout(() => {
      setPageVisible(true);
    }, 2550);
    return () => clearTimeout(timer);
  }, [introKey]);

  async function launch(kind: string) {
    setBusy(kind);
    setError("");
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "launch", kind }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(
        kind === "fresh" || kind === "group_partial"
          ? "/shop"
          : kind === "delivered"
            ? "/orders"
            : "/support",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
      setBusy("");
    }
  }

  return (
    <>
      <CinematicIntro
        key={introKey}
        targetSelector="[data-brand-logo]"
        onSettled={() => setLogoSettled(true)}
      />

      <main
        className="app-shell demo-launcher"
        style={{
          opacity: pageVisible ? 1 : 0,
          transform: pageVisible ? "translateY(0)" : "translateY(16px)",
          transition:
            "opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1), transform 0.95s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <header>
          <Link
            href="/shop"
            aria-label="DALE home"
            data-brand-logo="true"
            style={{
              opacity: logoSettled ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          >
            <BrandWordmark />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={() => setIntroKey((k) => k + 1)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: "999px",
                color: "rgba(255, 255, 255, 0.65)",
                padding: "6px 14px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)";
              }}
            >
              Replay intro ↺
            </button>
            <Link href="/shop">Return to the store ↗</Link>
          </div>
        </header>

        <span className="eyebrow">THE COMPLETE JOURNEY, OPEN TO TEST</span>
        <h1>
          Meet your
          <br />
          <em>shopping companion.</em>
        </h1>
        <p>
          Choose a scenario. No account or access code needed. Each workspace is
          private to this browser, with simulated payments, shipping and AI.
          Purchases and remedies still require the same explicit approvals.
        </p>
        {error && <p role="alert">{error}</p>}
        <p>
          These scenarios use fixtures.{" "}
          <Link href="/live">Test the live agent and PayPal ↗</Link> in a
          separately configured shopper session.
        </p>
        <div className="demo-scenarios">
          {scenarios.map(([kind, title, description]) => (
            <button
              className="demo-scenario"
              key={kind}
              disabled={!!busy}
              onClick={() => void launch(kind)}
            >
              <span>{busy === kind ? "Opening your workspace…" : title}</span>
              <p>{description}</p>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
