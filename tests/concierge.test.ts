import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
vi.mock("../src/server/concierge/model", () => ({ modelTurn: vi.fn() }));
import { modelTurn } from "../src/server/concierge/model";
import { customerSession } from "../src/server/customers";
import { closeDatabase, getDatabase } from "../src/server/database";
import {
  hybridSearch,
  productDetails,
  catalogCapabilities,
} from "../src/server/concierge/retrieval";
import {
  readConcierge,
  changeConcierge,
  withTurnFence,
} from "../src/server/concierge/store";
import {
  manageBasket,
  basket,
  confirmOperation,
  prepareConfirmation,
  prepareCheckout,
  customerOrders,
} from "../src/server/concierge/shopping";
import {
  runConcierge,
  acknowledgeBrowser,
  cancelTurn,
} from "../src/server/concierge/engine";
import { executeTool, declarations } from "../src/server/concierge/tools";
import { uiContext, type NativeMessage } from "../src/domain/concierge";
import { registeredPath } from "../src/domain/site-routes";
import type { Actor } from "../src/server/state";
import type { Product } from "../src/domain/catalog";
import { lifestyleProfile } from "../src/domain/departments";
import {
  checkout as checkoutOffer,
  snapshot as commerceSnapshot,
  updateGroupPolicy,
} from "../src/server/service";

