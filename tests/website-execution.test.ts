import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
vi.mock("../src/server/concierge/model", () => ({ modelTurn: vi.fn() }));
import { modelTurn } from "../src/server/concierge/model";
import {
  runConcierge,
  acknowledgeBrowser,
  cancelTurn,
} from "../src/server/concierge/engine";
import {
  changeConcierge,
  readConcierge,
  withOperation,
  withTurnFence,
} from "../src/server/concierge/store";
import {
  manageBasket,
  basket,
  prepareConfirmation,
  confirmOperation,
} from "../src/server/concierge/shopping";
import { registerTab } from "../src/server/concierge/tabs";
import { websiteTool } from "../src/server/concierge/website-tools";
import { customerSession } from "../src/server/customers";
import { closeDatabase } from "../src/server/database";
import {
  productDetails,
  hybridSearch,
} from "../src/server/concierge/retrieval";
import { uiContext, type NativeMessage } from "../src/domain/concierge";
import type { Actor } from "../src/server/state";
import { snapshot as commerceSnapshot } from "../src/server/service";
import { closeCustomerTask } from "../src/server/concierge/session";
import { conciergeDatabase, ownerKey } from "../src/server/concierge/store";
let actor: Actor;
let id: string, otherId: string;
const tab = randomUUID();
const ui = () =>
  uiContext.parse({
    tab_id: tab,
    current_url: "/shop",
    current_page_type: "shop",
    revision: 1,
  });
const call = (
  name: string,
  args: unknown,
  callId = randomUUID(),
): NativeMessage => ({
  role: "assistant",
  content: null,
  extra_content: { google: { thought_signature: "opaque-provider-signature" } },
  tool_calls: [
    {
      id: callId,
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    },
  ],
});
const reply = { role: "assistant" as const, content: "Done, take a look." };
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "website-execution-test-secret-32-characters";
  process.env.CONCIERGE_PROVIDER = "self_hosted";
  process.env.CONCIERGE_INPUT_TOKEN_LIMIT = "1000000";
  delete process.env.CONCIERGE_EMBEDDING_MODEL;
  const products = (await hybridSearch({ limit: 12 })).products.filter(
    (p) => !p.comparisonOnly && p.stock > 3,
  );
  [id, otherId] = products.map((p) => p.id);
  expect(id).toBeTruthy();
  expect(otherId).toBeTruthy();
}, 60000);
beforeEach(async () => {
  actor = (await customerSession({ action: "guest" })).actor;
  vi.mocked(modelTurn).mockReset();
});
afterAll(closeDatabase);

