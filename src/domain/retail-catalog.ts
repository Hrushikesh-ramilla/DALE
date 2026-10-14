import { mentionedRetailTypes } from "./retail-types";
import type { Product } from "./catalog";
import type { RetailCategory } from "./departments";

// Merchant-authored engineering inventory. These are not verified branded products
// or a claim of physical stock. A variant is an independently purchasable SKU.
type Family = {
  name: string;
  price: number;
  material?: string;
  scent?: string;
  use: string;
  detail: string;
};
const families: Record<"clothing" | "fragrance" | "bags" | "home" | "beauty", Family[]> = {
  clothing: [
    {
      name: "Cotton Crew-Neck T-Shirt",
      price: 1800,
      material: "cotton",
      use: "casual",
      detail: "Regular fit; chest S 96 / M 104 / L 112 cm",
    },
    {
      name: "Linen Short-Sleeve Shirt",
      price: 4200,
      material: "linen",
      use: "summer",
      detail: "Relaxed fit; chest S 100 / M 108 / L 116 cm",
    },
    {
      name: "Merino Crew-Neck Sweater",
      price: 8500,
      material: "merino wool",
      use: "winter",
      detail: "Regular fit; chest S 96 / M 104 / L 112 cm",
    },
    {
      name: "Cotton Zip Hoodie",
      price: 4800,
      material: "cotton",
      use: "casual",
      detail: "Relaxed fit; chest S 100 / M 108 / L 116 cm",
    },
    {
      name: "Linen Midi Dress",
      price: 6800,
      material: "linen",
      use: "summer",
      detail: "Regular fit; bust S 88 / M 96 / L 104 cm",
    },
    {
      name: "Cotton Chino Trousers",
      price: 5200,
      material: "cotton",
      use: "office",
      detail: "Straight leg; waist S 76 / M 84 / L 92 cm",
    },
    {
      name: "Denim Straight-Leg Jeans",
      price: 5800,
      material: "denim",
      use: "casual",
      detail: "Straight leg; waist S 76 / M 84 / L 92 cm",
    },
    {
      name: "Wool-Blend Tailored Jacket",
      price: 12000,
      material: "wool blend",
      use: "office",
      detail: "Regular fit; chest S 96 / M 104 / L 112 cm",
    },
    {
      name: "Cotton Lounge Shorts",
      price: 2400,
      material: "cotton",
      use: "lounge",
      detail: "Elastic waist; waist S 76 / M 84 / L 92 cm",
    },
    {
      name: "Recycled-Polyester Rain Jacket",
      price: 7200,
      material: "recycled polyester",
      use: "outdoor",
      detail:
        "Relaxed fit; chest S 100 / M 108 / L 116 cm; no certified waterproof rating",
    },
    {
      name: "Cotton Ribbed Tank Top",
      price: 1600,
      material: "cotton",
      use: "summer",
      detail: "Regular fit; chest S 88 / M 96 / L 104 cm",
    },
    {
      name: "Cotton Oxford Shirt",
      price: 4600,
      material: "cotton",
      use: "office",
      detail: "Regular fit; chest S 96 / M 104 / L 112 cm",
    },
  ],
  fragrance: [
    {
      name: "Citrus Eau de Toilette",
      price: 2200,
      scent: "citrus",
      use: "daytime",
      detail: "Bergamot, lemon and cedar notes; eau de toilette",
    },
    {
      name: "Rose Eau de Parfum",
      price: 2800,
      scent: "floral",
      use: "evening",
      detail: "Rose, peony and musk notes; eau de parfum",
    },
    {
      name: "Cedar Eau de Parfum",
      price: 3000,
      scent: "woody",
      use: "evening",
      detail: "Cedar, vetiver and amber notes; eau de parfum",
    },
    {
      name: "Vanilla Eau de Parfum",
      price: 2600,
      scent: "gourmand",
      use: "evening",
      detail: "Vanilla, tonka and sandalwood notes; eau de parfum",
    },
    {
      name: "Green Tea Eau de Toilette",
      price: 2000,
      scent: "fresh",
      use: "daytime",
      detail: "Green tea, mint and citrus notes; eau de toilette",
    },
    {
      name: "Jasmine Eau de Parfum",
      price: 2800,
      scent: "floral",
      use: "evening",
      detail: "Jasmine, orange blossom and musk notes; eau de parfum",
    },
    {
      name: "Amber Eau de Parfum",
      price: 3200,
      scent: "amber",
      use: "evening",
      detail: "Amber, resin and vanilla notes; eau de parfum",
    },
    {
      name: "Vetiver Eau de Toilette",
      price: 2400,
      scent: "woody",
      use: "daytime",
      detail: "Vetiver, grapefruit and pepper notes; eau de toilette",
    },
    {
      name: "Marine Eau de Toilette",
      price: 2000,
      scent: "fresh",
      use: "daytime",
      detail: "Marine accord, sage and musk notes; eau de toilette",
    },
    {
      name: "Lavender Eau de Cologne",
      price: 1800,
      scent: "aromatic",
      use: "daytime",
      detail: "Lavender, rosemary and citrus notes; eau de cologne",
    },
    {
      name: "Spiced Leather Eau de Parfum",
      price: 3400,
      scent: "spicy",
      use: "evening",
      detail: "Cardamom, leather accord and cedar notes; eau de parfum",
    },
    {
      name: "Neroli Eau de Cologne",
      price: 2200,
      scent: "citrus",
      use: "daytime",
      detail: "Neroli, petitgrain and lemon notes; eau de cologne",
    },
  ],
  bags: [
    {
      name: "Canvas Everyday Tote",
      price: 2400,
      material: "canvas",
      use: "everyday",
      detail: "Open top; 38 x 32 x 12 cm",
    },
    {
      name: "Nylon Commuter Backpack",
      price: 5800,
      material: "nylon",
      use: "commute",
      detail:
        "Zip closure; 44 x 30 x 16 cm; check device dimensions separately",
    },
    {
      name: "Leather Crossbody Bag",
      price: 8800,
      material: "leather",
      use: "everyday",
      detail: "Adjustable strap; 24 x 18 x 8 cm",
    },
    {
      name: "Canvas Weekend Duffel",
      price: 6200,
      material: "canvas",
      use: "travel",
      detail: "Zip closure; 50 x 28 x 25 cm; airline limits vary",
    },
    {
      name: "Nylon Packing Cube Set",
      price: 2200,
      material: "nylon",
      use: "travel",
      detail: "Three zip cubes; largest 36 x 26 x 10 cm",
    },
    {
      name: "Leather Card Holder",
      price: 2800,
      material: "leather",
      use: "everyday",
      detail: "Four card slots; 10 x 7 cm",
    },
    {
      name: "Canvas Zip Pouch",
      price: 1400,
      material: "canvas",
      use: "everyday",
      detail: "Zip closure; 22 x 15 cm",
    },
    {
      name: "Nylon Belt Bag",
      price: 2600,
      material: "nylon",
      use: "outdoor",
      detail: "Adjustable strap; 25 x 14 x 7 cm",
    },
    {
      name: "Leather Travel Wallet",
      price: 4800,
      material: "leather",
      use: "travel",
      detail: "Passport pocket; 20 x 12 cm",
    },
    {
      name: "Canvas Roll-Top Backpack",
      price: 5400,
      material: "canvas",
      use: "commute",
      detail: "Roll closure; 45 x 30 x 14 cm",
    },
    {
      name: "Nylon Toiletry Bag",
      price: 2400,
      material: "nylon",
      use: "travel",
      detail: "Wipe-clean lining; 26 x 16 x 12 cm",
    },
    {
      name: "Canvas Grocery Tote",
      price: 1800,
      material: "canvas",
      use: "everyday",
      detail: "Wide handles; 40 x 36 x 15 cm",
    },
  ],
  home: [
    {
      name: "Cotton Waffle Bath Towel",
      price: 2400,
      material: "cotton",
      use: "bathroom",
      detail: "70 x 140 cm; machine washable",
    },
    {
      name: "Linen Cushion Cover",
      price: 2200,
      material: "linen",
      use: "living",
      detail: "45 x 45 cm; insert not included",
    },
    {
      name: "Ceramic Breakfast Bowl",
      price: 1600,
      material: "ceramic",
      use: "kitchen",
      detail: "600 ml; 16 cm diameter",
    },
    {
      name: "Stoneware Coffee Mug",
      price: 1400,
      material: "stoneware",
      use: "kitchen",
      detail: "350 ml; 9 cm height",
    },
    {
      name: "Glass Water Carafe",
      price: 2400,
      material: "glass",
      use: "kitchen",
      detail: "1 litre; 26 cm height",
    },
    {
      name: "Acacia Serving Board",
      price: 2800,
      material: "acacia wood",
      use: "kitchen",
      detail: "38 x 22 cm; hand wash only",
    },
    {
      name: "Cotton Throw Blanket",
      price: 4200,
      material: "cotton",
      use: "living",
      detail: "130 x 170 cm; machine washable",
    },
    {
      name: "Steel Desk Organizer",
      price: 2600,
      material: "steel",
      use: "office",
      detail: "24 x 16 x 12 cm",
    },
    {
      name: "Glass Bud Vase",
      price: 1800,
      material: "glass",
      use: "living",
      detail: "18 cm height; 8 cm base",
    },
    {
      name: "Bamboo Storage Box",
      price: 3200,
      material: "bamboo",
      use: "storage",
      detail: "30 x 20 x 15 cm; removable lid",
    },
    {
      name: "Cotton Table Runner",
      price: 2200,
      material: "cotton",
      use: "kitchen",
      detail: "35 x 180 cm; machine washable",
    },
    {
      name: "Steel Bookends",
      price: 2400,
      material: "steel",
      use: "office",
      detail: "Pair; each 15 x 12 x 12 cm",
    },
  ],
  beauty: [
    {
      name: "Glycerin Hand Wash",
      price: 1200,
      use: "hands",
      detail:
        "Listed ingredients: water, sodium laureth sulfate, glycerin, fragrance; rinse off",
    },
    {
      name: "Shea Hand Cream",
      price: 1400,
      use: "hands",
      detail: "Listed ingredients: water, shea butter, glycerin, fragrance",
    },
    {
      name: "Oat Body Lotion",
      price: 1800,
      use: "body",
      detail:
        "Listed ingredients: water, glycerin, oat extract, cetearyl alcohol",
    },
    {
      name: "Aloe Shower Gel",
      price: 1400,
      use: "body",
      detail:
        "Listed ingredients: water, sodium laureth sulfate, aloe extract, fragrance",
    },
    {
      name: "Coconut Hair Conditioner",
      price: 1800,
      use: "hair",
      detail:
        "Listed ingredients: water, cetearyl alcohol, coconut oil, fragrance; rinse off",
    },
    {
      name: "Glycerin Facial Cleanser",
      price: 1800,
      use: "face",
      detail:
        "Listed ingredients: water, glycerin, cocamidopropyl betaine; rinse off",
    },
    {
      name: "Jojoba Body Oil",
      price: 2200,
      use: "body",
      detail: "Listed ingredients: jojoba oil, sunflower oil, tocopherol",
    },
    {
      name: "Rosewater Facial Mist",
      price: 1600,
      use: "face",
      detail: "Listed ingredients: water, rose hydrosol, phenoxyethanol",
    },
    {
      name: "Argan Hair Oil",
      price: 2400,
      use: "hair",
      detail: "Listed ingredients: argan oil, sunflower oil, tocopherol",
    },
    {
      name: "Cocoa Body Butter",
      price: 2200,
      use: "body",
      detail: "Listed ingredients: cocoa butter, shea butter, sunflower oil",
    },
    {
      name: "Mint Foot Cream",
      price: 1600,
      use: "feet",
      detail:
        "Listed ingredients: water, glycerin, cetearyl alcohol, mint extract",
    },
    {
      name: "Glycerin Shampoo",
      price: 1400,
      use: "hair",
      detail:
        "Listed ingredients: water, sodium laureth sulfate, glycerin, fragrance; rinse off",
    },
  ],
};
export const retailCatalog: Product[] = Object.entries(families).flatMap(
  ([category, entries], department) =>
    entries.flatMap((family, index) =>
      Array.from({ length: 3 }, (_, variant): Product => {
        const attributes = {
          productType: mentionedRetailTypes(
            family.name,
            category as RetailCategory,
          )[0],
          ...(family.material ? { material: family.material } : {}),
          ...(family.scent ? { scent: family.scent } : {}),
          use: family.use,
          ...(category === "clothing"
            ? { size: ["S", "M", "L"][variant] }
            : {}),
          ...(["fragrance", "beauty"].includes(category)
            ? { volumeMl: [30, 50, 100][variant] }
            : {}),
          ...(["bags", "home"].includes(category)
            ? { finish: ["Natural", "Charcoal", "Stone"][variant] }
            : {}),
        };
        const variantName =
          attributes.size ||
          (attributes.volumeMl
            ? `${attributes.volumeMl} ml`
            : attributes.finish);
        return {
          id: `L${String(department * 36 + index * 3 + variant + 1).padStart(3, "0")}`,
          familyId: `lifestyle:${category}:${index + 1}`,
          name: `${family.name} · ${variantName}`,
          category: category as RetailCategory,
          description: `${family.name} for ${family.use}. Merchant-authored sample specification; review the exact variant before approving.`,
          price:
            family.price +
            (["fragrance", "beauty"].includes(category) ? variant * 1000 : 0),
          compatibleModels: [],
          specs: [
            family.detail,
            `Variant: ${variantName}`,
            "30-day merchant review policy; issues remain reviewable",
          ],
          sponsored: false,
          stock: 20,
          color: "stone",
          attributes,
          source: `merchant:dale:lifestyle:${category}:${index + 1}:v1`,
          provenance: "merchant_sample",
        };
      }),
    ),
);
