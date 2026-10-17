export const categoryIds = [
  "phones",
  "laptops",
  "tablets",
  "chargers",
  "docks",
  "storage",
  "audio",
  "headphones",
  "earbuds",
  "accessories",
  "clothing",
  "fragrance",
  "bags",
  "home",
  "beauty",
  "watches",
  "footwear",
  "sunglasses",
  "appliances",
] as const;
export type Category = (typeof categoryIds)[number];
export const retailCategories = [
  "phones",
  "laptops",
  "tablets",
  "clothing",
  "fragrance",
  "bags",
  "home",
  "beauty",
  "watches",
  "footwear",
  "sunglasses",
  "appliances",
] as const;
export type RetailCategory = (typeof retailCategories)[number];
export const lifestyleProfile = "not-required";
export const isRetailCategory = (
  category?: string,
): category is RetailCategory =>
  retailCategories.some((value) => value === category);
export const categoryTitles: Record<Category, string> = {
  phones: "Mobile Phones",
  laptops: "Laptops",
  tablets: "Tablets",
  chargers: "Power & Charging",
  docks: "Desk & Connectivity",
  storage: "Storage",
  audio: "Audio & Speakers",
  headphones: "Headphones",
  earbuds: "Earphones & Earbuds",
  watches: "Watches",
  footwear: "Shoes",
  sunglasses: "Sunglasses",
  appliances: "Appliances",
  accessories: "Computer Accessories",
  clothing: "Clothing",
  fragrance: "Fragrance",
  bags: "Bags & Accessories",
  home: "Home & Living",
  beauty: "Beauty & Care",
};
export const departments = [
  {
    id: "electronics",
    title: "Electronics",
    categories: [
      "phones",
      "laptops",
      "tablets",
      "chargers",
      "docks",
      "storage",
      "audio",
      "headphones",
      "earbuds",
      "accessories",
    ],
    description:
      "Phones, laptops, tablets and peripherals. Compare recorded specifications; accessory compatibility needs separate evidence.",
  },
  {
    id: "clothing",
    title: "Clothing",
    categories: ["clothing"],
    description:
      "Everyday layers and occasion wear. Compare material, fit and the exact size variant.",
  },
  {
    id: "fragrance",
    title: "Fragrance",
    categories: ["fragrance"],
    description:
      "Explore scent families, concentration and bottle size. Personal enjoyment is never guaranteed.",
  },
  {
    id: "bags",
    title: "Bags & Accessories",
    categories: ["bags"],
    description:
      "Carry essentials by capacity, material and use. Check dimensions before committing.",
  },
  {
    id: "home",
    title: "Home & Living",
    categories: ["home"],
    description:
      "Useful objects for your space. Compare materials and dimensions rather than assumed fit.",
  },
  {
    id: "beauty",
    title: "Beauty & Care",
    categories: ["beauty"],
    description:
      "Routine essentials with stated ingredients and volume. No medical or allergy-safety promises.",
  },
  {
    id: "watches",
    title: "Watches",
    categories: ["watches"],
    description:
      "Compare exact references, movements, case dimensions and stated water resistance.",
  },
  {
    id: "footwear",
    title: "Shoes",
    categories: ["footwear"],
    description:
      "Compare construction, materials and sizing systems. Fit requires your measurements.",
  },
  {
    id: "eyewear",
    title: "Sunglasses",
    categories: ["sunglasses"],
    description:
      "Compare exact frames, lens treatments and measurements. Polarization is separate from UV protection.",
  },
  {
    id: "appliances",
    title: "Appliances",
    categories: ["appliances"],
    description:
      "Compare capacity, dimensions, voltage and manufacturer energy specifications.",
  },
] as const;

