import { z } from "zod";
import { knownModels as models } from "./catalog";
import type { ResearchContext } from "./agent-plan";
import type { ResearchReport } from "./research";
import type { ScamResult } from "./scams";
import type { AgentGroupOffer } from "./agent-workflow";
import { mentionedModels } from "./identification";
import { understandVoice, type VoiceIntent } from "./voice";

export const agentRequest = z.object({
  task: z.string().trim().min(1).max(2000),
  model: z.enum(models as [string, ...string[]]),
  budget: z.number().int().min(1).max(100000),
  expectedWorkspaceId: z.uuid().optional(),
  expectedBuyerId: z.string().min(1).max(100).optional(),
});
export type AgentRequest = z.infer<typeof agentRequest>;
export type AgentRun = {
  id: string;
  task: string;
  at: string;
  status:
    "needs_input" | "ready_for_review" | "opened_workspace" | "draft_prepared";
  reply: string;
  steps: string[];
  productIds: string[];
  briefVersion?: number;
  intent: VoiceIntent;
  mode?: "catalog" | "model" | "unavailable";
  proposedTask?: string;
  recommendation?: {
    productId: string | null;
    sourceIds: string[];
    reasons: string[];
  };
  context?: ResearchContext;
  research?: ResearchReport;
  sourceReceipts?: {
    sourceId: string;
    url: string;
    status: "reviewed_snapshot" | "matched" | "changed" | "unavailable";
    checkedAt: string;
    contentHash?: string;
    note: string;
  }[];
  claims?: {
    id: string;
    orderId: string;
    status: string;
    request: string;
    deadlineAt: string;
    analysis: string;
    nextStep: string;
  }[];
  safety?: ScamResult;
  groupOffers?: AgentGroupOffer[];
  toolCalls?: {
    tool: string;
    status: "completed" | "needs_input" | "skipped";
  }[];
  orders?: { id: string; product: string; status: string; nextStep: string }[];
};

export function understandAgent(input: AgentRequest): VoiceIntent {
  const intent = understandVoice({
    transcript: input.task,
    model: input.model,
    budget: input.budget,
  });
  if (intent.kind !== "shopping") return intent;
  // A free-text real device must never silently inherit the default demo model.
  if (!mentionedModels(input.task).length)
    return {
      kind: "clarification",
      message:
        "That device is not verified yet. Give the exact model and year. Reviewed charging evidence covers MacBook Air M1/M2 and 13-inch MacBook Pro M1. Sample tasks can explicitly use USB-C Laptop (65W), USB-C Laptop (100W), USB-C Laptop (45W) or Barrel-jack Laptop (45W).",
    };
  if (
    /\b(?:macbook|iphone|ipad|thinkpad|surface|galaxy|dell|lenovo|asus|acer|samsung|apple|hewlett|zenbook|ideapad|pavilion|latitude|inspiron)\b/i.test(
      input.task,
    )
  )
    return {
      kind: "clarification",
      message:
        "That real model is not verified in this catalog. A sample device profile does not establish its compatibility. I need manufacturer specifications and a real product source before recommending a fit.",
    };
  return intent;
}
