import type { RetailCategory } from "./departments";
export const retailTypes: Record<RetailCategory, string[]> = {
  phones: ["phone"],
  laptops: ["laptop"],
  tablets: ["tablet"],
  clothing: [
    "t-shirt",
    "shirt",
    "sweater",
    "hoodie",
    "dress",
    "trousers",
    "jeans",
    "jacket",
    "shorts",
    "tank top",
    "polo",
  ],
  fragrance: ["eau de toilette", "eau de parfum", "eau de cologne"],
  bags: [
    "tote",
    "backpack",
    "crossbody bag",
    "duffel",
    "packing cube",
    "card holder",
    "pouch",
    "belt bag",
    "wallet",
    "toiletry bag",
  ],
  home: [
    "towel",
    "cushion cover",
    "bowl",
    "mug",
    "carafe",
    "serving board",
    "blanket",
    "desk organizer",
    "vase",
    "storage box",
    "table runner",
    "bookends",
  ],
  beauty: [
    "serum",
    "hand wash",
    "hand cream",
    "body lotion",
    "shower gel",
    "conditioner",
    "facial cleanser",
    "body oil",
    "facial mist",
    "hair oil",
    "body butter",
    "foot cream",
    "shampoo",
  ],
};
export function mentionedRetailTypes(text: string, category: RetailCategory) {
  return retailTypes[category].filter((type) => {
    if (type === "shirt" && /\bt-?shirt/i.test(text)) return false;
    const pattern = type === "t-shirt" ? "t-?shirt" : type;
    return new RegExp(`\\b${pattern}s?\\b`, "i").test(text);
  });
}
