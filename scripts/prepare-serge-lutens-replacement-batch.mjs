import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { tsImport } from "tsx/esm/api";
const { parseAnyCatalogManifest } = await tsImport(
  "../src/domain/catalog-manifest.ts",
  import.meta.url,
);
const profile = process.argv[2] || "serge-lutens";
const profiles = {
  "serge-lutens": {
    host: "sergelutens.com",
    brand: "Serge Lutens",
    type: "FRAGRANCE",
    tenant: "/s/files/1/0631/1614/8926/",
  },
  amouage: {
    host: "amouage.com",
    brand: "Amouage",
    type: "EDP",
    tenant: "/s/files/1/0823/5099/7796/",
  },
};
const config = profiles[profile];
if (!config) throw Error("Unsupported reviewed manufacturer profile");
const feedText = await readFile(
  ".data/product-media-audit/manufacturer-feeds/" + config.host + ".json",
  "utf8",
);
const feed = JSON.parse(feedText);
const oldProducts = JSON.parse(
  await readFile("catalog/manifests/fragrance-core-2026-10-11-v2.json", "utf8"),
).products.filter((product) => product.brand === config.brand);
const registryPath = "catalog/media/verified-product-images.json",
  registry = JSON.parse(await readFile(registryPath, "utf8"));
const normalize = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(?:eau de parfum|extrait de parfum|eau de toilette)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
const products = [],
  evidence = [],
  replacements = [];
