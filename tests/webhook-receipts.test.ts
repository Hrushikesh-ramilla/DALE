import { beforeEach, expect, it, vi } from "vitest";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import { checkout, makeQuote, snapshot } from "../src/server/service";
import { acceptWebhook } from "../src/server/recovery";
import { verifyWebhook } from "../src/server/payments";
vi.mock("../src/server/payments", async (original) => ({
  ...(await original<typeof import("../src/server/payments")>()),
  verifyWebhook: vi.fn(),
}));
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  vi.mocked(verifyWebhook).mockResolvedValue(false);
});
it("records only signed own-order receipts without accepting webhook money claims", async () => {
  const actor: Actor = {
    workspaceId: (await createWorkspace()).id,
    userId: "shopper",
    role: "buyer",
  };
  const quote = await makeQuote(actor, "P001", "Atlas 14");
  const order = await checkout(actor, quote.id, quote.fingerprint);
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.orders[0].quote.provider = "sandbox";
    state.orders[0].providerOrderId = "SANDBOX-ORDER-1";
  });
  process.env.PAYMENT_MODE = "sandbox";
  const event = {
    id: "SIGNED-CAPTURE-RECEIPT",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURE-1",
      amount: { value: "9999.00", currency_code: "USD" },
      supplementary_data: { related_ids: { order_id: "SANDBOX-ORDER-1" } },
    },
  };
  await expect(acceptWebhook(new Headers(), event)).rejects.toThrow(
    "signature",
  );
  expect((await snapshot(actor)).signedWebhookReceipts).toEqual([]);
  vi.mocked(verifyWebhook).mockResolvedValue(true);
  await acceptWebhook(new Headers(), event);
  await acceptWebhook(new Headers(), event);
  const state = await getWorkspace(actor.workspaceId);
  expect(state.signedWebhookReceipts).toHaveLength(1);
  expect(state.orders[0].status).toBe("checkout_pending");
  expect(state.orders[0].captureId).toBeUndefined();
  expect((await snapshot(actor)).signedWebhookReceipts[0].orderIds).toEqual([
    order.id,
  ]);
  expect(
    (await snapshot({ ...actor, userId: "another-shopper" }))
      .signedWebhookReceipts,
  ).toEqual([]);
  await acceptWebhook(new Headers(), {
    ...event,
    id: "UNRELATED-RECEIPT",
    resource: { id: "OTHER-CAPTURE" },
  });
  expect((await snapshot(actor)).signedWebhookReceipts).toHaveLength(1);
});
