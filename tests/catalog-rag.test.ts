import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
vi.mock("../src/server/concierge/model", () => ({ modelTurn: vi.fn() }));
import { modelTurn } from "../src/server/concierge/model";
import {
  catalogReply,
  catalogTools,
  readCatalog,
} from "../src/server/concierge/catalog-rag";
import { getDatabase, closeDatabase } from "../src/server/database";
import type { NativeMessage } from "../src/domain/concierge";
const call = (name: string, args: unknown): NativeMessage => ({
  role: "assistant",
  content: null,
  extra_content: { google: { thought_signature: "test-native-signature" } },
  tool_calls: [
    {
      id: "catalog-read",
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    },
  ],
});
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  const db = await getDatabase();
  const base = {
    description: "Oud and incense fragrance",
    compatibleModels: [],
    specs: ["Oud", "Incense"],
    sponsored: false,
    stock: 4,
    color: "black",
    source: "https://example.com/test-product",
    attributes: { notes: "oud incense" },
    brand: "Louis Vuitton",
    category: "fragrance",
    price: 100,
  };
  for (const [id, name, publication] of [
    [
      "rag-lv-imagination",
      "Louis Vuitton Imagination Eau de Parfum",
      "published",
    ],
    ["rag-lv-ombre", "Louis Vuitton Ombre Nomade Eau de Parfum", "published"],
    ["rag-hidden", "Hidden test fragrance", "quarantined"],
  ]) {
    const p = { ...base, id, name };
    await db.query(
      "INSERT INTO catalog_products(id,category,price,record,publication,leaf_type,brand) VALUES($1,'fragrance',32500,$2::jsonb,$3,'fragrance','Louis Vuitton')",
      [id, JSON.stringify(p), publication],
    );
  }
}, 60000);
beforeEach(() => {
  vi.mocked(modelTurn).mockReset();
  process.env.CONCIERGE_PROVIDER = "self_hosted";
  process.env.CONCIERGE_INPUT_TOKEN_LIMIT = "1000000";
  process.env.CONCIERGE_REPLY_TOKENS = "2048";
  delete process.env.CONCIERGE_CONTEXT_BUDGET_TOKENS;
  delete process.env.CONCIERGE_EMBEDDING_MODEL;
});
afterAll(closeDatabase);
it("lets ordinary conversation pass through in one generation without catalog reads or prose rewriting", async () => {
  const reply = {
    role: "assistant" as const,
    content: "Hey! What's on your mind?",
  };
  vi.mocked(modelTurn).mockResolvedValue(reply);
  expect(await catalogReply([{ role: "user", content: "What's up?" }])).toBe(
    reply,
  );
  expect(modelTurn).toHaveBeenCalledTimes(1);
  expect(vi.mocked(modelTurn).mock.calls[0][1]).toEqual(catalogTools);
});
it("supplies actual matching catalog records to Gemini and preserves its native frames and final wording", async () => {
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(
      call("search_catalog", {
        query: "LV Imagination",
        match_mode: "identity",
        categories: ["fragrance"],
      }),
    )
    .mockResolvedValueOnce({
      role: "assistant",
      content:
        "Here's Imagination from our collection—what size did you have in mind?",
    });
  const reply = await catalogReply([
    { role: "user", content: "get me lv imagination perfume" },
  ]);
  expect(reply.content).toContain("what size did you have in mind?");
  const input = vi.mocked(modelTurn).mock.calls[1][0];
  expect(input[1].extra_content?.google.thought_signature).toBe(
    "test-native-signature",
  );
  expect(input[2].tool_call_id).toBe("catalog-read");
  const result = JSON.parse(input[2].content!);
  expect(result.ok).toBe(true);
  expect(
    result.data.products.some(
      (p: { id: string }) => p.id === "rag-lv-imagination",
    ),
  ).toBe(true);
  expect(
    result.data.products.every((p: { name: string }) =>
      /imagination/i.test(p.name),
    ),
  ).toBe(true);
  expect(
    result.data.products.find(
      (p: { id: string }) => p.id === "rag-lv-imagination",
    ).price_cents,
  ).toBe(32500);
});
it("does not retrieve hidden records or invent a missing product", async () => {
  const details = await readCatalog("get_catalog_products", {
    product_ids: ["rag-hidden", "no-such-id"],
  });
  expect(details).toEqual({
    products: [],
    missing_ids: ["rag-hidden", "no-such-id"],
  });
  const result = await readCatalog("search_catalog", {
    query: "DefinitelyNonexistentZXQ",
    match_mode: "identity",
  });
  expect(result).toMatchObject({ products: [], total: 0 });
});
it("supports descriptive retrieval with exact database price and category filters", async () => {
  const result = await readCatalog("search_catalog", {
    query: "oud incense",
    categories: ["fragrance"],
    brands: ["Louis Vuitton"],
    max_price: 32500,
  });
  expect(
    result.products.some((p: { id: string }) => p.id === "rag-lv-ombre"),
  ).toBe(true);
  expect(
    result.products.every(
      (p: { price_cents: number; category: string }) =>
        p.price_cents <= 32500 && p.category === "fragrance",
    ),
  ).toBe(true);
  const empty = await readCatalog("search_catalog", {
    query: "oud incense",
    brands: ["Louis Vuitton"],
    max_price: 100,
  });
  expect(empty.total).toBe(0);
});
it("exposes catalog knowledge functions only and returns tool argument failures as observations", async () => {
  expect(catalogTools.map((t) => t.name)).toEqual([
    "search_catalog",
    "get_catalog_products",
    "get_catalog_info",
  ]);
  vi.mocked(modelTurn)
    .mockResolvedValueOnce(call("manage_collection", { action: "clear" }))
    .mockResolvedValueOnce({
      role: "assistant",
      content: "I can help you explore the catalog.",
    });
  await catalogReply([{ role: "user", content: "Something else" }]);
  expect(JSON.parse(vi.mocked(modelTurn).mock.calls[1][0][2].content!)).toEqual(
    { ok: false, error: "Unknown catalog function." },
  );
});
it("bounds repeated read requests and offers a final free-text generation", async () => {
  vi.mocked(modelTurn).mockResolvedValue(
    call("get_catalog_products", { product_ids: ["rag-lv-imagination"] }),
  );
  await expect(
    catalogReply([{ role: "user", content: "Look this up" }]),
  ).rejects.toThrow("more catalog reads");
  expect(modelTurn).toHaveBeenCalledTimes(4);
  expect(vi.mocked(modelTurn).mock.calls.at(-1)![1]).toEqual([]);
});
it("does not generate a reply after cancellation", async () => {
  const abort = new AbortController();
  abort.abort();
  await expect(
    catalogReply([{ role: "user", content: "Hello" }], abort.signal),
  ).rejects.toBeDefined();
  expect(modelTurn).not.toHaveBeenCalled();
});
it("discovers the actual published category and attribute vocabulary", async () => {
  const result = await readCatalog("get_catalog_info", {});
  expect(
    result.collections.some(
      (c: { category: string; brand: string }) =>
        c.category === "fragrance" && c.brand === "Louis Vuitton",
    ),
  ).toBe(true);
  expect(
    result.attributes.find(
      (a: { category: string }) => a.category === "fragrance",
    )?.keys,
  ).toContain("notes");
});
