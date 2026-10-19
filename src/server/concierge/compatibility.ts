import { z } from "zod";
import {
  deviceProfiles,
  knownModels,
  productFits,
  models as sampleModels,
} from "@/domain/catalog";
import { deviceRegistry } from "@/domain/device-registry";
import { lifestyleProfile } from "@/domain/departments";
import {
  realModels,
  researchProducts,
  researchSources,
  matchesResearchEvidence,
} from "@/domain/research";
import { productDetails } from "./retrieval";

export const compatibilityArguments = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("profiles") }).strict(),
  z
    .object({
      operation: z.literal("assess"),
      device_model: z.string().min(1).max(100),
      product_ids: z.array(z.string().min(1).max(150)).min(1).max(12),
      budget_cents: z.number().int().min(1).max(1000000),
      cable: z.enum(["unknown", "none", "usb60", "usb100", "magsafe3"]),
      fast_charging: z.boolean(),
    })
    .strict(),
]);

export async function deviceCompatibility(raw: unknown) {
  const input = compatibilityArguments.parse(raw);
  if (input.operation === "profiles")
    return {
      profiles: knownModels.map((model) => {
        const device = deviceRegistry.find((d) => d.model === model);
        return {
          model,
          label: deviceProfiles[model] || model,
          scope: device
            ? "recorded_manufacturer_device"
            : model === lifestyleProfile
              ? "no_accessory_fit_check"
              : "engineering_sample",
          device: device || null,
          source: device
            ? researchSources.find((s) => s.id === device.sourceId) || null
            : null,
        };
      }),
      scope:
        "Recorded compatibility evidence only; no arbitrary-device lookup or live manufacturer verification.",
    };
  const products = await productDetails(input.product_ids);
  const report = realModels.includes(input.device_model)
    ? researchProducts({
        model: input.device_model,
        budget: 1000000,
        cable: input.cable,
        fastCharging: input.fast_charging,
      })
    : null;
  return {
    device_model: input.device_model,
    known_profile: knownModels.includes(input.device_model),
    questions: report?.questions || [],
    freshness: report?.freshness || null,
    assessments: products.map((p) => {
      const finding = report?.findings.find((f) => f.productId === p.id);
      const evidenceMatches = matchesResearchEvidence(p);
      const reasons = finding ? [...finding.reasons] : [];
      let status: "supported" | "unverified" | "not_applicable" = "unverified";
      let evidenceKind = "no_verified_accessory_assessment";
      if (input.device_model === lifestyleProfile) {
        status = "not_applicable";
        reasons.push(
          "The general purchase profile performs no device compatibility check.",
        );
      } else if (report && finding && evidenceMatches) {
        evidenceKind = "recorded_manufacturer_evidence";
        if (finding.eligible && p.compatibleModels.includes(input.device_model))
          status = "supported";
        else if (!p.compatibleModels.includes(input.device_model))
          reasons.push(
            "The current published record does not confirm this exact device.",
          );
      } else if (report && finding) {
        reasons.push(
          "The published product identity or compatibility metadata changed from the qualified evidence pack. Re-verify the evidence before claiming fit.",
        );
      } else if (
        sampleModels.includes(input.device_model) &&
        p.compatibleModels.includes(input.device_model) &&
        productFits(p, input.device_model)
      ) {
        status = "supported";
        evidenceKind = "engineering_sample_only";
        reasons.push(
          "This is an engineering profile assessment, not manufacturer verification for a real device.",
        );
      } else
        reasons.push(
          "No deterministic assessment is available for this exact published product and device. Do not infer a fit from its name or general purchase eligibility.",
        );
      const withinBudget = p.price <= input.budget_cents;
      if (!withinBudget)
        reasons.push("The current DALE offer exceeds the specified budget.");
      return {
        product_id: p.id,
        name: p.name,
        status,
        evidence_kind: evidenceKind,
        eligible:
          status === "supported" &&
          withinBudget &&
          p.stock > 0 &&
          !p.comparisonOnly,
        within_budget: withinBudget,
        price_cents: p.price,
        compatible_models: p.compatibleModels,
        reasons,
        sources: finding
          ? researchSources.filter((s) => finding.sourceIds.includes(s.id))
          : [],
      };
    }),
    missing_ids: input.product_ids.filter(
      (id) => !products.some((p) => p.id === id),
    ),
    scope:
      "Recorded evidence and deterministic requirements; unverified does not mean physically incompatible. No live manufacturer or inventory verification.",
  };
}