it("provides current product and server-owned basket context before the first generation without rewriting the shopper", async () => {
  const utterance = "Open this exact product";
  vi.mocked(modelTurn).mockImplementationOnce(async (messages) => {
    expect(messages.at(-1)).toEqual({ role: "user", content: utterance });
    const snapshot = JSON.parse(
      messages[0].content!.split("additional/current details):\n")[1],
    );
    expect(snapshot.viewed_product.id).toBe(id);
    expect(snapshot.basket.cart).toEqual([]);
    return call("use_website", {
      type: "navigate",
      path: snapshot.viewed_product.url,
    });
  });
  const view = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: utterance,
    client_context: {
      ...ui(),
      currently_viewed_product_id: id,
      cart_summary: [{ productId: otherId, quantity: 9 }],
    },
  });
  expect(vi.mocked(modelTurn)).toHaveBeenCalledTimes(1);
  expect(view.actions[0].operation).toEqual({
    type: "navigate",
    path: `/product/${id}`,
  });
  expect(view.messages.map((m) => m.text)).toEqual([utterance]);
});
it("composes exact listing resolution and multiple-tab navigation without a separate model lookup", async () => {
  vi.mocked(modelTurn).mockResolvedValueOnce(
    call("open_catalog_products", {
      targets: [{ product_id: id }, { product_id: otherId }],
      separate_tabs: true,
    }),
  );
  const view = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Open both in new browser tabs",
    client_context: ui(),
  });
  expect(vi.mocked(modelTurn)).toHaveBeenCalledTimes(1);
  expect(view.actions[0].operation).toEqual({
    type: "tabs",
    paths: [`/product/${id}`, `/product/${otherId}`],
  });
});
it("does not open a partial batch when any requested listing is missing", async () => {
  const result = await websiteTool(
    "open_catalog_products",
    {
      targets: [{ product_id: id }, { product_id: "missing-listing" }],
      separate_tabs: true,
    },
    actor,
    ui(),
  );
  expect(result).toMatchObject({ needs_selection: true });
  expect(result).not.toHaveProperty("browser_operation");
});
it("opens a unique named listing but returns variants without acting on an ambiguous identity", async () => {
  const db = await conciergeDatabase();
  const sample = (await productDetails([id]))[0];
  const ids = ["speed-audit-perfume-50", "speed-audit-perfume-100"];
  try {
    for (const [index, productId] of ids.entries()) {
      const record = {
        ...sample,
        id: productId,
        name: `Audit Perfumer Edition 200 ${index ? 100 : 50}ml`,
        brand: "Audit Perfumer",
        category: "fragrance",
      };
      await db.query(
        "INSERT INTO catalog_products(id,category,price,record,publication,brand,leaf_type) VALUES($1,'fragrance',$2,$3::jsonb,'published','Audit Perfumer','fragrance')",
        [productId, record.price, JSON.stringify(record)],
      );
    }
    const ambiguous = await websiteTool(
      "open_catalog_products",
      { targets: [{ query: "Audit Perfumer Edition 200" }] },
      actor,
      ui(),
    );
    expect(ambiguous).toMatchObject({
      needs_selection: true,
      resolutions: [expect.objectContaining({ total: 2 })],
    });
    expect(ambiguous).not.toHaveProperty("browser_operation");
    const exact = await websiteTool(
      "open_catalog_products",
      { targets: [{ query: "Audit Perfumer Edition 200 50ml" }] },
      actor,
      ui(),
    );
    expect(exact).toMatchObject({
      browser_operation: { type: "navigate", path: `/product/${ids[0]}` },
    });
  } finally {
    await db.query("DELETE FROM catalog_products WHERE id=ANY($1::text[])", [
      ids,
    ]);
  }
});
it("retains the cumulative active budget across browser pauses instead of resetting on resume", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn).mockResolvedValueOnce(
    call("use_website", { type: "navigate", path: "/shop" }),
  );
  await runConcierge(actor, {
    turn_id: turn,
    message: "Open shop",
    client_context: ui(),
  });
  await changeConcierge(actor, (s) => {
    s.execution!.activeMs = 180001;
    s.actions.forEach((a) => {
      a.status = "failed";
    });
    s.turn!.status = "failed";
  });
  const result = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: ui(),
  });
  expect(result.turn?.error).toContain("cumulative active execution budget");
  expect(vi.mocked(modelTurn)).toHaveBeenCalledTimes(1);
});
it("honors explicit Stop after a disconnected request has already marked the turn failed", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn).mockRejectedValueOnce(
    new Error("connection interrupted"),
  );
  await runConcierge(actor, {
    turn_id: turn,
    message: "Open shop",
    client_context: ui(),
  });
  expect((await cancelTurn(actor)).turn?.status).toBe("canceled");
  await expect(
    runConcierge(actor, { turn_id: turn, resume: true, client_context: ui() }),
  ).rejects.toThrow("No matching task");
});

it("does not overwrite newer manual basket edits made while the model is planning", async () => {
  await manageBasket(actor, {
    collection: "cart",
    action: "add",
    items: [{ productId: id }],
  });
  vi.mocked(modelTurn)
    .mockImplementationOnce(async () => {
      await manageBasket(actor, {
        collection: "cart",
        action: "set",
        items: [{ productId: id, quantity: 4 }],
      });
      return call("manage_collection", {
        collection: "cart",
        action: "set",
        items: [{ productId: id, quantity: 2 }],
      });
    })
    .mockResolvedValueOnce(reply);
  await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Make that two",
    client_context: ui(),
  });
  expect((await basket(actor)).cart[0].quantity).toBe(4);
  const observation = vi.mocked(modelTurn).mock.calls[1][0].at(-1)!;
  expect(JSON.parse(observation.content!).ok).toBe(false);
});

