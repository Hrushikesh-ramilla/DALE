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
  observationText,
} from "../src/server/concierge/engine";
import { executeTool, declarations } from "../src/server/concierge/tools";
import {
  modelProductReferences,
  resolveProductReferences,
} from "../src/server/concierge/product-references";
import {
  uiContext,
  searchConstraints,
  type NativeMessage,
} from "../src/domain/concierge";
import { registeredPath } from "../src/domain/site-routes";
import { waitForConciergeChange } from "../src/server/concierge/changes";
import { ownerKey } from "../src/server/concierge/store";
import type { Actor } from "../src/server/state";
import type { Product } from "../src/domain/catalog";
import { classifyMovement } from "../src/domain/catalog-derived";
import { lifestyleProfile } from "../src/domain/departments";
import {
  checkout as checkoutOffer,
  snapshot as commerceSnapshot,
  updateGroupPolicy,
  joinGroup,
  updateBrief,
} from "../src/server/service";
import { mutateWorkspace, getWorkspace } from "../src/server/state";
import { deviceCompatibility } from "../src/server/concierge/compatibility";

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
it("publishes only committed state and does not publish a rolled back mutation", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const revision = (await readConcierge(fresh)).revision;
  const waiting = waitForConciergeChange(
    ownerKey(fresh),
    revision,
    new AbortController().signal,
  );
  await changeConcierge(fresh, (state) => {
    state.wishlist = [products[0].id];
  });
  expect(await waiting).toBe(true);
  expect((await readConcierge(fresh)).wishlist).toEqual([products[0].id]);
  const after = (await readConcierge(fresh)).revision;
  const rolledBack = waitForConciergeChange(
    ownerKey(fresh),
    after,
    new AbortController().signal,
    20,
  );
  await expect(
    changeConcierge(fresh, (state) => {
      state.wishlist = [];
      throw new Error("rollback probe");
    }),
  ).rejects.toThrow("rollback probe");
  expect(await rolledBack).toBe(false);
  expect((await readConcierge(fresh)).wishlist).toEqual([products[0].id]);
});
it("keeps a missing named identity primary unless the customer explicitly requests independent results or alternatives", async () => {
  for (const alternatives of [false, true]) {
    const buyer = (await customerSession({ action: "guest" })).actor;
    vi.mocked(modelTurn).mockReset();
    vi.mocked(modelTurn)
      .mockResolvedValueOnce(
        call("lookup_product", {
          name: "nonexistent-identity-" + randomUUID(),
        }),
      )
      .mockResolvedValueOnce(
        call("search_catalog", {
          categories: [products[0].category],
          limit: 3,
          replace_identity_scope: alternatives,
        }),
      )
      .mockResolvedValueOnce({
        role: "assistant",
        content: alternatives
          ? "The named item is absent; here are the requested alternatives."
          : "The named item is absent.",
      });
    const view = await runConcierge(buyer, {
      turn_id: randomUUID(),
      message: alternatives
        ? "Find an unavailable item, and show alternatives if absent."
        : "Find my named item.",
      client_context: context,
    });
    expect(view.turn?.status).toBe("completed");
    expect(view.catalog_match_status).toBe(
      alternatives ? "structured" : "not_found",
    );
    expect(view.products.length).toBe(alternatives ? 3 : 0);
  }
});

