import { z } from "zod";
import { realModels } from "@/domain/research";
import type { WorkflowStep } from "@/domain/agent-workflow";
import { resolveDevices } from "@/domain/device-registry";
import { plannerSchema } from "@/domain/agent-plan";

// A small local model extracts intent and values. Unit conversion and registry
// metadata belong to the server, followed by the ordinary workflow validator.
export const localIntentSchema = z
  .object({
    goals: z
      .array(
        z.enum([
          "research_products",
          "discover_groups",
          "inspect_orders",
          "inspect_claims",
          "prepare_support",
          "scan_message",
          "clarify",
          "legacy_task",
        ]),
      )
      .min(1)
      .max(6),
    model: z.string().max(120).nullable(),
    budgetUsd: z.number().min(0.01).max(1000).nullable(),
    cable: z.enum(["unknown", "none", "usb60", "usb100", "magsafe3"]),
    fastCharging: z.boolean(),
    reason: z
      .enum(["damaged", "wrong_item", "not_delivered", "canceled"])
      .nullable(),
    remedy: z.enum(["refund", "replacement"]).nullable(),
    question: z.string().max(300).nullable(),
  })
  .strict();

export function localIntentWorkflow(intent: z.infer<typeof localIntentSchema>) {
  const resolved = intent.model ? resolveDevices(intent.model) : [];
  const model =
    intent.model && realModels.includes(intent.model)
      ? intent.model
      : resolved.length === 1
        ? resolved[0].model
        : null;
  const steps: WorkflowStep[] = intent.goals.map((tool) => {
    if (tool === "research_products")
      if (intent.model && !model)
        return {
          tool: "clarify",
          question:
            "Which exact device model and year do you have? I need reviewed manufacturer evidence before comparing its charging options.",
        };
      else
        return {
          tool,
          model,
          budget:
            intent.budgetUsd === null
              ? null
              : Math.round(intent.budgetUsd * 100),
          cable: intent.cable,
          fastCharging: intent.fastCharging,
          deviceFamily:
            model && realModels.slice(2).includes(model) ? "reviewed" : "m2air",
        };
    if (tool === "prepare_support")
      return {
        tool,
        ...(intent.reason ? { reason: intent.reason } : {}),
        ...(intent.remedy ? { request: intent.remedy } : {}),
      };
    if (tool === "clarify") {
      if (!intent.question?.trim())
        throw new Error("Missing clarification question.");
      return { tool, question: intent.question };
    }
    return tool === "discover_groups"
      ? { tool }
      : plannerSchema.parse({ tool });
  });
  return { steps };
}

export const localIntentInstruction = `Extract the shopper's intent into JSON. goals is an ordered list of ONLY requested goals: research_products = find/compare products; discover_groups = seek group savings; inspect_orders = see own orders; inspect_claims = see own return cases; prepare_support = draft a return/refund/replacement; scan_message = inspect an untrusted seller message; clarify = ask a short question; legacy_task = refuse payment/code execution.
For shopping, model is the device name the shopper states, copied without substituting another device. If none is stated, use confirmed prior model or null. Do not infer a device from the budget. The server resolves device names against reviewed manufacturer records. Use confirmed context for follow-ups; never invent missing facts.
serverExtractedConstraints are exact parameters parsed by the server from the shopper's words. Preserve them when provided; they are not a suggestion. Select goals from the task separately.
budgetUsd is the stated maximum in DOLLARS, e.g. $25.50 is 25.50. Keep confirmed prior budget if unchanged; otherwise null.
cable describes what the shopper ALREADY OWNS: unknown if unstated; none if a new/included cable is needed; usb60/usb100 for an owned 60W/100W cable; magsafe3 for an owned MagSafe 3 cable. fastCharging is false unless requested or confirmed previously.
reason and remedy are null unless a support request supplies them. question is null unless asking clarification. Do not add unrelated goals. Never buy, join, refund, invent evidence or execute commands. A request to see a parcel's progress has only inspect_orders. A request for another delivered broken item has only prepare_support, reason damaged, remedy replacement.`;
