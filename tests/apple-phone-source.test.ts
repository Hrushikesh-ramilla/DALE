import { afterAll, beforeAll, expect, it } from "vitest";
import { parseApplePhoneSource } from "../src/server/apple-phone-source";
import {
  browseCatalog,
  catalogLanguageContext,
} from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";
import { fallbackWorkflow } from "../src/domain/agent-workflow";
import manifest from "../catalog/manifests/phones-apple-2026-10-11-v1.json";
const html = `<h1>iPhone 18 Pro - Tech Specs</h1><img alt="iPhone 18 Pro" src="https://cdsassets.apple.com/live/images/iphone-18-pro.png">
<h3>Finish</h3><p>Black, Silver</p><ul><li>Aluminum unibody design</li></ul>
<h3>Capacity<sup>1</sup></h3><ul><li>256GB</li><li>512GB</li></ul>
<h3>Display</h3><p>6.3-inch (diagonal) OLED display</p><p>Adaptive refresh rates up to 120Hz</p>
<h3>Chip</h3><p>A20 Pro chip</p><h3>Camera</h3>`;
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
afterAll(() => closeDatabase());
it("extracts explicit capacity/display/chip and keeps design material separate from finish", () => {
  const product = parseApplePhoneSource(
    "148590",
    "iPhone 18 Pro",
    html,
    "2026-10-11",
  );
  expect(product.color).toBe("Black");
  expect(product.attributes).toMatchObject({
    storageGb: 256,
    displayInches: 6.3,
    refreshHz: 120,
  });
  expect(product.attributes?.ramGb).toBeUndefined();
  expect(product.attributes?.batteryMah).toBeUndefined();
  expect(() =>
    parseApplePhoneSource("148591", "iPhone 18 Pro Max", html, "2026-10-11"),
  ).toThrow("identity");
  expect(() =>
    parseApplePhoneSource(
      "148590",
      "iPhone 18 Pro",
      html.replace("cdsassets.apple.com", "other.example"),
      "2026-10-11",
    ),
  ).toThrow("photograph");
  expect(() =>
    parseApplePhoneSource(
      "148590",
      "iPhone 18 Pro",
      html.replace("256GB", "Unknown").replace("512GB", "Unknown"),
      "2026-10-11",
    ),
  ).toThrow("specifications");
});
it("publishes ten additional distinct models and chooses the explicitly requested longer model", async () => {
  expect(
    new Set(manifest.products.map((product) => product.familyId)).size,
  ).toBe(10);
  expect(
    (
      await browseCatalog({
        category: "phones",
        requirements: { brand: "apple" },
      })
    ).total,
  ).toBe(11);
  for (const modelName of [
    "iphone 18 pro",
    "iphone 18 pro max",
    "iphone 17 pro max",
    "iphone 17 pro",
  ]) {
    const input = {
      task: `Find Apple ${modelName} with 256GB storage under $1500`,
      model: "not-required",
      budget: 150000,
    };
    const workflow = fallbackWorkflow(
      input,
      undefined,
      await catalogLanguageContext(input.task),
    );
    expect(workflow.plan).toMatchObject({
      tool: "search_retail",
      category: "phones",
      requirements: { brand: "apple", modelName, storageGb: 256 },
    });
    const result = await browseCatalog({
      category: "phones",
      requirements: { brand: "apple", modelName, storageGb: 256 },
    });
    expect(result.total).toBe(1);
    expect(result.products[0].attributes?.ramGb).toBeUndefined();
  }
});
