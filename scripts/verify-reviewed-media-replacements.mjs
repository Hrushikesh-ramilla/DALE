import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import sharp from "sharp";

const [base, ...paths] = process.argv.slice(2);
if (!base || !paths.length)
  throw Error(
    "Usage: verify-reviewed-media-replacements.mjs <base-url> <batch.json> [...]",
  );
const origin = new URL(base);
if (
  !["http:", "https:"].includes(origin.protocol) ||
  origin.username ||
  origin.password
)
  throw Error("Invalid application origin");
const registry = JSON.parse(
  await readFile("catalog/media/verified-product-images.json", "utf8"),
).entries;
async function get(path) {
  const response = await fetch(new URL(path, origin), {
    redirect: "error",
    signal: AbortSignal.timeout(60000),
  });
  assert.equal(response.status, 200, "Unexpected response for " + path);
  return response;
}
let checked = 0;
for (const path of paths) {
  const batch = JSON.parse(await readFile(path, "utf8"));
  for (const expected of batch.manifest.products) {
    const { product } = await (
      await get("/api/catalog/" + encodeURIComponent(expected.id))
    ).json();
    const image = registry[expected.id];
    assert.equal(product.id, expected.id);
    assert.equal(product.name, expected.name);
    assert.deepEqual(product.attributes, expected.attributes);
    assert.equal(product.media.url, image.url);
    assert.equal(product.media.source, expected.source);
    const bytes = Buffer.from(await (await get(image.url)).arrayBuffer());
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      image.sha256,
    );
    assert(bytes.length <= 140000);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert(metadata.width <= 960 && metadata.height <= 960);
    const mapping = batch.replacements.find(
      (item) => item.newProductId === expected.id,
    );
    assert(mapping, "Missing historical identity mapping");
    const old = await (
      await get("/api/catalog/" + encodeURIComponent(mapping.oldProductId))
    ).json();
    assert.equal(
      old.product.id,
      mapping.oldProductId,
      "Historical record must remain accessible",
    );
    checked++;
  }
}
console.log(
  JSON.stringify({
    checked,
    passed: checked,
    checks: [
      "API identity",
      "exact variant facts",
      "approved image binding",
      "served WebP hash and dimensions",
      "historical record retained",
    ],
    base: origin.origin,
  }),
);
