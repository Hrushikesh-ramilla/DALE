import { brandedCatalog } from "./branded-catalog";
import { briefSchema } from "./brief";
import { lifestyleProfile, type Category } from "./departments";
import type { VoiceIntent } from "./voice";

const aliases: Record<string, string[]> = {
  "maison francis kurkdjian": ["maison francis kurkdjian", "mfk"],
  "saint laurent": ["saint laurent", "ysl"],
  "louis vuitton": ["louis vuitton", "lv"],
  hermès: ["hermès", "hermes"],
  lancôme: ["lancôme", "lancome"],
};
const brands = [
  ...new Set([
    ...brandedCatalog.map((p) => p.brand!.toLowerCase()),
    "prada",
    "gucci",
    "creed",
    "amouage",
    "versace",
    "chanel",
    "guess",
    "oscar de la renta",
  ]),
];
const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const has = (text: string, phrase: string) =>
  ` ${normalized(text).replace(/[^a-z0-9°]+/g, " ")} `.includes(
    ` ${normalized(phrase).replace(/[^a-z0-9°]+/g, " ")} `,
  );
const categoryPatterns: [Category, RegExp][] = [
  ["phones", /\b(?:phones?|mobiles?|smartphones?|iphone)\b/i],
  ["laptops", /\b(?:laptops?|macbook)\b/i],
  ["tablets", /\b(?:tablets?|ipad)\b/i],
  ["fragrance", /\b(?:perfume|fragrance|eau de|cologne)\b/i],
  [
    "clothing",
    /\b(?:clothing|shirt|t-shirt|polo|jumper|sweater|dress|trousers)\b/i,
  ],
  ["bags", /\b(?:bag|bags|tote|crossbody|wallet|pouch)\b/i],
  ["beauty", /\b(?:beauty|skincare|serum|cleanser|cream)\b/i],
  ["home", /\b(?:mug|porcelain|homeware)\b/i],
  ["accessories", /\b(?:keyboard|mouse)\b/i],
  ["audio", /\b(?:headphones|headset)\b/i],
  ["storage", /\b(?:ssd|portable drive)\b/i],
];
export function brandedShopping(
  text: string,
  defaultBudget: number,
): VoiceIntent | undefined {
  const statedBrands = brands.filter((brand) =>
    (aliases[brand] || [brand]).some((alias) => has(text, alias)),
  );
  const named = brandedCatalog.filter(
    (p) => p.attributes?.modelName && has(text, p.attributes.modelName),
  );
  const categories = [
    ...new Set([
      ...named.map((p) => p.category),
      ...categoryPatterns
        .filter(([, regex]) => regex.test(text))
        .map(([category]) => category),
    ]),
  ];
  // Keep established device/accessory compatibility research on its existing path.
  if (
    /\b(?:charger|charging|adapter|dock|hub|cable|compatible|fits?|needs? power|power brick|wire)\b/i.test(
      text,
    )
  )
    return undefined;
  const devicePurchase = categories.some((c) =>
    ["phones", "laptops", "tablets"].includes(c),
  );
  if (!statedBrands.length && !named.length && !devicePurchase)
    return undefined;
  const clarify = (message: string): VoiceIntent => ({
    kind: "clarification",
    message,
  });
  if (/₹|\b(?:inr|rupees?|eur|euros?|gbp|pounds?)\b/i.test(text))
    return clarify(
      "DALE sandbox offers are currently denominated in USD. Confirm a USD budget; I will not guess an exchange rate.",
    );
  if (
    /\b(?:extrait|intense|elixir|bleu de chanel|coco mademoiselle|aventus cologne|silver mountain water|reflection 45|black|white|blue|pink|green|red|silver|gold|grey|gray)\b/i.test(
      text,
    )
  )
    return clarify(
      "That variant or colour needs an exact verified record. Choose the recorded variant; I will not silently replace it with a different one.",
    );
  if (categories.length !== 1)
    return clarify(
      "Which one product category should I compare? Each exact variant keeps its own approval.",
    );
  if (statedBrands.length > 1)
    return clarify(
      "Choose one brand filter, or ask for the category without brand restrictions to compare across houses.",
    );
  if (/\b(?:allerg|eczema|safe for|hypoallergenic|cure|treat)\b/i.test(text))
    return clarify(
      "I can show manufacturer ingredients, but cannot establish medical or allergy safety.",
    );
  if (
    /\b(?:without|except|exclude|at least|minimum|less than|more than)\b/i.test(
      text,
    )
  )
    return clarify(
      "Confirm exact values using the filters; I will not silently ignore an exclusion or minimum requirement.",
    );
  if (
    /\b(?:\d+(?:\.\d+)?\s*(?:hz|mah|inches|inch)|waterproof|water resistant|gaming|battery life|camera|refresh rate)\b/i.test(
      text,
    )
  )
    return clarify(
      "Those performance requirements need a specification comparison. Review the recorded manufacturer facts; I will not treat an unverified requirement as matched.",
    );
  const amounts = [
    ...text.matchAll(
      /(?:under|below|up to|budget(?: of| is|:)?|maximum(?: of| is|:)?)\s*\$?\s*(\d+(?:\.\d{1,2})?)/gi,
    ),
  ].map((m) => Math.round(Number(m[1]) * 100));
  if (new Set(amounts).size > 1)
    return clarify(
      "Choose one maximum budget in USD for these sandbox offers.",
    );
  const budget = amounts[0] ?? defaultBudget;
  if (budget < 1 || budget > 1000000)
    return clarify("Choose a sandbox budget between $0.01 and $10,000 USD.");
  const modelNames = [...new Set(named.map((p) => p.attributes!.modelName!))];
  if (
    devicePurchase &&
    /\b(?:iphone\s*\d+|galaxy\s+s\d+|xiaomi\s*\d+|oneplus\s*\d+|macbook\s+air\s+m\d+|ipad\s+(?:air|pro))\b/i.test(
      text,
    ) &&
    !modelNames.length
  )
    return clarify(
      "That exact model is not recorded. I will not substitute a different model; choose a sourced model from the category filters.",
    );
  if (/\biphone\s*17\s*(?:pro|max|plus|e)\b/i.test(text))
    return clarify(
      "The reviewed record is the base iPhone 17. That variant is not verified, so I will not substitute it.",
    );
  if (modelNames.length > 1)
    return clarify(
      "Choose one model filter, or compare the category without an exact-model restriction.",
    );
  const volumes = [...text.matchAll(/\b(\d+)\s*ml\b/gi)].map((m) =>
    Number(m[1]),
  );
  const sizes = [
    ...text.matchAll(/\bsize\s+(S|M|L|small|medium|large)\b/gi),
  ].map(
    (m) =>
      ({ small: "S", medium: "M", large: "L" })[m[1].toLowerCase()] ||
      m[1].toUpperCase(),
  );
  const statedSize = text.match(/\bsize\s+([a-z0-9]+)\b/i)?.[1];
  if (statedSize && !/^(s|m|l|small|medium|large)$/i.test(statedSize))
    return clarify(
      "That size is not verified in this collection. I will not substitute another size.",
    );
  const storage = [...text.matchAll(/\b(\d+)\s*gb\s*(?:storage|ssd)\b/gi)].map(
    (m) => Number(m[1]),
  );
  const ram = [...text.matchAll(/\b(\d+)\s*gb\s*(?:ram|memory)\b/gi)].map((m) =>
    Number(m[1]),
  );
  const bareGb = [
    ...text.matchAll(/\b(\d+)\s*gb\b(?!\s*(?:ram|memory|storage|ssd))/gi),
  ].map((m) => Number(m[1]));
  if (bareGb.length)
    return clarify(
      "Does that GB value mean RAM or storage? State, for example, 12GB RAM and 256GB storage.",
    );
  if (
    [volumes, sizes, storage, ram].some(
      (values) => new Set<string | number>(values).size > 1,
    )
  )
    return clarify(
      "Choose one exact size, volume, memory and storage value for this comparison.",
    );
  const category = categories[0];
  const scents = [
    "citrus",
    "floral",
    "woody",
    "gourmand",
    "fresh",
    "amber",
    "aromatic",
    "spicy",
  ].filter((v) => has(text, v));
  const materials = [
    "cotton",
    "linen",
    "leather",
    "canvas",
    "porcelain",
    "silk",
    "cashmere",
  ].filter((v) => has(text, v));
  if (scents.length > 1 || materials.length > 1)
    return clarify(
      "Choose one scent family or material filter; mixed materials remain in the specification text.",
    );
  const types = ["eau de parfum", "eau de toilette", "eau de cologne"].filter(
    (v, index) => has(text, v) || has(text, ["edp", "edt", "edc"][index]),
  );
  if (types.length > 1) return clarify("Choose one fragrance concentration.");
  const productType =
    category === "clothing"
      ? /t-?shirt/i.test(text)
        ? "t-shirt"
        : /\bpolo\b/i.test(text)
          ? "polo"
          : /\bshirt\b/i.test(text)
            ? "shirt"
            : /sweater|jumper/i.test(text)
              ? "sweater"
              : undefined
      : category === "beauty" && /serum/i.test(text)
        ? "serum"
        : category === "bags"
          ? /crossbody/i.test(text)
            ? "crossbody bag"
            : /tote/i.test(text)
              ? "tote"
              : /key pouch/i.test(text)
                ? "key pouch"
                : undefined
          : types[0];
  return {
    kind: "shopping",
    brief: briefSchema.parse({
      message: text,
      model: lifestyleProfile,
      category,
      budget,
      priority: "price",
      preference: "",
      requirements: {
        ...(statedBrands[0] ? { brand: statedBrands[0] } : {}),
        ...(modelNames[0] ? { modelName: modelNames[0] } : {}),
        ...(productType ? { productType } : {}),
        ...(types[0] ? { concentration: types[0] } : {}),
        ...(volumes[0] ? { volumeMl: volumes[0] } : {}),
        ...(sizes[0] ? { size: sizes[0] } : {}),
        ...(storage[0] ? { storageGb: storage[0] } : {}),
        ...(ram[0] ? { ramGb: ram[0] } : {}),
        ...(scents[0] ? { scent: scents[0] } : {}),
        ...(materials[0] ? { material: materials[0] } : {}),
      },
    }),
  };
}
