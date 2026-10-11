import { afterAll, beforeAll, expect, it } from "vitest";
import { parseTissotSource } from "../src/server/tissot-source";
import {
  browseCatalog,
  catalogLanguageContext,
} from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";
import { fallbackWorkflow } from "../src/domain/agent-workflow";
import manifest from "../catalog/manifests/watches-tissot-2026-10-11-v1.json";
const reference = "T1374101104100";
const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "Product", name: "Tissot PRX 40mm", mpn: reference, sku: reference, brand: { name: "Tissot" }, offers: { priceCurrency: "USD", price: "450.00" } })}</script>
<meta property="og:image" content="https://www.tissotwatches.com/on/demandware.static/T137-410-11-041-00_shadow.png">
<li>Diameter:40 mm</li><div aria-label="Movement Quartz three hands"></div><div aria-label="Case Water resistance Water-resistant up to a pressure of 10 bar (100 m / 330 ft)"></div>`;
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
afterAll(() => closeDatabase());
it("extracts explicit specifications and rejects mismatched identity, media, currency and missing movement", () => {
  const record = parseTissotSource(reference, html, "2026-10-11");
  expect(record.attributes).toMatchObject({
    modelName: "prx",
    movement: "quartz",
    caseDiameterMm: 40,
    waterResistanceM: 100,
  });
  expect(record.price).toBe(45000);
  expect(record.description).toContain("not a diving");
  expect(() => parseTissotSource("T1254171703100", html, "2026-10-11")).toThrow(
    "identity",
  );
  expect(() =>
    parseTissotSource(reference, html.replace("USD", "INR"), "2026-10-11"),
  ).toThrow("currency");
  expect(() =>
    parseTissotSource(
      reference,
      html.replace("Quartz three hands", "Unknown"),
      "2026-10-11",
    ),
  ).toThrow("Movement");
  expect(() =>
    parseTissotSource(
      reference,
      html.replace("www.tissotwatches.com/on", "other.example/on"),
      "2026-10-11",
    ),
  ).toThrow("photograph");
});
it("publishes ten separate collections and grounds requested movement and diameter in persisted facts", async () => {
  expect(
    new Set(manifest.products.map((p) => p.attributes.modelName)).size,
  ).toBe(10);
  const watches = await browseCatalog({
    category: "watches",
    requirements: { brand: "tissot" },
  });
  expect(watches.total).toBe(10);
  const input = {
    task: "Find a Tissot quartz watch with a 40mm case under $600 and use group buying",
    model: "not-required",
    budget: 60000,
  };
  const workflow = fallbackWorkflow(
    input,
    undefined,
    await catalogLanguageContext(input.task),
  );
  expect(workflow.plan).toMatchObject({
    tool: "search_retail",
    category: "watches",
    requirements: { brand: "tissot", movement: "quartz", caseDiameterMm: 40 },
  });
  const exact = await browseCatalog({
    category: "watches",
    budget: 60000,
    requirements: { brand: "tissot", movement: "quartz", caseDiameterMm: 40 },
  });
  expect(exact.total).toBeGreaterThan(0);
  expect(
    exact.products.every(
      (p) =>
        p.attributes?.movement === "quartz" &&
        p.attributes?.caseDiameterMm === 40,
    ),
  ).toBe(true);
  const unknown = await browseCatalog({
    category: "watches",
    requirements: { movement: "automatic", caseDiameterMm: 19.5 },
  });
  expect(unknown.total).toBe(0);
});
