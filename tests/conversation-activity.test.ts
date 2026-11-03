import { describe, it, expect } from "vitest";
import {
  conversationActivity,
  activityLabel,
} from "../src/components/copilot/conversation-activity";
import type { BrowserAction } from "../src/domain/concierge";
import type { CopilotMessage } from "../src/components/copilot/copilot-types";
const message = (id: string, sender: "user" | "assistant"): CopilotMessage => ({
  id,
  sender,
  text: id,
  timestamp: 1,
});
const receipt = (
  id: string,
  turnId: string,
  status: BrowserAction["status"] = "succeeded",
  outcome = "Requested page rendered.",
): BrowserAction => ({
  id,
  turnId,
  status,
  outcome,
  operation: { type: "navigate", path: "/cart" },
  toolCallId: id,
  expectedRevision: 1,
  createdAt: "2026-10-24T00:00:00Z",
});
const messages = [
  message("first", "user"),
  message("reply-first", "assistant"),
  message("second", "user"),
  message("reply-second", "assistant"),
];
describe("request-bound activity", () => {
  it("anchors a late old failure before the next request rather than appending it", () => {
    const groups = conversationActivity(messages, [
      receipt("new", "second"),
      receipt("late", "first", "failed", "Navigation timed out."),
    ]);
    expect(groups.get("reply-first")?.map((r) => r.id)).toEqual(["late"]);
    expect(groups.get("reply-second")?.map((r) => r.id)).toEqual(["new"]);
  });
  it("omits superseded and pending operations without hiding genuine failures", () => {
    const groups = conversationActivity(messages, [
      receipt(
        "old",
        "first",
        "failed",
        "Superseded by a newer customer message.",
      ),
      receipt("pending", "second", "pending"),
      receipt("failure", "second", "failed", "Unable to load listing."),
    ]);
    expect(groups.has("reply-first")).toBe(false);
    expect(groups.get("reply-second")?.map((r) => r.id)).toEqual(["failure"]);
  });
  it("deduplicates receipts and does not orphan unloaded history at the bottom", () => {
    const groups = conversationActivity(messages, [
      receipt("one", "first"),
      receipt("one", "first"),
      receipt("unloaded", "older"),
    ]);
    expect([...groups.values()].flat()).toHaveLength(1);
  });
  it("keeps an unfinished request's activity with its own user or streamed reply", () => {
    expect(
      conversationActivity(
        [message("turn", "user")],
        [receipt("r", "turn")],
      ).has("turn"),
    ).toBe(true);
    expect(
      conversationActivity(
        [message("turn", "user"), message("stream:1", "assistant")],
        [receipt("r", "turn")],
      ).has("stream:1"),
    ).toBe(true);
  });
  it("summarizes multiple operations once while retaining attention states", () => {
    expect(activityLabel([receipt("a", "first"), receipt("b", "first")])).toBe(
      "2 actions completed",
    );
    expect(activityLabel([receipt("a", "first", "failed")])).toBe(
      "An action needs attention",
    );
  });
});