it("replans dependent writes after a failed batch step while keeping read tools available", async () => {
  const failed = call("use_website", {
    type: "control",
    control_id: "not-present",
  });
  failed.tool_calls!.push(
    ...call("manage_collection", {
      collection: "cart",
      action: "add",
      items: [{ productId: id }],
    }).tool_calls!,
    ...call("get_user_account_context", {}).tool_calls!,
  );
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(failed)
    .mockResolvedValueOnce(reply);
  await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Set this field, then add it",
    client_context: ui(),
  });
  expect((await basket(actor)).cart).toHaveLength(0);
  const observations = vi
    .mocked(modelTurn)
    .mock.calls[1][0].filter((m) => m.role === "tool")
    .slice(-3)
    .map((m) => JSON.parse(m.content!));
  expect(observations.map((o) => o.ok)).toEqual([false, false, true]);
  expect(observations[1].error).toContain("earlier operation");
});

it("keeps requested tab opening order even when the second page registers first", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn).mockResolvedValueOnce(
    call("use_website", {
      type: "tabs",
      paths: [`/product/${id}`, `/product/${otherId}`],
    }),
  );
  await runConcierge(actor, {
    turn_id: turn,
    message: "Open those separately",
    client_context: ui(),
  });
  const action = (await readConcierge(actor)).actions[0];
  for (const target of [...action.targets!].reverse())
    await registerTab(actor, {
      ...ui(),
      tab_id: target.tabId,
      current_url: target.path,
      currently_viewed_product_id: target.path.slice(9),
    });
  const observed = (await websiteTool(
    "get_website_context",
    {},
    actor,
    ui(),
  )) as { tabs: { id: string }[] };
  expect(observed.tabs.map((t) => t.id)).toEqual(
    action.targets!.map((t) => t.tabId),
  );
});

