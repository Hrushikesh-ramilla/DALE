import { afterAll, beforeAll, expect, it } from "vitest";
import { parseRolexSource } from "../src/server/rolex-source";
import {
  browseCatalog,
  catalogLanguageContext,
} from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";
import { fallbackWorkflow } from "../src/domain/agent-workflow";
import manifest from "../catalog/manifests/watches-rolex-2026-10-11-v1.json";
const path = "/watches/submariner/m124060-0001";
const fixture = {
  "@type": "Product",
  "@id": `https://www.rolex.com${path}#product`,
  sku: "m124060-0001",
  manufacturer: { "@id": "https://www.rolex.com/#organization" },
  isRelatedTo: { name: "Rolex Submariner" },
  image: ["https://media.rolex.com/image/upload/catalogue/2026/m124060-0001"],
  additionalProperty: [
    { name: "Case diameter", value: "41 mm" },
    { name: "Case material", value: "Oystersteel" },
    { name: "Dial colour", value: "Black" },
    { name: "Movement", value: "Perpetual, mechanical, self-winding" },
    {
      name: "Water resistance",
      value: "Waterproof to 300 metres / 1,000 feet",
    },
  ],
};
const html = `<script type="application/ld+json">${JSON.stringify(fixture)}</script>`;
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
afterAll(() => closeDatabase());
it("uses exact source identity and explicit facts without claiming manufacturer price or stock", () => {
  const product = parseRolexSource(path, html, "2026-10-11");
  expect(product.attributes).toMatchObject({
    movement: "automatic",
    caseDiameterMm: 41,
    waterResistanceM: 300,
  });
  expect(product.evidence?.missing.join(" ")).toContain("simulated");
  expect(() =>
    parseRolexSource(
      path,
      html.replace("#organization", "#other"),
      "2026-10-11",
    ),
  ).toThrow("identity");
  expect(() =>
    parseRolexSource(
      path,
      html.replace("media.rolex.com", "other.example"),
      "2026-10-11",
    ),
  ).toThrow("photograph");
  expect(() =>
    parseRolexSource(
      path,
      html.replace("self-winding", "unknown"),
      "2026-10-11",
    ),
  ).toThrow("specifications");
});
it("publishes ten distinct collections and applies exact diameter/movement filters in agent search", async () => {
  expect(
    new Set(manifest.products.map((product) => product.familyId)).size,
  ).toBe(10);
  expect(
    (
      await browseCatalog({
        category: "watches",
        requirements: { brand: "rolex" },
      })
    ).total,
  ).toBe(10);
  const input = {
    task: "Find a Rolex automatic watch with a 41mm case under $9000",
    model: "not-required",
    budget: 900000,
  };
  const workflow = fallbackWorkflow(
    input,
    undefined,
    await catalogLanguageContext(input.task),
  );
  expect(workflow.plan).toMatchObject({
    tool: "search_retail",
    category: "watches",
    requirements: { brand: "rolex", movement: "automatic", caseDiameterMm: 41 },
  });
  const filtered = await browseCatalog({
    category: "watches",
    budget: 900000,
    requirements: { brand: "rolex", caseDiameterMm: 41 },
  });
  expect(filtered.total).toBeGreaterThan(0);
  expect(
    filtered.products.every(
      (product) => product.attributes?.caseDiameterMm === 41,
    ),
  ).toBe(true);
});
