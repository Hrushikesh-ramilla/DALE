import { z } from "zod";
import { realModels, type Cable, type ResearchNeed } from "./research";
import { mentionedModels } from "./identification";
import { scanMessage } from "./scams";
import type { AgentRequest } from "./agent";

export const plannerSchema = z.discriminatedUnion("tool", [
  z.object({
    tool: z.literal("research_products"),
    model: z.enum(realModels as [string, ...string[]]).nullable(),
    budget: z.number().int().min(1).max(100000).nullable(),
    cable: z.enum(["unknown", "none", "usb60", "usb100", "magsafe3"]),
    fastCharging: z.boolean(),
    deviceFamily: z.literal("m2air"),
  }),
  z.object({ tool: z.literal("scan_message") }),
  z.object({ tool: z.literal("inspect_orders") }),
  z.object({
    tool: z.literal("prepare_support"),
    reason: z
      .enum(["damaged", "wrong_item", "not_delivered", "canceled"])
      .optional(),
    request: z.enum(["refund", "replacement"]).optional(),
  }),
  z.object({
    tool: z.literal("clarify"),
    question: z.string().min(1).max(500),
  }),
  z.object({ tool: z.literal("legacy_task") }),
  z.object({
    tool: z.literal("confirm_interpretation"),
    model: z.enum(realModels as [string, ...string[]]),
    budget: z.number().int().min(1).max(100000).nullable(),
  }),
]);
export type AgentPlan = z.infer<typeof plannerSchema>;
export type ResearchContext = Omit<ResearchNeed, "model" | "budget"> & {
  model: string | null;
  budget: number | null;
  deviceFamily: "m2air";
};