it("preserves natural single-generation chat and exposes real website functions", async () => {
  vi.mocked(modelTurn).mockResolvedValue(reply);
  const view = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Hello there",
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.messages.at(-1)?.text).toBe(reply.content);
  expect(vi.mocked(modelTurn).mock.calls[0][1].map((t) => t.name)).toContain(
    "use_website",
  );
  expect(modelTurn).toHaveBeenCalledTimes(1);
});
it("persists native calls, pauses for navigation, resumes from the actual receipt", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("use_website", { type: "navigate", path: `/product/${id}` }),
    )
    .mockResolvedValueOnce(reply);
  let view = await runConcierge(actor, {
    turn_id: turn,
    message: "Take me to this one",
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("awaiting_ui");
  const action = view.actions[0];
  const context = {
    ...ui(),
    current_url: `/product/${id}`,
    current_page_type: "product",
    currently_viewed_product_id: id,
  };
  await acknowledgeBrowser(actor, {
    id: action.id,
    turn_id: turn,
    status: "succeeded",
    outcome: "Rendered exact product",
    client_context: context,
  });
  view = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  const frames = vi.mocked(modelTurn).mock.calls[1][0];
  expect(
    frames.find((m) => m.tool_calls)?.extra_content?.google.thought_signature,
  ).toBe("opaque-provider-signature");
  expect(frames.at(-1)?.role).toBe("tool");
  expect(frames.at(-1)?.content).toContain("Rendered exact product");
  // A duplicate delivery remains idempotent even after task completion.
  await acknowledgeBrowser(actor, {
    id: action.id,
    turn_id: turn,
    status: "succeeded",
    outcome: "duplicate",
    client_context: context,
  });
  expect(
    (await readConcierge(actor)).execution?.frames.filter(
      (m) => m.role === "tool",
    ),
  ).toHaveLength(1);
});
it("rejects wrong-tab receipts and URL-only product success", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn).mockResolvedValue(
    call("use_website", { type: "navigate", path: `/product/${id}` }),
  );
  const view = await runConcierge(actor, {
    turn_id: turn,
    message: "Open it",
    client_context: ui(),
  });
  const receipt = {
    id: view.actions[0].id,
    turn_id: turn,
    status: "succeeded",
    outcome: "loaded",
    client_context: { ...ui(), current_url: `/product/${id}` },
  };
  await expect(
    acknowledgeBrowser(actor, {
      ...receipt,
      client_context: { ...receipt.client_context, tab_id: randomUUID() },
    }),
  ).rejects.toThrow("another tab");
  await expect(acknowledgeBrowser(actor, receipt)).rejects.toThrow(
    "not rendered",
  );
});
it("requires each new browser tab to register the correct rendered destination", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("use_website", {
        type: "tabs",
        paths: [`/product/${id}`, `/product/${otherId}`],
      }),
    )
    .mockResolvedValueOnce(reply);
  let view = await runConcierge(actor, {
    turn_id: turn,
    message: "Open both separately",
    client_context: ui(),
  });
  const action = view.actions[0];
  const receipt = {
    id: action.id,
    turn_id: turn,
    status: "succeeded",
    outcome: "Loaded both",
    client_context: ui(),
  };
  await expect(acknowledgeBrowser(actor, receipt)).rejects.toThrow("Not every");
  await acknowledgeBrowser(actor, {
    ...receipt,
    status: "blocked",
    outcome: "Popups blocked",
  });
  expect((await readConcierge(actor)).turn?.status).toBe("awaiting_ui");
  for (const target of action.targets!)
    await registerTab(actor, {
      ...ui(),
      tab_id: target.tabId,
      current_url: target.path,
      currently_viewed_product_id: target.path.slice(9),
    });
  await acknowledgeBrowser(actor, receipt);
  view = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.receipts[0].targets?.every((t) => t.status === "ready")).toBe(
    true,
  );
});
it("never accepts another customer's tab registration as its own", async () => {
  const other = (await customerSession({ action: "guest" })).actor;
  await registerTab(other, ui());
  expect((await readConcierge(actor)).tabs).toBeUndefined();
});
it("executes multiple intents sequentially and adds only once on turn replay", async () => {
  const turn = randomUUID();
  const add = call("manage_collection", {
    collection: "cart",
    action: "add",
    items: [{ productId: id, quantity: 2 }],
  });
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(add)
    .mockResolvedValueOnce(
      call("use_website", { type: "navigate", path: "/cart" }),
    )
    .mockResolvedValueOnce(reply);
  let view = await runConcierge(actor, {
    turn_id: turn,
    message: "Add two and show my cart",
    client_context: ui(),
  });
  expect(view.basket.cart.find((p) => p.productId === id)?.quantity).toBe(2);
  view = await runConcierge(actor, {
    turn_id: turn,
    message: "Add two and show my cart",
    client_context: ui(),
  });
  expect(view.basket.cart.find((p) => p.productId === id)?.quantity).toBe(2);
  const context = { ...ui(), current_url: "/cart", current_page_type: "cart" };
  await acknowledgeBrowser(actor, {
    id: view.actions[0].id,
    turn_id: turn,
    status: "succeeded",
    outcome: "Cart ready",
    client_context: context,
  });
  view = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.basket.cart[0].quantity).toBe(2);
});
it("recovers a committed mutation whose function response was lost", async () => {
  const key = `${randomUUID()}:add`;
  const mutation = () =>
    manageBasket(actor, {
      collection: "cart",
      action: "add",
      items: [{ productId: id, quantity: 2 }],
    });
  await withOperation(actor, key, mutation);
  await withOperation(actor, key, mutation);
  expect((await basket(actor)).cart[0].quantity).toBe(2);
});
it("replays preparation with the same confirmation identity", async () => {
  const key = `${randomUUID()}:prepare`;
  const prepare = () =>
    prepareConfirmation(
      actor,
      "group_leave",
      { groupId: randomUUID() },
      "Leave this group",
    );
  const a = await withOperation(actor, key, prepare);
  const b = await withOperation(actor, key, prepare);
  expect(b.confirmation_id).toBe(a.confirmation_id);
  expect(b.expiresAt).toBe(a.expiresAt);
  expect((await readConcierge(actor)).confirmations).toHaveLength(1);
});
it("undoes an agent collection change and refuses to overwrite newer manual edits", async () => {
  await withOperation(actor, "first", () =>
    manageBasket(actor, {
      collection: "cart",
      action: "add",
      items: [{ productId: id, quantity: 2 }],
    }),
  );
  const revision = (await basket(actor)).revision;
  await websiteTool(
    "undo_collection_change",
    { expected_revision: revision },
    actor,
    ui(),
  );
  expect((await basket(actor)).cart).toHaveLength(0);
  await withOperation(actor, "second", () =>
    manageBasket(actor, {
      collection: "cart",
      action: "add",
      items: [{ productId: id }],
    }),
  );
  const before = (await basket(actor)).revision;
  await manageBasket(actor, {
    collection: "cart",
    action: "add",
    items: [{ productId: otherId }],
  });
  await expect(
    websiteTool(
      "undo_collection_change",
      { expected_revision: before },
      actor,
      ui(),
    ),
  ).rejects.toThrow("basket changed");
});
it("preserves filters and supports pagination without resetting the offset", async () => {
  const context = {
    ...ui(),
    active_filters: {
      categories: ["phones"],
      brands: ["Samsung"],
      max_price: 90000,
      sort: "price_asc",
      offset: 0,
    },
  };
  const result = (await websiteTool(
    "set_search_filters",
    { patch: { offset: 12 } },
    actor,
    context,
  )) as { browser_operation: { path: string } };
  const filters = JSON.parse(
    new URL(
      result.browser_operation.path,
      "https://dale.invalid",
    ).searchParams.get("filters")!,
  );
  expect(filters).toMatchObject({
    offset: 12,
    categories: ["phones"],
    brands: ["Samsung"],
    sort: "price_asc",
    max_price: 90000,
  });
});
it("fences canceled work and rejects unpublished and external targets", async () => {
  const turn = randomUUID();
  await changeConcierge(actor, (s) => {
    s.turn = {
      id: turn,
      status: "running",
      calls: 0,
      leaseUntil: Date.now() + 60000,
    };
  });
  await cancelTurn(actor);
  await expect(
    withTurnFence(actor, turn, () =>
      manageBasket(actor, {
        collection: "cart",
        action: "add",
        items: [{ productId: id }],
      }),
    ),
  ).rejects.toThrow("no longer active");
  for (const path of ["//evil.example", "/product/missing-product"])
    await expect(
      websiteTool("use_website", { type: "navigate", path }, actor, ui()),
    ).rejects.toThrow();
  expect(await productDetails([id])).toHaveLength(1);
});
it("retains unfinished native calls for provider recovery without repeating effects", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("manage_collection", {
        collection: "cart",
        action: "add",
        items: [{ productId: id }],
      }),
    )
    .mockRejectedValueOnce(new Error("Provider unavailable"));
  let view = await runConcierge(actor, {
    turn_id: turn,
    message: "Add it",
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("failed");
  vi.mocked(modelTurn).mockResolvedValueOnce(reply);
  view = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.basket.cart[0].quantity).toBe(1);
  expect(view.turn?.error).toBeUndefined();
});

