import "dotenv/config";
import { readFile } from "node:fs/promises";
import { planAgent, compareWithModel } from "../src/server/agent-planner";
import { modelLabelExtraction } from "../src/server/ai";
import { researchProducts, realModels } from "../src/domain/research";
import { canonicalModel } from "../src/domain/identification";
import { recordLiveChecks } from "./live-check-report";
if (process.argv.includes("--prepared")) {
  const candidate = JSON.parse(
    await readFile(".data/self-hosted/candidate.json", "utf8"),
  );
  process.env.AI_PROVIDER = "self_hosted";
  process.env.AI_MODEL = candidate.alias;
  process.env.AI_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
  process.env.AI_SELF_HOSTED_API_KEY = (
    await readFile(".data/self-hosted/api-key", "utf8")
  ).trim();
}
process.env.AI_MODE = "live";
process.env.AGENT_MODEL_ENABLED = "true";
const input = { model: "Atlas 14", budget: 8000 };
const report = await recordLiveChecks(
  ".data/reports/local-model-selection.json",
  [
    {
      scenario:
        "Composed goals with exact M1 device, complete cable budget and no financial tool",
      check: async () => {
        if (process.env.AI_PROVIDER !== "self_hosted")
          throw new Error(
            "Select private inference explicitly. No cloud request permitted.",
          );
        const result = await planAgent(
          {
            ...input,
            task: "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping to save money and show my orders.",
          },
          undefined,
          [],
        );
        return (
          result.mode === "model" &&
          result.plan.tool === "research_products" &&
          result.plan.model === realModels[2] &&
          result.plan.budget === 6000 &&
          result.plan.cable === "none" &&
          !result.plan.fastCharging &&
          result.steps.map((step) => step.tool).join(",") ===
            "research_products,discover_groups,inspect_orders"
        );
      },
    },
    {
      scenario: "Unknown real device is clarified without substitution",
      check: async () => {
        const result = await planAgent(
          {
            ...input,
            task: "Find a charger for Dell XPS 13 under $60, include a cable.",
          },
          undefined,
          [],
        );
        return (
          result.mode === "model" &&
          result.steps.length === 1 &&
          result.plan.tool === "clarify"
        );
      },
    },
    {
      scenario:
        "Grounded eligible recommendation cites the actual product evidence",
      check: async () => {
        const report = researchProducts({
          model: realModels[2],
          budget: 6000,
          cable: "none",
          fastCharging: false,
        });
        const result = await compareWithModel(report);
        return (
          result.productId === "R003" && result.sourceIds.includes("dynamic")
        );
      },
    },
    {
      scenario: "Owned clear label resolves to its actual model",
      check: async () => {
        const result = await modelLabelExtraction({
          bytes: await readFile("fixtures/evaluation/vision-v1/label-1.png"),
          mime: "image/png",
        });
        return (
          result.readable &&
          result.labels.length === 1 &&
          canonicalModel(result.labels[0]) === "Atlas 14"
        );
      },
    },
    {
      scenario: "Blurred label never proposes a device from a readable heading",
      check: async () => {
        const result = await modelLabelExtraction({
          bytes: await readFile("fixtures/evaluation/vision-v1/label-12.png"),
          mime: "image/png",
        });
        return !result.readable && result.labels.length === 0;
      },
    },
  ],
  {
    provider: "self_hosted",
    model: process.env.AI_MODEL || "not configured",
    purpose:
      "Bounded development selection; not the held-out 180-record evaluation or EC2 acceptance",
  },
);
console.log(JSON.stringify(report, null, 2));
if (!report.complete) process.exitCode = 1;
