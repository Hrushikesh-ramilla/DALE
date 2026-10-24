import type { RetailCategory } from "./departments";
export const retailTypes: Record<RetailCategory, string[]> = {
  watches: ["watch"],
  footwear: ["sneaker", "loafer", "boot", "sandal", "dress shoe"],
  sunglasses: ["sunglasses"],
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
  fragrance: [
    "eau de toilette",
    "eau de parfum",
    "eau de cologne",
    "parfum",
    "extrait de parfum",
  ],
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
};
export function mentionedRetailTypes(text: string, category: RetailCategory) {
  return retailTypes[category].filter((type) => {
    if (type === "shirt" && /\bt-?shirt/i.test(text)) return false;
    const pattern = type === "t-shirt" ? "t-?shirt" : type;
    return new RegExp(`\\b${pattern}s?\\b`, "i").test(text);
  });
}
