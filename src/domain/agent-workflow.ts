import { z } from "zod";
import {
  fallbackPlan,
  plannerSchema,
  validateModelPlan,
  type AgentPlan,
  type ResearchContext,
} from "./agent-plan";
import type { AgentRequest } from "./agent";

export const groupDiscoverySchema = z
  .object({ tool: z.literal("discover_groups") })
  .strict();
export const workflowResponseSchema = z.union([
  plannerSchema,
  z
    .object({
      steps: z
        .array(z.union([plannerSchema, groupDiscoverySchema]))
        .min(1)
        .max(4),
    })
    .strict(),
]);
export type WorkflowStep = AgentPlan | z.infer<typeof groupDiscoverySchema>;
export type AgentGroupOffer = {
  productId: string;
  model: string;
  briefVersion: number;
  groupId?: string;
  memberCount: number;
  joined: boolean;
  status: "forming" | "ready" | "available";
  baseAmount: number;
  groupAmount: number;
  saving: number;
  deadline?: string;
  eligible: boolean;
  nextStep: string;
};
export function wantsGroupSavings(text: string) {
  if (declinesGroupSavings(text)) return false;
  return /\b(?:group(?:ing|s| deal| buying)?|buy together|bulk|collective|pool(?:ing)?|split .*cost)\b/i.test(
    text,
  );
}
export function declinesGroupSavings(text: string) {
  return /\b(?:no|without|stop|skip|avoid)\s+(?:the\s+)?group|\b(?:don't|do not)\s+(?:want|use|need)\s+(?:a\s+)?group|\bshop alone\b/i.test(
    text,
  );
}
export function groupSavingsEnabled(text: string, previous = false) {
  return !declinesGroupSavings(text) && (wantsGroupSavings(text) || previous);
}
function groupOnlyRequest(text: string) {
  return (
    wantsGroupSavings(text) &&
    !/\b(?:approve|pay|purchase|execute|transfer|delete|charger|laptop|device|phone|macbook|ssd|dock|mouse|headphones?|under|below|budget)\b/i.test(
      text,
    )
  );
}
export function fallbackWorkflow(
  input: AgentRequest,
  context?: ResearchContext,
) {
  const primary = fallbackPlan(input, context);
  if (primary.tool === "legacy_task" && groupOnlyRequest(input.task))
    return {
      plan: primary,
      steps: [{ tool: "discover_groups" }] as WorkflowStep[],
    };
  const steps: WorkflowStep[] = [primary];
  if (
    groupSavingsEnabled(input.task, context?.groupSavings) &&
    (primary.tool === "research_products" || primary.tool === "legacy_task")
  )
    steps.push({ tool: "discover_groups" });
  return { plan: primary, steps };
}
export function validateWorkflow(
  response: z.infer<typeof workflowResponseSchema>,
  input: AgentRequest,
  context?: ResearchContext,
) {
  const steps: WorkflowStep[] =
    "steps" in response ? response.steps : [response];
  const primary = steps[0];
  if (primary.tool === "discover_groups") {
    const guard = fallbackPlan(input, context);
    if (
      steps.length !== 1 ||
      !groupOnlyRequest(input.task) ||
      guard.tool === "clarify" ||
      /\b(?:approve|pay|purchase|execute|transfer|delete)\b/i.test(input.task)
    )
      throw new Error("Group discovery needs a shopper savings request.");
    return { plan: fallbackPlan(input, context), steps };
  }
  const validated = validateModelPlan(primary, input, context);
  if (validated.tool === "confirm_interpretation")
    return { plan: validated, steps: [validated] as WorkflowStep[] };
  const seen = new Set<string>([validated.tool]);
  for (const step of steps.slice(1)) {
    if (seen.has(step.tool))
      throw new Error("A tool may run only once per task.");
    seen.add(step.tool);
    if (
      step.tool !== "discover_groups" ||
      declinesGroupSavings(input.task) ||
      !["research_products", "legacy_task"].includes(validated.tool)
    )
      throw new Error("This dependent tool has no supported shopper goal.");
  }
  if (
    groupSavingsEnabled(input.task, context?.groupSavings) &&
    (validated.tool === "research_products" ||
      validated.tool === "legacy_task") &&
    !seen.has("discover_groups")
  )
    steps.push({ tool: "discover_groups" });
  return { plan: validated, steps: [validated, ...steps.slice(1)] };
}