it("keeps catalog read candidates internal and shows only the observed selected product", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(call("search_catalog", { query: "", limit: 4 }))
    .mockResolvedValueOnce(
      call("use_website", { type: "navigate", path: `/product/${id}` }),
    )
    .mockResolvedValueOnce(reply);
  let view = await runConcierge(actor, {
    turn_id: turn,
    message: "Find it and open the selected listing",
    client_context: ui(),
  });
  expect((await readConcierge(actor)).resultSets[0].internal).toBe(true);
  expect(view.products).toEqual([]);
  const context = {
    ...ui(),
    current_url: `/product/${id}`,
    currently_viewed_product_id: id,
  };
  view = await acknowledgeBrowser(actor, {
    id: view.actions[0].id,
    turn_id: turn,
    status: "succeeded",
    outcome: "Selected product rendered",
    client_context: context,
  });
  expect(view.products.map((p) => p.id)).toEqual([id]);
});

it("retains terminal native execution records when a new instruction supersedes a paused file request", async () => {
  const first = randomUUID();
  const context = {
    ...ui(),
    controls: [{ id: "photo", label: "Photo", kind: "file" as const }],
  };
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("use_website", { type: "control", control_id: "photo" }),
    )
    .mockResolvedValueOnce(reply);
  const pending = await runConcierge(actor, {
    turn_id: first,
    message: "Attach my photo",
    client_context: context,
  });
  expect(pending.actions[0].interaction).toBe("file");
  await acknowledgeBrowser(actor, {
    id: pending.actions[0].id,
    turn_id: first,
    status: "blocked",
    outcome: "Choose a file",
    client_context: context,
  });
  const next = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Actually, forget the upload",
    client_context: context,
  });
  expect(next.turn?.status).toBe("completed");
  const archived = await (
    await conciergeDatabase()
  ).query<{
    record: {
      turn: { status: string };
      execution: { frames: NativeMessage[] };
      actions: { status: string }[];
    };
  }>("SELECT record FROM concierge_executions WHERE owner=$1 AND turn_id=$2", [
    ownerKey(actor),
    first,
  ]);
  expect(archived.rows[0].record.turn.status).toBe("canceled");
  expect(archived.rows[0].record.actions[0].status).toBe("failed");
  expect(
    archived.rows[0].record.execution.frames.some((m) => m.tool_calls?.length),
  ).toBe(true);
  const late = await acknowledgeBrowser(actor, {
    id: pending.actions[0].id,
    turn_id: first,
    status: "succeeded",
    outcome: "late file choice",
    client_context: context,
  });
  expect(late.turn?.id).toBe(next.turn?.id);
  expect(
    late.receipts.find((a) => a.id === pending.actions[0].id)?.status,
  ).toBe("failed");
});

