import { z } from "zod";
import type { Product } from "./catalog";
import { categoryIds, leafTypeKeys, leafToParentCategory } from "./departments";

export const photoObservation = z.object({
  summary: z.string().trim().min(1).max(350),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(100),
        category: z.enum(categoryIds),
        leafType: z.enum(leafTypeKeys).nullable(),
        visibleBrand: z.string().trim().min(1).max(80).nullable(),
        visibleModel: z.string().trim().min(1).max(100).nullable(),
        visibleConcentration: z
          .enum([
            "eau de parfum",
            "eau de toilette",
            "eau de cologne",
            "extrait de parfum",
            "parfum",
          ])
          .nullable()
          .default(null),
        traits: z.array(z.string().trim().min(1).max(60)).max(8),
      }),
    )
    .max(4),
});
export type PhotoObservation = z.infer<typeof photoObservation>;
export type PhotoMatch = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  kind: "possible_identity" | "similar";
  reasons: string[];
};
export type PhotoDiscovery = {
  summary: string;
  items: (PhotoObservation["items"][number] & { matches: PhotoMatch[] })[];
};

const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const tokens = (text: string) =>
  normalize(text)
    .split(" ")
    .filter((t) => t.length > 1);
const contains = (text: string, phrase: string) =>
  ` ${normalize(text)} `.includes(` ${normalize(phrase)} `);

/** A product beside its own box is one identity, not two recommendations. */
export function coalescePhotoItems(items: PhotoObservation["items"]) {
  const result: PhotoObservation["items"] = [];
  for (const item of items) {
    const previous =
      item.visibleBrand && item.visibleModel
        ? result.find(
            (p) =>
              p.category === item.category &&
              normalize(p.visibleBrand || "") ===
                normalize(item.visibleBrand!) &&
              normalize(p.visibleModel || "") ===
                normalize(item.visibleModel!) &&
              (!p.visibleConcentration ||
                !item.visibleConcentration ||
                p.visibleConcentration === item.visibleConcentration),
          )
        : undefined;
    if (!previous) {
      result.push({ ...item });
      continue;
    }
    previous.visibleConcentration ||= item.visibleConcentration;
    if (
      /\b(box|packaging|carton)\b/i.test(previous.label) &&
      !/\b(box|packaging|carton)\b/i.test(item.label)
    ) {
      previous.label = item.label;
      previous.traits = item.traits;
    }
  }
  return result;
}

function recordedConcentration(product: Product) {
  const text = normalize(
    product.attributes?.concentration ||
      product.specs.find((s) => /^concentration\s*:/i.test(s)) ||
      product.name,
  );
  if (/\bextrait(?: de parfum)?\b/.test(text)) return "extrait de parfum";
  if (/\beau de parfum\b|\bedp\b/.test(text)) return "eau de parfum";
  if (/\beau de toilette\b|\bedt\b/.test(text)) return "eau de toilette";
  if (/\beau de cologne\b|\bedc\b/.test(text)) return "eau de cologne";
  if (/\bparfum\b/.test(text)) return "parfum";
  return null;
}

/** Observations are search hints, never proof of identity or specifications. */
export function matchPhotoItem(
  item: PhotoObservation["items"][number],
  products: Product[],
) {
  const leaf =
    item.leafType && leafToParentCategory[item.leafType] === item.category
      ? item.leafType
      : null;
  const scored = products
    .filter(
      (p) => p.category === item.category && (!leaf || p.leafType === leaf),
    )
    .map((p) => {
      const brand = p.brand || p.attributes?.brand || "";
      const brandMatch = Boolean(
        item.visibleBrand && normalize(brand) === normalize(item.visibleBrand),
      );
      // A legible different brand is a contradiction, not a similar match.
      if (item.visibleBrand && !brandMatch) return null;
      if (
        item.category === "fragrance" &&
        item.visibleConcentration &&
        recordedConcentration(p) !== item.visibleConcentration
      )
        return null;
      const identityText = [
        p.name,
        p.modelName,
        p.skuVariant,
        p.attributes?.modelName,
      ].join(" ");
      const modelTokens = tokens(item.visibleModel || "");
      const modelMatch =
        modelTokens.length > 0 &&
        modelTokens.every((t) => tokens(identityText).includes(t));
      const text = [
        identityText,
        p.description,
        p.color,
        ...p.specs,
        JSON.stringify(p.attributes || {}),
      ].join(" ");
      const traits = item.traits.filter((t) => contains(text, t));
      const traitWords = new Set(item.traits.flatMap(tokens));
      const words = new Set(tokens(text));
      const overlap = [...traitWords].filter((t) => words.has(t)).length;
      if (!brandMatch && !modelMatch && !overlap) return null;
      return {
        product: p,
        score:
          Number(modelMatch) * 100 +
          Number(brandMatch) * 20 +
          traits.length * 4 +
          overlap,
        kind:
          brandMatch && modelMatch
            ? ("possible_identity" as const)
            : ("similar" as const),
        reasons: [
          ...(brandMatch ? ["Visible brand matches listing"] : []),
          ...(item.category === "fragrance" && item.visibleConcentration
            ? [`Label concentration matches: ${item.visibleConcentration}`]
            : []),
          ...(modelMatch
            ? ["Model text matches listing; confirm variant"]
            : []),
          ...traits.slice(0, 3).map((t) => `Recorded detail: ${t}`),
        ],
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort(
      (a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id),
    );
  const identities = scored.filter((p) => p.kind === "possible_identity");
  return (identities.length ? identities : scored).slice(0, 4);
}
