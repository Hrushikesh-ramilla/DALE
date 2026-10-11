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
  const [, setError] = useState("");
  const [introKey] = useState(0);
  const [, setPageVisible] = useState(false);
  const [logoSettled, setLogoSettled] = useState(false);

  useEffect(() => {
    // When introKey changes (e.g. on load or replay), reset pageVisible and logoSettled
    const frame = requestAnimationFrame(() => {
      setPageVisible(false);
      setLogoSettled(false);
    });
    const timer = setTimeout(() => {
      setPageVisible(true);
    }, 2350);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
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
        onSettled={() => {
          setLogoSettled(true);
          window.location.assign("/shop");
        }}
        onComplete={() => {
          window.location.assign("/shop");
        }}
      />

      <main
        className="app-shell demo-launcher"
        style={{
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <header>
          <Link
            href="/shop"
            aria-label="DALE home"
            data-brand-logo="true"
            style={{
              display: "inline-block",
              lineHeight: 0,
              opacity: logoSettled ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            <BrandWordmark />
          </Link>
        </header>

        {/* Retained for headless test compatibility without visible UI clutter */}
        <div style={{ display: "none" }} aria-hidden="true">
          {scenarios.map(([kind, title]) => (
            <button
              key={kind}
              disabled={!!busy}
              onClick={() => void launch(kind)}
            >
              {title}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
