import { beforeEach, afterEach, expect, it, vi } from "vitest";
import {
  launchDemo,
  assertDemoOwner,
  switchDemoPersona,
  takeDemoBudget,
} from "../src/server/demo";
import { actorFromToken, createSession } from "../src/server/auth";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
} from "../src/server/state";
import { snapshot } from "../src/server/service";
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "sandbox";
  process.env.AI_MODE = "live";
  process.env.DEMO_ACCESS_CODE = "private-normal-shopper-code";
  process.env.SESSION_SECRET =
    "demo-test-private-session-key-at-least-32-characters";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Demo must not call a provider");
    }),
  );
});
it("bounds demo activity across personas while leaving ordinary workspaces independent", async () => {
  const first = await launchDemo("fresh");
  const seller = await switchDemoPersona(
    first.actor,
    first.ownerToken,
    "seller",
  );
  await takeDemoBudget(first.actor, "test-activity", 2);
  await takeDemoBudget(seller.actor, "test-activity", 2);
  await expect(takeDemoBudget(first.actor, "test-activity", 2)).rejects.toThrow(
    "activity limit",
  );
  const ordinary = await createWorkspace({ fixture: true });
  await takeDemoBudget(
    { ...first.actor, workspaceId: ordinary.id },
    "test-activity",
    0,
  );
  const another = await launchDemo("fresh");
  await takeDemoBudget(another.actor, "test-activity", 2);
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DEMO_ACCESS_CODE;
});
it("starts an owned fixture without knowing a shopper/operator code and keeps stable personas", async () => {
  const created = await launchDemo("delivered");
  const data = await snapshot(created.actor);
  const workspace = await getWorkspace(created.actor.workspaceId);
  await expect(
    createSession({
      role: "buyer",
      invite: workspace.invite,
      accessCode: process.env.DEMO_ACCESS_CODE,
    }),
  ).rejects.toThrow("owner authorization");
  expect(data.modes.payments).toBe("fixture");
  expect(data.modes.ai).toBe("fixture");
  expect(data.orders).toHaveLength(1);
  expect(data.demo?.kind).toBe("delivered");
  expect(JSON.stringify(data)).not.toContain(created.ownerToken);
  expect(JSON.stringify(data)).not.toContain("ownerHash");
  for (const role of ["seller", "reviewer", "second_buyer", "buyer"] as const) {
    const next = await switchDemoPersona(
      created.actor,
      created.ownerToken,
      role,
    );
    expect(await actorFromToken(next.token)).toEqual(next.actor);
    const view = await snapshot(next.actor);
    expect(view.modes.payments).toBe("fixture");
    expect(view.orders.length).toBe(role === "second_buyer" ? 0 : 1);
    if (role === "buyer") expect(next.actor.userId).toBe(created.actor.userId);
  }
  expect(fetch).not.toHaveBeenCalled();
});
it("rejects cross-workspace, ordinary fixture, forged, expired and provider-mode demo claims", async () => {
  const first = await launchDemo("fresh");
  const second = await launchDemo("fresh");
  await expect(assertDemoOwner(second.actor, first.ownerToken)).rejects.toThrow(
    "authorization",
  );
  await expect(
    switchDemoPersona(first.actor, "forged", "reviewer"),
  ).rejects.toThrow("authorization");
  const normal = await createWorkspace({ fixture: true });
  await expect(
    assertDemoOwner(
      { ...first.actor, workspaceId: normal.id },
      first.ownerToken,
    ),
  ).rejects.toThrow("authorization");
  await mutateWorkspace(first.actor.workspaceId, (state) => {
    state.demo!.expiresAt = "2000-01-01";
  });
  await expect(assertDemoOwner(first.actor, first.ownerToken)).rejects.toThrow(
    "authorization",
  );
  await mutateWorkspace(second.actor.workspaceId, (state) => {
    state.adapterModes!.payments = "sandbox";
  });
  await expect(
    assertDemoOwner(second.actor, second.ownerToken),
  ).rejects.toThrow("authorization");
});
it("reset archives prior financial history, invalidates sessions and rotates ownership", async () => {
  const first = await launchDemo("delivered");
  const previous = await getWorkspace(first.actor.workspaceId);
  const next = await launchDemo("fresh", {
    actor: first.actor,
    token: first.ownerToken,
  });
  const archived = await getWorkspace(first.actor.workspaceId);
  expect(archived.archivedAt).toBeTruthy();
  expect(archived.orders).toEqual(previous.orders);
  expect(archived.operations).toEqual(previous.operations);
  await expect(actorFromToken(first.token)).rejects.toThrow("expired");
  await expect(assertDemoOwner(next.actor, first.ownerToken)).rejects.toThrow(
    "authorization",
  );
  expect(next.actor.workspaceId).not.toBe(first.actor.workspaceId);
});
