import { expect, it } from "vitest";
import { brandedShopping } from "../src/domain/branded-shopping";
import {
  fallbackWorkflow,
  validateWorkflow,
} from "../src/domain/agent-workflow";
import { productById, type Product } from "../src/domain/catalog";
const eyewear: Product = {
  ...productById("B010"),
  id: "isolated-eyewear",
  category: "sunglasses",
  brand: "Oakley",
  name: "Oakley Holbrook",
  attributes: {
    brand: "oakley",
    modelName: "holbrook",
    frameShape: "square",
    polarization: "polarized",
  },
};
it("recognizes imported brands/models without a bundled product ID whitelist", () => {
  expect(
    brandedShopping("Find Oakley Holbrook sunglasses under $250", 30000, [
      eyewear,
    ]),
  ).toMatchObject({
    kind: "shopping",
    brief: {
      category: "sunglasses",
      budget: 25000,
      requirements: { brand: "oakley", modelName: "holbrook" },
    },
  });
  const input = {
    task: "Find Oakley Holbrook sunglasses under $250 and use group buying",
    model: "not-required",
    budget: 30000,
  };
  const workflow = fallbackWorkflow(input, undefined, [eyewear]);
  expect(workflow.steps.map((s) => s.tool)).toEqual([
    "search_retail",
    "discover_groups",
  ]);
  expect(
    validateWorkflow({ steps: workflow.steps }, input, undefined, [eyewear])
      .plan,
  ).toMatchObject({ tool: "search_retail", category: "sunglasses" });
});
it("separates polarized and non-polarized requirements, and does not guess UV protection", () => {
  expect(
    brandedShopping("Find Oakley non-polarized sunglasses under $250", 30000, [
      eyewear,
    ]),
  ).toMatchObject({
    kind: "shopping",
    brief: { requirements: { polarization: "non-polarized" } },
  });
  const intent = brandedShopping(
    "Find polarized sunglasses under $250",
    30000,
    [eyewear],
  );
  expect(intent).toMatchObject({
    kind: "shopping",
    brief: { requirements: { polarization: "polarized" } },
  });
  if (intent?.kind === "shopping")
    expect(intent.brief.requirements?.uvProtection).toBeUndefined();
});
it("does not grant a shopping request financial authority", () => {
  const input = {
    task: "Pay for Oakley sunglasses automatically",
    model: "not-required",
    budget: 30000,
  };
  const workflow = fallbackWorkflow(input, undefined, [eyewear]);
  expect(
    workflow.steps.every(
      (step) => !["checkout", "capture", "refund"].includes(step.tool),
    ),
  ).toBe(true);
});
