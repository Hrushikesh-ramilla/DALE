import { z } from "zod";
import type { Product } from "@/domain/catalog";
export type FragranceFeedProfile = {
  key: string;
  host: string;
  brand: string;
  mediaPath: string;
  concentration: "title" | "catalog_type" | "product_categories";
};
const variantSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  sku: z.string(),
  featured_image: z
    .object({ id: z.number().int().positive() })
    .nullable()
    .optional(),
});
const itemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(2).max(100),
  handle: z.string().regex(/^[a-z0-9-]+$/),
  product_type: z.string(),
  tags: z.array(z.string()),
  variants: z.array(variantSchema).min(1),
  images: z
    .array(
      z.object({
        id: z.number().int().positive(),
        src: z.url(),
        variant_ids: z.array(z.number()).optional(),
      }),
    )
    .min(1),
});
export const feedProductIdentitySchema = itemSchema;
const text = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export const normalizeFragranceName = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
export function isIndividualFragrance(item: {
  title: string;
  handle: string;
  product_type?: string;
  tags?: string[];
}) {
  return !/\b(?:gift[ -]*set|bundles?|travel|samples?|discovery|body|hair|cream|wrapping|sets?)\b/i.test(
    [
      item.title,
      item.handle,
      item.product_type || "",
      ...(item.tags || []),
    ].join(" "),
  );
}
export function parseManufacturerFragrance(
  profile: FragranceFeedProfile,
  input: unknown,
  html: string,
  checkedAt: string,
): Product {
  const item = itemSchema.parse(input);
  if (!isIndividualFragrance(item))
    throw new Error(
      "The reviewed batch accepts individual fragrances, not sets, samples or body/hair products.",
    );
  const heading = text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  if (normalizeFragranceName(heading) !== normalizeFragranceName(item.title))
    throw new Error("Product-page identity differs from manufacturer catalog.");
  const variants = item.variants.filter(
    (v) => /^\d+\s*ml$/i.test(v.title) && parseInt(v.title) >= 50,
  );
  const variant =
    variants.find((v) => parseInt(v.title) === 100) || variants[0];
  if (!variant || !variant.sku)
    throw new Error(
      "Exact manufacturer bottle volume/reference requires review.",
    );
  const volumeMl = parseInt(variant.title);
  const image =
    item.images.find(
      (i) =>
        i.id === variant.featured_image?.id ||
        i.variant_ids?.includes(variant.id),
    ) || (item.variants.length === 1 ? item.images[0] : undefined);
  if (!image)
    throw new Error(
      "Photograph is not associated with the selected bottle variant.",
    );
  const media = new URL(image.src);
  if (
    media.protocol !== "https:" ||
    media.hostname !== "cdn.shopify.com" ||
    !media.pathname.startsWith(profile.mediaPath) ||
    media.username ||
    media.password ||
    media.port
  )
    throw new Error("Manufacturer media tenant mismatch.");
  let concentration: string | undefined;
  if (profile.concentration === "title") {
    const title = text(
      html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
    );
    if (
      !normalizeFragranceName(title).startsWith(
        normalizeFragranceName(item.title),
      )
    )
      throw new Error("Manufacturer title identity mismatch.");
    concentration = title
      .match(
        /\b(eau de parfum|extrait de parfum|eau de toilette|parfum)\b/i,
      )?.[1]
      .toLowerCase();
  } else if (profile.concentration === "catalog_type") {
    concentration = (
      { EDP: "eau de parfum", EXTRAIT: "extrait de parfum" } as Record<
        string,
        string
      >
    )[item.product_type.toUpperCase()];
  } else {
    // Public product metadata, explicitly bound to this catalog ID and product name.
    const blocks = [...html.matchAll(/var item\s*=\s*\{([\s\S]*?)\};/g)];
    const product = blocks.find(
      (m) => Number(m[1].match(/ProductID:\s*(\d+)/)?.[1]) === item.id,
    );
    const name = JSON.parse(
      product?.[1].match(/Name:\s*("(?:\\.|[^"\\])*")/)?.[1] || '""',
    );
    const categories = JSON.parse(
      product?.[1].match(/Categories:\s*(\[[^\]]*\])/)?.[1] || "[]",
    ) as string[];
    if (normalizeFragranceName(name) !== normalizeFragranceName(item.title))
      throw new Error(
        "Manufacturer product categories belong to a different model.",
      );
    const concentrations = categories
      .map((c) => c.toLowerCase())
      .filter((c) =>
        ["eau de parfum", "extrait de parfum", "eau de toilette"].includes(c),
      );
    if (new Set(concentrations).size === 1) concentration = concentrations[0];
  }
  if (!concentration)
    throw new Error(
      "Concentration is not explicitly documented for this manufacturer model.",
    );
  const source = `https://${profile.host}/products/${item.handle}`;
  return {
    id: `FRAGRANCE-${profile.key.toUpperCase()}-${variant.id}`,
    familyId: `${profile.key}:${item.handle}`,
    name: `${profile.brand} ${item.title} · ${concentration.replace(/\b\w/g, (c) => c.toUpperCase())} · ${volumeMl}ml`,
    category: "fragrance",
    brand: profile.brand,
    source,
    provenance: "manufacturer_evidence",
    offerKind: "sandbox",
    description: `Manufacturer-listed ${item.title}, selected ${volumeMl}ml bottle. Concentration and reference are recorded from the official storefront. DALE's selling price, inventory and fulfilment are simulated.`,
    price: 32500,
    stock: 20,
    sponsored: false,
    color: "Manufacturer bottle",
    compatibleModels: [],
    specs: [
      `Reference: ${variant.sku}`,
      `Concentration: ${concentration}`,
      `Volume: ${volumeMl}ml`,
    ],
    attributes: {
      brand: profile.brand.toLowerCase(),
      modelName: item.title.toLowerCase(),
      productType: concentration,
      concentration,
      volumeMl,
    },
    evidence: {
      checkedAt,
      region:
        profile.host === "amouage.com"
          ? "Global manufacturer storefront"
          : "US",
      review: "specifications",
      missing: [
        "Olfactory notes, release year and ingredients were not recorded in this reviewed import.",
        "Enjoyment, longevity, projection, allergy safety and medical effects are not established.",
        "Real merchant price, stock, authenticity and fulfilment are not connected.",
      ],
    },
    media: {
      url: media.href,
      source,
      alt: `${profile.brand} ${item.title} selected bottle photograph`,
      attribution: `${profile.brand} official storefront product photography; external reference`,
      reviewedAt: checkedAt,
      usage: "external_reference",
    },
  };
}
