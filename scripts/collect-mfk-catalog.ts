import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import { parseMfkSource, mfkSourceReceipt } from "../src/server/mfk-source";
// Exact links observed in the manufacturer's Eau de Parfum collection; colours/sizes are not new families.
const selected = [
  ["kurky-eau-de-parfum-RA12402", "Kurky"],
  ["grand-soir-eau-de-parfum-RA122521", "Grand Soir"],
  ["oud-eau-de-parfum-RA121221", "OUD"],
  ["oud-satin-mood-eau-de-parfum-RA122221", "OUD satin mood"],
  ["oud-silk-mood-eau-de-parfum-RA12172", "OUD silk mood"],
  ["724-eau-de-parfum-RA12352", "724"],
  ["a-la-rose-eau-de-parfum-RA128722", "À la rose"],
  ["lhomme-a-la-rose-eau-de-parfum-RA12312", "L'Homme À la rose"],
  ["amyris-femme-eau-de-parfum-RA121322", "Amyris femme"],
  ["feminin-pluriel-eau-de-parfum-RA122021", "féminin Pluriel"],
  ["petit-matin-eau-de-parfum-RA122421", "Petit Matin"],
  ["apom-eau-de-parfum-RA120421", "APOM"],
  ["absolue-pour-le-matin-eau-de-parfum-RA120621", "Absolue Pour le Matin"],
  ["absolue-pour-le-soir-eau-de-parfum-RA120721", "Absolue Pour le Soir"],
];
const checkedAt = new Date().toISOString().slice(0, 10),
  products = [],
  observations = [];
for (const [slug, name] of selected) {
  const source = `https://www.franciskurkdjian.com/us-en/p/${slug}.html`;
  const response = await fetch(source, {
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `Manufacturer returned ${response.status}; no manifest written.`,
    );
  const html = await response.text();
  if (Buffer.byteLength(html) > 2_000_000)
    throw new Error("Source exceeds review size limit.");
  const product = parseMfkSource(source, name, html, checkedAt);
  const image = await fetch(product.media!.url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  await image.body?.cancel();
  if (!image.ok || !image.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`Photograph needs review for ${name}.`);
  products.push(product);
  observations.push({
    ...mfkSourceReceipt(source, html),
    imageStatus: image.status,
    imageProbeMethod: "GET (body cancelled; no file downloaded)",
    imageType: image.headers.get("content-type"),
  });
  console.log(`Reviewed ${product.name}`);
}
const id = process.argv[3] || `fragrance-mfk-${checkedAt}-v1`;
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id,
  reviewedBy: "manufacturer-exact-fragrance-review",
  reviewedAt: checkedAt,
  approvedSourceHosts: ["www.franciskurkdjian.com"],
  products,
});
const output = process.argv[2] || `catalog/manifests/${id}.json`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(manifest, null, 2) + "\n", {
  flag: "wx",
});
await writeFile(
  output.replace(/\.json$/, ".observations.json"),
  JSON.stringify({ checkedAt, observations }, null, 2) + "\n",
  { flag: "wx" },
);
console.log(
  `Saved ${products.length} distinct fragrances for reviewed publication.`,
);
