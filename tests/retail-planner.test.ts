import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/server/ai", () => ({ completion: vi.fn() }));
import { completion } from "../src/server/ai";
import { planAgent } from "../src/server/agent-planner";
import { fallbackWorkflow } from "../src/domain/agent-workflow";
const input = {
  task: "Compare citrus perfume in 50 ml under $40 and use group buying",
  model: "Atlas 14",
  budget: 8000,
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function enable() {
  vi.stubEnv("AI_MODE", "live");
  vi.stubEnv("AGENT_MODEL_ENABLED", "true");
  vi.stubEnv("AI_PROVIDER", "self_hosted");
}
it("uses the inference adapter to plan retail search followed by group discovery", async () => {
  enable();
  vi.mocked(completion).mockResolvedValue({
    steps: fallbackWorkflow(input).steps,
  });
  const planned = await planAgent(input, undefined, []);
  expect(planned.mode).toBe("model");
  expect(planned.steps.map((step) => step.tool)).toEqual([
    "search_retail",
    "discover_groups",
  ]);
  expect(completion).toHaveBeenCalledTimes(1);
});
it("rejects a model attempting to broaden volume or budget and discloses fallback", async () => {
  enable();
  const first = fallbackWorkflow(input).plan;
  if (first.tool !== "search_retail") throw new Error("Expected retail search");
  vi.mocked(completion).mockResolvedValue({
    steps: [
      {
        ...first,
        budget: 9000,
        requirements: { scent: "citrus", volumeMl: 100 },
      },
    ],
  });
  const planned = await planAgent(input, undefined, []);
  expect(planned.mode).toBe("unavailable");
  expect(planned.plan).toEqual(first);
});
