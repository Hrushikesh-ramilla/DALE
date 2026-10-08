import { afterEach, expect, it, vi } from "vitest";
import {
  localIntentSchema,
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
  expect(result.plan).toMatchObject({
    budget: 6000,
    cable: "none",
    model: realModels[2],
  });
});
it("rejects incomplete clarification rather than repairing it into success", () => {
  expect(() =>
    localIntentWorkflow(
      localIntentSchema.parse({ ...base, goals: ["clarify"] }),
    ),
  ).toThrow(/Missing clarification/);
});
