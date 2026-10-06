import { beforeAll, describe, expect, it } from "vitest";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import {
  addDispatchEvidence,
  addEvidence,
  analyzeCase,
  appealCase,
  capture,
  checkout,
  joinGroup,
  leaveGroup,
  makeQuote,
  openReturn,
  resolveCase,
  shippingEvent,
  snapshot,
  evidenceBytes,
  updateBrief,
} from "../src/server/service";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { actorFromToken, createSession } from "../src/server/auth";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET =
    "test-session-secret-at-least-thirty-two-characters";
  process.env.OPERATOR_ACCESS_CODE = "test-operator";
});
async function actors() {
  const state = await createWorkspace();
  const buyer: Actor = {
    workspaceId: state.id,
    userId: "buyer-1",
    role: "buyer",
  };
  return {
    buyer,
    second: { ...buyer, userId: "buyer-2" },
    seller: { ...buyer, userId: "seller", role: "seller" as const },
    reviewer: { ...buyer, userId: "reviewer", role: "reviewer" as const },
  };
}
async function paid(actor: Actor) {
  const quote = await makeQuote(actor, "P001", "Atlas 14");
  const order = await checkout(actor, quote.id, quote.fingerprint);
  return capture(actor, order.id);
}
describe("persistent shopper workflows", () => {
  it("replaces unpaid approvals when a brief changes, preserving other buyers and paid orders", async () => {
    const { buyer, second } = await actors();
    const paidOrder = await paid(buyer);
    const otherQuote = await makeQuote(second, "P001", "Atlas 14");
    const oldQuote = await makeQuote(buyer, "P001", "Atlas 14");
    const pending = await checkout(buyer, oldQuote.id, oldQuote.fingerprint);
    const input = {
      message: "",
      model: "Slate 11",
      category: "chargers" as const,
      budget: 3000,
      preference: "",
      priority: "price" as const,
    };
    await updateBrief(buyer, input);
    await expect(
      checkout(buyer, oldQuote.id, oldQuote.fingerprint),
    ).rejects.toThrow("brief changed");
    await expect(capture(buyer, pending.id)).rejects.toThrow("not ready");
    await expect(makeQuote(buyer, "P001", "Atlas 14")).rejects.toThrow("brief");
    await expect(makeQuote(buyer, "P018", "Slate 11")).rejects.toThrow(
      "budget",
    );
    const fresh = await makeQuote(buyer, "P002", "Slate 11");
    const freshOrder = await checkout(buyer, fresh.id, fresh.fingerprint);
    expect((await capture(buyer, freshOrder.id)).status).toBe("paid");
    expect(
      (await checkout(second, otherQuote.id, otherQuote.fingerprint)).status,
    ).toBe("checkout_pending");
    expect(
      (await getWorkspace(buyer.workspaceId)).orders.find(
        (o) => o.id === paidOrder.id,
      )?.status,
    ).toBe("paid");
    expect((await updateBrief(buyer, input)).version).toBe(1);
  });
  it("keeps the original approval for an in-flight capture during a brief change", async () => {
    const { buyer } = await actors();
    const quote = await makeQuote(buyer, "P001", "Atlas 14");
    const order = await checkout(buyer, quote.id, quote.fingerprint);
    await mutateWorkspace(buyer.workspaceId, (state) => {
      state.operations.push({
        id: "in-flight",
        orderId: order.id,
        kind: "capture",
        state: "unknown",
        amount: 2900,
      });
    });
    await updateBrief(buyer, {
      message: "",
      model: "Slate 11",
      category: "chargers",
      budget: 3000,
      preference: "",
      priority: "price",
    });
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.orders[0].status).toBe("checkout_pending");
    expect(state.orders[0].quote.invalidatedAt).toBeUndefined();
    expect((await capture(buyer, order.id)).status).toBe("paid");
  });
  it("stores original photo bytes, isolates access, and detects stored-file tampering", async () => {
    const { buyer, second } = await actors();
    const order = await paid(buyer);
    const item = await openReturn(buyer, order.id, "damaged", "refund");
    const previous = process.env.LOCAL_DATA_DIR;
    process.env.LOCAL_DATA_DIR = `.data/evidence-tests-${randomUUID()}`;
    try {
      const bytes = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      );
      const entry = await addEvidence(
        buyer,
        item.id,
        {
          checkpoint: "buyer_receipt",
          serial: "",
          note: "Synthetic photo fixture",
        },
        { bytes, mime: "image/png" },
      );
      expect((await evidenceBytes(buyer, entry.id)).bytes).toEqual(bytes);
      await expect(evidenceBytes(second, entry.id)).rejects.toThrow(
        "not found",
      );
      await writeFile(
        `${process.env.LOCAL_DATA_DIR}/assets/${entry.assetKey}`,
        Buffer.from("changed"),
      );
      await expect(evidenceBytes(buyer, entry.id)).rejects.toThrow("integrity");
    } finally {
      process.env.LOCAL_DATA_DIR = previous;
    }
  });
  it("reserves finalized group stock and converts each commitment into one checkout", async () => {
    const { buyer, second } = await actors();
    const id = await joinGroup(buyer, "P001", "Atlas 14");
    await joinGroup(second, "P001", "Atlas 14");
    const other = { ...buyer, userId: "other" };
    const quotes = await Promise.all(
      Array.from({ length: 11 }, () => makeQuote(other, "P001", "Atlas 14")),
    );
    const results = await Promise.allSettled(
      quotes.map((q) => checkout(other, q.id, q.fingerprint)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    const first = await makeQuote(buyer, "P001", "Atlas 14", id);
    const duplicate = await makeQuote(buyer, "P001", "Atlas 14", id);
    await checkout(buyer, first.id, first.fingerprint);
    await expect(
      checkout(buyer, duplicate.id, duplicate.fingerprint),
    ).rejects.toThrow("already exists");
    const final = await makeQuote(second, "P001", "Atlas 14", id);
    await checkout(second, final.id, final.fingerprint);
    expect((await getWorkspace(buyer.workspaceId)).orders).toHaveLength(12);
  });
  it("authenticates opaque sessions and rejects an invented token", async () => {
    const session = await createSession({ role: "buyer" });
    expect(await actorFromToken(session.token)).toEqual(session.actor);
    await expect(actorFromToken("fabricated")).rejects.toThrow("expired");
  });
  it("rejects unauthorized operator sessions", async () => {
    await expect(
      createSession({ role: "reviewer", accessCode: "bad" }),
    ).rejects.toThrow("access code");
  });
  it("joins a workspace only through its invitation", async () => {
    const first = await createSession({ role: "buyer" });
    const state = await getWorkspace(first.actor.workspaceId);
    const second = await createSession({ role: "buyer", invite: state.invite });
    expect(second.actor.workspaceId).toBe(first.actor.workspaceId);
  });
  it("creates and captures one payment across repeated approval requests", async () => {
    const { buyer } = await actors();
    const quote = await makeQuote(buyer, "P001", "Atlas 14");
    const orders = await Promise.all([
      checkout(buyer, quote.id, quote.fingerprint),
      checkout(buyer, quote.id, quote.fingerprint),
    ]);
    expect(orders[0].id).toBe(orders[1].id);
    await Promise.all(orders.map((o) => capture(buyer, o.id)));
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.orders).toHaveLength(1);
    expect(state.operations.filter((o) => o.kind === "capture")).toHaveLength(
      1,
    );
    expect(state.orders[0].status).toBe("paid");
  });
  it("rejects cross-customer order and quote access", async () => {
    const { buyer, second } = await actors();
    const quote = await makeQuote(buyer, "P001", "Atlas 14");
    await expect(checkout(second, quote.id, quote.fingerprint)).rejects.toThrow(
      "not found",
    );
    const order = await paid(buyer);
    await expect(capture(second, order.id)).rejects.toThrow("not found");
    expect((await snapshot(second)).orders).toEqual([]);
  });
  it("rejects a forged approval and incompatible product", async () => {
    const { buyer } = await actors();
    await expect(makeQuote(buyer, "P002", "Atlas 14")).rejects.toThrow(
      "compatible",
    );
    const quote = await makeQuote(buyer, "P001", "Atlas 14");
    await expect(checkout(buyer, quote.id, "0".repeat(64))).rejects.toThrow(
      "approval",
    );
  });
  it("finalizes a group once and preserves the successful buyer's price", async () => {
    const { buyer, second } = await actors();
    const id = await joinGroup(buyer, "P001", "Atlas 14");
    expect(await joinGroup(buyer, "P001", "Atlas 14")).toBe(id);
    await expect(makeQuote(buyer, "P001", "Atlas 14", id)).rejects.toThrow(
      "not available",
    );
    expect(await joinGroup(second, "P001", "Atlas 14")).toBe(id);
    const quote = await makeQuote(buyer, "P001", "Atlas 14", id);
    expect(quote.amount).toBe(2610);
    const order = await checkout(buyer, quote.id, quote.fingerprint);
    await capture(buyer, order.id);
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.orders[0].quote.amount).toBe(2610);
    expect(state.groups[0].members).toHaveLength(2);
  });
  it("allows leaving before the group finalizes without a payment", async () => {
    const { buyer } = await actors();
    const id = await joinGroup(buyer, "P001", "Atlas 14");
    await leaveGroup(buyer, id);
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.groups[0].members).toEqual([]);
    expect(state.operations).toEqual([]);
  });
  it("resolves a damaged-item claim with dispatch records and one refund", async () => {
    const { buyer, seller, reviewer } = await actors();
    const order = await paid(buyer);
    await addDispatchEvidence(seller, order.id, {
      serial: "SER-1",
      note: "Item condition recorded before shipping",
    });
    await shippingEvent(seller, order.id, "shipped");
    await shippingEvent(seller, order.id, "delivered");
    const item = await openReturn(buyer, order.id, "damaged", "refund");
    expect(item.evidence).toHaveLength(1);
    await addEvidence(buyer, item.id, {
      checkpoint: "buyer_receipt",
      serial: "SER-1",
      note: "Case is cracked on receipt",
    });
    const analysis = await analyzeCase(buyer, item.id);
    expect(analysis.outcome).toBe("insufficient");
    await expect(
      resolveCase(buyer, item.id, "refund", "Approve"),
    ).rejects.toThrow("authorization");
    await Promise.all([
      resolveCase(
        reviewer,
        item.id,
        "refund",
        "Customer policy: refund approved",
      ),
      resolveCase(
        reviewer,
        item.id,
        "refund",
        "Customer policy: refund approved",
      ),
    ]);
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.orders[0].refundedAmount).toBe(2900);
    expect(state.operations.filter((o) => o.kind === "refund")).toHaveLength(1);
    expect(state.cases[0].status).toBe("resolved");
  });
  it("keeps identifier conflicts open and prevents submitting the other side's evidence", async () => {
    const { buyer, seller } = await actors();
    const order = await paid(buyer);
    const item = await openReturn(buyer, order.id, "wrong_item", "refund");
    await addEvidence(buyer, item.id, {
      checkpoint: "buyer_return",
      serial: "A",
      note: "Returned product",
    });
    await addEvidence(seller, item.id, {
      checkpoint: "seller_return",
      serial: "B",
      note: "Received product",
    });
    await expect(
      addEvidence(buyer, item.id, {
        checkpoint: "seller_return",
        serial: "A",
        note: "Fake seller record",
      }),
    ).rejects.toThrow("your side");
    expect((await analyzeCase(buyer, item.id)).outcome).toBe("contradicted");
    expect((await getWorkspace(buyer.workspaceId)).cases[0].status).toBe(
      "review",
    );
  });
  it("honors replacement choice without another payment and prevents duplicate fulfillment", async () => {
    const { buyer, reviewer } = await actors();
    const order = await paid(buyer);
    const item = await openReturn(buyer, order.id, "damaged", "replacement");
    await expect(
      resolveCase(reviewer, item.id, "refund", "Refund instead"),
    ).rejects.toThrow("customer's choice");
    await resolveCase(
      reviewer,
      item.id,
      "replacement",
      "Replacement under customer policy",
    );
    await resolveCase(reviewer, item.id, "replacement", "Retry");
    const state = await getWorkspace(buyer.workspaceId);
    expect(
      state.orders.filter((o) => o.replacementOf === order.id),
    ).toHaveLength(1);
    expect(state.operations.filter((o) => o.kind === "capture")).toHaveLength(
      1,
    );
  });
  it("allows an appeal without refunding again", async () => {
    const { buyer, reviewer } = await actors();
    const order = await paid(buyer);
    const item = await openReturn(buyer, order.id, "canceled", "refund");
    await resolveCase(reviewer, item.id, "refund", "Cancellation refund");
    await appealCase(buyer, item.id, "Please check my delivery experience");
    await resolveCase(
      reviewer,
      item.id,
      "refund",
      "Financial remedy already complete",
    );
    const state = await getWorkspace(buyer.workspaceId);
    expect(state.orders[0].refundedAmount).toBe(2900);
  });
  it("cannot overreserve stock under concurrent checkout", async () => {
    const { buyer } = await actors();
    const quotes = await Promise.all(
      Array.from({ length: 14 }, () => makeQuote(buyer, "P001", "Atlas 14")),
    );
    const results = await Promise.allSettled(
      quotes.map((q) => checkout(buyer, q.id, q.fingerprint)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(12);
  });
  it("rejects non-monotonic shipping state", async () => {
    const { buyer, seller } = await actors();
    const order = await paid(buyer);
    await expect(shippingEvent(seller, order.id, "delivered")).rejects.toThrow(
      "not valid",
    );
  });
  it("rolls back rejected mutations", async () => {
    const { buyer } = await actors();
    await expect(
      mutateWorkspace(buyer.workspaceId, (s) => {
        s.invite = "changed";
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    expect((await getWorkspace(buyer.workspaceId)).invite).not.toBe("changed");
  });
});
