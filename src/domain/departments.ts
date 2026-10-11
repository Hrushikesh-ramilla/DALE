export const categoryIds = [
  "phones",
  "laptops",
  "tablets",
  "chargers",
  "docks",
  "storage",
  "audio",
  "accessories",
  "clothing",
  "fragrance",
  "bags",
  "home",
  "beauty",
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
  audio: "Sound & Focus",
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
] as const;
