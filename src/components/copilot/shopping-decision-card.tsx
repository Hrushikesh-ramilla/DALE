"use client";
import { useState } from "react";
import Link from "next/link";
import type { DecisionView } from "@/domain/shopping-decision";
import type { Quote } from "@/domain/guard";
import { formatMoney } from "@/domain/money";
import { CatalogEvidence } from "../catalog-evidence";

export function ShoppingDecisionCard({
  decision,
  refresh,
  close,
}: {
  decision: DecisionView;
  refresh: () => Promise<void>;
  close: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const offer = decision.offers[selected] || decision.offers[0];
  async function review() {
    if (!offer) return;
    setBusy(true);
    setError("");
    setQuote(null);
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionId: decision.id,
          productId: offer.product.id,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not review this offer.");
      setQuote(result);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not review this offer.",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="dale-decision-card"
      aria-label="Your shopping decision"
      data-decision-id={decision.id}
    >
      <header>
        <strong>Your shopping decision</strong>
        <small>Requirements v{decision.version} · Recorded catalog facts</small>
      </header>
      <p>{decision.brief.purpose}</p>
      {decision.brief.constraints.max_price !== null && (
        <p>Budget: {formatMoney(decision.brief.constraints.max_price)} USD</p>
      )}
      {decision.outcome === "clarification" && (
        <div role="status">
          {decision.questions.map((question) => (
            <p key={question}>{question}</p>
          ))}
        </div>
      )}
      {decision.outcome === "no_match" && (
        <p role="status">
          No purchasable variant meets these requirements. Change a requirement
          or ask for alternatives; nothing was added or purchased.
        </p>
      )}
      {offer && (
        <>
          {decision.offers.length > 1 && (
            <label>
              Matching variant
              <select
                aria-label="Decision variant"
                value={selected}
                onChange={(event) => {
                  setSelected(Number(event.target.value));
                  setQuote(null);
                  setError("");
                }}
              >
                {decision.offers.map((item, index) => (
                  <option key={item.product.id} value={index}>
                    {item.product.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <h3>{offer.product.name}</h3>
          <p>Exact variant: {offer.product.skuVariant || offer.product.id}</p>
          <p>
            Solo offer: <strong>{formatMoney(offer.soloAmount)} USD</strong>
            {offer.kind === "conditional_group" && " — above your budget"}
          </p>
          {offer.group && (
            <div className="dale-decision-group">
              <strong>
                Conditional group offer: {formatMoney(offer.group.amount)} USD
              </strong>
              <p>
                Save {formatMoney(offer.soloAmount - offer.group.amount)} (
                {offer.group.discountPercent}%) only when{" "}
                {offer.group.minimumMembers} distinct shoppers commit and
                current stock, policy and deadline conditions are met. Not
                unlocked; no payment or commitment has been made.
              </p>
              <small>
                Merchant policy v{offer.group.policyVersion} ·{" "}
                {offer.group.checkoutMinutes}-minute checkout window after
                readiness
              </small>
            </div>
          )}
          <details>
            <summary>Why this matches</summary>
            <ul>
              {offer.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary>Sources and unknowns</summary>
            {offer.product.source.startsWith("https://") ? (
              <a href={offer.product.source} target="_blank" rel="noreferrer">
                Recorded manufacturer source
              </a>
            ) : (
              <CatalogEvidence product={offer.product} />
            )}
            <p>
              Catalog observation:{" "}
              {offer.product.evidence?.checkedAt || "Not recorded"} ·{" "}
              {offer.product.evidence?.region || "Region not recorded"}
            </p>
            <ul>
              {offer.unknowns.map((unknown, index) => (
                <li key={index}>{unknown}</li>
              ))}
            </ul>
          </details>
          <p>
            DALE sandbox merchant offers · USD · Simulated stock and fulfillment
          </p>
          <div className="dale-decision-actions">
            <Link
              href={`/product/${encodeURIComponent(offer.product.id)}?decision=${decision.id}`}
              onClick={close}
            >
              Open exact product
            </Link>
            {offer.kind === "solo" ? (
              <button
                type="button"
                disabled={busy || decision.status !== "current"}
                onClick={() => void review()}
              >
                {busy ? "Checking current terms…" : "Review current offer"}
              </button>
            ) : (
              <Link href={`/groups?product=${encodeURIComponent(offer.product.id)}&decision=${decision.id}`} onClick={close}>
                View buying circles
              </Link>
            )}
            {offer.kind === "solo" && offer.group && <Link href={`/groups?product=${encodeURIComponent(offer.product.id)}&decision=${decision.id}`} onClick={close}>View buying circles</Link>}
          </div>
          {quote && decision.status === "current" && (
            <div role="status">
              <strong>Current quote: {formatMoney(quote.amount)} USD</strong>
              <p>
                Merchant: {quote.payee}. Expires{" "}
                {new Date(quote.expiresAt).toLocaleTimeString()}. Review and
                approve separately from the product page; no order or payment
                was created.
              </p>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <small>
        Saved {new Date(decision.createdAt).toLocaleString()} ·{" "}
        {decision.retrieval.map((item) => item.mode).join(" / ") ||
          "Awaiting clarification"}{" "}
        retrieval
      </small>
    </section>
  );
}
