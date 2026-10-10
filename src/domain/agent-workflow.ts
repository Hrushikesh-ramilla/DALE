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
        .max(6),
    })
    .strict(),
]);
export type WorkflowStep = AgentPlan | z.infer<typeof groupDiscoverySchema>;
export type AgentGroupOffer = {
  productId: string;
  model: string;
  briefVersion: number;
  policyVersion: number;
  minimumMembers: number;
  discountPercent: number;
  checkoutMinutes: number;
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
  const guard = fallbackPlan(input, context);
  const protectedRequest =
    guard.tool === "scan_message" || financialRequest(input.task);
  const shopping = shoppingInput(input);
  const research = fallbackPlan(shopping, context);
  const primary =
    !protectedRequest &&
    research.tool === "research_products" &&
    (!orderGoal(input.task) ||
      /\b(?:find|buy|shop|compare|choose|recommend|need|looking)\b/i.test(
        input.task,
      ))
      ? research
      : guard;
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
  if (!protectedRequest) {
    if (
      orderGoal(input.task) &&
      !steps.some((s) => s.tool === "inspect_orders")
    )
      steps.push({ tool: "inspect_orders" });
    if (
      claimGoal(input.task) &&
      !steps.some((s) => s.tool === "inspect_claims")
    )
      steps.push({ tool: "inspect_claims" });
    if (
      supportGoal(input.task) &&
      !steps.some((s) => s.tool === "prepare_support")
    ) {
      const support = fallbackPlan(
        {
          ...input,
          task: input.task.replace(
            /\b(?:my orders?|track|order status|my cases?|claim status|return status|evidence report|case status)\b/gi,
            "",
          ),
        },
        context,
      );
      if (support.tool === "prepare_support") steps.push(support);
    }
  }
  return { plan: primary, steps };
}
const financialRequest = (text: string) =>
  /\b(?:approve|pay|purchase|execute|run code|transfer|delete)\b/i.test(text);
const orderGoal = (text: string) =>
  /\b(?:my orders?|track|order status|shipment|purchase history)\b/i.test(text);
const claimGoal = (text: string) =>
  /\b(?:my cases?|claim status|return status|evidence report|case status)\b/i.test(
    text,
  );
const supportGoal = (text: string) =>
  /\b(?:damaged|broken|cracked|shattered|wrong item|refund|money back|replacement|return|not delivered|not arrived|canceled|cancelled)\b/i.test(
    text,
  );
function shoppingInput(input: AgentRequest): AgentRequest {
  if (!/\b(?:charger|charging|macbook|cable|device|laptop)\b/i.test(input.task))
    return input;
  return {
    ...input,
    task: input.task.replace(
      /\b(?:my orders?|track|order status|damaged|broken|wrong item|refund|replacement|return|not delivered|not arrived|canceled|cancelled|my cases?|claim status|return status|evidence report)\b/gi,
      "",
    ),
  };
}
function validateSupport(
  plan: Extract<AgentPlan, { tool: "prepare_support" }>,
  input: AgentRequest,
) {
  const statedRequest = /\breplac(?:e|ement)\b/i.test(input.task)
    ? "replacement"
    : /\b(?:refund|money back)\b/i.test(input.task)
      ? "refund"
      : undefined;
  if (statedRequest && plan.request && plan.request !== statedRequest)
    throw new Error(
      "The support draft conflicts with the customer's chosen remedy.",
    );
  return plan;
}
export function validateWorkflow(
  response: z.infer<typeof workflowResponseSchema>,
  input: AgentRequest,
  context?: ResearchContext,
) {
  const steps: WorkflowStep[] =
    "steps" in response ? response.steps : [response];
  const primary = steps[0];
  if (new Set(steps.map((step) => step.tool)).size !== steps.length)
    throw new Error("A tool may run only once per task.");
  const researchIndex = steps.findIndex(
    (step) => step.tool === "research_products",
  );
  const groupIndex = steps.findIndex((step) => step.tool === "discover_groups");
  if (researchIndex >= 0 && groupIndex >= 0 && groupIndex < researchIndex)
    throw new Error("Research must precede dependent group discovery.");
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
  const guard = fallbackPlan(input, context);
  if (
    financialRequest(input.task) &&
    guard.tool !== "scan_message" &&
    (steps.length !== 1 || primary.tool !== "legacy_task")
  )
    throw new Error("The model requested unauthorized financial authority.");
  if (
    guard.tool === "scan_message" &&
    (steps.length !== 1 || primary.tool !== "scan_message")
  )
    throw new Error(
      "Untrusted seller instructions require isolated safety analysis.",
    );
  const validated =
    primary.tool === "research_products"
      ? validateModelPlan(primary, shoppingInput(input), context)
      : ["inspect_orders", "inspect_claims"].includes(primary.tool)
        ? primary
        : primary.tool === "prepare_support" && supportGoal(input.task)
          ? validateSupport(primary, input)
          : validateModelPlan(primary, input, context);
  if (validated.tool === "confirm_interpretation")
    return { plan: validated, steps: [validated] as WorkflowStep[] };
  const seen = new Set<string>([validated.tool]);
  for (const step of steps.slice(1)) {
    if (seen.has(step.tool))
      throw new Error("A tool may run only once per task.");
    seen.add(step.tool);
    if (step.tool === "discover_groups") {
      if (
        declinesGroupSavings(input.task) ||
        !["research_products", "legacy_task"].some((tool) =>
          steps.some((s) => s.tool === tool),
        )
      )
        throw new Error(
          "Group discovery needs confirmed shopping constraints.",
        );
    } else if (
      step.tool === "inspect_orders" ||
      step.tool === "inspect_claims"
    ) {
      // Scoped read-only tools may be composed by semantic planning without fixed trigger phrases.
    } else if (step.tool === "prepare_support" && supportGoal(input.task)) {
      validateSupport(step, input);
      // A draft has no remedy authority and is explicitly reviewed before submission.
    } else if (step.tool === "research_products") {
      const check = validateModelPlan(step, shoppingInput(input), context);
      if (check.tool !== "research_products")
        throw new Error(
          "Confirm the proposed shopping interpretation before dependent tools.",
        );
    } else
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
