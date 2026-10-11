import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import {
  parseRolexSource,
  rolexSourceReceipt,
} from "../src/server/rolex-source";
const paths = [
  "/watches/submariner/m124060-0001",
  "/watches/datejust/m126334-0033",
  "/watches/gmt-master-ii/m126710blnr-0003",
  "/watches/cosmograph-daytona/m126506-0001",
  "/watches/explorer/m224270-0001",
  "/watches/oyster-perpetual/m134303-0001",
  "/watches/day-date/m228236-0018",
  "/watches/sky-dweller/m336935-0008",
  "/watches/yacht-master/m226658-0001",
  "/watches/sea-dweller/m126603-0001",
];
const checkedAt = new Date().toISOString().slice(0, 10);
const products = [],
  observations = [];
for (const path of paths) {
  const response = await fetch(`https://www.rolex.com${path}`, {
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Manufacturer ${path} returned ${response.status}; no batch written.`,
    );
  const html = await response.text();
  if (Buffer.byteLength(html) > 3_000_000)
    throw new Error("Source review size limit exceeded.");
  const product = parseRolexSource(path, html, checkedAt);
  const media = await fetch(product.media!.url, {
    method: "HEAD",
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!media.ok || !media.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`Exact-reference photograph failed for ${path}.`);
  products.push(product);
  observations.push({
    ...rolexSourceReceipt(path, html),
    imageStatus: media.status,
    imageType: media.headers.get("content-type"),
  });
  console.log(`Reviewed ${product.name}`);
}
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id: process.argv[3] || `watches-rolex-${checkedAt}-v1`,
  reviewedBy: "manufacturer-structured-source-review",
  reviewedAt: checkedAt,
  approvedSourceHosts: ["www.rolex.com"],
  products,
});
const output =
  process.argv[2] || `catalog/manifests/watches-rolex-${checkedAt}-v1.json`;
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
  `Saved ${products.length} exact-model source records; publication remains separate.`,
);
