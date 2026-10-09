import { afterEach, expect, it, vi } from "vitest";
import {
  localIntentSchema,
  localIntentSchemaForPlan,
  localIntentWorkflow,
} from "../src/server/local-agent-plan";
import { planAgent } from "../src/server/agent-planner";
import { realModels } from "../src/domain/research";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const base = {
  goals: ["research_products"],
  model: realModels[2],
  budgetUsd: 59.99,
  cable: "none",
  fastCharging: false,
  reason: null,
  remedy: null,
  question: null,
};
it("converts currency units on the server, and derives family from the reviewed registry", () => {
  expect(
    localIntentWorkflow(localIntentSchema.parse(base)).steps[0],
  ).toMatchObject({ budget: 5999, deviceFamily: "reviewed", cable: "none" });
  expect(() => localIntentSchema.parse({ ...base, budgetUsd: 0 })).toThrow();
});
it("does not accept a local semantic proposal that changes explicit shopper constraints", async () => {
  vi.stubEnv("AI_PROVIDER", "self_hosted");
  vi.stubEnv("AI_MODE", "live");
  vi.stubEnv("AGENT_MODEL_ENABLED", "true");
  vi.stubEnv("AI_MODEL", "private-model");
  vi.stubEnv("AI_SELF_HOSTED_BASE_URL", "http://127.0.0.1:8081/v1");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify({ ...base, budgetUsd: 99 }) },
          },
        ],
      }),
    ),
  );
  const result = await planAgent(
    {
      task: "Find a charger for MacBook Air M1 under $60, include a cable",
      model: "Atlas 14",
      budget: 8000,
    },
    undefined,
    [],
  );
  expect(result.mode).toBe("unavailable");
  expect(result).toMatchObject({
    failureStage: "inference",
    failureCode: "schema",
  });
  expect(result.plan).toMatchObject({
    budget: 6000,
    cable: "none",
    model: realModels[2],
  });
});

it("constrains only exact server facts and leaves unparsed values as proposals", () => {
  const schema = localIntentSchemaForPlan(
    {
      tool: "research_products",
      model: realModels[2],
      budget: 6000,
      cable: "none",
      fastCharging: false,
      deviceFamily: "reviewed",
    },
    "under $60, normal charging",
  );
  expect(() => schema.parse({ ...base, budgetUsd: 60 })).not.toThrow();
  for (const changed of [
    { budgetUsd: 99 },
    { model: null },
    { cable: "usb100" },
    { fastCharging: true },
  ])
    expect(() =>
      schema.parse({ ...base, budgetUsd: 60, ...changed }),
    ).toThrow();
  const unparsed = localIntentSchemaForPlan(
    {
      tool: "research_products",
      model: null,
      budget: null,
      cable: "unknown",
      fastCharging: false,
      deviceFamily: "m2air",
    },
    "Help me choose something suitable",
  );
  expect(() => unparsed.parse({ ...base, fastCharging: true })).not.toThrow();
});
it("rejects incomplete clarification rather than repairing it into success", () => {
  expect(() =>
    localIntentWorkflow(
      localIntentSchema.parse({
        ...base,
        goals: ["clarify"],
      }),
    ),
  ).toThrow(/Missing clarification/);
  const clarification = localIntentSchemaForPlan(
    { tool: "clarify", question: "Which exact model do you have?" },
    "Find an unreviewed device",
  );
  expect(() =>
    clarification.parse({ ...base, goals: ["clarify"], question: null }),
  ).toThrow();
});

it("keeps a registry-required clarification when shopping intent has no verified device", () => {
  const guard = {
    tool: "clarify" as const,
    question: "Provide an exact model with reviewed manufacturer evidence.",
  };
  const intent = localIntentSchema.parse({ ...base, model: null });
  expect(localIntentWorkflow(intent, guard).steps).toEqual([guard]);
  // A substituted reviewed model is not repaired into a pass: it still reaches
  // the ordinary conflict validator and is rejected against the unreviewed task.
  const substituted = localIntentWorkflow(localIntentSchema.parse(base), guard);
  expect(substituted.steps[0].tool).toBe("research_products");
  expect(() =>
    localIntentWorkflow({ ...intent, goals: ["clarify"] }, guard),
  ).toThrow(/Missing clarification/);
});
