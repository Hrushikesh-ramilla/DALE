export type Category = "chargers" | "docks" | "storage" | "audio" | "accessories";
export type Product = {
  id: string; name: string; category: Category; description: string; price: number;
  compatibleModels: string[]; specs: string[]; sponsored: boolean; stock: number;
  color: string; source: string;
};
export const models = ["Atlas 14", "Atlas 14 Pro", "Orbit 13", "Slate 11"];
const families: Omit<Product, "id" | "source">[] = [
  { name: "Everyday USB-C Charger", category: "chargers", description: "A compact 65W charger for a lighter everyday carry.", price: 2900, compatibleModels: ["Atlas 14", "Orbit 13"], specs: ["65W USB-C PD", "1.5m cable", "30-day returns"], sponsored: false, stock: 12, color: "mint" },
  { name: "Precision Barrel Charger", category: "chargers", description: "Dedicated barrel connector for the Slate series.", price: 2400, compatibleModels: ["Slate 11"], specs: ["45W barrel", "Slate connector", "30-day returns"], sponsored: true, stock: 8, color: "sand" },
  { name: "Power USB-C Charger", category: "chargers", description: "Extra headroom for power-intensive workstations.", price: 4900, compatibleModels: ["Atlas 14", "Atlas 14 Pro", "Orbit 13"], specs: ["100W USB-C PD", "Braided cable", "30-day returns"], sponsored: false, stock: 10, color: "blue" },
  { name: "Desk USB-C Dock", category: "docks", description: "Connect your desk in one step, with ports for the essentials.", price: 6900, compatibleModels: ["Atlas 14", "Atlas 14 Pro"], specs: ["DisplayPort alt mode", "HDMI + USB-A", "60W passthrough"], sponsored: false, stock: 7, color: "lilac" },
  { name: "Pocket SSD", category: "storage", description: "Keep your projects close with portable, fast storage.", price: 7900, compatibleModels: models, specs: ["512GB", "USB-C + USB-A", "Compact aluminum case"], sponsored: false, stock: 15, color: "blue" },
  { name: "Quiet Wireless Headphones", category: "audio", description: "A little more focus for work, travel, and everything between.", price: 5900, compatibleModels: models, specs: ["Bluetooth audio", "USB-C charging", "Fold-flat design"], sponsored: true, stock: 20, color: "sand" },
  { name: "Everyday Wireless Mouse", category: "accessories", description: "A comfortable companion for your everyday workspace.", price: 1900, compatibleModels: models, specs: ["Bluetooth", "Silent clicks", "Ambidextrous"], sponsored: false, stock: 24, color: "mint" },
  { name: "Travel USB-C Hub", category: "docks", description: "Small enough for your bag, useful enough for every desk.", price: 3900, compatibleModels: ["Atlas 14", "Atlas 14 Pro", "Orbit 13"], specs: ["USB-A + Ethernet", "Data ports", "No display output"], sponsored: false, stock: 9, color: "lilac" },
];
export const catalog: Product[] = Array.from({ length: 5 }, (_, variant) => families.map((family, i) => ({
  ...family, id: `P${String(variant * 8 + i + 1).padStart(3, "0")}`,
  name: family.name + (variant ? ` · Series ${variant + 1}` : ""), price: family.price + variant * 500,
  source: `catalog:${variant * 8 + i + 1}:v1`,
}))).flat();

export function productById(id: string): Product {
  const product = catalog.find((item) => item.id === id);
  if (!product) throw new Error("Unknown product");
  return product;
}

export function searchCatalog(input: { model: string; category?: string; budget: number; preference?: string }) {
  if (!models.includes(input.model)) return [];
  return catalog.filter((product) => product.compatibleModels.includes(input.model)
    && product.price <= input.budget && (!input.category || product.category === input.category))
    .sort((a, b) => {
      const aMatch = input.preference && a.specs.join(" ").toLowerCase().includes(input.preference.toLowerCase()) ? 1 : 0;
      const bMatch = input.preference && b.specs.join(" ").toLowerCase().includes(input.preference.toLowerCase()) ? 1 : 0;
      return Number(bMatch) - Number(aMatch) || a.price - b.price || a.id.localeCompare(b.id);
    });
}
