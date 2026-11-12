import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
vi.mock("../src/server/concierge/model", () => ({ modelTurn: vi.fn() }));
import { modelTurn } from "../src/server/concierge/model";
import { customerSession } from "../src/server/customers";
import { closeDatabase, getDatabase } from "../src/server/database";
import { getStoredProduct } from "../src/server/catalog-store";
import { getWorkspace, mutateWorkspace } from "../src/server/state";
import {
  prepareShoppingDecision,
  shoppingDecision,
} from "../src/server/concierge/decisions";
import { basket } from "../src/server/concierge/shopping";
import { readConcierge, withOperation } from "../src/server/concierge/store";
import {
  makeQuote,
  checkout,
  capture,
  snapshot,
  updateBrief,
} from "../src/server/service";
import { runConcierge } from "../src/server/concierge/engine";
import { uiContext, type NativeMessage } from "../src/domain/concierge";
import { quoteFingerprint } from "../src/domain/guard";
import { defaultGroupPolicy } from "../src/domain/group-policy";
import type { Product } from "../src/domain/catalog";
let product: Product;
const guest = async () => (await customerSession({ action: "guest" })).actor;
const request = (extra: Record<string, unknown> = {}) => ({
  purpose: "Find the exact recorded fragrance within my budget",
  constraints: {
    query: product.name,
    categories: [product.category],
    max_price: product.price,
    brands: product.brand ? [product.brand] : [],
  },
  expected_version: 0,
  ...extra,
});
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.CONCIERGE_PROVIDER = "self_hosted";
  process.env.CONCIERGE_MODEL = "contract-test";
  process.env.CONCIERGE_INPUT_TOKEN_LIMIT = "65536";
  process.env.SESSION_SECRET =
    "m2-decision-contract-secret-at-least-32-characters";
  delete process.env.CONCIERGE_EMBEDDING_BASE_URL;
  await getDatabase();
  product = await getStoredProduct("B010");
}, 60000);
afterAll(async () => {
  await closeDatabase();
  vi.restoreAllMocks();
});
it("retrieves eligible exact products, saves evidence and requirement versions without shopping mutations", async () => {
  const actor = await guest();
  const decision = (await prepareShoppingDecision(actor, request()))!;
  expect(decision.outcome).toBe("matches");
  const offer = decision.offers.find((o) => o.product.id === product.id)!;
  expect(offer).toBeDefined();
  expect(offer.soloAmount).toBe(product.price);
  expect(offer.product.source).toBe(product.source);
  expect(offer.group).toBeNull();
  expect(offer.unknowns.length).toBeGreaterThan(0);
  expect((await shoppingDecision(actor, decision.id))?.id).toBe(decision.id);
  expect((await basket(actor)).cart).toEqual([]);
  const state = await snapshot(actor);
  expect(state.orders).toEqual([]);
  expect(state.groups.some((g) => g.joined)).toBe(false);
});
it("only exposes above-budget group amounts on opt-in and uses approved same-offer arithmetic", async () => {
  const budget = Math.floor(product.price * 0.95);
  const input = request({
    constraints: { query: product.name, max_price: budget },
  });
  const solo = (await prepareShoppingDecision(await guest(), input))!;
  expect(solo.offers.some((o) => o.product.id === product.id)).toBe(false);
  const actor = await guest();
  const group = (await prepareShoppingDecision(actor, {
    ...input,
    group_savings: true,
  }))!;
  const offer = group.offers.find((o) => o.product.id === product.id)!;
  expect(offer.kind).toBe("conditional_group");
  expect(offer.soloAmount).toBeGreaterThan(budget);
  expect(offer.group?.amount).toBe(Math.round(product.price * 0.9));
  expect(offer.group!.amount).toBeLessThanOrEqual(budget);
  await expect(
    makeQuote(actor, product.id, "not-required", undefined, group.id),
  ).rejects.toThrow(/ready group/);
  expect((await snapshot(actor)).orders).toEqual([]);
});
it("does not invent missing compatibility, a budget, numeric facts or a cross-category match", async () => {
  const unknown = (await prepareShoppingDecision(
    await guest(),
    request({
      unknown_requirements: [
        "Compatibility with my unrecorded device is unknown",
      ],
    }),
  ))!;
  expect(unknown.outcome).toBe("clarification");
  expect(unknown.offers).toEqual([]);
  const missingBudget = (await prepareShoppingDecision(
    await guest(),
    request({ constraints: { query: product.name, max_price: null } }),
  ))!;
  expect(missingBudget.questions.join(" ")).toMatch(/budget/);
  for (const constraints of [
    { query: product.name, max_price: 1 },
    {
      query: product.name,
      max_price: product.price,
      categories: ["wall-chargers"],
    },
    {
      query: product.name,
      max_price: product.price,
      attributes: { notRecorded: { min: 100 } },
    },
  ]) {
    const result = (await prepareShoppingDecision(
      await guest(),
      request({ constraints }),
    ))!;
    expect(result.outcome).toBe("no_match");
    expect(result.offers).toEqual([]);
  }
});
it("denies another customer decision lookup and quote binding, and invalidates old requirement approvals", async () => {
  const actor = await guest(),
    other = await guest();
  const first = (await prepareShoppingDecision(actor, request()))!;
  await expect(shoppingDecision(other, first.id)).rejects.toThrow(/not found/);
  await expect(
    makeQuote(other, product.id, "not-required", undefined, first.id),
  ).rejects.toThrow(/not found/);
  const quote = await makeQuote(
    actor,
    product.id,
    "not-required",
    undefined,
    first.id,
  );
  expect(quote.discovery?.decisionId).toBe(first.id);
  expect((await shoppingDecision(actor, first.id))?.quoteIds).toContain(
    quote.id,
  );
  expect(
    quoteFingerprint({
      ...quote,
      discovery: { ...quote.discovery!, version: 99 },
    }),
  ).not.toBe(quote.fingerprint);
  await prepareShoppingDecision(
    actor,
    request({
      expected_version: 1,
      purpose: "Changed requirements: a different use",
    }),
  );
  expect((await shoppingDecision(actor, first.id))?.status).toBe("stale");
  await expect(checkout(actor, quote.id, quote.fingerprint)).rejects.toThrow(
    /requirements changed/,
  );
  expect((await snapshot(actor)).orders).toEqual([]);
});
it("revalidates offer price and variant at checkout, not just when rendering a card", async () => {
  const actor = await guest();
  const decision = (await prepareShoppingDecision(actor, request()))!;
  const quote = await makeQuote(
    actor,
    product.id,
    "not-required",
    undefined,
    decision.id,
  );
  const db = await getDatabase();
  for (const change of ["price", "variant"] as const) {
    try {
      if (change === "price")
        await db.query(
          "UPDATE catalog_products SET price=price+1 WHERE id=$1",
          [product.id],
        );
      else
        await db.query(
          "UPDATE catalog_products SET record=jsonb_set(record,'{skuVariant}','\"changed exact variant\"'::jsonb) WHERE id=$1",
          [product.id],
        );
      expect((await shoppingDecision(actor, decision.id))?.status).toBe(
        "stale",
      );
      await expect(
        checkout(actor, quote.id, quote.fingerprint),
      ).rejects.toThrow(/changed/);
    } finally {
      await db.query(
        "UPDATE catalog_products SET price=$2,record=$3 WHERE id=$1",
        [product.id, product.price, JSON.stringify(product)],
      );
    }
  }
});
it("rejects a decision after approved group policy or legacy purchase requirements change", async () => {
  const actor = await guest();
  const decision = (await prepareShoppingDecision(
    actor,
    request({ group_savings: true }),
  ))!;
  await mutateWorkspace(actor.workspaceId, (state) => {
    state.groupPolicy = { ...defaultGroupPolicy, version: 2 };
  });
  expect(
    (await shoppingDecision(actor, decision.id))?.staleReasons.join(" "),
  ).toMatch(/group terms changed/);
  const fresh = (await prepareShoppingDecision(
    actor,
    request({ expected_version: 1 }),
  ))!;
  await updateBrief(actor, {
    model: "not-required",
    category: "fragrance",
    budget: product.price,
    message: "A new manual purchase brief",
    preference: "",
    priority: "price",
  });
  expect((await shoppingDecision(actor, fresh.id))?.status).toBe("stale");
});
it("replays the same tool operation as one saved decision", async () => {
  const actor = await guest();
  const first = await withOperation(actor, "one-native-call", () =>
    prepareShoppingDecision(actor, request()),
  );
  const again = await withOperation(actor, "one-native-call", () =>
    prepareShoppingDecision(actor, request()),
  );
  expect(again?.id).toBe(first?.id);
  expect(
    (await getWorkspace(actor.workspaceId)).shoppingDecisions?.filter(
      (d) => d.buyerId === actor.userId,
    ),
  ).toHaveLength(1);
});
const tool = (name: string, args: unknown): NativeMessage => ({
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
const context = uiContext.parse({
  current_url: "/search",
  current_page_type: "search",
});
it("runs the registered decision function through the native tool loop, then preserves the request on outage", async () => {
  const actor = await guest();
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(
      tool(
        "prepare_shopping_decision",
        request({ budget_quote: `${product.price} cents` }),
      ),
    )
    .mockResolvedValueOnce({
      role: "assistant",
      content:
        "The saved decision uses recorded facts and a current sandbox offer.",
    });
  const success = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: `Find this exact fragrance within my budget of ${product.price} cents`,
    client_context: context,
  });
  expect(success.turn?.status).toBe("completed");
  expect(
    success.decision?.offers.some((o) => o.product.id === product.id),
  ).toBe(true);
  expect(success.messages.at(-1)?.text).toContain("recorded facts");
  const quote = await makeQuote(
    actor,
    product.id,
    "not-required",
    undefined,
    success.decision!.id,
  );
  vi.mocked(modelTurn).mockRejectedValue(
    new Error("Controlled provider outage"),
  );
  const failed = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: "Change my budget to one dollar",
    client_context: context,
  });
  expect(failed.turn?.status).toBe("failed");
  expect(
    (await readConcierge(actor)).transcript.some(
      (m) => m.text === "Change my budget to one dollar",
    ),
  ).toBe(true);
  expect(failed.decision?.status).toBe("stale");
  await expect(checkout(actor, quote.id, quote.fingerprint)).rejects.toThrow(
    /newer request/,
  );
  expect((await basket(actor)).cart).toEqual([]);
  expect((await snapshot(actor)).orders).toEqual([]);
});
it("allows a current decision-bound quote through the existing fixture checkout/capture path", async () => {
  const actor = await guest();
  const decision = (await prepareShoppingDecision(actor, request()))!;
  const quote = await makeQuote(
    actor,
    product.id,
    "not-required",
    undefined,
    decision.id,
  );
  const order = await checkout(actor, quote.id, quote.fingerprint);
  await capture(actor, order.id);
  expect((await snapshot(actor)).orders[0].captureId).toBeTruthy();
});
it("locks the interpreted budget within a user request and permits an explicit later customer correction", async () => {
  const actor = await guest();
  const originalBudget = product.price - 1;
  const initial = request({
    constraints: { query: product.name, max_price: originalBudget },
    budget_quote: `${originalBudget} cents`,
  });
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(tool("prepare_shopping_decision", initial))
    .mockResolvedValueOnce(
      tool("prepare_shopping_decision", {
        ...initial,
        expected_version: 1,
        budget_quote: `${product.price + 1} cents`,
        constraints: { query: product.name, max_price: product.price + 1 },
      }),
    )
    .mockResolvedValueOnce({
      role: "assistant",
      content: "No exact offer fits your unchanged budget.",
    });
  const first = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: `Keep my maximum budget at ${originalBudget} cents. The product price is ${product.price + 1} cents.`,
    client_context: context,
  });
  expect(first.decision?.brief.constraints.max_price).toBe(originalBudget);
  expect(first.decision?.outcome).toBe("no_match");
  expect(
    (await readConcierge(actor)).execution?.frames.some(
      (frame) =>
        frame.role === "tool" && frame.content?.includes("budget is locked"),
    ),
  ).toBe(true);
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(
      tool("prepare_shopping_decision", {
        ...initial,
        expected_version: 1,
        constraints: { query: product.name, max_price: product.price + 1 },
        budget_quote: `${product.price + 1} cents`,
      }),
    )
    .mockResolvedValueOnce({
      role: "assistant",
      content: "Updated to your new budget.",
    });
  const changed = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: `I now explicitly increase my budget to ${product.price + 1} cents.`,
    client_context: context,
  });
  expect(changed.decision?.brief.constraints.max_price).toBe(product.price + 1);
  expect(changed.decision?.version).toBe(2);
  expect(
    changed.decision?.offers.some((offer) => offer.product.id === product.id),
  ).toBe(true);
});
it("rejects a model-invented budget that has no matching customer source span", async () => {
  const actor = await guest();
  const bad = request({
    constraints: { query: product.name, max_price: product.price + 50000 },
    budget_quote: "9999 USD",
  });
  vi.mocked(modelTurn)
    .mockReset()
    .mockResolvedValueOnce(tool("prepare_shopping_decision", bad))
    .mockResolvedValueOnce({
      role: "assistant",
      content: "I need your exact budget before selecting a product.",
    });
  const result = await runConcierge(actor, {
    turn_id: randomUUID(),
    message: `My budget is ${product.price} cents.`,
    client_context: context,
  });
  expect(result.decision).toBeNull();
  expect(
    (await readConcierge(actor)).execution?.frames.some(
      (frame) =>
        frame.role === "tool" &&
        frame.content?.includes("exact stated budget phrase"),
    ),
  ).toBe(true);
  expect((await snapshot(actor)).orders).toEqual([]);
});
