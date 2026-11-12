import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { customerSession } from "../src/server/customers";
import { getDatabase, closeDatabase } from "../src/server/database";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import { getStoredProduct } from "../src/server/catalog-store";
import { readCircles, commitCircle } from "../src/server/circles";
import {
  joinGroup,
  leaveGroup,
  makeQuote,
  checkout,
  capture,
  snapshot,
  updateBrief,
  updateGroupPolicy,
} from "../src/server/service";
import { activeStock } from "../src/server/group-lifecycle";
import { recoverWorkspace } from "../src/server/recovery";
import { cancelFulfillment } from "../src/server/order-options";
import { defaultGroupPolicy } from "../src/domain/group-policy";
import { prepareShoppingDecision } from "../src/server/concierge/decisions";
import type { Product } from "../src/domain/catalog";
import type { CircleOffer } from "../src/domain/circles";
let product: Product;
let a: Actor, b: Actor, c: Actor;
const guest = async () => (await customerSession({ action: "guest" })).actor;
const command = (offer: CircleOffer, circleId?: string) => ({
  action: "join",
  productId: offer.product.id,
  model: offer.model,
  ...offer.review,
  consent: true,
  circleId,
});
const offer = async (actor = a) =>
  (await readCircles({ productId: product.id }, actor)).offer!;
