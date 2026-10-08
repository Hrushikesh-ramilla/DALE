import { z } from "zod";

export const deviceRecordSchema = z
  .object({
    model: z.string().min(1),
    family: z.enum(["air", "pro"]),
    chip: z.string().min(1),
    year: z.number().int(),
    size: z.number(),
    normalWatts: z.number().positive(),
    magsafe3: z.boolean(),
    fastCharging: z.boolean(),
    sourceId: z.string(),
    aliases: z.array(z.string().min(1)).min(1),
  })
  .strict();
export type DeviceRecord = z.infer<typeof deviceRecordSchema>;
// Reviewed manufacturer facts. Adding a record does not require a new intent rule.
export const deviceRegistry: DeviceRecord[] = [
  {
    model: "MacBook Air (13-inch, M2, 2022)",
    family: "air",
    chip: "M2",
    year: 2022,
    size: 13,
    normalWatts: 30,
    magsafe3: true,
    fastCharging: true,
    sourceId: "air13",
    aliases: ["MacBook Air M2 13", "MacBook Air 13 M2", "MacBook Air 2022"],
  },
  {
    model: "MacBook Air (15-inch, M2, 2023)",
    family: "air",
    chip: "M2",
    year: 2023,
    size: 15,
    normalWatts: 35,
    magsafe3: true,
    fastCharging: true,
    sourceId: "air15",
    aliases: ["MacBook Air M2 15", "MacBook Air 15 M2"],
  },
  {
    model: "MacBook Air (M1, 2020)",
    family: "air",
    chip: "M1",
    year: 2020,
    size: 13,
    normalWatts: 30,
    magsafe3: false,
    fastCharging: false,
    sourceId: "airm1",
    aliases: ["MacBook Air M1", "MacBook Air 2020 M1"],
  },
  {
    model: "MacBook Pro (13-inch, M1, 2020)",
    family: "pro",
    chip: "M1",
    year: 2020,
    size: 13,
    normalWatts: 61,
    magsafe3: false,
    fastCharging: false,
    sourceId: "prom1",
    aliases: ["MacBook Pro M1 13", "MacBook Pro 13 M1", "MacBook Pro M1 2020"],
  },
].map((record) => deviceRecordSchema.parse(record));
export const normalizeDevice = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
export const deviceDescription = (text: string) =>
  text
    .replace(
      /\b(?:under|below|up to|budget(?: of| is|:)?|maximum(?: of| is|:)?)\s*\$?\s*\d+(?:\.\d{1,2})?\s*(?:usd|dollars?)?/gi,
      " ",
    )
    .replace(/[$₹€£]\s*\d+(?:\.\d{1,2})?/g, " ");
export function resolveDevices(text: string): DeviceRecord[] {
  const normalized = normalizeDevice(deviceDescription(text));
  const exact = deviceRegistry.filter((device) =>
    [device.model, ...device.aliases].some(
      (alias) => normalizeDevice(alias) === normalized,
    ),
  );
  if (exact.length) return exact;
  const sizes = [
    ...normalized.matchAll(/\b(13|15|14|16)(?:\.\d+)?(?:\s*inch)?\b/g),
  ].map((m) => Number(m[1]));
  const chips = [
    ...normalized.matchAll(/\bm\d+(?:\s+(?:pro|max|ultra))?\b/g),
  ].map((m) => m[0]);
  const years = [...normalized.matchAll(/\b20\d{2}\b/g)].map((m) =>
    Number(m[0]),
  );
  if (!/\bmacbook\b/.test(normalized) || (!chips.length && !years.length))
    return [];
  return deviceRegistry.filter(
    (device) =>
      (!/\bair\b/.test(normalized) || device.family === "air") &&
      (!/\bpro\b/.test(normalized) || device.family === "pro") &&
      (!sizes.length || sizes.includes(device.size)) &&
      (!chips.length || chips.includes(device.chip.toLowerCase())) &&
      (!years.length || years.includes(device.year)),
  );
}
export const deviceByModel = (model: string) =>
  deviceRegistry.find((d) => d.model === model);
