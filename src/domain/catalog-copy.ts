import type { Product } from "./catalog";

const labels: Record<string, string> = {
  volumeMl: "Bottle size (ml)",
  storageGb: "Storage (GB)",
  ramGb: "Memory (GB)",
  displayInches: "Display diagonal (inches)",
  refreshHz: "Refresh rate (Hz)",
  batteryMah: "Battery capacity (mAh)",
  caseDiameterMm: "Case diameter (mm)",
  waterResistanceM: "Water resistance (m)",
  powerReserveHours: "Power reserve (hours)",
  maxWatts: "Maximum power (W)",
  usbCPDWatts: "USB-C PD power (W)",
  dataTransferGbps: "Data transfer (Gbps)",
  volumeLiters: "Capacity (litres)",
  dimensionsCm: "Dimensions (cm)",
  lensWidthMm: "Lens width (mm)",
  bridgeMm: "Bridge width (mm)",
  templeMm: "Temple length (mm)",
};
/** Copy editing only. Never infers a fact, variant, compatibility, or verification. */
export function cleanCatalogCopy(product: Product): Product {
  // Source-specific descriptions from actual reviews are already useful prose.
  if (
    !/Official manufacturer specification recorded from/i.test(
      product.description,
    )
  )
    return product;
  const brand = product.brand || "";
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const name = product.name
    .replace(/\s+/g, " ")
    .trim()
    .replace(new RegExp(`^(${escaped})\\s+${escaped}\\b`, "i"), "$1");
  const seen = new Set<string>();
  const specs = product.specs
    .filter(
      (s) =>
        !/^(?:brand|manufacturer|model|modelName|line|generation\s*\/\s*release):/i.test(
          s,
        ),
    )
    .map((s) => {
      const split = s.indexOf(":");
      if (split < 0) return s.trim();
      const key = s.slice(0, split).trim(),
        value = s.slice(split + 1).trim();
      const label =
        labels[key] ||
        key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/^./, (c) => c.toUpperCase());
      return `${label}: ${value}`;
    })
    .filter((s) => {
      const key = s.toLowerCase();
      if (!s || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const variant = product.skuVariant || product.color;
  const selected =
    variant && !/^(standard|default(?: title)?)$/i.test(variant)
      ? ` Selected variant: ${variant}.`
      : "";
  return {
    ...product,
    name,
    specs,
    description: `${name}.${selected}${specs.length ? " Recorded details: " + specs.slice(0, 3).join("; ") + "." : " Review the recorded product reference and selected variant."} DALE prices and stock are simulated sandbox offers.`,
  };
}
