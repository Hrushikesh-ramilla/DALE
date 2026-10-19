import { expect, it } from "vitest";
import {
  identityMatcher,
  brandVocabulary,
  canonicalBrand,
  mentionedIdentities,
} from "../src/server/concierge/identity";
import type { Product } from "../src/domain/catalog";
const product = (name: string, brand: string) => ({ name, brand }) as Product;
it("keeps model numbers separate from measured variant quantities", () => {
  expect(
    identityMatcher("Acme Aurora 12 128GB", ["Acme"])(
      product("Acme Aurora 128 12GB", "Acme"),
    ),
  ).toBeNull();
  expect(
    identityMatcher("128GB Acme Aurora12", ["Acme"])(
      product("Acme Aurora 12 128 GB", "Acme"),
    )?.kind,
  ).toBe("identity");
});
it("anchors full names without confusing a shorter family or other edition", () => {
  const family = product("Acme Aurora", "Acme");
  const exact = product("Acme Aurora 12 Pro 128GB", "Acme");
  const other = product("Acme Aurora 12 Pro 256GB", "Acme");
  expect(
    mentionedIdentities(
      "Do you have Acme Aurora 12 Pro 128GB, and what does it cost?",
      [family, exact, other],
    ),
  ).toEqual([exact]);
  expect(
    mentionedIdentities(
      "Compare Acme Aurora 12 Pro 128GB and Acme Aurora 12 Pro 256GB",
      [family, exact, other],
    ),
  ).toEqual([exact, other]);
});

it("resolves abbreviations from catalog vocabulary without brand-specific rules", () => {
  const brands = ["Arcadia House", "Meridian Instruments"];
  expect(canonicalBrand("AH", brandVocabulary(brands))).toBe("Arcadia House");
  const lookup = identityMatcher("AH Aurora", brands);
  expect(
    lookup(product("Arcadia House Aurora Eau de Parfum", brands[0]))?.kind,
  ).toBe("partial_family");
  expect(lookup(product("Meridian Instruments Aurora", brands[1]))).toBeNull();
});
it("does not resolve ambiguous initials or invent a missing model", () => {
  const brands = ["Arcadia House", "Atlas Haven"];
  expect(canonicalBrand("AH", brandVocabulary(brands))).toBeNull();
  expect(
    identityMatcher(
      "Arcadia House Unlisted Imagination",
      brands,
    )(product("Arcadia House Aurora", brands[0])),
  ).toBeNull();
});
it("allows bounded spelling corrections and reports approximate identity", () => {
  const lookup = identityMatcher("Meridian Neptuen", ["Meridian"]);
  expect(
    lookup(product("Meridian Neptune Chronograph", "Meridian"))?.kind,
  ).toBe("approximate_identity");
  expect(lookup(product("Meridian Atlas Chronograph", "Meridian"))).toBeNull();
});
it("never changes variant numbers to make a name fit", () => {
  const lookup = identityMatcher("Arcadia Aurora 12", ["Arcadia"]);
  expect(lookup(product("Arcadia Aurora 12", "Arcadia"))?.kind).toBe(
    "identity",
  );
  expect(lookup(product("Arcadia Aurora 13", "Arcadia"))).toBeNull();
  expect(
    identityMatcher("Arcadia Aurroa12", ["Arcadia"])(
      product("Arcadia Aurora13", "Arcadia"),
    ),
  ).toBeNull();
});
it("regresses the reported misspelling without mixing a different watch family", () => {
  const lookup = identityMatcher("omega peedmater", ["Omega"]);
  expect(
    lookup(product("Omega Speedmaster Professional Moonwatch 42mm", "Omega"))
      ?.kind,
  ).toBe("approximate_identity");
  expect(lookup(product("Omega Seamaster Aqua Terra", "Omega"))).toBeNull();
});
it("normalizes joined letter/number model spelling while preserving variant identity", () => {
  expect(
    identityMatcher("Apple iPhone16 Pro", ["Apple"])(
      product("Apple iPhone 16 Pro", "Apple"),
    )?.kind,
  ).toBe("identity");
  expect(
    identityMatcher("Samsung S24Ultra", ["Samsung"])(
      product("Samsung Galaxy S24 Ultra", "Samsung"),
    )?.kind,
  ).toBe("partial_family");
  expect(
    identityMatcher("Apple iPhone16 Pro", ["Apple"])(
      product("Apple iPhone 17 Pro", "Apple"),
    ),
  ).toBeNull();
});
it("never turns a generic similarity candidate into the reported requested perfume", () => {
  const lookup = identityMatcher("lv imagination perfume", [
    "Louis Vuitton",
    "Amouage",
  ]);
  expect(
    lookup(product("Amouage Gold Man Eau de Parfum", "Amouage")),
  ).toBeNull();
  expect(
    lookup(product("Louis Vuitton Neverfull MM", "Louis Vuitton")),
  ).toBeNull();
});
it("does not label an extra variant qualifier as an exact requested SKU", () => {
  expect(
    identityMatcher("Acme Aurora Pro", ["Acme"])(
      product("Acme Aurora Pro Max", "Acme"),
    )?.kind,
  ).toBe("partial_family");
});
