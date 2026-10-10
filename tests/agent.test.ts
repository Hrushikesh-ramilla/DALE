import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { understandAgent } from "../src/domain/agent";
import { runAgent } from "../src/server/agent";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import { snapshot, makeQuote, checkout } from "../src/server/service";
import { catalog } from "../src/domain/catalog";
const input = {
  model: "Atlas 14",
  budget: 8000,
  task: "Find a 65W charger under $40 for USB-C Laptop (65W)",
};
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Provider calls forbidden");
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
async function buyer(): Promise<Actor> {
  const state = await createWorkspace({ fixture: true });
  return { workspaceId: state.id, userId: "buyer-1", role: "buyer" };
}
it.each([
  "Find a charger for my MacBook under $40",
  "Find a charger under $40",
  "Find a charger for my MacBook using USB-C Laptop (65W) under $40",
])("does not invent real device verification: %s", (task) => {
  const intent = understandAgent({ ...input, task });
  expect(intent.kind).toBe("clarification");
  if (intent.kind === "clarification")
    expect(intent.message).toMatch(/not verified/);
});
it("executes sample filtering, persists private receipts and leaves payment untouched", async () => {
  const actor = await buyer();
  const data = await runAgent(actor, input);
  expect(data.run.status).toBe("ready_for_review");
  expect(data.run.productIds.length).toBeGreaterThan(0);
  for (const id of data.run.productIds) {
    const product = catalog.find((item) => item.id === id)!;
    expect(product.price).toBeLessThanOrEqual(4000);
    expect(product.compatibleModels).toContain("Atlas 14");
  }
  expect(data.snapshot.orders).toHaveLength(0);
  expect(data.run.briefVersion).toBe(data.snapshot.brief?.version);
  expect(data.snapshot.agentRuns).toEqual([data.run]);
  expect(data.snapshot.conversation).toHaveLength(2);
  expect((await getWorkspace(actor.workspaceId)).audit.at(-1)?.action).toBe(
    "agent.task",
  );
  expect(fetch).not.toHaveBeenCalled();
});
it("rejects financial authority and real lookup without altering the saved brief", async () => {
  const actor = await buyer();
  const initial = await runAgent(actor, input);
  for (const task of [
    "Approve payment now",
    "Find a charger for MacBook under $40",
  ]) {
    const data = await runAgent(actor, { ...input, task });
    expect(data.run.status).toBe("needs_input");
    expect(data.run.productIds).toHaveLength(0);
    expect(data.snapshot.brief).toEqual(initial.snapshot.brief);
    expect(data.snapshot.orders).toHaveLength(0);
  }
});
it("prepares navigation and return drafts without submitting a case or financial remedy", async () => {
  const actor = await buyer();
  const navigation = await runAgent(actor, {
    ...input,
    task: "Show my orders",
  });
  expect(navigation.run.status).toBe("opened_workspace");
  const draft = await runAgent(actor, {
    ...input,
    task: "My item is damaged and I want a replacement",
  });
  expect(draft.intent).toMatchObject({
    kind: "support_draft",
    reason: "damaged",
    request: "replacement",
  });
  expect(draft.snapshot.cases).toHaveLength(0);
  expect(draft.snapshot.orders).toHaveLength(0);
});
it("bounds history and keeps each shopper's tasks private from other parties", async () => {
  const actor = await buyer();
  const second = { ...actor, userId: "buyer-2" };
  await runAgent(second, { ...input, task: "Show my orders" });
  for (let i = 0; i < 14; i++)
    await runAgent(actor, { ...input, task: `Show my orders ${i}` });
  const own = await snapshot(actor);
  expect(own.agentRuns).toHaveLength(12);
  expect(own.agentRuns[0].task).toBe("Show my orders 2");
  expect((await snapshot(second)).agentRuns).toHaveLength(1);
  expect((await snapshot({ ...actor, role: "seller" })).agentRuns).toHaveLength(
    0,
  );
  expect(JSON.stringify(own.agentRuns)).not.toContain("buyerId");
});
it("denies operator execution, stale identities and archived workspaces", async () => {
  const actor = await buyer();
  await expect(runAgent({ ...actor, role: "reviewer" }, input)).rejects.toThrow(
    "shopper",
  );
  await expect(
    runAgent(actor, { ...input, expectedBuyerId: "buyer-2" }),
  ).rejects.toThrow("session changed");
  const other = await buyer();
  await expect(
    runAgent(actor, { ...input, expectedWorkspaceId: other.workspaceId }),
  ).rejects.toThrow("session changed");
  expect((await snapshot(actor)).agentRuns).toHaveLength(0);
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.archivedAt = new Date().toISOString();
  });
  await expect(runAgent(actor, input)).rejects.toThrow("archived");
});
it("a new task invalidates an unpaid quote and reports no matches honestly", async () => {
  const actor = await buyer();
  await runAgent(actor, input);
  const quote = await makeQuote(actor, "P001", "Atlas 14");
  const noMatch = await runAgent(actor, {
    ...input,
    task: "Find a charger under $1 for USB-C Laptop (65W)",
  });
  expect(noMatch.run.status).toBe("needs_input");
  expect(noMatch.run.productIds).toHaveLength(0);
  await expect(checkout(actor, quote.id, quote.fingerprint)).rejects.toThrow();
  expect(noMatch.snapshot.orders).toHaveLength(0);
});
