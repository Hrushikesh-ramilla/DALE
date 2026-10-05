import { beforeEach, expect, it, vi } from "vitest";
import { createWorkspace, getWorkspace, type Actor } from "../src/server/state";
import {
  makeQuote,
  checkout,
  capture,
  openReturn,
  resolveCase,
  appealCase,
  executeRefund,
} from "../src/server/service";
import { refundPayment } from "../src/server/payments";
import { recoverWorkspace } from "../src/server/recovery";
vi.mock("../src/server/payments", async (original) => ({
  ...(await original<typeof import("../src/server/payments")>()),
  refundPayment: vi.fn(),
}));
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  vi.mocked(refundPayment).mockReset();
});
it("reconciles a fixture processing reference without calling the real provider", async () => {
  const workspace = await createWorkspace();
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "customer",
    role: "buyer",
  };
  const reviewer: Actor = { ...buyer, userId: "reviewer", role: "reviewer" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  vi.mocked(refundPayment)
    .mockResolvedValueOnce({ id: "FIXTURE-PENDING", status: "PENDING" })
    .mockResolvedValueOnce({ id: "FIXTURE-PENDING", status: "COMPLETED" });
  const network = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
    throw new Error("Fixture attempted external request");
  });
  try {
    await resolveCase(
      reviewer,
      item.id,
      "refund",
      "Customer remedy under merchant policy",
    );
    await executeRefund(reviewer, order.id);
    expect((await getWorkspace(workspace.id)).orders[0].refundedAmount).toBe(
      2900,
    );
    expect(vi.mocked(refundPayment).mock.calls[0][1]).toBe(
      vi.mocked(refundPayment).mock.calls[1][1],
    );
    expect(network).not.toHaveBeenCalled();
  } finally {
    network.mockRestore();
  }
});
it("recovers one remote refund that succeeded before its response was lost, including an appeal while pending", async () => {
  const workspace = await createWorkspace();
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "customer",
    role: "buyer",
  };
  const reviewer: Actor = { ...buyer, userId: "reviewer", role: "reviewer" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  const remoteLedger = new Map<string, string>();
  let loseResponse = true;
  vi.mocked(refundPayment).mockImplementation(async (_capture, key) => {
    if (!remoteLedger.has(key)) remoteLedger.set(key, `remote-${key}`);
    if (loseResponse) {
      loseResponse = false;
      throw new Error("Response lost after provider success.");
    }
    return { id: remoteLedger.get(key)!, status: "COMPLETED" };
  });
  await expect(
    resolveCase(
      reviewer,
      item.id,
      "refund",
      "Customer policy authorizes this refund.",
    ),
  ).rejects.toThrow("Response lost");
  await appealCase(buyer, item.id, "Please check the interrupted refund.");
  expect((await getWorkspace(workspace.id)).cases[0].status).toBe(
    "refund_pending",
  );
  await recoverWorkspace(workspace.id);
  await recoverWorkspace(workspace.id);
  expect(remoteLedger.size).toBe(1);
  expect(
    new Set(vi.mocked(refundPayment).mock.calls.map((call) => call[1])).size,
  ).toBe(1);
  expect((await getWorkspace(workspace.id)).orders[0].refundedAmount).toBe(
    2900,
  );
  await appealCase(buyer, item.id, "Please recheck the completed remedy.");
  await resolveCase(
    reviewer,
    item.id,
    "refund",
    "Reaffirm the existing completed refund.",
  );
  const state = await getWorkspace(workspace.id);
  expect(state.cases[0].status).toBe("resolved");
  expect(state.operations.filter((op) => op.kind === "refund")).toHaveLength(1);
  expect(remoteLedger.size).toBe(1);
});
it("keeps a failed refund visible and open without issuing another financial operation", async () => {
  const workspace = await createWorkspace();
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "customer",
    role: "buyer",
  };
  const reviewer: Actor = { ...buyer, userId: "reviewer", role: "reviewer" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  vi.mocked(refundPayment).mockResolvedValue({
    id: "failed-provider-reference",
    status: "FAILED",
  });
  await resolveCase(
    reviewer,
    item.id,
    "refund",
    "Customer refund approved under damage policy",
  );
  const state = await getWorkspace(workspace.id);
  expect(state.orders[0].refundedAmount).toBe(0);
  expect(state.orders[0].status).toBe("refund_failed");
  expect(state.orders[0].refund?.reference).toBe("failed-provider-reference");
  expect(state.orders[0].refund?.nextStep).toContain("request remains open");
  expect(state.cases[0].status).toBe("refund_failed");
  await expect(
    resolveCase(reviewer, item.id, "refund", "Repeat approval"),
  ).rejects.toThrow("reconcile");
  await appealCase(buyer, item.id, "Please review this provider failure");
  await expect(
    resolveCase(reviewer, item.id, "refund", "Review the same refund"),
  ).rejects.toThrow("reconcile");
  expect(refundPayment).toHaveBeenCalledTimes(1);
  expect(
    (await getWorkspace(workspace.id)).operations.filter(
      (op) => op.kind === "refund",
    ),
  ).toHaveLength(1);
});
