import { readFile, writeFile } from "node:fs/promises";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import type { Product } from "../src/domain/catalog";
const input = JSON.parse(
  await readFile(
    "catalog/manifests/eyewear-ray-ban-2026-10-11-v1.observations.json",
    "utf8",
  ),
) as {
  checkedAt: string;
  observations: {
    model: string;
    upc: string;
    slug: string;
    name: string;
    frame: string;
    lenses: string;
    size?: string;
    polarization?: string;
    asset: string;
  }[];
};
const products: Product[] = [];
for (const observation of input.observations) {
  const { model, upc, slug, name, frame, lenses, size, polarization, asset } =
    observation;
  if (
    !/^RB\d{4}$/.test(model) ||
    !/^\d{12,13}$/.test(upc) ||
    !asset.includes(`0${model}__`)
  )
    throw new Error("Reviewed reference/media mismatch.");
  const source = `https://www.ray-ban.com/usa/sunglasses/${slug}/${upc}`;
  const image = `https://images2.ray-ban.com//prod-onecp-record-files/pieyewear/${asset}?impolicy=RB_Product_clone&width=720&bgc=%23f2f2f2`;
  const response = await fetch(image, {
    method: "HEAD",
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    throw new Error(`Reviewed photo unavailable for ${model}.`);
  products.push({
    id: `EYE-RB-${upc}`,
    name: `Ray-Ban ${name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} · ${model}`,
    category: "sunglasses",
    brand: "Ray-Ban",
    offerKind: "sandbox",
    provenance: "manufacturer_evidence",
    price: 20000,
    stock: 20,
    sponsored: false,
    color: frame,
    compatibleModels: [],
    source,
    familyId: `ray-ban:${model}`,
    description: `Manufacturer model ${model}, exact UPC ${upc}. Observed ${frame} frame and ${lenses} lenses. DALE is an independent test storefront with simulated prices and stock.`,
    specs: [
      `Model: ${model}; UPC: ${upc}`,
      `Frame colour: ${frame}`,
      `Lens colour: ${lenses}`,
      ...(size ? [`Manufacturer size label: ${size}`] : []),
      ...(polarization ? [`Selected lens: ${polarization}`] : []),
    ],
    attributes: {
      brand: "ray-ban",
      modelName: name.toLowerCase(),
      productType: "sunglasses",
      ...(polarization ? { polarization } : {}),
    },
    evidence: {
      checkedAt: input.checkedAt,
      region: "United States manufacturer selected variant",
      review: "specifications",
      missing: [
        "Frame geometry/material, numeric lens/bridge/temple dimensions, UV protection and individual fit are not verified.",
        "DALE prices and stock are simulated, not manufacturer retail prices or availability.",
        ...(size ? [] : ["Selected frame size is not recorded."]),
        ...(polarization ? [] : ["Selected polarization is not verified."]),
      ],
    },
    media: {
      url: image,
      source,
      alt: `Ray-Ban ${name}, ${model}, ${frame} manufacturer photograph`,
      attribution:
        "Product photograph © Ray-Ban/Luxottica; manufacturer reference",
      reviewedAt: input.checkedAt,
      usage: "external_reference",
    },
  });
  console.log(`Verified photograph for ${model}`);
}
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id: "eyewear-ray-ban-2026-10-11-v1",
  reviewedBy: "manufacturer-visible-variant-review",
  reviewedAt: input.checkedAt,
  approvedSourceHosts: ["www.ray-ban.com"],
  products,
});
await writeFile(
  "catalog/manifests/eyewear-ray-ban-2026-10-11-v1.json",
  JSON.stringify(manifest, null, 2) + "\n",
  { flag: "wx" },
);