let actor: Actor, other: Actor;
let products: Product[];
const context = uiContext.parse({
  current_url: "/shop",
  current_page_type: "shop",
});
const call = (name: string, args: unknown): NativeMessage => ({
  role: "assistant",
  content: null,
  tool_calls: [
    {
      id: randomUUID(),
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    },
  ],
});
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET =
    "concierge-independent-test-secret-32-characters";
  delete process.env.CONCIERGE_EMBEDDING_MODEL;
  actor = (await customerSession({ action: "guest" })).actor;
  other = (await customerSession({ action: "guest" })).actor;
  products = (await hybridSearch({ limit: 24 })).products;
}, 60000);
afterAll(async () => {
  await closeDatabase();
  vi.restoreAllMocks();
});
it("discovers live brands and supports strict inclusive/exclusive limits across independently selected categories", async () => {
  const capabilities = await catalogCapabilities();
  expect(capabilities.collections.length).toBeGreaterThan(10);
  const distinct = [
    ...new Set(
      capabilities.collections.map((r) => r.leaf_type).filter(Boolean),
    ),
  ].slice(1, 5);
  for (const category of distinct) {
    const sample = (await hybridSearch({ categories: [category], limit: 1 }))
      .products[0];
    if (!sample) continue;
    const equal = await hybridSearch({
      categories: [category],
      brands: sample.brand ? [sample.brand] : [],
      min_price: sample.price,
      max_price: sample.price,
    });
    expect(equal.products.some((p) => p.id === sample.id)).toBe(true);
    expect(equal.products.every((p) => p.price === sample.price)).toBe(true);
    const exclusive = await hybridSearch({
      categories: [category],
      min_price: sample.price,
      max_price: sample.price,
      min_exclusive: true,
    });
    expect(exclusive.total).toBe(0);
  }
});
it("does not invent matches for unknown attributes, broadening or malformed currency", async () => {
  expect(
    (
      await hybridSearch({
        attributes: { neverRecordedAttribute: randomUUID() },
      })
    ).total,
  ).toBe(0);
  await expect(hybridSearch({ currency: "INR" })).rejects.toThrow();
  const result = await hybridSearch({ query: randomUUID() });
  expect(result.total).toBe(0);
  expect(result.degradation).toContain("Semantic");
});
it("persists cart and wishlist separately and rejects excess stock and foreign state", async () => {
  const p = products[0];
  await manageBasket(actor, {
    collection: "cart",
    action: "add",
    items: [{ productId: p.id, quantity: 1 }],
  });
  await manageBasket(actor, {
    collection: "wishlist",
    action: "add",
    items: [{ productId: p.id }],
  });
  expect((await basket(actor)).cart[0].productId).toBe(p.id);
  expect((await basket(other)).cart).toEqual([]);
  expect((await basket(actor)).wishlist).toHaveLength(1);
  await expect(
    manageBasket(actor, {
      collection: "cart",
      action: "set",
      items: [{ productId: p.id, quantity: 99 }],
    }),
  ).rejects.toThrow();
  const before = await readConcierge(actor);
  await expect(
    manageBasket(actor, {
      collection: "cart",
      action: "clear",
      expected_revision: before.revision - 1,
    }),
  ).rejects.toThrow("changed");
});
it("chains native calls through actual search and persistent mutations, and replays the turn without duplicating", async () => {
  vi.mocked(modelTurn).mockReset();
  const id = randomUUID();
  const p = products[2];
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(call("get_product_details", { product_ids: [p.id] }))
    .mockResolvedValueOnce(
      call("manage_collection", {
        collection: "cart",
        action: "add",
        items: [{ productId: p.id }],
      }),
    )
    .mockResolvedValueOnce({
      role: "assistant",
      content: "Fixture response after observing persisted basket",
    });
  const result = await runConcierge(actor, {
    turn_id: id,
    message: "Independent multi-tool contract exercise",
    client_context: context,
  });
  expect(result.turn?.status).toBe("completed");
  expect(
    (await basket(actor)).cart.find((i) => i.productId === p.id)?.quantity,
  ).toBe(1);
  const replay = await runConcierge(actor, {
    turn_id: id,
    message: "duplicate",
    client_context: context,
  });
  expect(replay.turn?.status).toBe("completed");
  expect(modelTurn).toHaveBeenCalledTimes(3);
  const sent = vi.mocked(modelTurn).mock.calls[2][0];
  expect(sent.some((m) => m.role === "tool" && m.content?.includes(p.id))).toBe(
    true,
  );
});
it("allows general conversation without forcing catalog intent or tools", async () => {
  vi.mocked(modelTurn).mockReset().mockResolvedValue({
    role: "assistant",
    content:
      "A general conversational model response, supplied only by this test.",
  });
  const result = await runConcierge(other, {
    turn_id: randomUUID(),
    message: "Explain a non-shopping topic",
    client_context: context,
  });
  expect(result.turn?.calls).toBe(0);
  expect(result.turn?.status).toBe("completed");
});
it("requires browser observation and continues from the exact acknowledged state", async () => {
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(
      call("operate_ui", { operation: "navigate", destination: "orders" }),
    )
    .mockResolvedValueOnce({
      role: "assistant",
      content: "Observed browser receipt in this contract test",
    });
  const id = randomUUID();
  let result = await runConcierge(actor, {
    turn_id: id,
    message: "Navigate",
    client_context: context,
  });
  expect(result.turn?.status).toBe("awaiting_ui");
  expect(result.actions).toHaveLength(1);
  await expect(
    acknowledgeBrowser(actor, {
      id: result.actions[0].id,
      turn_id: id,
      status: "succeeded",
      outcome: "false claim",
      client_context: context,
    }),
  ).rejects.toThrow("destination");
  await acknowledgeBrowser(actor, {
    id: result.actions[0].id,
    turn_id: id,
    status: "succeeded",
    outcome: "observed",
    client_context: { ...context, current_url: "/orders", revision: 1 },
  });
  result = await runConcierge(actor, {
    turn_id: id,
    resume: true,
    client_context: { ...context, current_url: "/orders", revision: 2 },
  });
  expect(result.turn?.status).toBe("completed");
});
it("preserves manual filter constraints while a later patch modifies only one field", async () => {
  const result = await executeTool(
    "operate_ui",
    { operation: "filter", constraints: { max_price: 40000 } },
    {
      actor,
      ui: {
        ...context,
        active_filters: {
          categories: [products[0].category],
          brands: products[0].brand ? [products[0].brand] : [],
          min_price: 100,
        },
      },
    },
  );
  const parsed = JSON.parse(
    new URL(
      (result.data as { browser_operation: { path: string } }).browser_operation
        .path,
      "https://dale.invalid",
    ).searchParams.get("filters")!,
  );
  expect(parsed.min_price).toBe(100);
  expect(parsed.max_price).toBe(40000);
  expect(parsed.categories).toEqual([products[0].category]);
});
it("reports provider outages without injecting a scripted response or mutating collections", async () => {
  vi.mocked(modelTurn)
    .mockReset()
    .mockRejectedValue(new Error("fixture transport unavailable"));
  const before = await basket(actor);
  const result = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Arbitrary request",
    client_context: context,
  });
  expect(result.turn?.status).toBe("failed");
  expect(result.turn?.error).toContain("transport");
  expect((await basket(actor)).cart).toEqual(before.cart);
});
it("rejects unknown tools, arbitrary browser paths and seller operations", async () => {
  await expect(
    executeTool("capture_payment", {}, { actor, ui: context }),
  ).rejects.toThrow("Unknown tool");
  await expect(
    executeTool(
      "manage_collection",
      { collection: "cart", action: "clear", owner: other.userId },
      { actor, ui: context },
    ),
  ).rejects.toThrow();
  for (const path of [
    "https://example.com",
    "//example.com",
    "/product/../../api/actions",
    "/api/actions",
    "/\\example.com",
  ])
    expect(registeredPath(path)).toBe(false);
  await expect(readConcierge({ ...actor, role: "seller" })).rejects.toThrow(
    "shopper",
  );
  expect(declarations().some((t) => t.name.includes("capture"))).toBe(false);
});
it("keeps order ownership and confirmation authority outside the model", async () => {
  const confirmation = await prepareConfirmation(
    actor,
    "cancel",
    { orderId: randomUUID() },
    "Test cancellation",
  );
  await expect(
    confirmOperation(other, confirmation.confirmation_id),
  ).rejects.toThrow("not found");
  await expect(customerOrders(other, randomUUID())).rejects.toThrow(
    "not found",
  );
  const canceled = await confirmOperation(
    actor,
    confirmation.confirmation_id,
    true,
  );
  expect(canceled).toEqual({ canceled: true });
  await expect(
    confirmOperation(actor, confirmation.confirmation_id),
  ).rejects.toThrow("attempted");
});
it("never returns withdrawn products even when their existing vector or old product reference survives", async () => {
  const p = products[5];
  const db = await getDatabase();
  await db.query(
    "UPDATE catalog_products SET publication='retired' WHERE id=$1",
    [p.id],
  );
  expect(await productDetails([p.id])).toEqual([]);
  expect((await hybridSearch({})).products.some((r) => r.id === p.id)).toBe(
    false,
  );
  await db.query(
    "UPDATE catalog_products SET publication='published' WHERE id=$1",
    [p.id],
  );
});
it("rejects expired confirmations without executing side effects", async () => {
  const c = await prepareConfirmation(
    actor,
    "cancel",
    { orderId: randomUUID() },
    "Expired operation",
  );
  await changeConcierge(actor, (s) => {
    s.confirmations.find((p) => p.id === c.confirmation_id)!.expiresAt =
      new Date(0).toISOString();
  });
  await expect(confirmOperation(actor, c.confirmation_id)).rejects.toThrow(
    "expired",
  );
});
it("does not replay an old turn after other turns have completed", async () => {
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValue({ role: "assistant", content: "Contract-only reply" });
  const old = randomUUID();
  await runConcierge(actor, {
    turn_id: old,
    message: "First turn",
    client_context: context,
  });
  await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Later turn",
    client_context: context,
  });
  const calls = vi.mocked(modelTurn).mock.calls.length;
  await runConcierge(actor, {
    turn_id: old,
    message: "Replayed older turn",
    client_context: context,
  });
  expect(modelTurn).toHaveBeenCalledTimes(calls);
});
it("fences delayed mutations after cancellation and cannot overwrite a newer turn", async () => {
  const turnId = randomUUID();
  await changeConcierge(actor, (s) => {
    s.turn = {
      id: turnId,
      status: "running",
      calls: 0,
      leaseUntil: Date.now() + 60000,
    };
  });
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const delayed = withTurnFence(actor, turnId, async () => {
    await gate;
    return manageBasket(actor, { collection: "cart", action: "clear" });
  });
  await cancelTurn(actor);
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValue({ role: "assistant", content: "New turn completed" });
  const newer = randomUUID();
  await runConcierge(actor, {
    turn_id: newer,
    message: "New independent instruction",
    client_context: context,
  });
  release();
  await expect(delayed).rejects.toThrow("no longer active");
  expect((await readConcierge(actor)).turn?.id).toBe(newer);
  expect((await readConcierge(actor)).turn?.status).toBe("completed");
});
it("repairs every outstanding native function call after an interrupted partial frame", async () => {
  await changeConcierge(actor, (s) => {
    s.messages = [
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "resolved",
            type: "function",
            function: { name: "get_current_ui_context", arguments: "{}" },
          },
          {
            id: "unresolved",
            type: "function",
            function: { name: "get_group_deals", arguments: "{}" },
          },
        ],
      },
      { role: "tool", tool_call_id: "resolved", content: "{}" },
    ];
  });
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValue({ role: "assistant", content: "Recovered frame" });
  await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Continue after interruption",
    client_context: context,
  });
  const sent = vi.mocked(modelTurn).mock.calls[0][0];
  expect(
    sent.filter((m) => m.role === "tool" && m.tool_call_id === "unresolved"),
  ).toHaveLength(1);
  expect(
    sent.filter((m) => m.role === "tool" && m.tool_call_id === "resolved"),
  ).toHaveLength(1);
});
it("rejects checkout approval after a concurrent cart edit", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const p = products[0];
  await manageBasket(fresh, {
    collection: "cart",
    action: "add",
    items: [{ productId: p.id }],
  });
  const prepared = await prepareCheckout(fresh, lifestyleProfile);
  await manageBasket(fresh, {
    collection: "cart",
    action: "remove",
    items: [{ productId: p.id }],
  });
  await expect(
    confirmOperation(fresh, prepared.confirmation_id),
  ).rejects.toThrow(/expired|changed/);
});
it("reuses one cart approval across repeated preparations and concurrent confirmations", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  await manageBasket(fresh, {
    collection: "cart",
    action: "add",
    items: [{ productId: products[0].id }],
  });
  const [a, b] = await Promise.all([
    prepareCheckout(fresh),
    prepareCheckout(fresh),
  ]);
  expect(a.confirmation_id).toBe(b.confirmation_id);
  const attempts = await Promise.allSettled([
    confirmOperation(fresh, a.confirmation_id),
    confirmOperation(fresh, b.confirmation_id),
  ]);
  expect(attempts.some((r) => r.status === "fulfilled")).toBe(true);
  const orders = (await commerceSnapshot(fresh)).orders;
  expect(orders).toHaveLength(1);
  await confirmOperation(fresh, a.confirmation_id);
  expect((await commerceSnapshot(fresh)).orders).toHaveLength(1);
  expect((await basket(fresh)).cart).toEqual([]);
});
it("recovers a crashed approved checkout from its existing order instead of creating another", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  await manageBasket(fresh, {
    collection: "cart",
    action: "add",
    items: [{ productId: products[1].id }],
  });
  const prepared = await prepareCheckout(fresh);
  const doc = await readConcierge(fresh);
  const confirmation = doc.confirmations.find(
    (c) => c.id === prepared.confirmation_id,
  )!;
  const quote = (
    confirmation.payload.quotes as { id: string; fingerprint: string }[]
  )[0];
  await checkoutOffer(fresh, quote.id, quote.fingerprint);
  await changeConcierge(fresh, (s) => {
    const c = s.confirmations.find((c) => c.id === prepared.confirmation_id)!;
    c.status = "executing";
    c.executionLeaseUntil = 0;
    c.attemptId = "crashed-attempt";
  });
  await confirmOperation(fresh, prepared.confirmation_id);
  expect((await commerceSnapshot(fresh)).orders).toHaveLength(1);
  expect((await basket(fresh)).cart).toEqual([]);
});
it("requires fresh consent if group policy changes after preparation", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const policy = (await commerceSnapshot(fresh)).groupPolicy;
  const confirmation = await prepareConfirmation(
    fresh,
    "group_join",
    {
      productId: products[0].id,
      model: lifestyleProfile,
      policyVersion: policy.version,
    },
    "Original policy",
  );
  await updateGroupPolicy(
    { ...fresh, role: "reviewer" },
    { ...policy, discountPercent: policy.discountPercent + 1 },
    policy.version,
  );
  await expect(
    confirmOperation(fresh, confirmation.confirmation_id),
  ).rejects.toThrow("terms changed");
  expect((await commerceSnapshot(fresh)).groups).toEqual([]);
});
