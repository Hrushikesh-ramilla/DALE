import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const profiles = [
  ["us.parfums-de-marly.com", "Parfums de Marly", "/s/files/1/0555/6279/7250/"],
  ["amouage.com", "Amouage", "/s/files/1/0823/5099/7796/"],
  ["us.initioparfums.com", "Initio", "/s/files/1/0607/4816/9444/"],
];
const normalize = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const modelName = (s) =>
  normalize(
    String(s).replace(
      /\b(?:eau de parfum|extrait de parfum|eau de toilette)\b/gi,
      "",
    ),
  );
const products = (
  await Promise.all(
    (await readdir("catalog/manifests"))
      .filter((f) => f.endsWith(".json") && !f.includes("observations"))
      .map(async (f) =>
        JSON.parse(await readFile("catalog/manifests/" + f, "utf8")),
      ),
  )
).flatMap((m) => m.products || []);
const registry = JSON.parse(
  await readFile("catalog/media/verified-product-images.json", "utf8"),
);
const candidates = [],
  unresolved = [];
for (const [host, brand, mediaPath] of profiles) {
  const sourceText = await readFile(
    ".data/product-media-audit/manufacturer-feeds/" + host + ".json",
    "utf8",
  );
  const feed = JSON.parse(sourceText);
  const sourceHash = createHash("sha256").update(sourceText).digest("hex");
  for (const p of products.filter(
    (p) => p.brand === brand && !registry.entries[p.id],
  )) {
    const source = new URL(p.source);
    const matches = feed.products.filter(
      (item) =>
        source.hostname === host &&
        source.pathname === "/products/" + item.handle &&
        modelName(item.title) ===
          modelName(p.attributes?.modelName || p.modelName || ""),
    );
    if (matches.length !== 1) {
      unresolved.push({
        id: p.id,
        reason: "exact source and model not uniquely matched",
      });
      continue;
    }
    const item = matches[0];
    const declaredVolumes = [p.skuVariant, p.color, p.name].flatMap((value) =>
      [...String(value || "").matchAll(/\b(\d+)\s*ml\b/gi)].map((match) =>
        Number(match[1]),
      ),
    );
    if (declaredVolumes.some((volume) => volume !== p.attributes?.volumeMl)) {
      unresolved.push({
        id: p.id,
        reason:
          "catalog volume contradicts selected/displayed bottle variant; repair facts before selecting photograph",
      });
      continue;
    }
    const variants = item.variants.filter(
      (v) =>
        /^\d+\s*ml$/i.test(v.title) &&
        parseInt(v.title) === p.attributes?.volumeMl &&
        v.sku,
    );
    if (variants.length !== 1) {
      unresolved.push({
        id: p.id,
        reason: "exact bottle volume/SKU missing or ambiguous",
      });
      continue;
    }
    const variant = variants[0];
    const image =
      item.images.find(
        (i) =>
          i.id === variant.featured_image?.id ||
          i.variant_ids?.includes(variant.id),
      ) || (item.variants.length === 1 ? item.images[0] : undefined);
    if (!image) {
      unresolved.push({ id: p.id, reason: "no variant-bound image" });
      continue;
    }
    const url = new URL(image.src);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "cdn.shopify.com" ||
      !url.pathname.startsWith(mediaPath) ||
      url.username ||
      url.password ||
      url.port
    ) {
      unresolved.push({ id: p.id, reason: "unreviewed media tenant" });
      continue;
    }
    candidates.push({
      id: p.id,
      images: [image.src],
      sourcePage: p.source,
      sourceHash,
      sku: variant.sku,
      manufacturerProductId: item.id,
      manufacturerVariantId: variant.id,
      volumeMl: p.attributes.volumeMl,
    });
  }
}
await writeFile(
  ".data/product-media-audit/feed-photo-candidates.json",
  JSON.stringify({ candidates, unresolved }, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    exactVariantCandidates: candidates.length,
    unresolved: unresolved.length,
    autoApproved: 0,
  }),
);
