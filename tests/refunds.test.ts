import { beforeEach, expect, it, vi } from "vitest";
import { createWorkspace, getWorkspace, type Actor } from "../src/server/state";
import {
  makeQuote,
  checkout,
  capture,
  openReturn,
  resolveCase,
  appealCase,
} from "../src/server/service";
import { refundPayment } from "../src/server/payments";
vi.mock("../src/server/payments", async (original) => ({
  ...(await original<typeof import("../src/server/payments")>()),
  refundPayment: vi.fn(),
}));
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  vi.mocked(refundPayment).mockReset();
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