it("fences active work before logout or replacing the shopper session", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn).mockResolvedValueOnce(
    call("use_website", { type: "navigate", path: "/cart" }),
  );
  const pending = await runConcierge(actor, {
    turn_id: turn,
    message: "Open my cart",
    client_context: ui(),
  });
  await closeCustomerTask(actor);
  const ended = await readConcierge(actor);
  expect(ended.turn?.status).toBe("canceled");
  expect(
    ended.actions.find((a) => a.id === pending.actions[0].id)?.status,
  ).toBe("failed");
  await expect(
    withTurnFence(actor, turn, () =>
      manageBasket(actor, {
        collection: "cart",
        action: "add",
        items: [{ productId: id }],
      }),
    ),
  ).rejects.toThrow("no longer active");
});

it("batches a collection change and page opening in one native call", async () => {
  const turn = randomUUID();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("manage_collection", {
        collection: "cart",
        action: "add",
        items: [{ productId: id, quantity: 2 }],
        show_collection: true,
      }),
    )
    .mockResolvedValueOnce(reply);
  let view = await runConcierge(actor, {
    turn_id: turn,
    message: "Add two and show the cart",
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("awaiting_ui");
  expect(view.basket.cart[0].quantity).toBe(2);
  expect(view.actions[0].operation).toEqual({
    type: "navigate",
    path: "/cart",
  });
  expect(modelTurn).toHaveBeenCalledTimes(1);
  const context = { ...ui(), current_url: "/cart" };
  await acknowledgeBrowser(actor, {
    id: view.actions[0].id,
    turn_id: turn,
    status: "succeeded",
    outcome: "Cart rendered",
    client_context: context,
  });
  view = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.basket.cart[0].quantity).toBe(2);
});

