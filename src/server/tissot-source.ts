import { createHash } from "node:crypto";
import type { Product } from "@/domain/catalog";

const decode = (value: string) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ");
/** Parse only explicit manufacturer product/attribute fields, never marketing promises. */
export function parseTissotSource(
  reference: string,
  html: string,
  checkedAt: string,
): Product {
  if (!/^T\d{13}$/.test(reference))
    throw new Error("Invalid manufacturer reference.");
  const documents = [
    ...html.matchAll(
      /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((match) => JSON.parse(match[1]));
  const product = documents
    .flatMap((document) =>
      Array.isArray(document) ? document : document["@graph"] || [document],
    )
    .find((document) => document["@type"] === "Product");
  if (
    !product ||
    product.mpn !== reference ||
    product.sku !== reference ||
    product.brand?.name !== "Tissot"
  )
    throw new Error(
      "Manufacturer product identity does not match the requested reference.",
    );
  const image = decode(
    html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] || "",
  );
  const imageUrl = new URL(image);
  if (
    imageUrl.protocol !== "https:" ||
    imageUrl.hostname !== "www.tissotwatches.com" ||
    !!imageUrl.username ||
    !!imageUrl.password ||
    !!imageUrl.port ||
    !imageUrl.pathname
      .split("/")
      .at(-1)
      ?.replaceAll("-", "")
      .includes(reference)
  )
    throw new Error("The exact-reference manufacturer photograph is missing.");
  const labels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((match) =>
    decode(match[1]),
  );
  const movementFact = labels.find((label) =>
    /^Movement (?:Quartz|Swiss|Automatic|Mechanical)/i.test(label),
  );
  const movement =
    movementFact && /quartz/i.test(movementFact)
      ? "quartz"
      : movementFact && /automatic/i.test(movementFact)
        ? "automatic"
        : undefined;
  const diameter = Number(html.match(/Diameter:\s*(\d+(?:\.\d+)?)\s*mm/i)?.[1]);
  if (!movement || !diameter)
    throw new Error("Movement or manufacturer-stated diameter needs review.");
  const waterFact = labels.find((label) =>
    label.startsWith("Case Water resistance "),
  );
  const water = Number(waterFact?.match(/\((\d+)\s*m\b/)?.[1]);
  const material = labels
    .find((label) => label.startsWith("Case material "))
    ?.slice("Case material ".length);
  const color =
    labels
      .find((label) => label.startsWith("Dial colour "))
      ?.slice("Dial colour ".length) || "Manufacturer reference";
  if (product.offers?.priceCurrency !== "USD")
    throw new Error("Source reference price currency requires review.");
  const price = Math.round(Number(product.offers.price) * 100);
  if (!Number.isSafeInteger(price) || price <= 0)
    throw new Error("Invalid reference price.");
  const source = `https://www.tissotwatches.com/en-us/${reference}.html`;
  return {
    id: `WATCH-${reference}`,
    name: `${product.name} · ${reference}`,
    category: "watches",
    description: `${product.name}, manufacturer reference ${reference}. Recorded ${movement} movement and ${diameter}mm case diameter. DALE offers and stock are simulated; listed water resistance is not a diving or activity guarantee.`,
    price,
    compatibleModels: [],
    specs: [
      `Manufacturer reference: ${reference}`,
      movementFact!,
      `Case diameter: ${diameter}mm`,
      ...(waterFact ? [waterFact] : []),
      ...(material ? [`Case material: ${material}`] : []),
    ],
    sponsored: false,
    stock: 20,
    color,
    source,
    familyId: `tissot:${String(product.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`,
    provenance: "manufacturer_evidence",
    brand: "Tissot",
    offerKind: "sandbox",
    attributes: {
      productType: "watch",
      brand: "tissot",
      modelName: String(product.name)
        .replace(/^Tissot\s+/i, "")
        .replace(/\s+\d+(?:\.\d+)?mm$/i, "")
        .toLowerCase(),
      movement,
      caseDiameterMm: diameter,
      ...(water ? { waterResistanceM: water } : {}),
      ...(material ? { material: material.toLowerCase() } : {}),
    },
    evidence: {
      checkedAt,
      region: "United States manufacturer reference",
      review: "specifications",
      missing: [
        "Individual wrist fit and suitability for diving or other water activities are not verified.",
        "Commercial stock, retail price and availability are not synchronized.",
        ...(water ? [] : ["Exact water resistance is not recorded."]),
      ],
    },
    media: {
      url: image,
      source,
      alt: `${product.name}, reference ${reference}, manufacturer photograph`,
      attribution: "Product photograph © Tissot SA; manufacturer reference",
      reviewedAt: checkedAt,
      usage: "external_reference",
    },
  };
}
export function tissotSourceReceipt(reference: string, html: string) {
  return {
    reference,
    source: `https://www.tissotwatches.com/en-us/${reference}.html`,
    sha256: createHash("sha256").update(html).digest("hex"),
  };
}
