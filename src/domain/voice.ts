import { mentionedRetailTypes } from "./retail-types";
import { brandedShopping } from "./branded-shopping";
import { z } from "zod";
import { knownModels as models } from "./catalog";
import { mentionedModels } from "./identification";
import { briefSchema, type ShoppingBrief } from "./brief";
import { isRetailCategory, lifestyleProfile } from "./departments";
export const voiceRequest = z.object({
  transcript: z.string().trim().min(1).max(2000),
  model: z.enum(models as [string, ...string[]]),
  budget: z.number().int().min(1).max(1000000),
});
export type VoiceIntent =
  | { kind: "shopping"; brief: ShoppingBrief }
  | { kind: "navigate"; destination: "orders" | "support" }
  | {
      kind: "support_draft";
      text: string;
      reason?: "damaged" | "wrong_item" | "not_delivered" | "canceled";
      request?: "refund" | "replacement";
    }
  | { kind: "clarification" | "review_required"; message: string };
export function understandVoice(
  input: z.infer<typeof voiceRequest>,
): VoiceIntent {
  const words: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };
  const numberWords =
    "(?:" + Object.keys(words).join("|") + "|hundred|thousand|and)";
  function number(phrase: string) {
    let total = 0,
      part = 0;
    for (const word of phrase.toLowerCase().split(/[ -]+/)) {
      if (word === "hundred") part = (part || 1) * 100;
      else if (word === "thousand") {
        total += (part || 1) * 1000;
        part = 0;
      } else part += words[word] || 0;
    }
    return total + part;
  }
  const text = input.transcript
    .replace(
      new RegExp(
        "((?:under|below|up to|budget(?: of| is)?|maximum(?: of)?)\\s+)(" +
          numberWords +
          "(?:[ -]+" +
          numberWords +
          "){0,6})\\b",
        "gi",
      ),
      (_, prefix: string, phrase: string) => prefix + number(phrase),
    )
    .replace(
      new RegExp(
        "\\b(" +
          numberWords +
          "(?:[ -]+" +
          numberWords +
          "){0,3})\\s+watts?\\b",
        "gi",
      ),
      (_, phrase: string) => number(phrase) + "W",
    );
  if (/\b(?:euros?|pounds?|rupees?|inr|eur|gbp)\b|[â‚¬Â£â‚¹]/i.test(text))
    return {
      kind: "clarification",
      message:
        "This test catalog uses USD. Please state the maximum amount in US dollars.",
    };
  if (
    /\b(?:approve|pay|purchase|execute|run code|transfer|delete)\b/i.test(text)
  )
    return {
      kind: "review_required",
      message:
        "Voice cannot approve payments, execute code or authorize a financial remedy. Use the protected review controls.",
    };
  if (
    /\b(?:refund|replace|replacement|return|damaged|wrong item)\b/i.test(text)
  )
    return {
      kind: "support_draft",
      text,
      reason: /\bwrong (?:item|product)\b/i.test(text)
        ? "wrong_item"
        : /\bdamag(?:ed|e)\b/i.test(text)
          ? "damaged"
          : /\b(?:not arrived|not delivered|hasn't arrived)\b/i.test(text)
            ? "not_delivered"
            : /\bcancel/i.test(text)
              ? "canceled"
              : undefined,
      request: /\breplac(?:e|ement)\b/i.test(text)
        ? "replacement"
        : /\brefund\b/i.test(text)
          ? "refund"
          : undefined,
    };
  if (/\b(?:my orders?|track (?:my )?order|order status)\b/i.test(text))
    return { kind: "navigate", destination: "orders" };
  if (/\b(?:support|customer care|help with (?:my )?order)\b/i.test(text))
    return { kind: "navigate", destination: "support" };
  const branded = brandedShopping(text, input.budget);
  if (branded) return branded;
  const amounts = [
    ...text.matchAll(
      /(?:under|below|up to|budget(?: of| is)?|maximum(?: of)?)\s*\$?\s*(\d+(?:\.\d{1,2})?)(?:\s*(?:dollars?|usd))?/gi,
    ),
  ].map((match) => Math.round(Number(match[1]) * 100));
  if (new Set(amounts).size > 1)
    return {
      kind: "clarification",
      message:
        "I heard more than one budget. Please choose one maximum amount in USD.",
    };
  const budget = amounts[0] ?? input.budget;
  if (budget < 1 || budget > 100000)
    return {
      kind: "clarification",
      message: "Choose a maximum budget between $0.01 and $1,000 USD.",
    };
  const devices = mentionedModels(text);
  if (devices.length > 1)
    return {
      kind: "clarification",
      message:
        "I heard multiple device profiles. Choose the one this purchase is for.",
    };
  const categories = [
    ["chargers", /\b(?:chargers?|charging|power adapter)\b/i],
    ["storage", /\b(?:ssd|storage|drive)\b/i],
    ["audio", /\b(?:headphones?|audio|headset)\b/i],
    ["docks", /\b(?:docks?|hubs?|ethernet)\b/i],
    ["accessories", /\b(?:mouse|computer accessories)\b/i],
    [
      "clothing",
      /\b(?:clothes|clothing|t-?shirt|shirts?|sweater|hoodie|dress|trousers?|jeans|jacket|shorts|tank top)\b/i,
    ],
    ["fragrance", /\b(?:perfumes?|fragrances?|eau de|cologne)\b/i],
    [
      "bags",
      /\b(?:bags?|backpacks?|tote|duffel|wallet|pouch|card holder|packing cubes?)\b/i,
    ],
    [
      "home",
      /\b(?:towels?|cushions?|bowls?|mugs?|carafe|serving board|blanket|organizer|vase|storage box|table runner|bookends)\b/i,
    ],
    [
      "beauty",
      /\b(?:hand wash|hand cream|lotion|shower gel|conditioner|cleanser|body oil|facial mist|hair oil|body butter|foot cream|shampoo|beauty|skincare)\b/i,
    ],
  ] as const;
  const found = categories
    .filter(([, pattern]) => pattern.test(text))
    .filter(
      ([category]) => !(category === "storage" && /storage box/i.test(text)),
    );
  if (found.length !== 1)
    return {
      kind: "clarification",
      message:
        "Choose one product category to compare: electronics, clothing, fragrance, bags, home or beauty. Separate purchases keep each variant and approval clear.",
    };
  const retail = isRetailCategory(found[0][0]);
  const productTypes = retail
    ? mentionedRetailTypes(
        text,
        found[0][0] as import("./departments").RetailCategory,
      )
    : [];
  if (productTypes.length > 1)
    return {
      kind: "clarification",
      message:
        "Choose one exact product type for this comparison; each purchase keeps its own approval.",
    };
  const statedSize = text.match(/\bsize\s+([a-z0-9]+)\b/i)?.[1];
  if (
    retail &&
    found[0][0] === "clothing" &&
    statedSize &&
    !/^(?:s|m|l|small|medium|large)$/i.test(statedSize)
  )
    return {
      kind: "clarification",
      message:
        "That size is not recorded in this catalog. I will not substitute S, M or L for it.",
    };
  const sizes = [
    ...text.matchAll(/\bsize\s+(S|M|L|small|medium|large)\b/gi),
  ].map(
    (m) =>
      ({ small: "S", medium: "M", large: "L" })[m[1].toLowerCase()] ||
      m[1].toUpperCase(),
  );
  const volumes = [...text.matchAll(/\b(\d+)\s*ml\b/gi)].map((m) =>
    Number(m[1]),
  );
  const materials = [
    "cotton",
    "linen",
    "merino wool",
    "wool blend",
    "denim",
    "recycled polyester",
    "canvas",
    "nylon",
    "leather",
    "ceramic",
    "stoneware",
    "glass",
    "acacia wood",
    "steel",
    "bamboo",
  ].filter((v) => new RegExp(`\\b${v}\\b`, "i").test(text));
  const scents = [
    "citrus",
    "floral",
    "woody",
    "gourmand",
    "fresh",
    "amber",
    "aromatic",
    "spicy",
  ].filter((v) => new RegExp(`\\b${v}\\b`, "i").test(text));
  if (
    retail &&
    (new Set(sizes).size > 1 ||
      new Set(volumes).size > 1 ||
      materials.length > 1 ||
      scents.length > 1)
  )
    return {
      kind: "clarification",
      message:
        "You mentioned alternative attributes. Choose one size, volume, material or scent family for this comparison.",
    };
  if (
    retail &&
    /\b(?:allerg|cure|treat|eczema|safe for|hypoallergenic)\b/i.test(text)
  )
    return {
      kind: "clarification",
      message:
        "I can show recorded ingredients, but cannot establish medical or allergy safety. Which ingredient or product would you like to inspect?",
    };
  const requirements = retail
    ? {
        ...(productTypes[0] ? { productType: productTypes[0] } : {}),
        ...(sizes[0] && found[0][0] === "clothing" ? { size: sizes[0] } : {}),
        ...(volumes[0] && ["fragrance", "beauty"].includes(found[0][0])
          ? { volumeMl: volumes[0] }
          : {}),
        ...(materials[0] && ["clothing", "bags", "home"].includes(found[0][0])
          ? { material: materials[0] }
          : {}),
        ...(scents[0] && found[0][0] === "fragrance"
          ? { scent: scents[0] }
          : {}),
      }
    : undefined;
  const preference =
    text.match(/\b\d{2,3}\s*w\b/i)?.[0].replace(/\s/g, "") || "";
  return {
    kind: "shopping",
    brief: briefSchema.parse({
      message: text,
      model: retail ? lifestyleProfile : devices[0] || input.model,
      requirements,
      budget,
      category: found[0][0],
      preference,
      priority: preference ? "features" : "price",
    }),
  };
}