it("uses stable product references without changing stored identities or unrelated arguments", async () => {
  const p = products[0];
  const encoded = (await modelProductReferences({
    id: p.id,
    url: `/product/${p.id}`,
    order_id: randomUUID(),
  })) as { id: string; url: string; order_id: string };
  expect(encoded.id).toMatch(/^item:[1-9][0-9]*$/);
  expect(encoded.url).toBe(`/product/${p.id}`);
  await modelProductReferences({ id: products[1].id });
  expect(
    ((await modelProductReferences({ id: p.id })) as { id: string }).id,
  ).toBe(encoded.id);
  expect(
    await resolveProductReferences({
      product_ids: [encoded.id],
      items: [{ productId: encoded.id }],
      note: encoded.id,
      order_id: encoded.id,
    }),
  ).toEqual({
    product_ids: [p.id],
    items: [{ productId: p.id }],
    note: encoded.id,
    order_id: encoded.id,
  });
  expect(
    await resolveProductReferences({
      destination: "category",
      entity_id: encoded.id,
    }),
  ).toEqual({ destination: "category", entity_id: encoded.id });
  expect(
    await resolveProductReferences({
      destination: "product",
      entity_id: encoded.id,
    }),
  ).toEqual({ destination: "product", entity_id: p.id });
  await expect(
    resolveProductReferences({ product_ids: ["item:9223372036854775807"] }),
  ).rejects.toThrow("Unknown product reference");
  await expect(
    resolveProductReferences({ product_id: "item:invalid" }),
  ).rejects.toThrow("Invalid product reference");
  const fresh = (await customerSession({ action: "guest" })).actor;
  await executeTool(
    "manage_collection",
    {
      collection: "wishlist",
      action: "add",
      items: [{ productId: encoded.id }],
    },
    { actor: fresh, ui: context },
  );
  expect((await basket(fresh)).wishlist.map((i) => i.productId)).toEqual([
    p.id,
  ]);
  expect((await basket(other)).wishlist).toEqual([]);
  const operation = await executeTool(
    "operate_ui",
    { operation: "navigate", destination: "product", entity_id: encoded.id },
    { actor: fresh, ui: context },
  );
  expect(JSON.stringify(operation)).toContain(encodeURIComponent(p.id));
});
it("moves only the requested item atomically in both directions and invalidates pending cart approval", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const [p, sentinel] = products.filter(
    (p) => !p.comparisonOnly && p.stock > 2,
  );
  await manageBasket(fresh, {
    collection: "wishlist",
    action: "add",
    items: [{ productId: p.id }, { productId: sentinel.id }],
  });
  await manageBasket(fresh, {
    collection: "cart",
    action: "add",
    items: [{ productId: sentinel.id, quantity: 2 }],
  });
  const ref = ((await modelProductReferences({ id: p.id })) as { id: string })
    .id;
  await expect(
    executeTool(
      "move_collection",
      {
        source_collection: "wishlist",
        destination_collection: "wishlist",
        items: [{ productId: ref }],
      },
      { actor: fresh, ui: context },
    ),
  ).rejects.toThrow("must differ");
  await executeTool(
    "move_collection",
    {
      source_collection: "wishlist",
      destination_collection: "cart",
      items: [{ productId: ref, quantity: 1 }],
    },
    { actor: fresh, ui: context },
  );
  let state = await readConcierge(fresh);
  expect(state.wishlist).toEqual([sentinel.id]);
  expect(state.cart).toEqual(
    expect.arrayContaining([
      { productId: p.id, quantity: 1 },
      { productId: sentinel.id, quantity: 2 },
    ]),
  );
  const prepared = await prepareConfirmation(
    fresh,
    "checkout",
    {},
    "Test pending cart approval",
  );
  await manageBasket(fresh, {
    collection: "wishlist",
    action: "move",
    items: [{ productId: p.id }],
  });
  state = await readConcierge(fresh);
  expect(state.cart).toEqual([{ productId: sentinel.id, quantity: 2 }]);
  expect(state.wishlist).toEqual([sentinel.id, p.id]);
  expect(
    Date.parse(
      state.confirmations.find((c) => c.id === prepared.confirmation_id)!
        .expiresAt,
    ),
  ).toBeLessThan(Date.now());
  expect((await readConcierge(other)).cart).toEqual([]);
  await expect(
    manageBasket(fresh, {
      collection: "wishlist",
      action: "move",
      items: [{ productId: p.id }],
    }),
  ).rejects.toThrow("source collection");
});

it("rolls back the whole move when one source product is unavailable", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const p = products.find((p) => !p.comparisonOnly && p.stock > 0)!;
  await changeConcierge(fresh, (s) => {
    s.wishlist = [p.id, "withdrawn-test-product"];
  });
  await expect(
    manageBasket(fresh, {
      collection: "cart",
      action: "move",
      items: [{ productId: p.id }, { productId: "withdrawn-test-product" }],
    }),
  ).rejects.toThrow("unavailable");
  const state = await readConcierge(fresh);
  expect(state.wishlist).toEqual([p.id, "withdrawn-test-product"]);
  expect(state.cart).toEqual([]);
  await expect(
    manageBasket(fresh, { collection: "cart", action: "move", items: [] }),
  ).rejects.toThrow("exact items");
});
it("merges a moved item with the existing cart quantity instead of silently reducing it", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const p = products.find((p) => !p.comparisonOnly && p.stock > 3)!;
  await manageBasket(fresh, {
    collection: "cart",
    action: "add",
    items: [{ productId: p.id, quantity: 3 }],
  });
  await manageBasket(fresh, {
    collection: "wishlist",
    action: "add",
    items: [{ productId: p.id }],
  });
  await manageBasket(fresh, {
    collection: "cart",
    action: "move",
    items: [{ productId: p.id, quantity: 1 }],
  });
  const state = await readConcierge(fresh);
  expect(state.cart).toEqual([{ productId: p.id, quantity: 4 }]);
  expect(state.wishlist).toEqual([]);
});

