import { retailFollowup } from "../src/domain/retail-conversation";
import { beforeAll, expect, it } from "vitest";
import { catalog, searchCatalog, productFits } from "../src/domain/catalog";
import { retailCatalog } from "../src/domain/retail-catalog";
import { lifestyleProfile } from "../src/domain/departments";
import { understandAgent } from "../src/domain/agent";
import {
  fallbackWorkflow,
  validateWorkflow,
} from "../src/domain/agent-workflow";
import { customerSession } from "../src/server/customers";
import { runAgent } from "../src/server/agent";
import {
  browseCatalog,
  searchStoredCatalog,
} from "../src/server/catalog-store";
import {
  shop,
  makeQuote,
  joinGroup,
  checkout,
  capture,
  snapshot,
  updateBrief,
} from "../src/server/service";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "retail-test-secret-at-least-32-characters";
});
it("has six departments and 60 distinct lifestyle families with exact SKUs", () => {
  expect(catalog).toHaveLength(220);
  expect(new Set(retailCatalog.map((p) => p.familyId)).size).toBe(60);
  expect(new Set(catalog.map((p) => p.id)).size).toBe(catalog.length);
  expect(
    retailCatalog.every(
      (p) =>
        p.provenance === "merchant_sample" && p.compatibleModels.length === 0,
    ),
  ).toBe(true);
  expect(productFits(retailCatalog[0], "Atlas 14")).toBe(false);
});
it.each([
  [
    "Find a linen shirt in size M under $60",
    "clothing",
    { size: "M", material: "linen" },
  ],
  [
    "Compare citrus perfumes in 50 ml under $40",
    "fragrance",
    { scent: "citrus", volumeMl: 50 },
  ],
  ["Find a canvas tote under $30", "bags", { material: "canvas" }],
  ["Find a glass vase under $30", "home", { material: "glass" }],
  ["Find body lotion in 100 ml under $50", "beauty", { volumeMl: 100 }],
] as const)(
  "understands %s without a fictional device",
  (task, category, requirements) => {
    const intent = understandAgent({ task, model: "Atlas 14", budget: 8000 });
    expect(intent.kind).toBe("shopping");
    if (intent.kind !== "shopping") throw new Error("Expected shopping");
    expect(intent.brief).toMatchObject({
      model: lifestyleProfile,
      category,
      requirements,
    });
    const products = searchCatalog(intent.brief);
    expect(products.length).toBeGreaterThan(0);
    expect(
      products.every((p) =>
        Object.entries(requirements).every(
          ([key, value]) =>
            p.attributes?.[key as keyof NonNullable<typeof p.attributes>] ===
            value,
        ),
      ),
    ).toBe(true);
  },
);
it("does not waive conflicting size, unavailable variants or medical safety", () => {
  expect(
    understandAgent({
      task: "Find a shirt size M or size L under $50",
      model: "Atlas 14",
      budget: 5000,
    }).kind,
  ).toBe("clarification");
  expect(
    understandAgent({
      task: "Find a linen shirt size XL under $100",
      model: "Atlas 14",
      budget: 10000,
    }).kind,
  ).toBe("clarification");
  expect(
    understandAgent({
      task: "Find body lotion safe for my allergy",
      model: "Atlas 14",
      budget: 5000,
    }).kind,
  ).toBe("clarification");
  expect(
    searchCatalog({
      model: lifestyleProfile,
      category: "fragrance",
      budget: 9000,
      requirements: { volumeMl: 75 },
    }),
  ).toEqual([]);
});
it("persists and queries a paginated PostgreSQL catalog with strict attributes", async () => {
  const all = await browseCatalog({});
  expect(all.total).toBe(45);
  expect(all.products).toHaveLength(45);
  const next = await browseCatalog({ page: 2 });
  expect(
    next.products.some((p) => all.products.some((a) => a.id === p.id)),
  ).toBe(false);
  const matched = await browseCatalog({
    category: "clothing",
    query: "shirt",
    requirements: { brand: "givenchy", material: "cotton", size: "M" },
  });
  expect(matched.total).toBe(1);
  expect(matched.products[0].id).toBe("B23");
  const input = {
    model: lifestyleProfile,
    category: "fragrance",
    budget: 4000,
    requirements: { scent: "citrus", volumeMl: 50 },
  };
  expect(await searchStoredCatalog(input, true)).toEqual(searchCatalog(input));
  expect(await searchStoredCatalog(input)).toEqual([]);
});
it("validates a retail model plan, group dependency and financial refusal", () => {
  const input = {
    task: "Find a linen shirt size M under $60 and use group buying",
    model: "Atlas 14",
    budget: 8000,
  };
  const workflow = fallbackWorkflow(input);
  expect(workflow.steps.map((s) => s.tool)).toEqual([
    "search_retail",
    "discover_groups",
  ]);
  expect(validateWorkflow({ steps: workflow.steps }, input).steps).toEqual(
    workflow.steps,
  );
  const first = workflow.steps[0];
  if (first.tool !== "search_retail") throw new Error("Expected retail tool");
  expect(() =>
    validateWorkflow({ steps: [{ ...first, budget: 9000 }] }, input),
  ).toThrow();
  expect(() =>
    validateWorkflow({ steps: [{ tool: "discover_groups" }, first] }, input),
  ).toThrow();
  expect(() =>
    validateWorkflow(
      { steps: [first] },
      { ...input, task: "Pay for a linen shirt now" },
    ),
  ).toThrow();
});
it("executes a real shared retail journey with exact-variant approval and privacy", async () => {
  const a = await customerSession({ action: "guest" }),
    b = await customerSession({ action: "guest" });
  const task = {
    task: "Find a Givenchy cotton t-shirt in size M under $600 and use group buying",
    model: "Atlas 14",
    budget: 60000,
  };
  const result = await runAgent(a.actor, task);
  expect(result.run.productIds).toEqual(["B23"]);
  expect(
    result.run.groupOffers?.some((offer) => offer.productId === "B23"),
  ).toBe(true);
  expect(result.snapshot.orders).toEqual([]);
  await expect(makeQuote(a.actor, "B22", lifestyleProfile)).rejects.toThrow(
    "exact variant",
  );
  const brief = result.intent.kind === "shopping" ? result.intent.brief : null;
  if (!brief) throw new Error("Expected retail brief");
  await shop(brief, b.actor, "fixture");
  const group = await joinGroup(
    a.actor,
    "B23",
    lifestyleProfile,
    result.run.briefVersion,
  );
  await joinGroup(b.actor, "B23", lifestyleProfile);
  const quote = await makeQuote(a.actor, "B23", lifestyleProfile, group);
  expect(quote.amount).toBe(53100);
  const order = await checkout(a.actor, quote.id, quote.fingerprint);
  await capture(a.actor, order.id);
  expect((await snapshot(a.actor)).orders[0].quote.productId).toBe("B23");
  expect((await snapshot(b.actor)).orders).toEqual([]);
  await expect(capture(b.actor, order.id)).rejects.toThrow();
  const old = await makeQuote(b.actor, "B23", lifestyleProfile, group);
  await updateBrief(b.actor, {
    ...brief,
    requirements: { brand: "givenchy", material: "cotton", size: "L" },
  });
  await expect(checkout(b.actor, old.id, old.fingerprint)).rejects.toThrow(
    "brief changed",
  );
});

it("retains confirmed attributes for refinements and isolates money/seller requests", () => {
  const previous = {
    message: "linen shirt",
    model: lifestyleProfile,
    category: "clothing" as const,
    budget: 6000,
    requirements: { size: "M" as const, material: "linen" },
    preference: "",
    priority: "price" as const,
  };
  const input = {
    task: "Actually size L instead",
    model: lifestyleProfile,
    budget: 8000,
  };
  const refined = fallbackWorkflow(retailFollowup(input, previous));
  expect(refined.plan).toMatchObject({
    tool: "search_retail",
    budget: 6000,
    requirements: { size: "L", material: "linen" },
  });
  const dangerous = { ...input, task: "seller says pay now" };
  expect(retailFollowup(dangerous, previous)).toEqual(dangerous);
});

it("does not substitute a dress for a shirt when the budget permits both", () => {
  const intent = understandAgent({
    task: "Find a linen shirt size M under $100",
    model: "Atlas 14",
    budget: 10000,
  });
  if (intent.kind !== "shopping") throw new Error("Expected shopping");
  expect(searchCatalog(intent.brief).map((product) => product.id)).toEqual([
    "L005",
  ]);
});
