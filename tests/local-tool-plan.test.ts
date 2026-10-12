import { afterEach, expect, it, vi } from "vitest";
import { localToolPlanner } from "../src/server/local-tool-plan";
import {
  fallbackWorkflow,
  validateWorkflow,
} from "../src/domain/agent-workflow";
import { realModels } from "../src/domain/research";
import { planAgent } from "../src/server/agent-planner";
import { selfHostedToolSelection } from "../src/server/self-hosted-ai";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const input = {
  task: "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping to save money and show my orders.",
  model: "Atlas 14",
  budget: 8000,
};
const calls = ["research_products", "discover_groups", "inspect_orders"].map(
  (name) => ({ name, arguments: {} }),
);
function configure() {
  vi.stubEnv("AI_PROVIDER", "self_hosted");
  vi.stubEnv("AI_MODE", "live");
  vi.stubEnv("AGENT_MODEL_ENABLED", "true");
  vi.stubEnv("AI_SELF_HOSTED_PROFILE", "lfm25vl3");
  vi.stubEnv("AI_MODEL", "private-model");
  vi.stubEnv("AI_SELF_HOSTED_BASE_URL", "http://127.0.0.1:8081/v1");
  vi.stubEnv("AI_SELF_HOSTED_API_KEY", "private-runtime-key");
  vi.stubEnv("AI_API_KEY", "unused-cloud-key");
}
function response(proposals = calls) {
  return Response.json({
    choices: [
      {
        finish_reason: "tool_calls",
        message: {
          tool_calls: proposals.map((call) => ({
            type: "function",
            function: {
              name: call.name,
              arguments: JSON.stringify(call.arguments),
            },
          })),
        },
      },
    ],
  });
}
it("native calls use server-owned exact facts and reject attempts to overwrite them", () => {
  const guard = fallbackWorkflow(input).plan;
  const planner = localToolPlanner(guard, input.task);
  const research = planner.definitions.find(
    (tool) => tool.name === "research_products",
  )!;
  expect(research.parameters).toMatchObject({
    properties: {},
    additionalProperties: false,
  });
  const workflow = validateWorkflow(planner.workflow(calls), input);
  expect(workflow.plan).toMatchObject({
    model: realModels[2],
    budget: 6000,
    cable: "none",
    fastCharging: false,
  });
  for (const changed of [
    { budgetUsd: 99 },
    { model: "different-device" },
    { cable: "usb100" },
    { fastCharging: true },
  ])
    expect(() =>
      planner.workflow([{ name: "research_products", arguments: changed }]),
    ).toThrow();
});
it("unparsed shopping values remain proposals requiring shopper confirmation", () => {
  const request = { ...input, task: "Find a charger for MacBook Air M1" };
  const planner = localToolPlanner(
    fallbackWorkflow(request).plan,
    request.task,
  );
  const proposed = planner.workflow([
    { name: "research_products", arguments: { budgetUsd: 60, cable: "none" } },
  ]);
  expect(validateWorkflow(proposed, request).plan.tool).toBe(
    "confirm_interpretation",
  );
});
it("unreviewed devices cannot inherit a sample or substituted model through native research", () => {
  const request = {
    ...input,
    task: "Find a charger for Dell XPS 13 under $60, include a cable.",
  };
  const planner = localToolPlanner(
    fallbackWorkflow(request).plan,
    request.task,
  );
  expect(
    validateWorkflow(
      planner.workflow([{ name: "research_products", arguments: {} }]),
      request,
    ).plan.tool,
  ).toBe("clarify");
  expect(() =>
    planner.workflow([
      { name: "research_products", arguments: { model: realModels[2] } },
    ]),
  ).toThrow();
});
it("parses native function calls without sending the cloud key or executing a tool", async () => {
  configure();
  const modelFetch = vi.fn().mockResolvedValue(response());
  vi.stubGlobal("fetch", modelFetch);
  const result = await planAgent(input, undefined, []);
  expect(result.mode).toBe("model");
  expect(result.steps.map((step) => step.tool)).toEqual(
    calls.map((call) => call.name),
  );
  expect(result.plan).toMatchObject({
    model: realModels[2],
    budget: 6000,
    cable: "none",
  });
  expect(modelFetch).toHaveBeenCalledTimes(1);
  const [endpoint, init] = modelFetch.mock.calls[0];
  expect(endpoint.hostname).toBe("127.0.0.1");
  expect(init.headers.Authorization).toBe("Bearer private-runtime-key");
  expect(JSON.stringify(init)).not.toContain("unused-cloud-key");
  expect(JSON.parse(init.body).messages[1].content).toBe(input.task);
  expect(
    JSON.parse(init.body).tools.map(
      (tool: { function: { name: string } }) => tool.function.name,
    ),
  ).not.toContain("refund");
});
it("rejects a native call changing an explicit budget instead of silently repairing it", async () => {
  configure();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        response([{ name: "research_products", arguments: { budgetUsd: 99 } }]),
      ),
  );
  const result = await planAgent(input, undefined, []);
  expect(result).toMatchObject({
    mode: "unavailable",
    failureStage: "workflow_validation",
  });
});
it("rejects unknown function names without a cloud fallback", async () => {
  configure();
  const modelFetch = vi
    .fn()
    .mockResolvedValue(response([{ name: "refund", arguments: {} }]));
  vi.stubGlobal("fetch", modelFetch);
  await expect(
    selfHostedToolSelection(
      [{ name: "inspect_orders", description: "Own orders", parameters: {} }],
      "Plan",
      {},
    ),
  ).rejects.toMatchObject({ code: "schema" });
  expect(modelFetch).toHaveBeenCalledTimes(1);
});
