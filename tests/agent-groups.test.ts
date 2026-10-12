import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runAgent } from "../src/server/agent";
import { planAgent } from "../src/server/agent-planner";
import { fallbackPlan } from "../src/domain/agent-plan";
import {
  validateWorkflow,
  workflowResponseSchema,
} from "../src/domain/agent-workflow";
import {
  commitAgentGroup,
  discoverAgentGroups,
} from "../src/server/agent-groups";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import {
  capture,
  checkout,
  joinGroup,
  makeQuote,
  snapshot,
} from "../src/server/service";
const input = {
  model: "Atlas 14",
  budget: 8000,
  task: "Find a charger for my MacBook Air M2 13-inch under $53, include a cable, normal charging. Use grouping to reduce the cost.",
};
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.AI_MODE = "fixture";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AGENT_MODEL_ENABLED = "false";
  process.env.AI_BILLING_DISABLED = "false";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Network forbidden");
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env.AI_MODE = "fixture";
  process.env.AGENT_MODEL_ENABLED = "false";
  process.env.AI_BILLING_DISABLED = "false";
});
async function buyer(fixture = true): Promise<Actor> {
  return {
    workspaceId: (await createWorkspace({ fixture })).id,
    userId: "shopper",
    role: "buyer",
  };
}
function native(...results: unknown[]) {
  process.env.AI_MODE = "live";
  process.env.AGENT_MODEL_ENABLED = "true";
  process.env.AI_BILLING_DISABLED = "true";
  process.env.AI_MODEL = "gemini-3.8-flash";
  process.env.AI_API_KEY = "mock-only";
  delete process.env.AI_API_BASE_URL;
  const mock = vi.fn();
  for (const result of results)
    mock.mockResolvedValueOnce(
      Response.json({
        candidates: [
          {
            content: { parts: [{ text: JSON.stringify(result) }] },
            finishReason: "STOP",
          },
        ],
      }),
    );
  vi.stubGlobal("fetch", mock);
  return mock;
}
it("composes research and conditional group savings without creating partners, commitments or payments", async () => {
  const actor = await buyer();
  const data = await runAgent(actor, input);
  expect(data.run.toolCalls?.map((call) => call.tool)).toEqual([
    "research_products",
    "discover_groups",
  ]);
  expect(data.run.productIds).toHaveLength(0); // $58 standalone bundle fails the $53 budget.
  expect(data.run.groupOffers?.filter((offer) => offer.eligible)).toEqual([
    expect.objectContaining({
      productId: "R003",
      groupAmount: 5220,
      saving: 580,
      memberCount: 0,
      joined: false,
    }),
  ]);
  expect(data.run.reply).toContain("conditional total is $52.20");
  expect(data.snapshot.groups).toHaveLength(0);
  expect(data.snapshot.orders).toHaveLength(0);
  expect((await snapshot(actor)).agentRuns.at(-1)?.groupOffers).toEqual(
    data.run.groupOffers,
  );
});
it("keeps the group goal through clarification and budget follow-ups", async () => {
  const actor = await buyer();
  const incomplete = await runAgent(actor, {
    ...input,
    task: "Find a charger for my MacBook Air M2 under $53 with group savings",
  });
  expect(incomplete.run.context?.groupSavings).toBe(true);
  expect(incomplete.run.toolCalls?.at(-1)?.status).toBe("skipped");
  await runAgent(actor, { ...input, task: "It is 13-inch" });
  await runAgent(actor, { ...input, task: "I need a cable included" });
  const final = await runAgent(actor, { ...input, task: "My budget is $60" });
  expect(
    final.run.groupOffers?.some(
      (offer) => offer.productId === "R003" && offer.eligible,
    ),
  ).toBe(true);
  expect(final.snapshot.groups).toHaveLength(0);
  const stopped = await runAgent(actor, {
    ...input,
    task: "No grouping, my budget is $60",
  });
  expect(stopped.run.context?.groupSavings).toBeUndefined();
  expect(stopped.run.groupOffers).toBeUndefined();
  const saved = await runAgent(actor, {
    ...input,
    task: "Use grouping to reduce the cost",
  });
  expect(saved.run.toolCalls?.map((call) => call.tool)).toEqual([
    "discover_groups",
  ]);
  expect(saved.run.groupOffers?.some((offer) => offer.eligible)).toBe(true);
  expect(saved.run.reply).not.toContain("Choose one product type");
});
it("requires explicit commitment, reserves only after another real shopper joins, and preserves exact discounted checkout", async () => {
  const actor = await buyer();
  const data = await runAgent(actor, input);
  const groupId = await commitAgentGroup(actor, "R003", data.run.briefVersion!);
  expect((await snapshot(actor)).groups[0].memberCount).toBe(1);
  await expect(
    makeQuote(actor, "R003", data.snapshot.brief!.input.model, groupId),
  ).rejects.toThrow("group offer");
  await joinGroup(
    { ...actor, userId: "second-shopper" },
    "R003",
    data.snapshot.brief!.input.model,
  );
  const quote = await makeQuote(
    actor,
    "R003",
    data.snapshot.brief!.input.model,
    groupId,
  );
  expect(quote.amount).toBe(5220);
  expect((await snapshot(actor)).orders).toHaveLength(0);
  const order = await checkout(actor, quote.id, quote.fingerprint);
  await capture(actor, order.id);
  const saved = await snapshot(actor);
  expect(saved.orders[0].status).toBe("paid");
  expect(saved.orders[0].quote.amount).toBe(5220);
});
it("rejects stale commitments and never uses group pricing to omit the cable or fast-charge requirement", async () => {
  const actor = await buyer();
  const data = await runAgent(actor, input);
  await expect(
    commitAgentGroup(actor, "R001", data.run.briefVersion!),
  ).rejects.toThrow("eligibility");
  await runAgent(actor, { ...input, task: "I want fast charging" });
  await expect(
    commitAgentGroup(actor, "R003", data.run.briefVersion!),
  ).rejects.toThrow("changed");
  expect((await snapshot(actor)).groups).toHaveLength(0);
});
it("does not reveal another shopper's identity or groups from other workspaces", async () => {
  const actor = await buyer();
  const other = await buyer();
  await runAgent(actor, input);
  await runAgent(other, input);
  await commitAgentGroup(other, "R003", 1);
  const local = await discoverAgentGroups(actor);
  expect(local.every((offer) => offer.memberCount === 0)).toBe(true);
  const localGroup = await commitAgentGroup(actor, "R003", 1);
  await joinGroup(
    { ...actor, userId: "private-second-buyer" },
    "R003",
    "MacBook Air (13-inch, M2, 2022)",
  );
  const report = await discoverAgentGroups(actor);
  expect(
    report.find((offer) => offer.groupId === localGroup)?.memberCount,
  ).toBe(2);
  expect(JSON.stringify(report)).not.toContain("private-second-buyer");
});
it("omits expired groups and cannot commit from an archived or reviewer session", async () => {
  const actor = await buyer();
  await runAgent(actor, input);
  await commitAgentGroup(actor, "R003", 1);
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.groups[0].expiresAt = new Date(0).toISOString();
  });
  expect((await discoverAgentGroups(actor))[0].groupId).toBeUndefined();
  await expect(
    commitAgentGroup({ ...actor, role: "reviewer" }, "R003", 1),
  ).rejects.toThrow("shopper");
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.archivedAt = new Date().toISOString();
  });
  await expect(commitAgentGroup(actor, "R003", 1)).rejects.toThrow(
    "eligibility",
  );
});
it("accepts native planning and discovers conditional groups without a redundant no-match comparison", async () => {
  const mock = native({
    steps: [fallbackPlan(input), { tool: "discover_groups" }],
  });
  const actor = await buyer(false);
  const data = await runAgent(actor, input);
  expect(data.run.mode).toBe("model");
  expect(mock).toHaveBeenCalledTimes(1);
  expect(data.run.toolCalls?.map((call) => call.tool)).toEqual([
    "research_products",
    "discover_groups",
  ]);
  expect((await getWorkspace(actor.workspaceId)).groups).toHaveLength(0);
});
it.each([
  { steps: [{ tool: "transfer", amount: 1 }] },
  { steps: [fallbackPlan(input), { tool: "discover_groups", discount: 99 }] },
  {
    steps: [
      fallbackPlan(input),
      { tool: "discover_groups" },
      { tool: "discover_groups" },
    ],
  },
  {
    steps: [
      fallbackPlan(input),
      { tool: "prepare_support", request: "refund" },
    ],
  },
])(
  "rejects malicious, duplicate or unsupported dependent tools",
  async (response) => {
    native(response);
    const data = await planAgent(input, undefined, []);
    expect(data.mode).toBe("unavailable");
    expect(data.steps).toEqual([
      fallbackPlan(input),
      { tool: "discover_groups" },
    ]);
  },
);
it("does not add a financial tool and cannot bypass unknown-device clarification through group-only discovery", () => {
  expect(() =>
    validateWorkflow(
      workflowResponseSchema.parse({ steps: [{ tool: "discover_groups" }] }),
      { ...input, task: "Find a charger for my MacBook M1 with grouping" },
    ),
  ).toThrow("savings request");
});