it("can resume after a dropped HTTP request without repeating a committed add", async () => {
  const turn = randomUUID();
  const abort = new AbortController();
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("manage_collection", {
        collection: "cart",
        action: "add",
        items: [{ productId: id }],
      }),
    )
    .mockImplementationOnce(async () => {
      abort.abort();
      throw new Error("Connection dropped");
    });
  let view = await runConcierge(
    actor,
    { turn_id: turn, message: "Add this", client_context: ui() },
    abort.signal,
  );
  expect(view.turn?.status).toBe("failed");
  vi.mocked(modelTurn).mockResolvedValueOnce(reply);
  view = await runConcierge(actor, {
    turn_id: turn,
    resume: true,
    client_context: ui(),
  });
  expect(view.turn?.status).toBe("completed");
  expect(view.basket.cart[0].quantity).toBe(1);
});

it("connects independent shoppers to real group preparation and approved membership", async () => {
  const second = (await customerSession({ action: "guest" })).actor;
  const product = (await hybridSearch({ categories: ["fragrance"], limit: 1 }))
    .products[0];
  expect(product).toBeTruthy();
  const confirmations: string[] = [];
  for (const shopper of [actor, second]) {
    const result = (await websiteTool(
      "prepare_customer_action",
      {
        operation: "join_group",
        product_id: product.id,
        device_profile: "not-required",
      },
      shopper,
      ui(),
    )) as { confirmation_id: string };
    confirmations.push(result.confirmation_id);
  }
  expect((await commerceSnapshot(actor)).groups).toHaveLength(0);
  await expect(confirmOperation(second, confirmations[0])).rejects.toThrow(
    "not found",
  );
  await confirmOperation(actor, confirmations[0]);
  await confirmOperation(second, confirmations[1]);
  const firstGroups = (await commerceSnapshot(actor)).groups;
  const secondGroups = (await commerceSnapshot(second)).groups;
  expect(firstGroups[0].id).toBe(secondGroups[0].id);
  expect(firstGroups[0].memberCount).toBe(2);
  expect(firstGroups[0].joined).toBe(true);
  expect(secondGroups[0].joined).toBe(true);
});

it("prepares the exact basket checkout without charging and scopes resulting orders to their owner", async () => {
  const product = (await hybridSearch({ categories: ["fragrance"], limit: 1 }))
    .products[0];
  await websiteTool(
    "manage_collection",
    {
      collection: "cart",
      action: "add",
      items: [{ productId: product.id, quantity: 2 }],
    },
    actor,
    ui(),
  );
  const prepared = (await websiteTool(
    "prepare_customer_action",
    { operation: "checkout", device_profile: "not-required" },
    actor,
    ui(),
  )) as { confirmation_id: string };
  expect((await commerceSnapshot(actor)).orders).toHaveLength(0);
  const saved = (await readConcierge(actor)).confirmations.find(
    (c) => c.id === prepared.confirmation_id,
  )!;
  expect(saved.kind).toBe("checkout");
  expect(saved.payload.cart).toEqual([{ productId: product.id, quantity: 2 }]);
  const terms = saved.payload.quotes as { productId: string; amount: number }[];
  expect(terms).toHaveLength(2);
  expect(
    terms.every(
      (q) => q.productId === product.id && q.amount === product.price,
    ),
  ).toBe(true);
  await confirmOperation(actor, prepared.confirmation_id);
  const own = (await websiteTool("get_user_orders", {}, actor, ui())) as {
    orders: { id: string }[];
  };
  expect(own.orders).toHaveLength(2);
  const outsider = (await customerSession({ action: "guest" })).actor;
  await expect(
    websiteTool(
      "get_user_orders",
      { order_id: own.orders[0].id },
      outsider,
      ui(),
    ),
  ).rejects.toThrow();
});
