"use client";
import { useState } from "react";
import Link from "next/link";
import { BrandWordmark } from "./brand-wordmark";

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
          ? "/"
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
    <main className="app-shell demo-launcher">
      <header>
        <Link href="/" aria-label="DALE home">
          <BrandWordmark />
        </Link>
        <Link href="/">Return to the store ↗</Link>
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
  );
}