it("rejects a move out of the cart while checkout is executing", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const p = products.find((p) => !p.comparisonOnly && p.stock > 0)!;
  await manageBasket(fresh, {
    collection: "cart",
    action: "add",
    items: [{ productId: p.id }],
  });
  const confirmation = await prepareConfirmation(
    fresh,
    "checkout",
    {},
    "Test executing checkout",
  );
  await changeConcierge(fresh, (s) => {
    s.confirmations.find((c) => c.id === confirmation.confirmation_id)!.status =
      "executing";
  });
  await expect(
    manageBasket(fresh, {
      collection: "wishlist",
      action: "move",
      items: [{ productId: p.id }],
    }),
  ).rejects.toThrow("Checkout is executing");
  expect((await readConcierge(fresh)).cart).toEqual([
    { productId: p.id, quantity: 1 },
  ]);
});

it("keeps variant ambiguity visible after reading details and blocks silently adding a candidate", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const turnId = randomUUID();
  await changeConcierge(fresh, (s) => {
    s.turn = {
      id: turnId,
      status: "running",
      calls: 0,
      leaseUntil: Date.now() + 60000,
    };
    s.resultSets = [
      {
        id: randomUUID(),
        turnId,
        matchStatus: "choose_variant",
        productIds: products.slice(0, 2).map((p) => p.id),
        constraints: searchConstraints.parse({}),
      },
    ];
  });
  const result = await executeTool(
    "get_product_details",
    { product_ids: [products[0].id], include_specs: false },
    { actor: fresh, ui: context },
  );
  expect(result.data).toMatchObject({ selection_required: true });
  // An unrelated lookup must not erase a pending variant choice.
  await executeTool(
    "lookup_product",
    { name: products[2].name },
    { actor: fresh, ui: context },
  );
  await expect(
    executeTool(
      "manage_collection",
      {
        collection: "cart",
        action: "add",
        items: [{ productId: products[0].id }],
      },
      { actor: fresh, ui: context },
    ),
  ).rejects.toThrow("Ask the customer");
  expect((await basket(fresh)).cart).toEqual([]);
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
  const result = await hybridSearch({
    query: randomUUID(),
    match_mode: "semantic",
  });
  expect(result.total).toBe(0);
  expect(result.degradation).toContain("Semantic");
});
it("returns named identities only and does not send identity requests to embeddings", async () => {
  const before = process.env.CONCIERGE_EMBEDDING_MODEL;
  process.env.CONCIERGE_EMBEDDING_MODEL = "must-not-be-called-for-identity";
  const request = vi.spyOn(globalThis, "fetch");
  try {
    const p = products[0];
    const lookup = await hybridSearch({ query: p.name, in_stock: false });
    expect(lookup.products.some((item) => item.id === p.id)).toBe(true);
    expect(lookup.mode).toBe("identity");
    expect(
      (
        await hybridSearch({ query: "lv imagination perfume", in_stock: false })
      ).products.every(
        (item) =>
          item.brand === "Louis Vuitton" &&
          item.name.toLowerCase().includes("imagination"),
      ),
    ).toBe(true);
    expect((await hybridSearch({ query: randomUUID() })).products).toEqual([]);
    expect(request).not.toHaveBeenCalled();
  } finally {
    request.mockRestore();
    if (before === undefined) delete process.env.CONCIERGE_EMBEDDING_MODEL;
    else process.env.CONCIERGE_EMBEDDING_MODEL = before;
  }
});

