import { Check, CircleAlert, ChevronDown } from "lucide-react";
import type { BrowserAction } from "@/domain/concierge";
import { activityLabel } from "./conversation-activity";

export function ActionActivity({ receipts }: { receipts?: BrowserAction[] }) {
  if (!receipts?.length) return null;
  const failed = receipts.some((r) => r.status === "failed");
  return (
    <details
      className="dale-action-activity"
      data-action-activity
      data-tone={failed ? "attention" : "complete"}
      aria-label="Action updates for this request"
    >
      <summary>
        {failed ? (
          <CircleAlert size={12} aria-hidden="true" />
        ) : (
          <Check size={12} aria-hidden="true" />
        )}
        <span>{activityLabel(receipts)}</span>
        <ChevronDown
          className="dale-activity-chevron"
          size={12}
          aria-hidden="true"
        />
      </summary>
      <ul>
        {receipts.map((receipt) => (
          <li key={receipt.id} data-action-receipt={receipt.id}>
            <span>
              {receipt.status === "failed" ? "Needs attention" : "Completed"}
            </span>
            {receipt.outcome || "The action finished."}
          </li>
        ))}
      </ul>
    </details>
  );
}
