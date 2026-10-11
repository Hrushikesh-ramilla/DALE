import { createHash } from "node:crypto";
import type { Product } from "@/domain/catalog";

/** Accept only explicit exact-reference manufacturer JSON-LD facts. */
export function parseRolexSource(
  path: string,
  html: string,
  checkedAt: string,
): Product {
  if (!/^\/watches\/[a-z0-9-]+\/m\d+[a-z0-9]*-\d{4}$/.test(path))
    throw new Error("Invalid exact watch reference path.");
  const reference = path.split("/").at(-1)!;
  const source = `https://www.rolex.com${path}`;
  const product = [
    ...html.matchAll(
      /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
    .map((match) => JSON.parse(match[1]))
    .find((record) => record["@type"] === "Product");
  if (
    !product ||
    product.sku !== reference ||
    product["@id"] !== `${source}#product` ||
    product.manufacturer?.["@id"] !== "https://www.rolex.com/#organization"
  )
    throw new Error("Manufacturer product identity mismatch.");
  const facts = new Map<string, string>(
    (product.additionalProperty || []).map(
      (fact: { name: string; value: string }) => [fact.name, fact.value],
    ),
  );
  const movementFact = facts.get("Movement") || "";
  const diameter = Number(
    facts.get("Case diameter")?.match(/^(\d+(?:\.\d+)?) mm$/)?.[1],
  );
  const water = Number(
    facts.get("Water resistance")?.match(/(?:to |of )(\d+) metres/)?.[1],
  );
  const material = facts.get("Case material");
  const color = facts.get("Dial colour");
  const model = String(product.isRelatedTo?.name || "").replace(/^Rolex /, "");
  if (
    !diameter ||
    !/self-winding/i.test(movementFact) ||
    !material ||
    !color ||
    !model
  )
    throw new Error("Required watch specifications need review.");
  const image = new URL(product.image?.[0] || "");
  if (
    image.protocol !== "https:" ||
    image.hostname !== "media.rolex.com" ||
    image.username ||
    image.password ||
    image.port ||
    !image.pathname.endsWith(`/${reference}`)
  )
    throw new Error("Exact-reference manufacturer photograph mismatch.");
  return {
    id: `WATCH-${reference}`,
    name: `Rolex ${model} · ${reference}`,
    category: "watches",
    brand: "Rolex",
    offerKind: "sandbox",
    provenance: "manufacturer_evidence",
    description: `Exact ${model} reference ${reference}: ${diameter}mm case and recorded automatic movement. DALE is an independent test storefront; no manufacturer affiliation or commercial stock is claimed.`,
    price: 800000,
    stock: 20,
    sponsored: false,
    compatibleModels: [],
    color,
    source,
    familyId: `rolex:${path.split("/")[2]}`,
    specs: [
      `Reference: ${reference}`,
      `Case diameter: ${diameter}mm`,
      `Case material: ${material}`,
      `Movement: ${movementFact}`,
      ...(water ? [`Manufacturer-stated water resistance: ${water}m`] : []),
    ],
    attributes: {
      brand: "rolex",
      modelName: model.toLowerCase(),
      productType: "watch",
      movement: "automatic",
      caseDiameterMm: diameter,
      material: material.toLowerCase(),
      ...(water ? { waterResistanceM: water } : {}),
    },
    evidence: {
      checkedAt,
      region: "International manufacturer specification",
      review: "specifications",
      missing: [
        "The USD 8,000 DALE offer and stock are simulated, not a Rolex retail price or availability claim.",
        "Individual wrist fit, authenticity of a physical item and suitability for water activities require separate verification.",
        ...(water ? [] : ["Exact water resistance is not recorded."]),
      ],
    },
    media: {
      url: image.href,
      source,
      alt: `Rolex ${model} reference ${reference}, manufacturer photograph`,
      attribution: "Product photograph © Rolex; manufacturer reference",
      reviewedAt: checkedAt,
      usage: "external_reference",
    },
  };
}
export function rolexSourceReceipt(path: string, html: string) {
  return {
    source: `https://www.rolex.com${path}`,
    sha256: createHash("sha256").update(html).digest("hex"),
  };
}
