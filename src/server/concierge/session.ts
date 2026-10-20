import type { Actor } from "../state";
import { changeConcierge } from "./store";

/** Fence an account's active customer task before ending or replacing its session. */
export async function closeCustomerTask(actor: Actor | undefined) {
  if (!actor || actor.role !== "buyer") return;
  await changeConcierge(actor, (s) => {
    if (s.turn && ["running", "awaiting_ui"].includes(s.turn.status)) {
      s.turn.status = "canceled";
      s.turn.error = "The shopping session ended or changed accounts.";
      for (const action of s.actions)
        if (action.status === "pending") {
          action.status = "failed";
          action.outcome = "Session ended before this action completed.";
        }
    }
  });
}
