import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { customerSession } from "../src/server/customers";
import { actorFromToken } from "../src/server/auth";
import { closeDatabase, getDatabase } from "../src/server/database";
import { basket, manageBasket } from "../src/server/concierge/shopping";
import { changeConcierge, readConcierge, conversationMessages } from "../src/server/concierge/store";
import { makeQuote, checkout, capture, openReturn, addEvidence, snapshot } from "../src/server/service";
import { caseReport } from "../src/server/case-report";
import { randomUUID } from "node:crypto";
import type { Actor } from "../src/server/state";
let buyer: Actor;
vi.mock("../src/server/auth", async (original) => ({
  ...await original<typeof import("../src/server/auth")>(),
  actorFromRequest: async () => buyer,
}));
import { POST as collectionPost } from "../src/app/api/copilot/state/route";
import { POST as actionPost } from "../src/app/api/actions/route";
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.APP_URL = "http://localhost:3110";
  process.env.SESSION_SECRET = "m1-customer-contract-secret-at-least-32-chars";
  await getDatabase();
}, 60000);
afterAll(() => closeDatabase());
it("recovers a guest cart and wishlist after conversion and login, while an expired token loses access", async () => {
  const guest = await customerSession({ action: "guest" });
  buyer = guest.actor;
  for (const collection of ["cart", "wishlist"])
    await manageBasket(buyer, { collection, action: "add", items: [{ productId: "B010", quantity: 2 }] });
  const registered = await customerSession({ action: "register", name: "M1 shopper", email: "m1@example.test", password: "m1-private-passphrase-42" }, buyer);
  expect(registered.actor).toEqual(buyer);
  const login = await customerSession({ action: "login", email: "m1@example.test", password: "m1-private-passphrase-42" });
  expect((await basket(login.actor)).cart[0]).toMatchObject({ productId: "B010", quantity: 2 });
  expect((await basket(login.actor)).wishlist).toHaveLength(1);
  const other = await customerSession({ action: "guest" });
  expect(other.actor.userId).not.toBe(buyer.userId);
  expect(other.actor.workspaceId).toBe(buyer.workspaceId);
  expect((await basket(other.actor)).cart).toEqual([]);
  expect((await basket(other.actor)).wishlist).toEqual([]);
  await (await getDatabase()).query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1", [buyer.userId]);
  await expect(actorFromToken(login.token)).rejects.toThrow(/expired/);
  const recovery = await customerSession({ action: "login", email: "m1@example.test", password: "m1-private-passphrase-42" });
  expect(await actorFromToken(recovery.token)).toEqual(buyer);
  expect((await basket(recovery.actor)).cart).toHaveLength(1);
});
it("rejects comparison-only, zero-stock and withdrawn products at both cart and direct quote HTTP handlers", async () => {
  buyer = (await customerSession({ action: "guest" })).actor;
  const db = await getDatabase();
  const original = (await db.query<{record: Record<string, unknown>}>("SELECT record FROM catalog_products WHERE id='B010'")).rows[0].record;
  for (const change of [{ comparisonOnly: true }, { stock: 0 }, { retired: true }]) {
    try {
      await db.query("UPDATE catalog_products SET record=$1,publication=$2 WHERE id='B010'", [JSON.stringify({ ...original, ...change }), 'retired' in change ? "retired" : "published"]);
      for (const [handler, body] of [
        [collectionPost, { collection: "cart", action: "add", items: [{ productId: "B010" }] }],
        [actionPost, { action: "quote", productId: "B010", model: "not-required" }],
      ] as const) {
        const response = await handler(new Request("http://localhost:3110/api/test", { method: "POST", headers: { Origin: "http://localhost:3110", "Content-Type": "application/json" }, body: JSON.stringify(body) }));
        expect(response.ok).toBe(false);
        expect((await response.json()).error).toBeTruthy();
      }
      expect((await basket(buyer)).cart).toEqual([]);
    } finally {
      await db.query("UPDATE catalog_products SET record=$1,publication='published' WHERE id='B010'", [JSON.stringify(original)]);
    }
  }
});
it("keeps chat, orders, cases and submitted evidence private between real customers in the same store", async () => {
  const first = (await customerSession({ action: "guest" })).actor;
  const second = (await customerSession({ action: "guest" })).actor;
  await changeConcierge(first, state => {
    state.transcript.push({ id: randomUUID(), sender: "user", text: "Private M1 shopping request", timestamp: Date.now() });
  });
  const own = await readConcierge(first);
  expect(await conversationMessages(first, own.conversationId)).toHaveLength(1);
  expect(await conversationMessages(second, own.conversationId)).toEqual([]);
  expect((await readConcierge(second)).transcript).toEqual([]);
  const quote = await makeQuote(first, "B010", "not-required");
  const order = await checkout(first, quote.id, quote.fingerprint);
  await capture(first, order.id);
  const support = await openReturn(first, order.id, "damaged", "refund");
  await addEvidence(first, support.id, { checkpoint: "buyer_receipt", serial: "M1-private", note: "Private customer condition record" });
  expect((await snapshot(first)).cases).toHaveLength(1);
  const other = await snapshot(second);
  expect(other.orders).toEqual([]);
  expect(other.cases).toEqual([]);
  await expect(caseReport(second, support.id)).rejects.toThrow(/not found/);
});