export function fallbackPlan(
  input: AgentRequest,
  previous?: ResearchContext,
): AgentPlan {
  const text = input.task;
  // Quoted seller instructions are analyzed, never executed.
  if (
    /\b(?:seller|message|scam|suspicious|safe|legit|phishing)\b/i.test(text) &&
    (scanMessage(text).level !== "low" ||
      /\b(?:message|scam|phishing)\b/i.test(text))
  )
    return { tool: "scan_message" };
  if (
    /\b(?:approve|pay|purchase|execute|run code|transfer|delete)\b/i.test(text)
  )
    return { tool: "legacy_task" };
  if (
    /\b(?:damaged|wrong item|refund|replacement|return|not delivered|not arrived|canceled|cancelled)\b/i.test(
      text,
    )
  )
    return {
      tool: "prepare_support",
      reason: /wrong item/i.test(text)
        ? "wrong_item"
        : /damaged/i.test(text)
          ? "damaged"
          : /cancel/i.test(text)
            ? "canceled"
            : /not (?:arrived|delivered)/i.test(text)
              ? "not_delivered"
              : undefined,
      request: /replac/i.test(text)
        ? "replacement"
        : /refund/i.test(text)
          ? "refund"
          : undefined,
    };
  if (/\b(?:my orders?|track|order status)\b/i.test(text))
    return { tool: "inspect_orders" };
  if (/\b(?:inr|rupees?|euros?|pounds?|eur|gbp)\b|[₹€£]/i.test(text))
    return {
      tool: "clarify",
      question:
        "This comparison uses US reference prices and USD demo offers. What is your maximum budget in USD?",
    };
  const real = mentionedModels(text).filter((model) =>
    realModels.includes(model),
  );
  if (
    real.length > 1 ||
    (real.length && mentionedModels(text).length > real.length)
  )
    return {
      tool: "clarify",
      question:
        "You mentioned different devices. Which exact model is this purchase for?",
    };
  const family = /macbook\s+air/i.test(text) && /\bm2\b/i.test(text);
  if (mentionedModels(text).some((model) => !realModels.includes(model)))
    return { tool: "legacy_task" };
  if (family && /\b(?:ssd|dock|hub|headphones?|mouse|storage)\b/i.test(text))
    return {
      tool: "clarify",
      question:
        "The manufacturer evidence pack currently covers charging for this real device. I need verified product specifications before comparing another category; I will not substitute sample inventory.",
    };
  const otherDevice =
    /\b(?:macbook|iphone|ipad|thinkpad|surface|galaxy|dell|lenovo|asus|acer|samsung|apple|zenbook)\b/i.test(
      text,
    ) && !family;
  if (otherDevice)
    return {
      tool: "clarify",
      question:
        "That real model is not verified in the current evidence pack. Give the exact model and year; supported real-device comparisons currently cover 13-inch and 15-inch MacBook Air M2 chargers. I will not substitute a sample profile.",
    };
  const continuation =
    previous &&
    /\b(?:cable|mag\s*safe|magsafe|fast|normal|charging|budget|under|below|instead|13|15|100w|60w)\b/i.test(
      text,
    );
  if (!family && !real.length && !continuation) return { tool: "legacy_task" };
  const amounts = [
    ...text.matchAll(
      /(?:under|below|up to|budget(?: of| is|:)?|maximum(?: of| is|:)?)\s*\$?\s*(\d+(?:\.\d{1,2})?)/gi,
    ),
  ].map((m) => Math.round(Number(m[1]) * 100));
  if (new Set(amounts).size > 1 || amounts.some((n) => n < 1 || n > 100000))
    return {
      tool: "clarify",
      question: "Choose one maximum budget between $0.01 and $1,000 USD.",
    };
  let model = real[0] || (family ? null : previous?.model) || null;
  if (!real.length && previous && /\b13(?:\.6)?(?:[ -]?inch)?\b/i.test(text))
    model = realModels[0];
  if (!real.length && previous && /\b15(?:\.3)?(?:[ -]?inch)?\b/i.test(text))
    model = realModels[1];
  let cable: Cable = previous?.cable || "unknown";
  if (
    /\b(?:no cable|need (?:a |the )?cable|include (?:a |the )?cable|don't have .*cable|do not have .*cable)\b/i.test(
      text,
    )
  )
    cable = "none";
  else if (
    /\b(?:have|own|using|with|original|already)\b/i.test(text) &&
    /mag\s*safe\s*3/i.test(text)
  )
    cable = "magsafe3";
  else if (
    /\b(?:have|own|using|with|already)\b/i.test(text) &&
    /(?:100|240)\s*w.*cable|cable.*(?:100|240)\s*w/i.test(text)
  )
    cable = "usb100";
  else if (
    /\b(?:have|own|using|with|already)\b/i.test(text) &&
    /60\s*w.*cable|cable.*60\s*w/i.test(text)
  )
    cable = "usb60";
  const fastCharging =
    /(?:no|don't need|do not need|without|not)\s+fast|normal (?:charging|charge)/i.test(
      text,
    )
      ? false
      : /fast(?:er)?[ -]?(?:charging|charge)/i.test(text)
        ? true
        : previous?.fastCharging || false;
  return {
    tool: "research_products",
    model,
    budget: amounts[0] ?? previous?.budget ?? null,
    cable,
    fastCharging,
    deviceFamily: "m2air",
  };
}

export function validateModelPlan(
  plan: AgentPlan,
  input: AgentRequest,
  previous?: ResearchContext,
) {
  const explicit = fallbackPlan(input, previous);
  if (
    plan.tool === "research_products" &&
    plan.model &&
    explicit.tool === "legacy_task" &&
    !/\b(?:approve|pay|purchase|execute|run code|transfer|delete)\b/i.test(
      input.task,
    )
  ) {
    // Semantic interpretation may propose known facts, but cannot confirm a purchase brief on the buyer's behalf.
    return {
      tool: "confirm_interpretation" as const,
      model: plan.model,
      budget: plan.budget,
    };
  }
  // Model text has no authority to override recognized constraints or switch away from safety tools.
  if (
    explicit.tool !== "legacy_task" &&
    (plan.tool !== explicit.tool ||
      (plan.tool !== "clarify" &&
        JSON.stringify(plan) !== JSON.stringify(explicit)))
  )
    throw new Error(
      "The model plan conflicts with the shopper's confirmed constraints.",
    );
  if (
    explicit.tool === "legacy_task" &&
    /\b(?:approve|pay|purchase|execute|run code|transfer|delete)\b/i.test(
      input.task,
    ) &&
    plan.tool !== "legacy_task"
  )
    throw new Error("The model requested unauthorized financial authority.");
  if (plan.tool === "research_products" && explicit.tool === "legacy_task")
    throw new Error(
      "The model invented an unconfirmed device or shopping constraint.",
    );
  return plan;
}
