import { beforeAll, afterAll, expect, it } from "vitest";
import pdm from "../catalog/manifests/fragrance-pdm-2026-10-11-v1.observations.json";
import amouage from "../catalog/manifests/fragrance-amouage-2026-10-11-v1.observations.json";
import initio from "../catalog/manifests/fragrance-initio-2026-10-11-v1.observations.json";
import {
  isIndividualFragrance,
  parseManufacturerFragrance,
  type FragranceFeedProfile,
} from "../src/server/manufacturer-fragrance-feed";
import {
  catalogLanguageContext,
  searchStoredCatalog,
} from "../src/server/catalog-store";
import { brandedShopping } from "../src/domain/branded-shopping";
import { closeDatabase } from "../src/server/database";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.DATABASE_URL = "";
});
afterAll(() => closeDatabase());
const pdmProfile = pdm.profile as FragranceFeedProfile;
const herod = pdm.observations.find(
  (o) => o.catalogProduct.title === "Herod",
)!.catalogProduct;
const herodHtml =
  "<title>Herod Eau de Parfum (75ml, 125ml) – Parfums de Marly Official Website</title><h1>Herod</h1>";
it("binds catalog and page identity, bottle size and manufacturer media tenant", () => {
  const p = parseManufacturerFragrance(
    pdmProfile,
    {
      ...herod,
      body_html: "This perfume cures eczema and guarantees happiness.",
    },
    herodHtml,
    "2026-10-11",
  );
  expect(p.attributes).toMatchObject({
    volumeMl: 75,
    concentration: "eau de parfum",
  });
  expect(JSON.stringify(p)).not.toContain("cures eczema");
  expect(() =>
    parseManufacturerFragrance(
      pdmProfile,
      herod,
      herodHtml.replace("<h1>Herod", "<h1>Oriana"),
      "2026-10-11",
    ),
  ).toThrow("identity");
  const wrongTenant = {
    ...herod,
    images: herod.images.map((i) => ({
      ...i,
      src: i.src.replace("0555/6279/7250", "0000/0000/0000"),
    })),
  };
  expect(() =>
    parseManufacturerFragrance(
      pdmProfile,
      wrongTenant,
      herodHtml,
      "2026-10-11",
    ),
  ).toThrow("tenant");
});
it("does not confuse Althair or gift-recipient tags with hair perfume or gift sets", () => {
  expect(
    isIndividualFragrance({
      title: "Althaïr",
      handle: "althair",
      tags: ["gifts for men"],
    }),
  ).toBe(true);
  for (const suffix of [
    "hair-perfume",
    "body-cream",
    "travel-duo",
    "gift-set",
    "sample",
  ])
    expect(
      isIndividualFragrance({ title: "Herod", handle: `herod-${suffix}` }),
    ).toBe(false);
});
it("withholds photographs that are not associated with a multiple-size selected variant", () => {
  const noAssociation = {
    ...herod,
    variants: herod.variants.map((v) => ({ ...v, featured_image: null })),
    images: herod.images.map((i) => ({ ...i, variant_ids: [] })),
  };
  expect(() =>
    parseManufacturerFragrance(
      pdmProfile,
      noAssociation,
      herodHtml,
      "2026-10-11",
    ),
  ).toThrow("associated");
});
it("records the explicit Amouage catalog type and cannot infer concentration from marketing", () => {
  const item = amouage.observations.find(
    (o) => o.catalogProduct.title === "Existence",
  )!.catalogProduct;
  expect(
    parseManufacturerFragrance(
      amouage.profile as FragranceFeedProfile,
      item,
      "<h1>Existence</h1>",
      "2026-10-11",
    ).attributes,
  ).toMatchObject({ volumeMl: 100, concentration: "eau de parfum" });
  expect(() =>
    parseManufacturerFragrance(
      amouage.profile as FragranceFeedProfile,
      { ...item, product_type: "Unknown", body_html: "Eau de parfum" },
      "<h1>Existence</h1>",
      "2026-10-11",
    ),
  ).toThrow("Concentration");
});
it("uses published Parfum facts without replacing them with eau de parfum", async () => {
  const task = "Find PDM Delina Exclusif parfum 75ml under $400";
  const records = await catalogLanguageContext(task);
  expect(records.filter((p) => p.brand === "Parfums de Marly")).toHaveLength(
    15,
  );
  const intent = brandedShopping(task, 40000, records);
  if (intent?.kind !== "shopping")
    throw new Error("Exact fragrance intent required");
  const result = await searchStoredCatalog(intent.brief);
  expect(result).toHaveLength(1);
  expect(result[0].attributes).toMatchObject({
    modelName: "delina exclusif",
    concentration: "parfum",
    volumeMl: 75,
  });
});
it("binds Initio concentration metadata to the exact public product and refuses an unrecorded extrait substitution", async () => {
  const item = initio.observations.find(
    (o) => o.catalogProduct.title === "ATOMIC ROSE",
  )!.catalogProduct;
  const html = `<h1>ATOMIC ROSE</h1><script>var item = {Name: "ATOMIC ROSE", ProductID: ${item.id}, Categories: ["EAU DE PARFUM"]};</script>`;
  const profile = initio.profile as FragranceFeedProfile;
  expect(
    parseManufacturerFragrance(profile, item, html, "2026-10-11").attributes
      ?.concentration,
  ).toBe("eau de parfum");
  expect(() =>
    parseManufacturerFragrance(
      profile,
      item,
      html.replace(String(item.id), "123"),
      "2026-10-11",
    ),
  ).toThrow("different model");
  const records = await catalogLanguageContext(
    "Find Initio Rehab extrait de parfum 90ml under $400",
  );
  const intent = brandedShopping(
    "Find Initio Rehab extrait de parfum 90ml under $400",
    40000,
    records,
  );
  if (intent?.kind !== "shopping")
    throw new Error("Documented extrait intent required");
  const result = await searchStoredCatalog(intent.brief);
  expect(result).toHaveLength(1);
  expect(result[0].attributes).toMatchObject({
    modelName: "rehab",
    concentration: "extrait de parfum",
    volumeMl: 90,
  });
  expect(
    brandedShopping("Find Initio Atomic Rose extrait de parfum", 40000, records)
      ?.kind,
  ).toBe("clarification");
});
