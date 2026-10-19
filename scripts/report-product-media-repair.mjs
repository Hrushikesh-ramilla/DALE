import { readdir, readFile, writeFile } from "node:fs/promises";
import { tsImport } from "tsx/esm/api";
const { resolveVerifiedProductImage } = await tsImport("../src/domain/verified-product-image.ts",import.meta.url);

const root = ".data/product-media-audit";
const registry = JSON.parse(
  await readFile("catalog/media/verified-product-images.json", "utf8"),
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
const sourceResults = await Promise.all(
  (await readdir(root + "/source-review"))
    .filter((f) => f.endsWith(".json"))
    .map(async (f) =>
      JSON.parse(await readFile(root + "/source-review/" + f, "utf8")),
    ),
);
const sourceByProduct = new Map(
  sourceResults.flatMap((r) => (r.products || []).map((p) => [p.id, r.status])),
);
let classification = { records: [] };
try {
  classification = JSON.parse(
    await readFile(root + "/original-image-classification.json", "utf8"),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const originalByProduct = new Map(classification.records.map((r) => [r.id, r]));
let visualReviews = { records: [] };
try {
  visualReviews = JSON.parse(
    await readFile("catalog/media/original-image-visual-reviews.json", "utf8"),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const visualByProduct = new Map(visualReviews.records.map((r) => [r.id, r]));
const records = products.map((p) => {
  const image = registry.entries[p.id];
  const usableImage=resolveVerifiedProductImage(p,registry.entries);
  const original = originalByProduct.get(p.id);
  const visual = visualByProduct.get(p.id);
  const currentVisual =
    visual?.originalSha256 === original?.originalSha256 ? visual : undefined;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    leafType: p.leafType || p.category,
    sourcePage: p.source,
    sourceStatus: sourceByProduct.get(p.id) || "not-in-source-recovery-pass",
    originalImage: original?.originalImage || "",
    originalImageReview:
      currentVisual?.status || original?.status || "not-inspected",
    originalImageReviewReason: currentVisual?.reason || "",
    imageStatus: usableImage.url
      ? "approved"
      : image?.verified ? "record-repair-required"
      : image
        ? "candidate-not-approved"
        : "replacement-pending",
    reviewedImage: usableImage.url,
    reviewMethod: image?.reviewMethod || "",
  };
});
const counts = {};
for (const r of records) {
  counts[r.leafType] ||= { total: 0, approved: 0, pending: 0 };
  counts[r.leafType].total++;
  counts[r.leafType][r.imageStatus === "approved" ? "approved" : "pending"]++;
}
const result = {
  at: new Date().toISOString(),
  total: records.length,
  approved: records.filter((r) => r.imageStatus === "approved").length,
  approvedPhotographs:Object.values(registry.entries).filter(image=>image.verified).length,
  categories: counts,
  records,
};
await writeFile(
  root + "/repair-ledger.json",
  JSON.stringify(result, null, 2) + "\n",
);
const keys = [
  "id",
  "name",
  "brand",
  "leafType",
  "sourcePage",
  "sourceStatus",
  "originalImage",
  "originalImageReview",
  "originalImageReviewReason",
  "imageStatus",
  "reviewedImage",
  "reviewMethod",
];
const csv = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
await writeFile(
  root + "/repair-ledger.csv",
  keys.join(",") +
    "\n" +
    records.map((r) => keys.map((k) => csv(r[k])).join(",")).join("\n") +
    "\n",
);
console.log(
  JSON.stringify({
    total: result.total,
    approved: result.approved,
    pending: result.total - result.approved,
    ledger: root + "/repair-ledger.csv",
    recordsDeleted: 0,
  }),
);
