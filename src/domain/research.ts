import type { Product } from "./catalog";
import { deviceRegistry, deviceByModel } from "./device-registry";

export const realModels = deviceRegistry.map((device) => device.model);
export type Cable = "unknown" | "none" | "usb60" | "usb100" | "magsafe3";
export type ResearchNeed = {
  model: string;
  budget: number;
  cable: Cable;
  fastCharging: boolean;
};
export type ResearchSource = {
  id: string;
  title: string;
  url: string;
  checkedAt: string;
};
const checkedAt = "2026-10-07";
export const researchSources: ResearchSource[] = [
  {
    id: "airm1",
    title: "Apple · MacBook Air M1 (2020) specifications",
    url: "https://support.apple.com/en-us/111883",
    checkedAt: "2026-10-08",
  },
  {
    id: "prom1",
    title: "Apple · MacBook Pro 13-inch M1 (2020) specifications",
    url: "https://support.apple.com/en-us/111893",
    checkedAt: "2026-10-08",
  },
  {
    id: "air13",
    title: "Apple · MacBook Air M2 (2022) specifications",
    url: "https://support.apple.com/en-us/111867",
    checkedAt,
  },
  {
    id: "air15",
    title: "Apple · MacBook Air 15-inch M2 specifications",
    url: "https://support.apple.com/en-us/111346",
    checkedAt,
  },
  {
    id: "dynamic",
    title: "Apple · 40W Dynamic Power Adapter",
    url: "https://www.apple.com/shop/product/mgkn4am/a/40w-dynamic-power-adapter-with-60w-max",
    checkedAt,
  },
  {
    id: "70w",
    title: "Apple · 70W USB-C Power Adapter",
    url: "https://www.apple.com/shop/product/mxn53am/a/70w-usb-c-power-adapter",
    checkedAt,
  },
  {
    id: "cable60",
    title: "Apple · 60W USB-C Charge Cable (1 m)",
    url: "https://www.apple.com/shop/product/mw493am/a/60w-usb-c-charge-cable-1-m",
    checkedAt,
  },
];
export const realProducts: Product[] = [
  {
    id: "R001",
    name: "Apple 40W Dynamic Power Adapter",
    category: "chargers",
    description:
      "Manufacturer-listed for the 13-inch M2 Air. Cable sold separately; no MacBook fast-charge claim.",
    price: 3900,
    compatibleModels: [realModels[0], realModels[2]],
    specs: [
      "USB-C",
      "40W dynamic output; up to 60W peak",
      "Charging cable not included",
    ],
    sponsored: false,
    stock: 10,
    color: "ivory",
    source: "apple:dynamic:2026-10-07",
    brand: "Apple",
    media: {
      url: "/images/products/chargers-apple-40w-dynamic-adapter.webp",
      source: "/images/products/chargers-apple-40w-dynamic-adapter.webp",
      alt: "Apple 40W Dynamic Power Adapter official packshot",
      attribution: "Product photography © Apple",
      reviewedAt: "2026-10-13",
      usage: "licensed",
    },
  },
  {
    id: "R002",
    name: "Apple 70W USB-C Power Adapter",
    category: "chargers",
    description:
      "Apple lists both M2 Air sizes; fast charging requires a suitable cable.",
    price: 5900,
    compatibleModels: [...realModels],
    specs: [
      "70W USB-C",
      "MacBook Air fast charging with suitable cable",
      "Charging cable not included",
    ],
    sponsored: false,
    stock: 10,
    color: "ivory",
    source: "apple:70w:2026-10-07",
    brand: "Apple",
    media: {
      url: "/images/products/chargers-apple-70w-usbc-adapter.webp",
      source: "/images/products/chargers-apple-70w-usbc-adapter.webp",
      alt: "Apple 70W USB-C Power Adapter official packshot",
      attribution: "Product photography © Apple",
      reviewedAt: "2026-10-13",
      usage: "licensed",
    },
  },
  {
    id: "R003",
    name: "Apple 40W Adapter + 60W USB-C Cable",
    category: "chargers",
    description:
      "Simulated merchant bundle of two sourced Apple products for normal charging of the 13-inch M2 Air.",
    price: 5800,
    compatibleModels: [realModels[0], realModels[2]],
    specs: [
      "40W Dynamic Power Adapter",
      "60W USB-C charging cable, 1 m",
      "Normal charging; no MacBook fast-charge claim",
    ],
    sponsored: false,
    stock: 10,
    color: "ivory",
    source: "apple:dynamic+cable60:2026-10-07",
    brand: "Apple",
    media: {
      url: "/images/products/chargers-apple-40w-adapter-60w-cable.webp",
      source: "/images/products/chargers-apple-40w-adapter-60w-cable.webp",
      alt: "Apple 40W Adapter + 60W USB-C Cable official packshot",
      attribution: "Product photography © Apple",
      reviewedAt: "2026-10-13",
      usage: "licensed",
    },
  },
];
export type ResearchFinding = {
  productId: string;
  eligible: boolean;
  reasons: string[];
  sourceIds: string[];
  total: number;
};
export type ResearchReport = {
  need: ResearchNeed;
  findings: ResearchFinding[];
  sources: ResearchSource[];
  questions: string[];
  freshness: "current" | "expired";
  market: "US";
  priceBasis: string;
};
/** Recorded fit evidence stays tied to the qualified identity and technical facts.
 * Offer price, stock and display photography do not change that identity. */