it("does not display prior search cards under a new request", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(call("lookup_product", { name: products[0].name }))
    .mockResolvedValueOnce({
      role: "assistant",
      content: "Observed identity lookup",
    });
  const previous = await runConcierge(fresh, {
    turn_id: randomUUID(),
    message: "Look up a named product",
    client_context: context,
  });
  expect(previous.products.length).toBeGreaterThan(0);
  vi.mocked(modelTurn).mockResolvedValueOnce({
    role: "assistant",
    content: "A separate general conversation",
  });
  const next = await runConcierge(fresh, {
    turn_id: randomUUID(),
    message: "A different request",
    client_context: context,
  });
  expect(next.products).toEqual([]);
  expect((await readConcierge(fresh)).resultSets.length).toBe(1);
  expect(
    vi.mocked(modelTurn).mock.calls[0][0].find((m) => m.role === "user")
      ?.content,
  ).toBe("Look up a named product");
});
it("uses requested lookup identity rather than interpreting other utterance mentions as selection", async () => {
  const p = products[0];
  const fresh = (await customerSession({ action: "guest" })).actor;
  for (const message of [
    `I already own ${products[1].name}; show me ${p.name} instead`,
    `Compare ${p.name} with ${products[1].name}`,
  ]) {
    await changeConcierge(fresh, (s) => {
      s.transcript.push({
        id: randomUUID(),
        sender: "user",
        text: message,
        timestamp: Date.now(),
      });
    });
    await executeTool(
      "lookup_product",
      { name: p.name },
      { actor: fresh, ui: context },
    );
    const set = (await readConcierge(fresh)).resultSets.at(-1)!;
    expect(set.productIds).toContain(p.id);
    expect(set.productIds).not.toContain(products[1].id);
  }
});

