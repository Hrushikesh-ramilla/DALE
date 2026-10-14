import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import { parseMfkObservation } from "../src/server/mfk-source";
const path =
  process.argv[2] ||
  "catalog/manifests/fragrance-mfk-2026-10-11-v1.observations.json";
if (!path.endsWith(".observations.json"))
  throw new Error("Supply the reviewed observation file.");
const input = z
  .object({
    checkedAt: z.iso.date(),
    captureMethod: z.string().min(20),
    observations: z.array(z.unknown()).min(1).max(500),
  })
  .strict()
  .parse(JSON.parse(await readFile(path, "utf8")));
const products = input.observations.map((o) =>
  parseMfkObservation(o, input.checkedAt),
);
if (new Set(products.map((p) => p.familyId)).size !== products.length)
  throw new Error(
    "Distinct fragrance families are required; do not inflate model counts with sizes.",
  );
const id = path
  .split(/[\\/]/)
  .at(-1)!
  .replace(/\.observations\.json$/, "");
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id,
  reviewedBy: "manufacturer-visible-variant-review",
  reviewedAt: input.checkedAt,
  approvedSourceHosts: ["www.franciskurkdjian.com"],
  products,
});
await writeFile(
  path.replace(/\.observations\.json$/, ".json"),
  JSON.stringify(manifest, null, 2) + "\n",
  { flag: "wx" },
);
console.log(
  `Prepared ${products.length} distinct reviewed fragrance models; no source fact or media fallback was guessed.`,
);