export function matchesResearchEvidence(product: Product) {
  const reference = realProducts.find((p) => p.id === product.id);
  if (!reference) return false;
  const stable = (value: unknown): string =>
    JSON.stringify(value, (_, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
          )
        : v,
    );
  const identity = (p: Product) =>
    stable({
      name: p.name,
      category: p.category,
      modelName: p.modelName || null,
      specs: p.specs,
      source: p.source,
      attributes: p.attributes || {},
      compatibleModels: [...p.compatibleModels].sort(),
    });
  return identity(product) === identity(reference);
}

export function researchProducts(
  need: ResearchNeed,
  now = Date.now(),
): ResearchReport {
  const freshness =
    now >= Date.parse(checkedAt) && now - Date.parse(checkedAt) <= 30 * 86400000
      ? "current"
      : "expired";
  const questions: string[] = [];
  const device = deviceByModel(need.model);
  if (!realModels.includes(need.model))
    questions.push(
      "That exact device is not verified in the current evidence pack. Give the model and year; I will not substitute a sample profile.",
    );
  if (need.cable === "unknown")
    questions.push(
      "Do you already have a USB-C charging cable (60W or 100W+) or the original USB-C to MagSafe 3 cable, or do you need a cable included?",
    );
  if (freshness === "expired")
    questions.push(
      "The manufacturer evidence is older than 30 days. Refresh the evidence pack before reviewing a purchase.",
    );
  const findings = realProducts.map((product): ResearchFinding => {
    const reasons: string[] = [];
    if (!product.compatibleModels.includes(need.model))
      reasons.push(
        "Manufacturer compatibility for this exact model is not listed in the evidence pack.",
      );
    if (product.price > need.budget)
      reasons.push(
        `The complete offer exceeds your budget by $${((product.price - need.budget) / 100).toFixed(2)}.`,
      );
    if (need.cable === "none" && product.id !== "R003")
      reasons.push(
        "A charging cable is required and is not included. The adapter price alone is not a complete solution.",
      );
    if (need.cable === "unknown" && product.id !== "R003")
      reasons.push(
        "Confirm your existing cable before choosing an adapter-only offer.",
      );
    if (device && !device.magsafe3 && need.cable === "magsafe3")
      reasons.push(
        "This device charges through USB-C and does not have a MagSafe 3 charging port.",
      );
    if (device && device.normalWatts > 60 && need.cable === "usb60")
      reasons.push(
        "A 60W cable does not establish the device's sourced 61W normal charging configuration. Confirm a 100W+ cable.",
      );
    if (
      need.fastCharging &&
      (!device?.fastCharging ||
        product.id !== "R002" ||
        !["magsafe3", "usb100"].includes(need.cable))
    )
      reasons.push(
        "This combination does not establish Apple-supported MacBook fast charging; a 70W adapter and suitable cable are required.",
      );
    if (freshness === "expired")
      reasons.push("Source verification has expired.");
    const sourceIds = [
      ...(device ? [device.sourceId] : []),
      product.id === "R002" ? "70w" : "dynamic",
      ...(product.id === "R003" ? ["cable60"] : []),
    ];
    return {
      productId: product.id,
      eligible: !reasons.length && !questions.length,
      reasons,
      sourceIds,
      total: product.price,
    };
  });
  return {
    need,
    findings,
    sources: researchSources,
    questions,
    freshness,
    market: "US",
    priceBasis:
      "Manufacturer US reference prices checked 7 October 2026. Checkout uses a simulated DALE merchant offer with $0 demo tax/shipping; no Apple order or physical fulfillment.",
  };
}
