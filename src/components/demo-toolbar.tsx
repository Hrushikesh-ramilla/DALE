"use client";
import { useState } from "react";
import type { snapshot } from "@/server/service";
type Session = Awaited<ReturnType<typeof snapshot>>;
const instructions: Record<string, string[]> = {
  fresh: [
    "Save your device, budget and need with Find my match.",
    "Compare catalog facts and review a purchase. An order appears only after explicit approval.",
    "Switch to Seller to record shipping, then return to Shopper to track the order.",
  ],
  delivered: [
    "Choose Get help / return on the delivered order and select your preferred remedy.",
    "Use Shopper and Seller to submit the available checkpoint evidence; uncertain claims stay open.",
    "Use Reviewer for analysis and prepaid return authorization. Record sending/receipt, then authorize the remedy.",
  ],
  group_partial: [
    "Open Group deals and inspect the ready offer.",
    "Review the existing group's price as the shopper; a declined participant does not silently raise it.",
    "Approve the simulated purchase and inspect My orders.",
  ],
  identifier_conflict: [
    "Inspect the customer and seller identifiers on the open case.",
    "Switch to Reviewer and inspect the analysis, which requires human review.",
    "Add an explained customer-first remedy or retain review; a conflict alone does not close the case.",
  ],
  seller_silence: [
    "Inspect the missed seller deadline and escalated case.",
    "Switch to Reviewer to review the customer's remedy and evidence.",
    "Authorize a justified remedy; seller silence is not a reason to leave the customer waiting indefinitely.",
  ],
  refund_failure: [
    "Inspect the failed refund status and recorded request.",
    "Switch to Reviewer and retry the authorized remedy.",
    "Inspect the final refund reference and audit export; a failed request must not be called completed.",
  ],
  refund_timeout: [
    "Inspect the interrupted refund and its original operation.",
    "Switch to Reviewer; use Recover operations in Environment details.",
    "Inspect the reconciled refund. Repeating recovery must not create a second refund.",
  ],
  canceled_order: [
    "Open My orders and inspect the seller cancellation.",
    "Choose the offered cancellation remedy as the customer.",
    "Follow its status/reference; recorded payment remains visible until its remedy completes.",
  ],
  late_order: [
    "Open My orders and inspect the missed delivery promise.",
    "Choose an offered late-delivery remedy.",
    "Follow the remedy without treating a simulated carrier event as physical delivery evidence.",
  ],
};
export function DemoToolbar({ session }: { session: Session }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!session.demo) return null;
  async function act(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(
        result.actor.role === "buyer" ? "/shop" : "/support",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
      setBusy(false);
    }
  }
  async function exportReport() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dale-demo-report.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const persona =
    session.actor.userId === "fixture-participant"
      ? "second_buyer"
      : session.actor.role;
  return (
    <aside className="demo-toolbar" aria-label="Guided engineer demo">
      <div className="demo-toolbar-heading">
        <strong>Guided demo · {session.demo.kind.replaceAll("_", " ")}</strong>
        <span>Private fixture workspace · no provider calls</span>
      </div>
      <div className="demo-toolbar-controls">
        <label>
          Demo persona
          <select
            disabled={busy}
            value={persona}
            onChange={(event) =>
              void act({ action: "persona", persona: event.target.value })
            }
          >
            <option value="buyer">Shopper</option>
            <option value="second_buyer">Second shopper</option>
            <option value="seller">Seller</option>
            <option value="reviewer">Reviewer</option>
          </select>
        </label>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={() =>
            void act({ action: "reset", kind: session.demo!.kind })
          }
        >
          Reset this scenario
        </button>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={() => void exportReport()}
        >
          Export test report
        </button>
        <a href="/demo">Choose another scenario ↗</a>
      </div>
      <details>
        <summary>Steps and expected outcomes</summary>
        <ol>
          {(instructions[session.demo.kind] || instructions.fresh).map(
            (step) => (
              <li key={step}>{step}</li>
            ),
          )}
        </ol>
        <p>
          All money, catalog inventory, AI and carrier events here are
          synthetic. File integrity alone does not prove a physical claim. Reset
          archives the prior history and creates a new workspace.
        </p>
      </details>
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
