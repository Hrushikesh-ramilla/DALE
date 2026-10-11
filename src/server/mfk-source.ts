import { createHash } from "node:crypto";
import { z } from "zod";
import type { Product } from "@/domain/catalog";

const identity = z.object({
  "@type": z.literal("Product"),
  name: z.string(),
  sku: z.string(),
  gtin13: z.string().regex(/^\d{13}$/),
  size: z.string(),
  brand: z.object({ name: z.literal("Maison Francis Kurkdjian") }),
  image: z.array(z.object({ url: z.url() })).min(1),
  offers: z.object({ url: z.url() }),
});
const normalized = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
export function parseMfkSource(
  source: string,
  expectedName: string,
  html: string,
  checkedAt: string,
): Product {
  const url = new URL(source);
  const reference = url.pathname.match(/-([A-Z0-9]+)\.html$/)?.[1];
  if (
    url.origin !== "https://www.franciskurkdjian.com" ||
    !url.pathname.startsWith("/us-en/p/") ||
    url.search ||
    !reference
  )
    throw new Error("Unreviewed fragrance source identity.");
  const objects = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));
  const record = identity.parse(
    objects.find((item) => item["@type"] === "Product"),
  );
  const volumeMl = Number(record.size.match(/^(\d+)ml$/i)?.[1]);
  const manufacturerName = `${expectedName} Eau de parfum ${volumeMl}ml`;
  if (
    record.sku !== reference ||
    record.offers.url !== source ||
    normalized(record.name) !== normalized(manufacturerName) ||
    !volumeMl
  )
    throw new Error("Exact fragrance model/variant mismatch.");
  const media = new URL(record.image[0].url);
  if (
    media.origin !== url.origin ||
    !media.pathname.startsWith("/dw/image/v2/") ||
    !media.pathname.includes(record.gtin13) ||
    media.username ||
    media.password
  )
    throw new Error("Exact fragrance photograph mismatch.");
  const page = JSON.parse(
    html.match(/"productPage":(\{[^{}]+\})/)?.[1] || "{}",
  );
  const scent =
    typeof page.olfactoryFamily === "string" &&
    normalized(page.name || "") === normalized(`${expectedName} Eau de parfum`)
      ? page.olfactoryFamily.toLowerCase().trim()
      : undefined;
  if (scent && scent.length > 60)
    throw new Error("Fragrance family requires review.");
  return buildMfkProduct(
    source,
    reference,
    expectedName,
    volumeMl,
    media,
    scent,
    checkedAt,
  );
}

const observationSchema = z
  .object({
    source: z.url(),
    reference: z.string().regex(/^RA\d+$/),
    name: z.string().min(2).max(80),
    heading: z.string().min(3).max(150),
    concentration: z.literal("Eau de parfum"),
    volume: z.string().regex(/^\d+ml$/),
    selectedVolume: z.string(),
    scent: z.string().max(60),
    image: z.url(),
    imageWidth: z.number().int().min(1).max(10000),
  })
  .strict();

/** Reviewed visible controls are a separate source from HTML structured data. */
export function parseMfkObservation(
  input: unknown,
  checkedAt: string,
): Product {
  const o = observationSchema.parse(input);
  const source = new URL(o.source),
    media = new URL(o.image);
  const volumeMl = Number(o.volume.slice(0, -2));
  if (
    source.origin !== "https://www.franciskurkdjian.com" ||
    !source.pathname.startsWith("/us-en/p/") ||
    source.search ||
    !source.pathname.endsWith(`-${o.reference}.html`) ||
    normalized(o.heading) !== normalized(`${o.name} ${o.concentration}`) ||
    o.volume !== o.selectedVolume ||
    !volumeMl
  )
    throw new Error(
      "Reviewed fragrance controls disagree about the selected variant.",
    );
  if (
    media.origin !== source.origin ||
    !media.pathname.startsWith("/dw/image/v2/") ||
    !/\/\d{13}_/.test(media.pathname) ||
    !media.pathname.toUpperCase().includes(`${volumeMl}ML`) ||
    media.username ||
    media.password
  )
    throw new Error("Reviewed fragrance photograph does not match the bottle.");
  return buildMfkProduct(
    o.source,
    o.reference,
    o.name,
    volumeMl,
    media,
    o.scent.toLowerCase() || undefined,
    checkedAt,
  );
}

function buildMfkProduct(
  source: string,
  reference: string,
  expectedName: string,
  volumeMl: number,
  media: URL,
  scent: string | undefined,
  checkedAt: string,
): Product {
  return {
    id: `FRAGRANCE-MFK-${reference}`,
    name: `Maison Francis Kurkdjian ${expectedName} · Eau de Parfum · ${volumeMl}ml`,
    familyId: `mfk:${normalized(expectedName).replace(/[^a-z0-9]+/g, "-")}`,
    category: "fragrance",
    brand: "Maison Francis Kurkdjian",
    description: `${expectedName}, manufacturer-identified eau de parfum, ${volumeMl}ml. DALE's price and inventory are simulated. Manufacturer olfactory descriptions do not establish enjoyment, performance or individual safety.`,
    price: 32500,
    stock: 20,
    compatibleModels: [],
    specs: [
      `Reference: ${reference}`,
      `Concentration: Eau de Parfum`,
      `Volume: ${volumeMl}ml`,
      ...(scent ? [`Manufacturer olfactory family: ${scent}`] : []),
    ],
    sponsored: false,
    color: "Manufacturer bottle",
    source,
    provenance: "manufacturer_evidence",
    offerKind: "sandbox",
    evidence: {
      checkedAt,
      region: "US",
      review: "specifications",
      missing: [
        "Scent enjoyment, longevity, projection and individual allergy safety are not established.",
        "Real merchant stock, current selling price and fulfilment are not connected.",
        ...(!scent
          ? ["Olfactory family was not recorded for this exact variant."]
          : []),
      ],
    },
    attributes: {
      brand: "maison francis kurkdjian",
      productType: "eau de parfum",
      modelName: expectedName.toLowerCase(),
      concentration: "eau de parfum",
      volumeMl,
      ...(scent ? { scent } : {}),
    },
    media: {
      url: media.href,
      source,
      alt: `${expectedName} Eau de Parfum ${volumeMl}ml manufacturer photograph`,
      attribution:
        "Maison Francis Kurkdjian product photography; external reference",
      reviewedAt: checkedAt,
      usage: "external_reference",
    },
  };
}
export function mfkSourceReceipt(source: string, html: string) {
  return {
    source,
    htmlSha256: createHash("sha256").update(html).digest("hex"),
  };
}
