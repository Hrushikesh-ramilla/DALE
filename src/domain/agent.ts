import { z } from "zod";
import { models } from "./catalog";
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
        "Real-product lookup is not connected. I cannot verify an arbitrary device. For a sample task, explicitly name USB-C Laptop (65W), USB-C Laptop (100W), USB-C Laptop (45W) or Barrel-jack Laptop (45W).",
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
