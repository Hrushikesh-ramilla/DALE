import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import {
  parseApplePhoneSource,
  applePhoneReceipt,
} from "../src/server/apple-phone-source";
const models = [
  ["148590", "iPhone 18 Pro"],
  ["148591", "iPhone 18 Pro Max"],
  ["126470", "iPhone 17e"],
  ["125091", "iPhone 17 Pro Max"],
  ["125090", "iPhone 17 Pro"],
  ["125092", "iPhone Air"],
  ["122208", "iPhone 16e"],
  ["121032", "iPhone 16 Pro Max"],
  ["121031", "iPhone 16 Pro"],
  ["121030", "iPhone 16 Plus"],
];
const checkedAt = new Date().toISOString().slice(0, 10),
  products = [],
  observations = [];
for (const [id, name] of models) {
  const response = await fetch(`https://support.apple.com/en-us/${id}`, {
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Manufacturer document ${id} returned ${response.status}; no batch written.`,
    );
  const html = await response.text();
  if (Buffer.byteLength(html) > 1_000_000)
    throw new Error("Source review size limit exceeded.");
  const product = parseApplePhoneSource(id, name, html, checkedAt);
  const media = await fetch(product.media!.url, {
    method: "HEAD",
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!media.ok || !media.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`Manufacturer photograph failed for ${name}.`);
  products.push(product);
  observations.push({
    ...applePhoneReceipt(id, html),
    imageStatus: media.status,
    imageType: media.headers.get("content-type"),
  });
  console.log(`Reviewed ${product.name}`);
}
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id: process.argv[3] || `phones-apple-${checkedAt}-v1`,
  reviewedBy: "manufacturer-technical-document-review",
  reviewedAt: checkedAt,
  approvedSourceHosts: ["support.apple.com"],
  products,
});
const output =
  process.argv[2] || `catalog/manifests/phones-apple-${checkedAt}-v1.json`;
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
  `Saved ${products.length} distinct reviewed phone models; publication remains separate.`,
);
