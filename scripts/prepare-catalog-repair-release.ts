/** Offline preparation only. Never turns a failed request into a withdrawal. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parseAnyCatalogManifest } from "../src/domain/catalog-manifest";
import {
  resolveVerifiedProductImage,
  hasConsistentBottleVolume,
  type VerifiedImage,
} from "../src/domain/verified-product-image";
import type { Product } from "../src/domain/catalog";

const read = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const digest = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const baseline = read(".data/catalog-curation/live-before.json") as Product[];
const current = new Map(baseline.map((p) => [p.id, p]));
const registry = read("catalog/media/verified-product-images.json")
  .entries as Record<string, VerifiedImage>;
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  );
const operations: {
  oldId: string;
  expected: object;
  acceptedPreimages?: object[];
  product: Product;
  reason: string;
  evidence: object;
}[] = [];
const signature = (p: Product) => ({
  name: p.name,
  brand: p.brand,
  source: p.source,
  attributes: p.attributes,
});
for (const file of walk("catalog/media").filter((f) =>
  /batch[^/]*\.json$/.test(f),
)) {
  const batch = read(file);
  if (!batch.manifest || !Array.isArray(batch.replacements)) continue;
  const relevant = batch.replacements.filter((r: { oldProductId: string }) =>
    current.has(r.oldProductId),
  );
  if (!relevant.length) continue;
  const manifest = parseAnyCatalogManifest({
    ...batch.manifest,
    products: batch.manifest.products.filter((p: Product) =>
      relevant.some((r: { newProductId: string }) => r.newProductId === p.id),
    ),
  });
  for (const mapping of relevant) {
    const old = current.get(mapping.oldProductId)!;
    const product = manifest.products.find(
      (p) => p.id === mapping.newProductId,
    )! as Product;
    const entry = registry[product?.id];
    const image = product && resolveVerifiedProductImage(product, registry);
    const evidence = batch.evidence.find(
      (e: { productId: string }) => e.productId === product?.id,
    );
    if (
      !product ||
      !image?.url ||
      !entry ||
      !evidence ||
      entry.sourceSku !== evidence.manufacturerSku ||
      image.source !== evidence.source ||
      product.source !== evidence.source ||
      product.brand !== old.brand ||
      product.category !== old.category ||
      !hasConsistentBottleVolume(product) ||
      digest(readFileSync("public" + image.url)) !== entry.sha256
    )
      throw Error(`Invalid replacement binding: ${mapping.oldProductId}`);
    if (
      operations.some((o) => o.oldId === old.id || o.product.id === product.id)
    )
      throw Error("Duplicate replacement identity");
    product.media = {
      url: image.url,
      source: image.source,
      alt: image.alt,
      attribution: image.attribution,
      reviewedAt: image.reviewedAt,
      usage: "external_reference",
    };
    operations.push({
      oldId: old.id,
      expected: signature(old),
      product,
      reason:
        "Replace the ambiguous legacy offer with a separately identified manufacturer SKU and its reviewed photograph. Keep the historical record intact.",
      evidence: {
        ...evidence,
        photographSha256: entry.sha256,
        batch: file,
        reviewedAt: entry.reviewedAt,
      },
    });
  }
}
for (const repair of read("catalog/media/reviewed-bottle-repairs.json")
  .repairs) {
  const old = current.get(repair.productId);
  if (!old || operations.some((o) => o.oldId === old.id)) continue;
  if (
    old.attributes?.volumeMl !== repair.previousVolumeMl &&
    old.attributes?.volumeMl !== repair.volumeMl
  )
    throw Error("Stale bottle review: " + old.id);
  const product = structuredClone(old);
  product.attributes = { ...product.attributes, volumeMl: repair.volumeMl };
  product.source = repair.sourceUrl;
  product.specs = product.specs.map((s) =>
    /^volumeMl:/i.test(s) ? `Bottle size: ${repair.volumeMl} ml` : s,
  );
  const image = resolveVerifiedProductImage(product, registry),
    entry = registry[product.id];
  if (
    !image.url ||
    entry.sourceSku !== repair.manufacturerSku ||
    !hasConsistentBottleVolume(product) ||
    digest(readFileSync("public" + image.url)) !== entry.sha256
  )
    throw Error("Invalid bottle photograph: " + old.id);
  product.media = {
    ...old.media!,
    url: image.url,
    source: image.source,
    alt: product.name,
    reviewedAt: image.reviewedAt,
  };
  operations.push({
    oldId: old.id,
    expected: signature(old),
    product,
    reason: repair.operatorAudit,
    evidence: {
      source: repair.sourceUrl,
      manufacturerSku: repair.manufacturerSku,
      photographSha256: entry.sha256,
    },
  });
}
// Restore exact reviewed photos only when the full existing identity/variant
// still matches the image registry. No looser model-title inference is allowed.
for (const old of baseline) {
  if (operations.some((o) => o.oldId === old.id)) continue;
  const entry = registry[old.id],
    image = resolveVerifiedProductImage(old, registry);
  if (
    !image.url ||
    !entry ||
    digest(readFileSync("public" + image.url)) !== entry.sha256 ||
    old.media?.url === image.url
  )
    continue;
  const product = structuredClone(old);
  product.media = {
    url: image.url,
    source: image.source,
    alt: image.alt,
    attribution: image.attribution,
    reviewedAt: image.reviewedAt,
    usage: "external_reference",
  };
  operations.push({
    oldId: old.id,
    expected: signature(old),
    product,
    reason:
      "Restore the exact photograph for the existing reviewed product and selected variant; retain all product facts and inventory.",
    evidence: {
      source: entry.sourcePage,
      sourceImage: entry.sourceImage,
      manufacturerSku: entry.sourceSku,
      photographSha256: entry.sha256,
    },
  });
}
mkdirSync("catalog/repairs", { recursive: true });
for (const item of read(
  "catalog/repairs/recovered-references-2026-10-24.json",
)) {
  const product = item.product as Product;
  const image = resolveVerifiedProductImage(product, registry),
    entry = registry[product.id];
  if (
    !image.url ||
    !entry ||
    digest(readFileSync("public" + image.url)) !== entry.sha256 ||
    operations.some((o) => o.oldId === item.oldId)
  )
    throw Error("Invalid recovered reference: " + item.oldId);
  operations.push(item);
}
// Fresh installs use the checked-in baseline; the current preview may include
// earlier operator corrections. Accept only these two explicitly observed inputs.
const baselineRecords = new Map<string, Product>();
for (const file of readdirSync("catalog/manifests").filter((f) =>
  f.endsWith(".json"),
)) {
  try {
    const input = JSON.parse(
      execFileSync("git", ["show", "HEAD:catalog/manifests/" + file], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
    for (const product of input.products || [])
      baselineRecords.set(product.id, product);
  } catch {
    /* Untracked research files are not baseline inputs. */
  }
}
for (const operation of operations) {
  const previous = baselineRecords.get(operation.oldId);
  if (
    previous &&
    previous.brand === operation.product.brand &&
    previous.category === operation.product.category
  )
    operation.acceptedPreimages = [
      ...(operation.acceptedPreimages || []),
      signature(previous),
    ];
}
writeFileSync(
  "catalog/repairs/repair-first-2026-10-24.json",
  JSON.stringify(
    {
      id: "repair-first-2026-10-24",
      policy:
        "Repair first. Only explicit source-bound changes are applied. Products absent from this plan remain untouched; HTTP errors are never withdrawal instructions.",
      operations,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    operations: operations.length,
    replacements: operations.filter((o) => o.oldId !== o.product.id).length,
    inPlace: operations.filter((o) => o.oldId === o.product.id).length,
    blanketWithdrawals: 0,
  }),
);
