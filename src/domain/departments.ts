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
  "watches",
  "footwear",
  "sunglasses",
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
  "watches",
  "footwear",
  "sunglasses",
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
  accessories: "Computer Accessories",
  clothing: "Clothing",
  fragrance: "Fragrance",
  bags: "Bags & Accessories",
  home: "Home & Living",
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
] as const;

export const leafTypeKeys = [
  // Wave 1: Electronics Core (11)
  "phones",
  "laptops",
  "tablets",
  "headphones",
  "earbuds",
  "speakers",
  "wall-chargers",
  "power-banks",
  "portable-ssds",
  "keyboards",
  "mice",
  // Wave 2: Electronics Remaining (4)
  "soundbars",
  "cables",
  "monitors",
  "docks-hubs",
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
  // Wave 4: Lifestyle (11)
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
  // Wave 5: Home (3)
  "kitchenware",
  "decor",
  "home-textiles",
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
  keyboards: "accessories",
  mice: "accessories",
  // Wave 2: Electronics Remaining
  soundbars: "audio",
  cables: "accessories",
  monitors: "accessories",
  "docks-hubs": "docks",
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
  // Wave 5: Home
  kitchenware: "home",
  decor: "home",
  "home-textiles": "home",
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
  watches: "watches",
  footwear: "lifestyle-sneakers",
  sunglasses: "sunglasses",
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

export const leafTitles: Record<LeafTypeKey, string> = {
  phones: "Smartphones",
  laptops: "Laptops",
  tablets: "Tablets",
  headphones: "Over-Ear & On-Ear Headphones",
  earbuds: "Wireless Earbuds",
  speakers: "Portable & Home Speakers",
  "wall-chargers": "Wall Chargers & Power Adapters",
  "power-banks": "Power Banks",
  "portable-ssds": "Portable SSDs",
  keyboards: "Keyboards",
  mice: "Mice & Pointing Devices",
  soundbars: "Soundbars & Home Audio",
  cables: "Charging & Data Cables",
  monitors: "Computer Monitors",
  "docks-hubs": "USB-C Docks & Hubs",
  shirts: "Button-Down Shirts",
  "t-shirts": "T-Shirts",
  knitwear: "Sweaters & Knitwear",
  trousers: "Trousers & Chinos",
  denim: "Jeans & Denim",
  dresses: "Dresses",
  suits: "Suits & Tailoring",
  jackets: "Jackets & Blazers",
  coats: "Outerwear & Coats",
  fragrance: "Fragrances & Perfumes",
  watches: "Luxury & Precision Watches",
  sunglasses: "Sunglasses & Eyewear",
  handbags: "Handbags & Totes",
  backpacks: "Backpacks",
  wallets: "Wallets & Cardholders",
  loafers: "Loafers & Slip-Ons",
  "formal-shoes": "Dress & Formal Shoes",
  "running-shoes": "Running & Performance Shoes",
  "lifestyle-sneakers": "Lifestyle Sneakers",
  boots: "Boots",
  kitchenware: "Cookware & Kitchenware",
  decor: "Home Decor & Objects",
  "home-textiles": "Bedding & Home Textiles",
};

export function getCategoryLeafTypes(category: Category): LeafTypeKey[] {
  return leafTypeKeys.filter((leaf) => leafToParentCategory[leaf] === category);
}

export function getDepartmentById(id: string) {
  return departments.find((d) => d.id === id);
}

export function getDepartmentLeafs(deptId: string): LeafTypeKey[] {
  const dept = departments.find((d) => d.id === deptId);
  if (!dept) return [];
  const catSet = new Set<string>(dept.categories);
  return leafTypeKeys.filter((leaf) => catSet.has(leafToParentCategory[leaf]));
}

export function getDepartmentForLeaf(leaf: LeafTypeKey | string) {
  const parentCat = leafToParentCategory[leaf as LeafTypeKey] || leaf;
  return departments.find((d) => (d.categories as readonly string[]).includes(parentCat));
}