it("does not expose an empty search tracking ID as an apparent product identity", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const observation = await executeTool(
    "lookup_product",
    { name: `absent-${randomUUID()}` },
    { actor: fresh, ui: context },
  );
  expect(observation.data).toMatchObject({
    status: "not_found",
    products: [],
    choices: [],
    total: 0,
    selection_required: false,
  });
  expect(observation.data).not.toHaveProperty("result_set_id");
  expect((await readConcierge(fresh)).resultSets.at(-1)?.productIds).toEqual(
    [],
  );
});
it("ends ambiguous single-item lookup at a truthful customer choice without another generation or a guessed mutation", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(call("lookup_product", { name: "omega peedmater" }));
  const view = await runConcierge(fresh, {
    turn_id: randomUUID(),
    message: "Find omega peedmater and save it to my wishlist",
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.catalog_match_status).toBe("choose_variant");
  expect(view.products.length).toBeGreaterThan(1);
  const text = view.messages.at(-1)?.text || "";
  expect(text).toContain("Which exact variant");
  expect(text).toContain(`${view.products.length} possible matches`);
  expect(text).toContain("Recorded sandbox offer");
  expect(view.basket.wishlist).toEqual([]);
  expect(vi.mocked(modelTurn)).toHaveBeenCalledTimes(1);
});
it("continues a compound lookup frame instead of discarding its independent results", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const frame = call("lookup_product", { name: "omega peedmater" });
  frame.tool_calls!.push(
    ...call("lookup_product", { name: products[0].name }).tool_calls!,
  );
  const answer = `I found ${products[0].name}. Which Omega Speedmaster variant do you mean?`;
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(frame)
    .mockResolvedValueOnce({ role: "assistant", content: answer });
  const view = await runConcierge(fresh, {
    turn_id: randomUUID(),
    message: `Find omega peedmater and also ${products[0].name}`,
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.messages.at(-1)?.text).toBe(answer);
  expect(vi.mocked(modelTurn)).toHaveBeenCalledTimes(2);
  const frames = (await readConcierge(fresh)).messages;
  expect(frames.filter((m) => m.role === "tool")).toHaveLength(2);
});
it("does not offer discovery of core functions that are already callable", () => {
  const discovery = declarations(["lookup_product", "manage_collection"]).find(
    (t) => t.name === "discover_tools",
  )!;
  const options = JSON.parse(JSON.stringify(discovery.parameters)).properties
    .names.items.enum;
  expect(options).not.toContain("lookup_product");
  expect(options).not.toContain("manage_collection");
  expect(options).toContain("search_catalog");
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
it("keeps observed basket revisions valid through native chat bookkeeping but rejects real stale edits", async () => {
  const buyer = (await customerSession({ action: "guest" })).actor;
  const p = products[0];
  await manageBasket(buyer, {
    collection: "wishlist",
    action: "add",
    items: [{ productId: p.id }],
  });
  vi.mocked(modelTurn).mockReset();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("manage_collection", { action: "get", collection: "wishlist" }),
    )
    .mockImplementationOnce(async (messages) => {
      const observation = JSON.parse(messages.at(-1)!.content!);
      return call("move_collection", {
        source_collection: "wishlist",
        destination_collection: "cart",
        expected_revision: observation.data.revision,
        items: [{ productId: p.id, quantity: 1 }],
      });
    })
    .mockResolvedValueOnce({
      role: "assistant",
      content: "Moved the requested item.",
    });
  const view = await runConcierge(buyer, {
    turn_id: randomUUID(),
    message: "Move my saved item into my cart.",
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.basket.cart).toEqual([
    expect.objectContaining({ productId: p.id, quantity: 1 }),
  ]);
  expect(view.basket.wishlist).toEqual([]);
  const observed = view.basket.revision;
  await manageBasket(buyer, {
    collection: "cart",
    action: "set",
    items: [{ productId: p.id, quantity: 2 }],
    expected_revision: observed,
  });
  await expect(
    manageBasket(buyer, {
      collection: "cart",
      action: "remove",
      items: [{ productId: p.id }],
      expected_revision: observed,
    }),
  ).rejects.toThrow("changed");
  expect((await basket(buyer)).cart[0].quantity).toBe(2);
});

it("initializes legacy basket versions without clearing saved items or staling an observed revision", async () => {
  const buyer = (await customerSession({ action: "guest" })).actor;
  const p = products[0];
  await manageBasket(buyer, {
    collection: "wishlist",
    action: "add",
    items: [{ productId: p.id }],
  });
  await (
    await getDatabase()
  ).query(
    "UPDATE concierge_documents SET state=state-'basketRevision' WHERE owner=$1",
    [ownerKey(buyer)],
  );
  const observed = await basket(buyer);
  await changeConcierge(buyer, (s) => {
    s.messages.push({ role: "user", content: "Unrelated chat bookkeeping" });
  });
  expect((await basket(buyer)).revision).toBe(observed.revision);
  await manageBasket(buyer, {
    collection: "cart",
    action: "move",
    items: [{ productId: p.id }],
    expected_revision: observed.revision,
  });
  expect((await basket(buyer)).wishlist).toEqual([]);
  expect((await basket(buyer)).cart[0].productId).toBe(p.id);
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
          max_price: 50,
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
  const schema = declarations().find((t) => t.name === "search_catalog")!
    .parameters as { required?: string[] };
  expect(schema.required || []).not.toContain("max_price");
  expect(schema.required || []).not.toContain("exclude_brands");
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

it("preserves an owned group selection and applies its locked discount after real independent shoppers join", async () => {
  const first = (await customerSession({ action: "guest" })).actor;
  const second = (await customerSession({ action: "guest" })).actor;
  const stranger = (await customerSession({ action: "guest" })).actor;
  const p = products[5];
  const groupId = await joinGroup(first, p.id, lifestyleProfile);
  for (const shopper of [first, stranger])
    await manageBasket(shopper, {
      collection: "cart",
      action: "add",
      items: [{ productId: p.id }],
    });
  await expect(
    manageBasket(stranger, {
      collection: "cart",
      action: "select_group",
      items: [{ productId: p.id, groupId }],
    }),
  ).rejects.toThrow("active membership");
  const regular = await prepareCheckout(first);
  await manageBasket(first, {
    collection: "cart",
    action: "select_group",
    items: [{ productId: p.id, groupId }],
  });
  await expect(
    confirmOperation(first, regular.confirmation_id),
  ).rejects.toThrow(/expired|changed/);
  await expect(prepareCheckout(first)).rejects.toThrow(
    "group offer is not available",
  );
  await expect(
    manageBasket(first, {
      collection: "cart",
      action: "set",
      items: [{ productId: p.id, quantity: 2 }],
    }),
  ).rejects.toThrow("one unit");
  expect(await joinGroup(second, p.id, lifestyleProfile)).toBe(groupId);
  const saved = await basket(first);
  expect(saved.cart[0].groupId).toBe(groupId);
  expect(saved.cart[0].selectedGroup?.ready).toBe(true);
  const prepared = await prepareCheckout(first);
  const confirmation = (await readConcierge(first)).confirmations.find(
    (c) => c.id === prepared.confirmation_id,
  )!;
  const quotes = confirmation.payload.quotes as {
    amount: number;
    groupId: string;
  }[];
  expect(quotes[0].groupId).toBe(groupId);
  expect(quotes[0].amount).toBe(saved.cart[0].selectedGroup?.amount);
  expect(quotes[0].amount).toBeLessThan(p.price);
  await confirmOperation(first, prepared.confirmation_id);
  const orders = (await commerceSnapshot(first)).orders;
  expect(orders).toHaveLength(1);
  expect(orders[0].quote.groupId).toBe(groupId);
  expect(orders[0].quote.amount).toBe(quotes[0].amount);
  expect(orders[0].captureId).toBeUndefined();
  expect((await basket(first)).cart).toEqual([]);
});

it("rejects stale or modified group terms without falling back to the regular offer", async () => {
  const p = products[6];
  for (const fault of [
    "expired",
    "amount",
    "membership",
    "product",
    "cleared",
  ] as const) {
    const first = (await customerSession({ action: "guest" })).actor;
    const second = (await customerSession({ action: "guest" })).actor;
    const groupId = await joinGroup(first, p.id, lifestyleProfile);
    await joinGroup(second, p.id, lifestyleProfile);
    await manageBasket(first, {
      collection: "cart",
      action: "add",
      items: [{ productId: p.id }],
    });
    await manageBasket(first, {
      collection: "cart",
      action: "select_group",
      items: [{ productId: p.id, groupId }],
    });
    const prepared = await prepareCheckout(first);
    if (fault === "cleared") {
      await manageBasket(first, {
        collection: "cart",
        action: "select_group",
        items: [{ productId: p.id, groupId: null }],
      });
      await expect(
        confirmOperation(first, prepared.confirmation_id),
      ).rejects.toThrow(/expired|changed/);
      expect((await basket(first)).cart[0].groupId).toBeUndefined();
    } else {
      await mutateWorkspace(first.workspaceId, (s) => {
        const group = s.groups.find((g) => g.id === groupId)!;
        if (fault === "expired")
          group.checkoutExpiresAt = new Date(0).toISOString();
        if (fault === "amount") group.amount = group.amount! + 1;
        if (fault === "membership")
          group.members = group.members.filter((m) => m !== first.userId);
        if (fault === "product") group.productId = products[7].id;
      });
      const result = (await confirmOperation(
        first,
        prepared.confirmation_id,
      )) as { status: string; outcomes: { error?: string }[] };
      expect(result.status).toBe("partial_or_failed");
      expect(result.outcomes[0].error).toContain("group offer");
    }
    expect((await commerceSnapshot(first)).orders).toEqual([]);
  }
});

it("only saves reviewed requirements and atomically rejects an outdated version", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const input = {
    message: "Headphones for study",
    model: lifestyleProfile,
    category: "headphones",
    budget: 100000,
    preference: "",
    priority: "price",
  };
  const prepared = await executeTool(
    "prepare_customer_action",
    { operation: "update_requirements", brief: input, expected_version: 0 },
    { actor: fresh, ui: context },
  );
  expect(
    (await getWorkspace(fresh.workspaceId)).briefs?.find(
      (b) => b.buyerId === fresh.userId,
    ),
  ).toBeUndefined();
  await confirmOperation(
    fresh,
    (prepared.data as { confirmation_id: string }).confirmation_id,
  );
  const saved = (await getWorkspace(fresh.workspaceId)).briefs!.find(
    (b) => b.buyerId === fresh.userId,
  )!;
  expect(saved.version).toBe(1);
  expect(saved.input.confirmConstraints).toBe(true);
  const stale = await executeTool(
    "prepare_customer_action",
    {
      operation: "update_requirements",
      brief: { ...input, budget: 90000 },
      expected_version: 1,
    },
    { actor: fresh, ui: context },
  );
  await updateBrief(fresh, { ...saved.input, budget: 80000 }, 1);
  await expect(
    confirmOperation(
      fresh,
      (stale.data as { confirmation_id: string }).confirmation_id,
    ),
  ).rejects.toThrow("requirements changed");
  expect(
    (await getWorkspace(fresh.workspaceId)).briefs!.find(
      (b) => b.buyerId === fresh.userId,
    )!.input.budget,
  ).toBe(80000);
  expect(
    (
      await executeTool(
        "get_user_account_context",
        {},
        { actor: other, ui: context },
      )
    ).data,
  ).not.toEqual(
    expect.objectContaining({
      purchase_requirements: expect.objectContaining({ buyerId: fresh.userId }),
    }),
  );
});

it("exposes recorded compatibility and never treats ordinary purchase eligibility as device fit", async () => {
  const profiles = await deviceCompatibility({ operation: "profiles" });
  expect(
    "profiles" in profiles &&
      profiles.profiles.some((p) => p.scope === "recorded_manufacturer_device"),
  ).toBe(true);
  for (const device_model of [lifestyleProfile, "Unlisted laptop 2026"]) {
    const report = await deviceCompatibility({
      operation: "assess",
      product_ids: [products[0].id],
      device_model,
      budget_cents: 1000000,
      cable: "usb100",
      fast_charging: false,
    });
    expect("assessments" in report && report.assessments[0].eligible).toBe(
      false,
    );
    expect("assessments" in report && report.assessments[0].status).toBe(
      device_model === lifestyleProfile ? "not_applicable" : "unverified",
    );
  }
  const real = await deviceCompatibility({
    operation: "assess",
    product_ids: ["R002"],
    device_model: "MacBook Air (M1, 2020)",
    budget_cents: 100000,
    cable: "usb100",
    fast_charging: true,
  });
  expect("assessments" in real && real.assessments[0].eligible).toBe(false);
  expect(
    "assessments" in real && real.assessments[0].reasons.join(" "),
  ).toContain("fast charging");
});

it("recovers a saved requirement confirmation without applying it twice", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const brief = {
    message: "Recorded preferences",
    model: lifestyleProfile,
    category: "",
    budget: 90000,
    confirmConstraints: true,
    priority: "price" as const,
  };
  const prepared = await prepareConfirmation(
    fresh,
    "update_requirements",
    { brief, expectedVersion: 0 },
    "Save reviewed preferences",
  );
  await updateBrief(fresh, brief, 0, prepared.confirmation_id);
  await changeConcierge(fresh, (s) => {
    const confirmation = s.confirmations.find(
      (c) => c.id === prepared.confirmation_id,
    )!;
    confirmation.status = "executing";
    confirmation.executionLeaseUntil = 0;
  });
  await confirmOperation(fresh, prepared.confirmation_id);
  expect(
    (await getWorkspace(fresh.workspaceId)).briefs!.find(
      (b) => b.buyerId === fresh.userId,
    )!.version,
  ).toBe(1);
});

it("allows an explicitly reviewed replacement brief to clear obsolete optional requirements", async () => {
  const fresh = (await customerSession({ action: "guest" })).actor;
  const brief = {
    message: "New purchase",
    model: lifestyleProfile,
    category: "",
    budget: 90000,
    confirmConstraints: true,
  };
  await updateBrief(
    fresh,
    { ...brief, requirements: { material: "leather" } },
    0,
  );
  const result = await updateBrief(fresh, brief, 1);
  expect(result.version).toBe(2);
  expect(result.input.requirements).toBeUndefined();
});

it("binds manufacturer fit claims to current specifications while allowing independent offer changes", async () => {
  const db = await getDatabase();
  const original = (
    await db.query<{ record: Product }>(
      "SELECT record FROM catalog_products WHERE id=$1",
      ["R002"],
    )
  ).rows[0].record;
  const assess = () =>
    deviceCompatibility({
      operation: "assess",
      product_ids: ["R002"],
      device_model: "MacBook Air (M1, 2020)",
      budget_cents: 100000,
      cable: "usb100",
      fast_charging: false,
    });
  const initial = await assess();
  expect("assessments" in initial && initial.assessments[0].status).toBe(
    "supported",
  );
  try {
    await db.query("UPDATE catalog_products SET record=$2::jsonb WHERE id=$1", [
      "R002",
      JSON.stringify({
        ...original,
        specs: ["Unqualified replacement 5W adapter"],
        source: "https://example.invalid/new-adapter",
      }),
    ]);
    const changed = await assess();
    expect("assessments" in changed && changed.assessments[0].status).toBe(
      "unverified",
    );
    expect("assessments" in changed && changed.assessments[0].eligible).toBe(
      false,
    );
  } finally {
    await db.query("UPDATE catalog_products SET record=$2::jsonb WHERE id=$1", [
      "R002",
      JSON.stringify(original),
    ]);
  }
  const first = (await customerSession({ action: "guest" })).actor;
  const second = (await customerSession({ action: "guest" })).actor;
  const model = "MacBook Air (M1, 2020)";
  for (const shopper of [first, second])
    await updateBrief(shopper, {
      message: "Charging for my confirmed MacBook",
      model,
      category: "chargers",
      budget: 100000,
      realRequirements: { cable: "usb100", fastCharging: false },
      confirmConstraints: true,
    });
  const groupId = await joinGroup(first, "R002", model);
  await joinGroup(second, "R002", model);
  await manageBasket(first, {
    collection: "cart",
    action: "add",
    items: [{ productId: "R002" }],
  });
  await manageBasket(first, {
    collection: "cart",
    action: "select_group",
    items: [{ productId: "R002", groupId }],
  });
  const prepared = await prepareCheckout(first);
  const quotes = (await readConcierge(first)).confirmations.find(
    (c) => c.id === prepared.confirmation_id,
  )!.payload.quotes as { model: string; groupId: string }[];
  expect(quotes[0].model).toBe(model);
  expect(quotes[0].groupId).toBe(groupId);
});

it("bounds oversized native observations without losing IDs, prices or degraded-retrieval truth", () => {
  const records = Array.from({ length: 24 }, (_, i) => ({
    id: `product-${i}-${"x".repeat(120)}`,
    name: `Recorded item ${i}`,
    price_cents: 12345,
    formatted_price: "$123.45",
    stock: 2,
    source: "https://manufacturer.example/product",
    attributes: { longFact: "x".repeat(18000) },
  }));
  const encoded = observationText({
    ok: true,
    data: {
      products: records,
      total: 240,
      mode: "lexical",
      degradation: "Embedding service unavailable",
    },
  });
  const actual = JSON.parse(encoded);
  expect(encoded.length).toBeLessThan(7000);
  expect(actual.data.all_product_ids).toEqual(records.map((p) => p.id));
  expect(actual.data.products[0].formatted_price).toBe("$123.45");
  expect(actual.data.degradation).toBe("Embedding service unavailable");
  expect(
    JSON.parse(
      observationText({
        ok: false,
        data: { products: records },
        error: "Read failed",
      }),
    ).ok,
  ).toBe(false);
});

it("pages a named older result set without reinterpreting its original ordering", async () => {
  const old = randomUUID(),
    current = randomUUID();
  const ids = products.slice(0, 4).map((p) => p.id);
  await changeConcierge(actor, (s) => {
    s.resultSets = [
      { id: old, productIds: ids, constraints: searchConstraints.parse({}) },
      {
        id: current,
        productIds: [...ids].reverse(),
        constraints: searchConstraints.parse({}),
      },
    ];
  });
  const result = await executeTool(
    "get_current_ui_context",
    { result_set_id: old, offset: 1, limit: 2 },
    { actor, ui: context },
  );
  const data = result.data as {
    resultSets: { productIds: string[]; total: number }[];
  };
  expect(
    await resolveProductReferences({
      product_ids: data.resultSets[0].productIds,
    }),
  ).toEqual({ product_ids: ids.slice(1, 3) });
  expect(data.resultSets[0].total).toBe(ids.length);
  await expect(
    executeTool(
      "get_current_ui_context",
      { result_set_id: randomUUID() },
      { actor, ui: context },
    ),
  ).rejects.toThrow("no longer available");
});

it("reads only owned metadata keys and leaves prototype names unavailable", async () => {
  const result = await executeTool(
    "get_product_details",
    {
      product_ids: [products[0].id],
      attribute_keys: ["constructor", "toString"],
      include_specs: false,
    },
    { actor, ui: context },
  );
  const data = result.data as {
    products: {
      attributes: Record<string, unknown>;
      missing_attribute_keys: string[];
    }[];
  };
  expect(Object.keys(data.products[0].attributes)).toEqual([]);
  expect(data.products[0].missing_attribute_keys).toEqual([
    "constructor",
    "toString",
  ]);
});
it("classifies recorded movements without guessing a missing winding type from model names", () => {
  expect(classifyMovement("", ["Swiss made", "Water resistant"])).toBe(
    "unknown",
  );
  expect(
    classifyMovement("Unspecified calibre", [
      "Automatic appears in unrelated marketing",
    ]),
  ).toBe("unknown");
  expect(classifyMovement("Self-winding")).toBe("automatic");
  expect(classifyMovement("Mechanical")).toBe("mechanical");
  expect(classifyMovement("Quartz")).toBe("quartz");
  expect(classifyMovement("Smartwatch")).toBe("smartwatch");
});
it("uses the shared watch classification as an exact constraint before hybrid ranking", async () => {
  const result = await hybridSearch({
    categories: ["watches"],
    attributes: { movement_class: "quartz" },
    sort: "brand_asc",
    limit: 24,
  });
  expect(result.total).toBeGreaterThan(0);
  for (const p of result.products)
    expect(
      `${p.attributes?.movement || ""} ${p.specs.filter((s) => /^(movement|calib(?:er|re))\s*:/i.test(s)).join(" ")}`,
    ).toMatch(/quartz/i);
  expect(result.products.map((p) => p.brand || "")).toEqual(
    result.products
      .map((p) => p.brand || "")
      .sort((a, b) => a.localeCompare(b)),
  );
});