export const leafTypeKeys = [
  // Wave 1: Electronics Core (13)
  "phones",
  "laptops",
  "tablets",
  "headphones",
  "earbuds",
  "speakers",
  "wall-chargers",
  "power-banks",
  "portable-ssds",
  "internal-ssds",
  "hard-drives",
  "keyboards",
  "mice",
  // Wave 2: Electronics Remaining (8)
  "soundbars",
  "cables",
  "memory-cards",
  "usb-flash-drives",
  "monitors",
  "docks-hubs",
  "webcams",
  "routers",
  // Wave 3: Clothing (9)
  "shirts",
  "t-shirts",
  "knitwear",
  "trousers",
  "denim",
  "dresses",
  "suits",
  "jackets",
  "coats",
  // Wave 4: Lifestyle (15)
  "fragrance",
  "watches",
  "sunglasses",
  "handbags",
  "backpacks",
  "wallets",
  "loafers",
  "formal-shoes",
  "running-shoes",
  "lifestyle-sneakers",
  "boots",
  "cleansers",
  "serums",
  "moisturizers",
  "sunscreens",
  // Wave 5: Home & Appliances (5)
  "kitchenware",
  "decor",
  "home-textiles",
  "vacuum-cleaners",
  "air-purifiers",
] as const;

export type LeafTypeKey = (typeof leafTypeKeys)[number];

export const isLeafTypeKey = (key?: string): key is LeafTypeKey =>
  typeof key === "string" && (leafTypeKeys as readonly string[]).includes(key);

export const leafToParentCategory: Record<LeafTypeKey, Category> = {
  // Wave 1: Electronics Core
  phones: "phones",
  laptops: "laptops",
  tablets: "tablets",
  headphones: "headphones",
  earbuds: "earbuds",
  speakers: "audio",
  "wall-chargers": "chargers",
  "power-banks": "chargers",
  "portable-ssds": "storage",
  "internal-ssds": "storage",
  "hard-drives": "storage",
  keyboards: "accessories",
  mice: "accessories",
  // Wave 2: Electronics Remaining
  soundbars: "audio",
  cables: "accessories",
  "memory-cards": "storage",
  "usb-flash-drives": "storage",
  monitors: "accessories",
  "docks-hubs": "docks",
  webcams: "accessories",
  routers: "accessories",
  // Wave 3: Clothing
  shirts: "clothing",
  "t-shirts": "clothing",
  knitwear: "clothing",
  trousers: "clothing",
  denim: "clothing",
  dresses: "clothing",
  suits: "clothing",
  jackets: "clothing",
  coats: "clothing",
  // Wave 4: Lifestyle
  fragrance: "fragrance",
  watches: "watches",
  sunglasses: "sunglasses",
  handbags: "bags",
  backpacks: "bags",
  wallets: "bags",
  loafers: "footwear",
  "formal-shoes": "footwear",
  "running-shoes": "footwear",
  "lifestyle-sneakers": "footwear",
  boots: "footwear",
  cleansers: "beauty",
  serums: "beauty",
  moisturizers: "beauty",
  sunscreens: "beauty",
  // Wave 5: Home & Appliances
  kitchenware: "home",
  decor: "home",
  "home-textiles": "home",
  "vacuum-cleaners": "appliances",
  "air-purifiers": "appliances",
};

export const categoryToDefaultLeaf: Record<Category, LeafTypeKey> = {
  phones: "phones",
  laptops: "laptops",
  tablets: "tablets",
  chargers: "wall-chargers",
  docks: "docks-hubs",
  storage: "portable-ssds",
  audio: "speakers",
  headphones: "headphones",
  earbuds: "earbuds",
  accessories: "keyboards",
  clothing: "shirts",
  fragrance: "fragrance",
  bags: "handbags",
  home: "decor",
  beauty: "serums",
  watches: "watches",
  footwear: "lifestyle-sneakers",
  sunglasses: "sunglasses",
  appliances: "vacuum-cleaners",
};

export function resolveParentCategory(leafOrCategory: string): Category {
  if (isLeafTypeKey(leafOrCategory)) {
    return leafToParentCategory[leafOrCategory];
  }
  if ((categoryIds as readonly string[]).includes(leafOrCategory)) {
    return leafOrCategory as Category;
  }
  return "accessories";
}

