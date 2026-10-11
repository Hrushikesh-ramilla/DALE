import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import {
  parseTissotSource,
  tissotSourceReceipt,
} from "../src/server/tissot-source";
const references = [
  "T1254171703100",
  "T1374101104100",
  "T1294103626100",
  "T1274101104100",
  "T0064072209300",
  "T1564101104100",
  "T1504101601100",
  "T1202171704100",
  "T1522231149600",
  "T0580093303100",
];
const checkedAt = new Date().toISOString().slice(0, 10);
const products = [];
const observations = [];
for (const reference of references) {
  const url = `https://www.tissotwatches.com/en-us/${reference}.html`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Manufacturer ${reference} returned ${response.status}; no batch was written.`,
    );
  const html = await response.text();
  if (Buffer.byteLength(html) > 2_000_000)
    throw new Error("Manufacturer response exceeds the review limit.");
  const product = parseTissotSource(reference, html, checkedAt);
  const media = await fetch(product.media!.url, {
    method: "HEAD",
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!media.ok || !media.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`Exact-reference photo failed for ${reference}.`);
  products.push(product);
  observations.push({
    ...tissotSourceReceipt(reference, html),
    imageStatus: media.status,
    imageType: media.headers.get("content-type"),
  });
  console.log(`Reviewed ${reference}: ${product.name}`);
}
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id: process.argv[3] || `watches-tissot-${checkedAt}-v1`,
  reviewedBy: "manufacturer-structured-source-review",
  reviewedAt: checkedAt,
  approvedSourceHosts: ["www.tissotwatches.com"],
  products,
});
const output =
  process.argv[2] || `catalog/manifests/watches-tissot-${checkedAt}-v1.json`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(manifest, null, 2) + "\n", {
  flag: "wx",
});
await writeFile(
  output.replace(/\.json$/, ".observations.json"),
  JSON.stringify({ checkedAt, observations }, null, 2) + "\n",
);
console.log(
  `Saved ${products.length} reviewed exact-reference records. Publication remains a separate step.`,
);