async function checkpointRegistry() {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await writeFile(registryPath, JSON.stringify(registry, null, 2) + "\n");
      return;
    } catch (error) {
      if (!["UNKNOWN", "EBUSY", "EPERM"].includes(error.code) || attempt === 5)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
}
for (const old of oldProducts) {
  const reviewedNames = {
    "PROD-FRAGRANCE-AMOUAGE-AMOUAGE-ROYAL-TOBACCO": "Opus XIV Royal Tobacco",
  };
  const reviewedName = reviewedNames[old.id] || old.attributes.modelName;
  const matches = feed.products.filter(
    (item) =>
      item.product_type === config.type &&
      normalize(item.title) === normalize(reviewedName) &&
      (!reviewedNames[old.id] ||
        old.source === "https://" + config.host + "/products/" + item.handle),
  );
  if (matches.length !== 1)
    throw Error("Manufacturer family absent or ambiguous: " + old.id);
  const item = matches[0];
  const variants = item.variants.filter(
    (variant) => /^\d+\s*ml$/i.test(variant.title) && variant.sku,
  );
  const variant =
    variants.find((variant) => parseInt(variant.title) === 100) ||
    variants.find((variant) => parseInt(variant.title) === 75);
  if (!variant)
    throw Error("No documented reviewable bottle variant for " + item.title);
  const volume = parseInt(variant.title),
    sku = String(variant.sku);
  const image =
    item.images.find(
      (image) =>
        image.src.includes(sku) &&
        new RegExp(volume + "ml", "i").test(image.src),
    ) ||
    (config.type === "EDP" &&
    item.variants.length === 1 &&
    item.variants[0].id === variant.id
      ? item.images[0]
      : undefined);
  if (
    !image ||
    !image.src.startsWith("https://cdn.shopify.com" + config.tenant)
  )
    throw Error("Exact SKU/volume photograph not supplied: " + item.title);
  const source = "https://" + config.host + "/products/" + item.handle;
  const id = "FRAGRANCE-" + profile.toUpperCase() + "-" + sku;
  const concentration =
    config.type === "EDP" ||
    item.tags.find((tag) => /^Product Type\|EAU DE PARFUM$/i.test(tag)) ||
    item.handle.includes("eau-de-parfum")
      ? "eau de parfum"
      : undefined;
  if (!concentration)
    throw Error("Recorded fragrance concentration not present: " + item.title);
  const family = item.tags
    .find((tag) => /^Olfactory Family\|/i.test(tag))
    ?.split("|")[1];
  const attributes = {
    brand: config.brand.toLowerCase(),
    modelName: item.title.toLowerCase(),
    volumeMl: volume,
    concentration,
    productType: concentration,
    ...(family ? { olfactoryFamily: family } : {}),
  };
  const product = {
    id,
    name:
      config.brand + " " + item.title + " · Eau de Parfum · " + volume + "ml",
    category: "fragrance",
    description:
      "Manufacturer-identified fragrance and exact bottle reference. DALE price, inventory, payments and fulfillment are sandbox offers.",
    price: Math.round(Number(variant.price) * 100),
    compatibleModels: [],
    specs: [
      "Manufacturer: " + config.brand,
      "Model: " + item.title,
      "Bottle volume: " + volume + "ml",
      "Concentration: Eau de Parfum",
      "Manufacturer SKU: " + sku,
      ...(family ? ["Manufacturer olfactory family: " + family] : []),
    ],
    sponsored: false,
    stock: 25,
    color: volume + "ml",
    source,
    familyId: profile + ":" + item.id,
    provenance: "manufacturer_evidence",
    brand: config.brand,
    offerKind: "sandbox",
    evidence: {
      checkedAt: "2026-10-14",
      region: "Manufacturer public catalog",
      missing: ["perfumer", "topNotes", "heartNotes", "baseNotes"],
      review: "specifications",
    },
    attributes,
    media: {
      url: image.src,
      source,
      alt: config.brand + " " + item.title + " " + volume + "ml",
      attribution:
        config.brand + " manufacturer product image; external reference",
      reviewedAt: "2026-10-14",
      usage: "external_reference",
    },
    leafType: "fragrance",
    modelName: item.title,
    skuVariant: volume + "ml",
  };
  if (!registry.entries[id]) {
    const response = await fetch(image.src, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw Error("Photo fetch failed " + item.title);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10_000_000) throw Error("Oversized image");
    let output;
    for (const [width, quality] of [
      [960, 78],
      [800, 70],
      [640, 65],
    ]) {
      output = await sharp(bytes, { limitInputPixels: 40_000_000 })
        .resize({
          width,
          height: width,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (output.length <= 140000) break;
    }
    if (output.length > 140000) throw Error("Photograph exceeds budget");
    const hash = createHash("sha256").update(output).digest("hex"),
      meta = await sharp(output).metadata(),
      url =
        "/images/verified/" +
        id.toLowerCase() +
        "-" +
        hash.slice(0, 16) +
        ".webp";
    await writeFile("public" + url, output);
    registry.entries[id] = {
      productName: product.name,
      brand: product.brand,
      color: product.color,
      attributes,
      url,
      alt: product.media.alt,
      sourcePage: source,
      sourceImage: image.src,
      sourceSku: sku,
      attribution: product.media.attribution,
      reviewedAt: "2026-10-14",
      reviewMethod:
        "manufacturer exact family, variant SKU and volume embedded in image identity; visual review pending",
      sha256: hash,
      bytes: output.length,
      width: meta.width,
      height: meta.height,
      verified: false,
    };
    await checkpointRegistry();
  }
  products.push(product);
  replacements.push({ oldProductId: old.id, newProductId: id });
  evidence.push({
    oldProductId: old.id,
    productId: id,
    source,
    manufacturerProductId: item.id,
    manufacturerVariantId: variant.id,
    manufacturerSku: sku,
    volumeMl: volume,
    sourceImage: image.src,
    feedSha256: createHash("sha256").update(feedText).digest("hex"),
  });
  console.log("Prepared manufacturer record and photograph: " + item.title);
}
const manifest = parseAnyCatalogManifest({
  schemaVersion: "catalog-manifest-v2",
  id: "fragrance-" + profile + "-media-repair-2026-10-14-v2",
  reviewedBy: "manufacturer-catalog-and-exact-variant-photo-review",
  reviewedAt: "2026-10-14",
  approvedSourceHosts: [config.host],
  products,
});
await writeFile(
  "catalog/media/evidence/" + profile + "-replacement-batch.json",
  JSON.stringify(
    {
      manifest,
      replacements,
      evidence,
      publication:
        "not-published; requires visual review and atomic offer replacement",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    prepared: products.length,
    published: 0,
    originalRecordsDeleted: 0,
  }),
);