async function forming() {
  const id = (await commitCircle(a, command(await offer()))) as string;
  return id;
}
async function ready() {
  const id = await forming();
  const view = (await readCircles({ circleId: id }, b)).circles[0];
  await commitCircle(b, command(view, id));
  return id;
}
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET =
    "m3-circle-tests-session-secret-at-least-32-characters";
  await getDatabase();
  product = await getStoredProduct("B010");
}, 60000);
beforeEach(async () => {
  const db = await getDatabase();
  const ws = await createWorkspace();
  await db.query(
    "INSERT INTO storefronts(id,workspace_id) VALUES('primary',$1) ON CONFLICT(id) DO UPDATE SET workspace_id=$1",
    [ws.id],
  );
  await db.query(
    "UPDATE catalog_products SET price=$2,record=$3,publication='published' WHERE id=$1",
    [product.id, product.price, JSON.stringify({ ...product, stock: 4 })],
  );
  [a, b, c] = await Promise.all([guest(), guest(), guest()]);
});
afterAll(() => closeDatabase());
it("shares one exact public circle while excluding customer and reservation identities", async () => {
  const id = await forming();
  const publicView = (await readCircles({ circleId: id })).circles[0];
  expect(publicView.memberCount).toBe(1);
  expect(publicView.joined).toBe(false);
  expect(publicView.canJoin).toBe(true);
  expect(publicView.terms.codCommitmentsEligible).toBe(true);
  expect(publicView.product.id).toBe(product.id);
  expect(publicView.terms.amount).toBe(Math.round(product.price * 0.9));
  expect(JSON.stringify(publicView)).not.toContain(a.userId);
  expect(publicView.review.briefVersion).toBeNull();
  const ws = await createWorkspace();
  await joinGroup({ ...a, workspaceId: ws.id }, product.id, "not-required");
  await expect(
    readCircles({ circleId: (await getWorkspace(ws.id)).groups[0].id }),
  ).rejects.toThrow("not found");
  const privateB = await snapshot(b);
  expect(JSON.stringify(privateB.groups)).not.toContain(a.userId);
  expect(privateB.orders).toEqual([]);
});
it("requires exact consent and storefront buyer authority without committing during preview", async () => {
  const fresh = await offer();
  expect((await getWorkspace(a.workspaceId)).groups).toEqual([]);
  await expect(
    commitCircle(a, { ...command(fresh), consent: false }),
  ).rejects.toThrow();
  await expect(
    commitCircle({ ...a, role: "reviewer" }, command(fresh)),
  ).rejects.toThrow("Only");
  await expect(
    commitCircle(
      { ...a, workspaceId: (await createWorkspace()).id },
      command(fresh),
    ),
  ).rejects.toThrow("storefront");
  expect((await getWorkspace(a.workspaceId)).groups).toEqual([]);
});
it("makes duplicate joins idempotent and concurrent final joins reserve exactly two units", async () => {
  const id = await forming();
  const av = (await readCircles({ circleId: id }, a)).circles[0];
  await Promise.all([
    commitCircle(a, command(av, id)),
    commitCircle(a, command(av, id)),
  ]);
  expect((await getWorkspace(a.workspaceId)).groups[0].members).toHaveLength(1);
  const bv = (await readCircles({ circleId: id }, b)).circles[0],
    cv = (await readCircles({ circleId: id }, c)).circles[0];
  const results = await Promise.allSettled([
    commitCircle(b, command(bv, id)),
    commitCircle(c, command(cv, id)),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const state = await getWorkspace(a.workspaceId);
  expect(state.groups[0].members).toHaveLength(2);
  expect(activeStock(state, product.id)).toBe(2);
  expect(state.orders).toEqual([]);
  expect(state.operations).toEqual([]);
});
it("does not overreserve when distinct circles reach readiness against the last units", async () => {
  const db = await getDatabase();
  await db.query(
    "UPDATE catalog_products SET record=jsonb_set(record,'{stock}','2'::jsonb) WHERE id=$1",
    [product.id],
  );
  const id = await ready();
  const state = await getWorkspace(a.workspaceId);
  expect(activeStock(state, product.id)).toBe(2);
  await joinGroup(c, product.id, "not-required");
  const d = await guest();
  await expect(joinGroup(d, product.id, "not-required")).rejects.toThrow(
    "stock",
  );
  expect(activeStock(await getWorkspace(a.workspaceId), product.id)).toBe(2);
  expect((await readCircles({ circleId: id }, a)).circles[0].canReview).toBe(
    true,
  );
});
it("rejects stale product, variant, policy and wrong-circle submissions", async () => {
  const fresh = await offer();
  const db = await getDatabase();
  await db.query("UPDATE catalog_products SET price=price+100 WHERE id=$1", [
    product.id,
  ]);
  await expect(commitCircle(a, command(fresh))).rejects.toThrow(
    "offer changed",
  );
  await db.query("UPDATE catalog_products SET price=$2 WHERE id=$1", [
    product.id,
    product.price,
  ]);
  const id = await forming();
  const view = (await readCircles({ circleId: id }, b)).circles[0];
  await expect(
    commitCircle(b, { ...command(view, id), productId: "B011" }),
  ).rejects.toThrow();
  await db.query(
    "UPDATE catalog_products SET record=jsonb_set(record,'{skuVariant}','\"changed\"'::jsonb) WHERE id=$1",
    [product.id],
  );
  expect((await readCircles({ circleId: id })).circles[0].status).toBe(
    "unavailable",
  );
  await expect(commitCircle(b, command(view, id))).rejects.toThrow("changed");
  await db.query("UPDATE catalog_products SET record=$2 WHERE id=$1", [
    product.id,
    JSON.stringify({ ...product, stock: 4 }),
  ]);
  const stale = await offer(c);
  await updateGroupPolicy(
    { ...a, role: "reviewer" },
    { ...defaultGroupPolicy, discountPercent: 15 },
    1,
  );
  await leaveGroup(a, id);
  await mutateWorkspace(a.workspaceId, (s) => {
    s.groups[0].expiresAt = new Date(0).toISOString();
  });
  await expect(commitCircle(c, command(stale))).rejects.toThrow(
    "terms changed",
  );
});
it("does not redirect an expired invitation into a different or newly created circle", async () => {
  const id = await forming(),
    view = (await readCircles({ circleId: id }, b)).circles[0];
  await mutateWorkspace(a.workspaceId, (s) => {
    s.groups[0].expiresAt = new Date(0).toISOString();
  });
  expect((await readCircles({ circleId: id })).circles[0].status).toBe(
    "expired",
  );
  await expect(commitCircle(b, command(view, id))).rejects.toThrow(
    "not available",
  );
  expect((await getWorkspace(a.workspaceId)).groups).toHaveLength(1);
});
it("invalidates an unsent join when the buyer changes requirements after preview", async () => {
  const fresh = await offer();
  await updateBrief(a, {
    model: "not-required",
    category: product.category,
    budget: product.price,
    message: "Updated exact product requirements",
    preference: "",
    priority: "price",
  });
  await expect(commitCircle(a, command(fresh))).rejects.toThrow(
    "brief changed",
  );
});
it("revalidates earlier members requirements before readiness and allows leave then fresh commitment", async () => {
  const id = await forming();
  await updateBrief(a, {
    model: "not-required",
    category: product.category,
    budget: product.price,
    message: "Updated brief",
    preference: "",
    priority: "price",
  });
  const view = (await readCircles({ circleId: id }, b)).circles[0];
  await expect(commitCircle(b, command(view, id))).rejects.toThrow(
    "requirements changed",
  );
  expect((await getWorkspace(a.workspaceId)).groups[0].members).toHaveLength(1);
  await leaveGroup(a, id);
  await commitCircle(
    a,
    command((await readCircles({ circleId: id }, a)).circles[0], id),
  );
  await commitCircle(b, command(view, id));
  expect((await getWorkspace(a.workspaceId)).groups[0].status).toBe("ready");
});
it("rejects a different saved discovery variant instead of accepting a budget-only match", async () => {
  const fresh = await offer();
  await prepareShoppingDecision(a, {
    purpose: "A different exact perfume",
    constraints: { query: "B011", max_price: 1000000 },
    expected_version: 0,
  });
  await expect(commitCircle(a, command(await offer()))).rejects.toThrow(
    "saved discovery",
  );
  expect(fresh.product.id).toBe(product.id);
});
it("releases only a declining shoppers unused unit and invalidates their old quote", async () => {
  const id = await ready(),
    qa = await makeQuote(a, product.id, "not-required", id),
    qb = await makeQuote(b, product.id, "not-required", id);
  await leaveGroup(a, id);
  await leaveGroup(a, id);
  const state = await getWorkspace(a.workspaceId);
  expect(activeStock(state, product.id)).toBe(1);
  expect(state.groups[0].status).toBe("ready");
  expect(state.groups[0].members).toEqual([b.userId]);
  expect(state.groups[0].qualifiedMemberCount).toBe(2);
  expect(JSON.stringify((await snapshot(b)).groups)).not.toContain(a.userId);
  await expect(checkout(a, qa.id, qa.fingerprint)).rejects.toThrow();
  const order = await checkout(b, qb.id, qb.fingerprint);
  expect(order.quote.amount).toBe(qb.amount);
  expect(order.status).toBe("checkout_pending");
  expect((await readCircles({ circleId: id }, b)).circles[0].memberCount).toBe(
    1,
  );
});
it("expiry releases unused members once, preserves paid orders and keeps their stock allocated", async () => {
  const id = await ready();
  const qa = await makeQuote(a, product.id, "not-required", id),
    qb = await makeQuote(b, product.id, "not-required", id);
  const order = await checkout(a, qa.id, qa.fingerprint);
  await capture(a, order.id);
  await expect(leaveGroup(a, id)).rejects.toThrow("Payment");
  const before = (await getWorkspace(a.workspaceId)).orders[0];
  await recoverWorkspace(a.workspaceId, Date.now() + 31 * 60000);
  await recoverWorkspace(a.workspaceId, Date.now() + 31 * 60000);
  const state = await getWorkspace(a.workspaceId);
  expect(state.orders[0]).toEqual(before);
  expect(state.groups[0].status).toBe("expired");
  expect(state.groups[0].members).toEqual([a.userId]);
  expect(state.groups[0].releasedMembers).toHaveLength(1);
  expect(activeStock(state, product.id)).toBe(1);
  await expect(checkout(b, qb.id, qb.fingerprint)).rejects.toThrow();
});
it("keeps frozen approved prices and COD qualification separate from later policy changes", async () => {
  const id = await forming();
  await updateGroupPolicy(
    { ...a, role: "reviewer" },
    {
      ...defaultGroupPolicy,
      codCommitmentsEligible: false,
      discountPercent: 20,
    },
    1,
  );
  const view = (await readCircles({ circleId: id }, b)).circles[0];
  expect(view.terms.discountPercent).toBe(10);
  expect(view.terms.codCommitmentsEligible).toBe(true);
  await commitCircle(b, command(view, id));
  expect((await makeQuote(a, product.id, "not-required", id)).amount).toBe(
    Math.round(product.price * 0.9),
  );
  expect((await offer(c)).terms.codCommitmentsEligible).toBe(false);
});
it("unpaid order cancellation releases only that member and never restores their ready-group reservation", async () => {
  const id = await ready(),
    qa = await makeQuote(a, product.id, "not-required", id);
  const order = await checkout(a, qa.id, qa.fingerprint);
  await cancelFulfillment(
    { ...a, role: "seller" },
    order.id,
    "Unable to fulfill this unit",
  );
  await cancelFulfillment(
    { ...a, role: "seller" },
    order.id,
    "Unable to fulfill this unit",
  );
  const state = await getWorkspace(a.workspaceId);
  expect(state.orders[0].status).toBe("canceled");
  expect(activeStock(state, product.id)).toBe(1);
  expect(state.groups[0].members).toEqual([b.userId]);
  expect(state.groups[0].releasedMembers).toHaveLength(1);
  expect((await makeQuote(b, product.id, "not-required", id)).amount).toBe(
    Math.round(product.price * 0.9),
  );
});
it("refuses decline while a capture outcome remains unresolved", async () => {
  const id = await ready(),
    qa = await makeQuote(a, product.id, "not-required", id);
  const order = await checkout(a, qa.id, qa.fingerprint);
  await mutateWorkspace(a.workspaceId, (s) => {
    s.operations.push({
      id: "pending-capture-proof",
      orderId: order.id,
      kind: "capture",
      state: "unknown",
      amount: qa.amount,
    });
  });
  await expect(leaveGroup(a, id)).rejects.toThrow("Payment");
  expect(activeStock(await getWorkspace(a.workspaceId), product.id)).toBe(2);
});
