import { afterEach, expect, it, vi } from "vitest";
import { planAgent } from "../src/server/agent-planner";
import { modelMessageSignals } from "../src/server/ai";
import { fallbackPlan } from "../src/domain/agent-plan";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const input = {
  task: "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping and show my orders.",
  model: "Atlas 14",
  budget: 8000,
};
it("preserves an explicitly owned cable rating despite different sentence order", () => {
  for (const [description, cable] of [
    ["My existing USB-C cable is 100W", "usb100"],
    ["My 60W USB-C cable is sufficient", "usb60"],
    ["My USB-C cable is 240W", "usb100"],
  ]) {
    expect(
      fallbackPlan({
        ...input,
        task: `MacBook Air M1 charger under $70. ${description}. Normal charging.`,
      }),
    ).toMatchObject({ cable });
  }
  expect(
    fallbackPlan({
      ...input,
      task: "MacBook Air M1 charger under $70. The recommended cable is 100W.",
    }),
  ).toMatchObject({ cable: "unknown" });
});
it("uses independent raw warning booleans without inventing a signal for false fields", async () => {
  configure([
    {
      outside_checkout: false,
      credential_request: true,
      pressure: false,
      instruction_override: false,
    },
  ]);
  expect(
    await modelMessageSignals("The seller asks for a private code."),
  ).toEqual({ signals: ["credential_request"] });
});
it("bounds follow-up history and excludes generated reply prose from inference", async () => {
  const fetch = configure([
    { goals: ["research_products", "discover_groups", "inspect_orders"] },
  ]);
  const result = await planAgent(input, undefined, [
    {
      task: "Old task".repeat(1000),
      reply: "GENERATED_REPLY_MUST_NOT_BE_SENT".repeat(1000),
    },
  ]);
  expect(result.mode).toBe("model");
  const payload = JSON.parse(fetch.mock.calls[0][1]?.body as string);
  const context = JSON.parse(payload.messages[1].content[0].text);
  expect(context.previousTasks[0]).toHaveLength(600);
  expect(JSON.stringify(payload)).not.toContain(
    "GENERATED_REPLY_MUST_NOT_BE_SENT",
  );
});
it("keeps an all-false advisory result empty and rejects malformed private classifier output", async () => {
  configure([
    {
      outside_checkout: false,
      credential_request: false,
      pressure: false,
      instruction_override: false,
    },
    { signals: ["pressure"] },
  ]);
  expect(await modelMessageSignals("A delivery reminder.")).toEqual({
    signals: [],
  });
  await expect(modelMessageSignals("A delivery reminder.")).rejects.toThrow();
});
function configure(outputs: unknown[]) {
  for (const [name, value] of Object.entries({
    AI_PROVIDER: "self_hosted",
    AI_MODEL: "private-tested",
    AI_SELF_HOSTED_PROFILE: "lfm25vl3-goals",
    AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:8081/v1",
    AI_MODE: "live",
    AGENT_MODEL_ENABLED: "true",
    AI_SELF_HOSTED_API_KEY: "local-test-key",
    AI_API_KEY: "unused-cloud-key",
  }))
    vi.stubEnv(name, value);
  const fetch = vi.fn<typeof global.fetch>(async () =>
    Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(outputs.shift()) },
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
it("lets the model select goals while keeping exact facts and scopes entirely server owned", async () => {
  const fetch = configure([
    { goals: ["research_products", "discover_groups", "inspect_orders"] },
  ]);
  const result = await planAgent(input, undefined, []);
  expect(result.mode).toBe("model");
  expect(result.steps.map((step) => step.tool)).toEqual([
    "research_products",
    "discover_groups",
    "inspect_orders",
  ]);
  expect(result.plan).toMatchObject({
    model: "MacBook Air (M1, 2020)",
    budget: 6000,
    cable: "none",
    fastCharging: false,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(fetch.mock.calls)).not.toContain("unused-cloud-key");
});
it("defers an unreviewed requested device without letting a goal substitute a model", async () => {
  const fetch = configure([{ goals: ["research_products"] }]);
  const result = await planAgent(
    {
      ...input,
      task: "Find a charger for Dell XPS 13 under $67, include a cable.",
    },
    undefined,
    [],
  );
  expect(result.mode).toBe("model");
  expect(result.plan.tool).toBe("clarify");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("requires confirmation before using a model proposal for an unparsed budget", async () => {
  configure([{ goals: ["research_products"] }, { budgetUsd: 63 }]);
  const result = await planAgent(
    {
      ...input,
      task: "MacBook Air M1 needs a charger. My ceiling is sixty-three dollars. Include a cable, normal charging.",
    },
    undefined,
    [],
  );
  expect(result.mode).toBe("model");
  expect(result.plan).toMatchObject({
    tool: "confirm_interpretation",
    budget: 6300,
    cable: "none",
  });
  expect(result.steps).toHaveLength(1);
});
it("preserves the customer's explicit remedy even when the model only selects support", async () => {
  const fetch = configure([{ goals: ["prepare_support"] }]);
  const result = await planAgent(
    { ...input, task: "The wrong item arrived. I want a replacement." },
    undefined,
    [],
  );
  expect(result.mode).toBe("model");
  expect(result.plan).toMatchObject({
    tool: "prepare_support",
    reason: "wrong_item",
    request: "replacement",
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it.each([
  { goals: ["research_products"], budgetUsd: 99 },
  { goals: ["refund_everyone"] },
  { goals: ["inspect_orders", "inspect_orders"] },
])(
  "rejects forged facts, unauthorized goals and duplicates",
  async (output) => {
    configure([output]);
    expect((await planAgent(input, undefined, [])).mode).toBe("unavailable");
  },
);
it("cannot turn a protected payment request into research", async () => {
  configure([
    { goals: ["research_products"] },
    {
      model: "MacBook Air (M1, 2020)",
      budgetUsd: 60,
      cable: "none",
      fastCharging: false,
    },
  ]);
  const result = await planAgent(
    {
      ...input,
      task: "Pay for a MacBook Air M1 charger now without my approval.",
    },
    undefined,
    [],
  );
  expect(result.mode).toBe("unavailable");
  expect(result.plan.tool).toBe("legacy_task");
});
