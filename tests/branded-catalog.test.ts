import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogEvidence } from "../src/components/catalog-evidence";
import { beforeAll, expect, it } from "vitest";
import { brandedCatalog } from "../src/domain/branded-catalog";
import {
  publicCatalog,
  productFits,
  productById,
  searchCatalog,
} from "../src/domain/catalog";
import { understandAgent } from "../src/domain/agent";
import { retailFollowup } from "../src/domain/retail-conversation";
import {
  fallbackWorkflow,
  validateWorkflow,
} from "../src/domain/agent-workflow";
import { customerSession } from "../src/server/customers";
import { makeQuote, joinGroup } from "../src/server/service";
import { browseCatalog } from "../src/server/catalog-store";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "branded-test-secret-at-least-32-characters";
});
it("keeps sourced identities separate from sandbox offers and legacy SKU histories", () => {
  expect(brandedCatalog).toHaveLength(36);
  expect(new Set(publicCatalog.map((p) => p.id)).size).toBe(35);
  expect(
    brandedCatalog.every(
      (p) =>
        p.source.startsWith("https://") &&
        p.evidence?.checkedAt &&
        p.offerKind === "sandbox",
    ),
  ).toBe(true);
  expect(productById("L005").name).toContain("Linen");
  expect(productById("B001").attributes?.ramGb).toBeUndefined();
  expect(productFits(productById("B001"), "Atlas 14")).toBe(false);
  expect(productFits(productById("B001"), "not-required")).toBe(true);
});
it.each([
  [
    "Compare phones with 12GB RAM and 256GB storage under $1000",
    ["B004", "B003", "B002"],
  ],
  ["Find MFK Baccarat Rouge 540 perfume in 70ml under $400", ["B010"]],
  ["Find Tom Ford Oud Wood perfume in 50ml under $350", ["B012"]],
  ["Find Givenchy cotton t-shirt size M under $600", ["B23"]],
  ["Find Lancôme serum in 100ml under $300", ["B019"]],
  ["Find Gucci leather key pouch under $700", ["B036"]],
] as const)("retains exact requirements for %s", (task, expected) => {
  const intent = understandAgent({ task, model: "Atlas 14", budget: 100000 });
  expect(intent.kind).toBe("shopping");
  if (intent.kind !== "shopping") throw new Error("Expected shopping");
  expect(searchCatalog(intent.brief, publicCatalog).map((p) => p.id)).toEqual(
    expected,
  );
  const workflow = fallbackWorkflow({
    task,
    model: "Atlas 14",
    budget: 100000,
  });
  expect(() =>
    validateWorkflow(
      { steps: workflow.steps },
      { task, model: "Atlas 14", budget: 100000 },
    ),
  ).not.toThrow();
});
it.each([
  "Find iPhone 16 under $1000",
  "Find Chanel Bleu de Chanel perfume under $200",
  "Find MFK Baccarat Rouge 540 extrait under $500",
  "Find iPhone 17 in pink under $1000",
  "Find OnePlus phone under 60000 rupees",
  "Find iPhone 17 Pro under $1500",
  "Find Galaxy S25 Plus phone under $1000",
  "Find Givenchy shirt size XL under $1000",
  "Find phones with 256GB under $1000",
  "Find Apple phone with at least 12GB RAM under $1000",
  "Find Chanel serum safe for my allergy",
  "Compare phones with 120Hz display under $1000",
])(
  "does not waive unknown models, ambiguous capacities or unverified requirements: %s",
  (task) => {
    expect(
      understandAgent({ task, model: "Atlas 14", budget: 100000 }).kind,
    ).toBe("clarification");
  },
);
it("queries real phones and manufacturer brands in persistent storage, excluding invented retail", async () => {
  const result = await browseCatalog({
    category: "phones",
    requirements: { ramGb: 12, storageGb: 256 },
  });
  expect(result.total).toBeGreaterThanOrEqual(3);
  expect(result.products.every((p) => p.brand && p.evidence)).toBe(true);
  expect(
    (
      await browseCatalog({
        category: "clothing",
        requirements: { material: "linen" },
      })
    ).total,
  ).toBe(0);
});
it("retains brand and volume when refining a sourced fragrance", () => {
  const previous = understandAgent({
    task: "Find MFK perfume in 70ml under $400",
    model: "Atlas 14",
    budget: 100000,
  });
  if (previous.kind !== "shopping") throw new Error("Expected shopping");
  const input = retailFollowup(
    { task: "Budget is $350 instead", model: "not-required", budget: 40000 },
    previous.brief,
  );
  expect(fallbackWorkflow(input).plan).toMatchObject({
    tool: "search_retail",
    budget: 35000,
    requirements: { brand: "maison francis kurkdjian", volumeMl: 70 },
  });
});
it("blocks checkout and group commitments for identity-only records", async () => {
  const { actor } = await customerSession({ action: "guest" });
  await expect(makeQuote(actor, "B028", "not-required")).rejects.toThrow(
    "comparison-only",
  );
  await expect(joinGroup(actor, "B028", "not-required")).rejects.toThrow(
    "comparison-only",
  );
});

it("renders manufacturer links and sandbox provenance for every public record, including legacy Apple bundles", () => {
  for (const product of publicCatalog) {
    const html = renderToStaticMarkup(
      createElement(CatalogEvidence, { product }),
    );
    expect(html).toContain('href="https://');
    expect(html).toContain("sandbox offer");
    expect(html).not.toContain("Engineering fixture");
  }
  expect(
    renderToStaticMarkup(
      createElement(CatalogEvidence, { product: productById("R003") }),
    ).match(/href=/g),
  ).toHaveLength(2);
});

it("honours the shopper's Armani and Maison Martin Margiela names without substituting another house", () => {
  const armani = understandAgent({
    task: "Find Armani cotton t-shirt size M under $1000",
    model: "Atlas 14",
    budget: 100000,
  });
  if (armani.kind !== "shopping") throw new Error("Expected shopping");
  expect(armani.brief.requirements?.brand).toBe("giorgio armani");
  expect(searchCatalog(armani.brief, publicCatalog)).toEqual([]);
  const margiela = understandAgent({
    task: "Find Maison Martin Margiela Jazz Club perfume in 100ml under $200",
    model: "Atlas 14",
    budget: 100000,
  });
  if (margiela.kind !== "shopping") throw new Error("Expected shopping");
  expect(margiela.brief.requirements?.brand).toBe("maison margiela");
  expect(searchCatalog(margiela.brief, publicCatalog).map((p) => p.id)).toEqual(
    ["B013"],
  );
});
