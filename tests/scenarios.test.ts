import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createScenario } from "../src/server/scenarios";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import { snapshot, checkout, makeQuote } from "../src/server/service";
import { recoverWorkspace } from "../src/server/recovery";

beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "sandbox";
  process.env.AI_MODE = "live";
  process.env.SESSION_SECRET = "scenario-test-private-session-key-long-enough";
  delete process.env.DEMO_ACCESS_CODE;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Fixture must not contact a provider.");
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
async function operator() {
  const workspace = await createWorkspace();
  return {
    workspaceId: workspace.id,
    userId: "engineer",
    role: "reviewer",
  } satisfies Actor;
}

it.each([
  "fresh",
  "delivered",
  "identifier_conflict",
  "seller_silence",
  "refund_failure",
  "refund_timeout",
  "group_partial",
  "canceled_order",
  "late_order",
] as const)(
  "creates the %s scenario with isolated fixture adapters on a sandbox/live host",
  async (kind) => {
    const source = await operator();
    const created = await createScenario(source, kind);
    const data = await snapshot(created.actor);
    expect(data.modes.payments).toBe("fixture");
    expect(data.modes.ai).toBe("fixture");
    expect(data.fixtureWorkspace).toBe(true);
    expect(data.paypalClientId).toBeUndefined();
    expect(
      data.orders.every((order) => order.quote.provider === "fixture"),
    ).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expect((await getWorkspace(source.workspaceId)).orders).toHaveLength(0);
    if (kind === "identifier_conflict") {
      expect(data.cases[0].analysis?.outcome).toBe("contradicted");
      expect(data.cases[0].status).toBe("review");
      expect(data.cases[0].analysis?.nextStep).toContain("remains open");
    }
    if (kind === "refund_failure") {
      expect(data.orders[0].status).toBe("refund_failed");
      expect(data.orders[0].refundedAmount).toBe(0);
      expect(data.cases[0].status).toBe("refund_failed");
    }
    if (kind === "seller_silence") expect(data.cases[0].status).toBe("review");
    if (kind === "canceled_order" || kind === "late_order") {
      expect(data.orders[0].fulfillmentIssue?.kind).toBe(
        kind === "canceled_order" ? "canceled" : "late",
      );
      expect(data.orders[0].refundedAmount).toBe(0);
      expect(data.orders[0].status).toBe("paid");
    }
    if (kind === "refund_timeout") {
      await recoverWorkspace(created.actor.workspaceId);
      await recoverWorkspace(created.actor.workspaceId);
      const state = await getWorkspace(created.actor.workspaceId);
      expect(state.orders[0].refundedAmount).toBe(2900);
      expect(
        state.operations.filter((op) => op.kind === "refund"),
      ).toHaveLength(1);
    }
    if (kind === "group_partial") {
      const quote = await makeQuote(
        created.actor,
        "P001",
        "Atlas 14",
        data.groups[0].id,
      );
      expect(quote.amount).toBe(2610);
      expect(
        (await checkout(created.actor, quote.id, quote.fingerprint)).quote
          .amount,
      ).toBe(2610);
    }
  },
);

it("denies buyer/seller scenario setup and reset of a normal payment workspace", async () => {
  const reviewer = await operator();
  await expect(
    createScenario({ ...reviewer, role: "buyer" }, "fresh"),
  ).rejects.toThrow("authorization");
  await expect(
    createScenario({ ...reviewer, role: "seller" }, "fresh"),
  ).rejects.toThrow("authorization");
  await expect(createScenario(reviewer, "fresh", true)).rejects.toThrow(
    "isolated fixture",
  );
});

it("archives only the reviewer's fixture workspace while preserving its financial history", async () => {
  const reviewer = await operator();
  const created = await createScenario(reviewer, "delivered");
  const before = await getWorkspace(created.actor.workspaceId);
  const next = await createScenario(
    { ...created.actor, role: "reviewer" },
    "fresh",
    true,
  );
  const archived = await getWorkspace(created.actor.workspaceId);
  expect(archived.archivedAt).toBeTruthy();
  expect(archived.operations).toEqual(before.operations);
  expect(archived.orders).toEqual(before.orders);
  expect(next.actor.workspaceId).not.toBe(created.actor.workspaceId);
  await expect(mutateWorkspace(archived.id, () => {})).rejects.toThrow(
    "archived",
  );
  expect((await getWorkspace(reviewer.workspaceId)).archivedAt).toBeUndefined();
});
