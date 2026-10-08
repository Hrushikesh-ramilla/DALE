import { realModels, realProducts } from "./research";
export type Category =
  "chargers" | "docks" | "storage" | "audio" | "accessories";
export type Product = {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  compatibleModels: string[];
  specs: string[];
  sponsored: boolean;
  stock: number;
  color: string;
  source: string;
};
export const models = ["Atlas 14", "Atlas 14 Pro", "Orbit 13", "Slate 11"];
export const knownModels = [...models, ...realModels];
export const deviceProfiles: Record<string, string> = {
  "Atlas 14": "USB-C Laptop (65W)",
  "Atlas 14 Pro": "USB-C Laptop (100W)",
  "Orbit 13": "USB-C Laptop (45W)",
  "Slate 11": "Barrel-jack Laptop (45W)",
};
export const deviceLabel = (model: string) => deviceProfiles[model] || model;
export function deviceText(text: string) {
  for (const model of [...models].sort((a, b) => b.length - a.length))
    text = text.replaceAll(model, deviceLabel(model));
  return text;
}
const families: Omit<Product, "id" | "source">[] = [
  {
    name: "65W USB-C Wall Charger",
    category: "chargers",
    description: "A compact 65W charger for a lighter everyday carry.",
    price: 2900,
    compatibleModels: ["Atlas 14", "Orbit 13"],
    specs: ["65W USB-C PD", "1.5m cable", "30-day returns"],
    sponsored: false,
    stock: 12,
    color: "mint",
  },
  {
    name: "45W Barrel Power Adapter",
    category: "chargers",
    description:
      "A dedicated power adapter for the 45W barrel-jack test profile.",
    price: 2400,
    compatibleModels: ["Slate 11"],
    specs: [
      "45W barrel connector",
      "Profile-specific connector",
      "30-day returns",
    ],
    sponsored: true,
    stock: 8,
    color: "sand",
  },
  {
    name: "100W USB-C Wall Charger",
    category: "chargers",
    description: "Extra headroom for power-intensive workstations.",
    price: 4900,
    compatibleModels: ["Atlas 14", "Atlas 14 Pro", "Orbit 13"],
    specs: ["100W USB-C PD", "Braided cable", "30-day returns"],
    sponsored: false,
    stock: 10,
    color: "blue",
  },
  {
    name: "USB-C HDMI Dock",
    category: "docks",
    description:
      "Connect your desk in one step, with ports for the essentials.",
    price: 6900,
    compatibleModels: ["Atlas 14", "Atlas 14 Pro"],
    specs: ["DisplayPort alt mode", "HDMI + USB-A", "60W passthrough"],
    sponsored: false,
    stock: 7,
    color: "lilac",
  },
  {
    name: "512GB Portable SSD",
    category: "storage",
    description: "Keep your projects close with portable, fast storage.",
    price: 7900,
    compatibleModels: models,
    specs: ["512GB", "USB-C + USB-A", "Compact aluminum case"],
    sponsored: false,
    stock: 15,
    color: "blue",
  },
  {
    name: "Bluetooth Over-Ear Headphones",
    category: "audio",
    description:
      "A little more focus for work, travel, and everything between.",
    price: 5900,
    compatibleModels: models,
    specs: ["Bluetooth audio", "USB-C charging", "Fold-flat design"],
    sponsored: true,
    stock: 20,
    color: "sand",
  },
  {
    name: "Silent Bluetooth Mouse",
    category: "accessories",
    description: "A comfortable companion for your everyday workspace.",
    price: 1900,
    compatibleModels: models,
    specs: ["Bluetooth", "Silent clicks", "Ambidextrous"],
    sponsored: false,
    stock: 24,
    color: "mint",
  },
  {
    name: "USB-C Ethernet Hub",
    category: "docks",
    description: "Small enough for your bag, useful enough for every desk.",
    price: 3900,
    compatibleModels: ["Atlas 14", "Atlas 14 Pro", "Orbit 13"],
    specs: ["USB-A + Ethernet", "Data ports", "No display output"],
    sponsored: false,
    stock: 9,
    color: "lilac",
  },
];
export const catalog: Product[] = Array.from({ length: 5 }, (_, variant) =>
  families.map((family, i) => ({
    ...family,
    id: `P${String(variant * 8 + i + 1).padStart(3, "0")}`,
    name:
      family.name +
      (variant
        ? ` · ${["", "Silver", "Ivory", "Midnight", "Stone"][variant]}`
        : ""),
    price: family.price + variant * 500,
    source: `catalog:${variant * 8 + i + 1}:v1`,
  })),
).flat();

export function productById(id: string): Product {
  const product = [...catalog, ...realProducts].find((item) => item.id === id);
  if (!product) throw new Error("Unknown product");
  return product;
}

export function searchCatalog(input: {
  model: string;
  category?: string;
  budget: number;
  preference?: string;
  priority?: "price" | "features";
  weights?: { price: number; features: number };
}) {
  if (
    input.weights &&
    (!Number.isFinite(input.weights.price + input.weights.features) ||
      input.weights.price + input.weights.features <= 0 ||
      Object.values(input.weights).some((weight) => weight < 0 || weight > 100))
  )
    throw new Error("Invalid shopper preference weights.");
  if (!knownModels.includes(input.model)) return [];
  return (realModels.includes(input.model) ? realProducts : catalog)
    .filter(
      (product) =>
        product.compatibleModels.includes(input.model) &&
        product.price <= input.budget &&
        (!input.category || product.category === input.category),
    )
    .sort((a, b) => {
      const aMatch =
        input.preference &&
        a.specs.join(" ").toLowerCase().includes(input.preference.toLowerCase())
          ? 1
          : 0;
      const bMatch =
        input.preference &&
        b.specs.join(" ").toLowerCase().includes(input.preference.toLowerCase())
          ? 1
          : 0;
      if (input.weights) {
        const total = input.weights.price + input.weights.features;
        // Eligibility precedes scoring; a cheaper incompatible item never ranks.
        const score = (product: Product, match: number) =>
          (input.weights!.price * (1 - product.price / input.budget) +
            input.weights!.features * match) /
          total;
        return (
          score(b, Number(bMatch)) - score(a, Number(aMatch)) ||
          a.price - b.price ||
          a.id.localeCompare(b.id)
        );
      }
      return (
        (input.priority === "features" ? Number(bMatch) - Number(aMatch) : 0) ||
        a.price - b.price ||
        Number(bMatch) - Number(aMatch) ||
        a.id.localeCompare(b.id)
      );
    });
}
