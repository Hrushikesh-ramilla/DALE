"use client";
import { useState } from "react";
import type { Order } from "@/server/state";
import { formatMoney } from "@/domain/money";

export function ProviderReconciliation({
  order,
  reviewer,
  busy,
  refresh,
}: {
  order: Order;
  reviewer: boolean;
  busy: boolean;
  refresh: (references: string[]) => Promise<void>;
}) {
  const [references, setReferences] = useState("");
  if (order.quote.provider !== "sandbox" || !order.captureId) return null;
  const observations = order.providerObservations || [];
  return (
    <details className="analysis-panel provider-reconciliation">
      <summary>
        PayPal reconciliation
        {observations.some((entry) => entry.state !== "verified")
          ? " · human follow-up needed"
          : ""}
      </summary>
      <p>
        Verified merchant refunds recorded: {formatMoney(order.refundedAmount)}.
        An external pending adjustment pauses another refund or replacement;
        your claim remains open.
      </p>
      {observations.map((entry) => (
        <div key={`${entry.kind}:${entry.reference}`}>
          <strong>
            {entry.kind} · {entry.state} · {entry.reference}
          </strong>
          <p>{entry.explanation}</p>
          {entry.reportedCustomerPayout !== undefined && (
            <p>
              Provider-reported customer payout:{" "}
              {formatMoney(entry.reportedCustomerPayout)}. It may be funded by
              PayPal or the merchant; it is not added to merchant refunds
              without a verified refund reference.
            </p>
          )}
          {entry.credited && (
            <p>
              Completed capture-linked refund accounted once:{" "}
              {formatMoney(entry.amount || 0)}.
            </p>
          )}
        </div>
      ))}
      {reviewer && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void refresh(
              references
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            );
          }}
        >
          <label>
            Known PayPal refund references (optional, comma separated)
            <input
              value={references}
              onChange={(event) => setReferences(event.target.value)}
              maxLength={1279}
            />
          </label>
          <p>
            Reads provider facts only. Supplied references or notes cannot
            authorize money movement, override a payout review, or declare a
            refund completed.
          </p>
          <button className="button secondary small" disabled={busy}>
            Refresh provider facts
          </button>
        </form>
      )}
    </details>
  );
}
