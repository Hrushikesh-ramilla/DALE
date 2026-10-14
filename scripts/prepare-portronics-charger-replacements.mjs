import { readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { tsImport } from "tsx/esm/api";
const { parseAnyCatalogManifest } = await tsImport(
  "../src/domain/catalog-manifest.ts",
  import.meta.url,
);
const feedText = await readFile(
  ".data/product-media-audit/manufacturer-feeds/www.portronics.com.json",
  "utf8",
);
const feed = JSON.parse(feedText);
const originals = JSON.parse(
  await readFile(
    "catalog/manifests/wall-chargers-core-2026-10-11-v2.json",
    "utf8",
  ),
).products;
// Individually reviewed manufacturer descriptions; do not infer full device compatibility.
const selections = [
  {
    oldSuffix: "ADAPTO-65-PRO",
    handle: "adapto-65b",
    sku: "POR-2954",
    watts: 65,
  },
  {
    oldSuffix: "ADAPTO-100",
    handle: "adapto-100-pro",
    sku: "POR-2955",
    watts: 100,
    ports: "3x USB-C + 1x USB-A",
    pd: true,
    gan: true,
  },
  {
    oldSuffix: "ADAPTO-45",
    handle: "adapto-45-plus",
    sku: "POR-3473",
    watts: 45,
    ports: "1x USB-C + 1x USB-A",
    pd: true,
    gan: true,
  },
  {
    oldSuffix: "ADAPTO-20",
    handle: "adapto-20b-1",
    sku: "POR-2021",
    watts: 20,
    ports: "1x USB-C + 1x USB-A",
    pd: true,
  },
];
const registryPath = "catalog/media/verified-product-images.json",
  registry = JSON.parse(await readFile(registryPath, "utf8"));
const products = [],
  replacements = [],
  evidence = [];
async function saveRegistry() {
  const temporary = registryPath + "." + process.pid + ".tmp";
  await writeFile(temporary, JSON.stringify(registry, null, 2) + "\n");
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await rename(temporary, registryPath);
      return;
    } catch (error) {
      if (
        !["UNKNOWN", "EBUSY", "EPERM", "EACCES"].includes(error.code) ||
        attempt === 5
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
}
for (const selection of selections) {
  const old = originals.find(
    (product) =>
      product.id ===
      "PROD-WALL-CHARGERS-PORTRONICS-PORTRONICS-" + selection.oldSuffix,
  );
  const item = feed.products.find(
    (product) => product.handle === selection.handle,
  );
  if (
    !old ||
    !item ||
    item.variants.length !== 1 ||
    item.variants[0].sku !== selection.sku
  )
    throw Error("Reviewed exact reference changed: " + selection.handle);
  const text = item.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  if (
    !text.includes(selection.watts + "W") ||
    !text.includes("PPS") ||
    !text.includes("White") ||
    (selection.gan && !text.includes("GaN"))
  )
    throw Error("Reviewed manufacturer facts missing");
  const image = item.images[0];
  if (!image?.src.startsWith("https://cdn.shopify.com/s/files/1/1603/9553/"))
    throw Error("Unreviewed media tenant");
  const source = "https://www.portronics.com/products/" + item.handle,
    id = "CHARGER-PORTRONICS-" + selection.sku;
  const attributes = {
    brand: "portronics",
    modelName: item.title.toLowerCase(),
    totalWatts: selection.watts,
    ppsSupported: true,
    ...(selection.ports ? { connectorType: selection.ports } : {}),
    ...(selection.gan ? { ganTechnology: true } : {}),
  };
  const product = {
    id,
    name: "Portronics " + item.title + " · " + selection.watts + "W · White",
    category: "chargers",
    leafType: "wall-chargers",
    modelName: item.title,
    skuVariant: "White",
    brand: "Portronics",
    color: "White",
    source,
    familyId: "portronics:" + item.id,
    provenance: "manufacturer_evidence",
    offerKind: "sandbox",
    description:
      "Manufacturer-identified charger and exact SKU photograph. DALE price, stock, payment and delivery are simulated; exact device charging rates require additional voltage and port-sharing evidence.",
    price: old.price,
    stock: 25,
    sponsored: false,
    compatibleModels: [],
    attributes,
    specs: [
      "Manufacturer: Portronics",
      "Model: " + item.title,
      "Manufacturer SKU: " + selection.sku,
      "Total output: " + selection.watts + "W",
      "PPS supported",
      ...(selection.ports ? ["Ports: " + selection.ports] : []),
      ...(selection.gan ? ["GaN technology"] : []),
    ],
    accessoryProtocols: {
      totalWatts: selection.watts,
      ppsSupported: true,
      ...(selection.pd ? { pdSupported: true } : {}),
    },
    deviceCompatibility: [],
    evidence: {
      checkedAt: "2026-10-14",
      region: "India manufacturer product description",
      missing: [
        "voltageProfiles",
        "pdVersion",
        "perPortPowerSharing",
        "deviceSpecificCompatibility",
      ],
      review: "specifications",
    },
    media: {
      url: image.src,
      source,
      alt: "Portronics " + item.title + " white charger",
      attribution:
        "Portronics manufacturer product photograph; external reference",
      reviewedAt: "2026-10-14",
      usage: "external_reference",
    },
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
      throw Error("Photograph unavailable");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10_000_000) throw Error("Oversized image");
    let output;
    for (const [width, quality] of [
      [960, 78],
      [800, 70],
      [640, 65],
    ]) {
      output = await sharp(bytes, { limitInputPixels: 40_000_000 })
        .rotate()
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
    if (output.length > 140000) throw Error("Image exceeds budget");
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
      sourceSku: selection.sku,
      attribution: product.media.attribution,
      reviewedAt: "2026-10-14",
      reviewMethod:
        "Exact sole manufacturer SKU and product primary photo; visual review pending",
      sha256: hash,
      bytes: output.length,
      width: meta.width,
      height: meta.height,
      verified: false,
    };
    await saveRegistry();
  }
  products.push(product);
  replacements.push({ oldProductId: old.id, newProductId: id });
  evidence.push({
    productId: id,
    source,
    manufacturerSku: selection.sku,
    manufacturerProductId: item.id,
    manufacturerVariantId: item.variants[0].id,
    sourceImage: image.src,
    feedSha256: createHash("sha256").update(feedText).digest("hex"),
    descriptionSha256: createHash("sha256")
      .update(item.body_html)
      .digest("hex"),
    reviewedFacts: attributes,
  });
}
const manifest = parseAnyCatalogManifest({
  schemaVersion: "catalog-manifest-v2",
  id: "chargers-portronics-media-repair-2026-10-14-v2",
  reviewedBy: "manufacturer-SKU-description-and-photo-review",
  reviewedAt: "2026-10-14",
  approvedSourceHosts: ["www.portronics.com"],
  products,
});
await writeFile(
  "catalog/media/evidence/portronics-replacement-batch.json",
  JSON.stringify(
    {
      manifest,
      replacements,
      evidence,
      publication:
        "not-published; visual review and atomic replacement required",
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify({ prepared: products.length, published: 0 }));
