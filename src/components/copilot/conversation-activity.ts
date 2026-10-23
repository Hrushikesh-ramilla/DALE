import type { BrowserAction } from "@/domain/concierge";
import type { CopilotMessage } from "./copilot-types";

/** User message IDs are turn IDs. Anchor receipts to the last visible reply in
 * that turn, never to their arrival time or the end of a newer conversation. */
export function conversationActivity(
  messages: CopilotMessage[],
  receipts: BrowserAction[],
) {
  const anchors = new Map<string, string>();
  let turn: string | undefined;
  for (const message of messages) {
    if (message.sender === "user") turn = message.id;
    if (turn) anchors.set(turn, message.id);
  }
  const groups = new Map<string, BrowserAction[]>();
  for (const receipt of new Map(receipts.map((r) => [r.id, r])).values()) {
    if (
      receipt.status === "pending" ||
      /superseded by a newer customer message/i.test(receipt.outcome || "")
    )
      continue;
    const anchor = anchors.get(receipt.turnId);
    if (!anchor) continue;
    const group = groups.get(anchor) || [];
    group.push(receipt);
    groups.set(anchor, group);
  }
  return groups;
}

export function activityLabel(receipts: BrowserAction[]) {
  const failed = receipts.filter((r) => r.status === "failed").length;
  if (failed)
    return failed === 1
      ? "An action needs attention"
      : `${failed} actions need attention`;
  if (receipts.length > 1) return `${receipts.length} actions completed`;
  const operation = receipts[0]?.operation;
  if (operation?.type === "navigate") return "Page opened";
  if (operation?.type === "tabs") return "Requested tabs opened";
  if (operation?.type === "tab" && operation.command === "close")
    return "Tab closed";
  return "Action completed";
}
