import type { Product } from "./catalog";

export type WatchMovement =
  "automatic" | "mechanical" | "quartz" | "smartwatch" | "unknown";
/** A display/search classification of recorded movement text, not an inferred
 * manufacturer specification. Missing evidence remains unknown. */
export function classifyMovement(
  movement: string = "",
  specs: string[] = [],
): WatchMovement {
  const recorded =
    movement ||
    specs.filter((s) => /^(movement|calib(?:er|re))\s*:/i.test(s)).join(" ");
  if (/\bsmartwatch\b/i.test(recorded)) return "smartwatch";
  if (/\bquartz\b/i.test(recorded)) return "quartz";
  if (/\b(automatic|self[ -]winding)\b/i.test(recorded)) return "automatic";
  if (/\b(mechanical|manual|hand[ -](?:wound|wind|winding))\b/i.test(recorded))
    return "mechanical";
  return "unknown";
}
export function recordedAttributes(p: Product): Record<string, unknown> {
  if (p.category !== "watches") return { ...p.attributes };
  return {
    ...p.attributes,
    movement_class: classifyMovement(p.attributes?.movement, p.specs),
  };
}
