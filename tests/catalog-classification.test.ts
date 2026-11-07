import { expect, it } from "vitest";
import { catalogLeaf } from "../src/domain/catalog-classification";
import { productById } from "../src/domain/catalog";

it("indexes recorded types without assigning broad categories arbitrary defaults", () => {
  const original = productById("B010");
  expect(catalogLeaf(original)).toBe("fragrance");
  expect(
    catalogLeaf({
      ...original,
      category: "accessories",
      attributes: { productType: "keyboard" },
    }),
  ).toBe("keyboards");
  expect(
    catalogLeaf({
      ...original,
      category: "clothing",
      attributes: { productType: "t-shirt" },
    }),
  ).toBe("t-shirts");
  expect(
    catalogLeaf({
      ...original,
      category: "bags",
      attributes: { productType: "tote" },
    }),
  ).toBe("handbags");
  expect(
    catalogLeaf({
      ...original,
      category: "home",
      attributes: { productType: "mug" },
    }),
  ).toBe("kitchenware");
  expect(
    catalogLeaf({ ...original, category: "clothing", attributes: {} }),
  ).toBeUndefined();
  expect(
    catalogLeaf({ ...original, category: "accessories", attributes: {} }),
  ).toBeUndefined();
  expect(
    catalogLeaf({ ...original, category: "home", attributes: {} }),
  ).toBeUndefined();
});
