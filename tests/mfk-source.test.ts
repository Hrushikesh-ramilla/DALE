import { afterAll, beforeAll, expect, it } from "vitest";
import observations from "../catalog/manifests/fragrance-mfk-2026-10-11-v1.observations.json";
import manifest from "../catalog/manifests/fragrance-mfk-2026-10-11-v1.json";
import { parseMfkObservation, parseMfkSource } from "../src/server/mfk-source";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import { brandedShopping } from "../src/domain/branded-shopping";
import {
  catalogLanguageContext,
  searchStoredCatalog,
} from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.DATABASE_URL = "";
});
afterAll(() => closeDatabase());
it("binds reviewed bottle controls, exact references and photographs without counting sizes as models", () => {
  const products = observations.observations.map((o) =>
    parseMfkObservation(o, observations.checkedAt),
  );
  expect(products).toEqual(catalogManifestSchema.parse(manifest).products);
  expect(new Set(products.map((p) => p.familyId)).size).toBe(14);
  for (const patch of [
    { selectedVolume: "35ml" },
    { reference: "RA99999" },
    { heading: "Other fragrance Eau de parfum" },
    { image: "https://www.franciskurkdjian.com/logo.png" },
    { imageWidth: 0 },
  ]) {
    expect(() =>
      parseMfkObservation(
        { ...observations.observations[0], ...patch },
        observations.checkedAt,
      ),
    ).toThrow();
  }
});
it("rejects unrelated structured identities and leaves unrecorded scent claims unknown", () => {
  const o = observations.observations[0];
  const record = {
    "@type": "Product",
    name: "Kurky Eau de parfum 70ml",
    sku: o.reference,
    gtin13: "3700559623855",
    size: "70ml",
    brand: { name: "Maison Francis Kurkdjian" },
    image: [{ url: o.image }],
    offers: { url: o.source },
  };
  const html = `<script type="application/ld+json">${JSON.stringify(record)}</script>`;
  expect(
    parseMfkSource(o.source, "Kurky", html, observations.checkedAt).attributes,
  ).toMatchObject({ volumeMl: 70, productType: "eau de parfum" });
  expect(
    parseMfkSource(o.source, "Kurky", html, observations.checkedAt).attributes
      ?.scent,
  ).toBeUndefined();
  expect(() =>
    parseMfkSource(o.source, "Other", html, observations.checkedAt),
  ).toThrow("mismatch");
  expect(() =>
    parseMfkSource(
      o.source,
      "Kurky",
      html.replace(o.reference, "RA0000"),
      observations.checkedAt,
    ),
  ).toThrow("mismatch");
});
it("retrieves MFK alias/model requests from published inventory with concentration and volume gates", async () => {
  const task =
    "Find MFK APOM eau de parfum 70ml under $400 and use group buying";
  const context = await catalogLanguageContext(task);
  expect(
    context.filter((p) => p.brand === "Maison Francis Kurkdjian"),
  ).toHaveLength(15);
  const intent = brandedShopping(task, 40000, context);
  expect(intent?.kind).toBe("shopping");
  if (intent?.kind !== "shopping") throw new Error("Shopping intent required");
  const matches = await searchStoredCatalog(intent.brief);
  expect(matches.map((p) => p.id)).toEqual(["FRAGRANCE-MFK-RA120421"]);
  expect(
    brandedShopping(
      "Find MFK APOM fragrance safe for allergies",
      40000,
      context,
    )?.kind,
  ).toBe("clarification");
  const citrus = brandedShopping(
    "Find MFK citrus eau de parfum 70ml under $400",
    40000,
    context,
  );
  if (citrus?.kind !== "shopping")
    throw new Error("Sourced citrus request required");
  expect(
    (await searchStoredCatalog(citrus.brief)).map((p) => p.id).sort(),
  ).toEqual(["FRAGRANCE-MFK-RA120621", "FRAGRANCE-MFK-RA122421"]);
});
