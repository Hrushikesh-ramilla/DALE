import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
const directory = path.resolve("public/images/products");
const output = path.resolve(".data/product-media-audit");
await mkdir(output, { recursive: true });
const products = (
  await Promise.all(
    (await readdir("catalog/manifests"))
      .filter((f) => f.endsWith(".json") && !f.includes("observations"))
      .map(async (f) => ({
        file: f,
        value: JSON.parse(
          await readFile(path.join("catalog/manifests", f), "utf8"),
        ),
      })),
  )
).flatMap(({ file, value }) =>
  (value.products || []).map((product) => ({ file, product })),
);
const images = [];
const names = (await readdir(directory)).filter((f) =>
  /\.(webp|png|jpg|jpeg|avif)$/i.test(f),
);
for (let offset = 0; offset < names.length; offset += 8) {
  images.push(
    ...(await Promise.all(
      names.slice(offset, offset + 8).map(async (filename) => {
        const bytes = await readFile(path.join(directory, filename));
        const hash = createHash("sha256").update(bytes).digest("hex");
        try {
          const meta = await sharp(bytes, {
            limitInputPixels: 40_000_000,
          }).metadata();
          return {
            filename,
            hash,
            bytes: bytes.length,
            width: meta.width,
            height: meta.height,
            format: meta.format,
            decoded: true,
          };
        } catch {
          return { filename, hash, bytes: bytes.length, decoded: false };
        }
      }),
    )),
  );
}
const byFilename = new Map(images.map((i) => [i.filename, i]));
const groups = new Map();
for (const image of images) {
  if (!groups.has(image.hash)) groups.set(image.hash, []);
  groups.get(image.hash).push(image.filename);
}
const records = products.map(({ file, product: p }) => {
  const url = p.media?.url || "";
  const filename = url.startsWith("/images/products/")
    ? url.slice("/images/products/".length)
    : null;
  const image = filename && byFilename.get(filename);
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    leafType: p.leafType || p.category,
    manifest: file,
    url,
    source: p.media?.source,
    imageHash: image?.hash,
    bytes: image?.bytes,
    decoded: !!image?.decoded,
    provenanceStatus:
      !p.media?.source || p.media.source.startsWith("/")
        ? "missing-external-product-image-evidence"
        : "requires-exact-model-review",
    duplicateFiles: image ? groups.get(image.hash).length : 0,
  };
});
const report = {
  at: new Date().toISOString(),
  summary: {
    productRecords: records.length,
    assets: images.length,
    distinctAssetHashes: groups.size,
    totalBytes: images.reduce((n, i) => n + i.bytes, 0),
    missingOrUndecodable: records.filter((r) => !r.decoded).length,
    missingExternalImageEvidence: records.filter(
      (r) => r.provenanceStatus === "missing-external-product-image-evidence",
    ).length,
    duplicateHashGroups: [...groups.values()].filter((g) => g.length > 1)
      .length,
  },
  records,
  images,
  duplicateGroups: [...groups]
    .filter(([, g]) => g.length > 1)
    .map(([hash, files]) => ({ hash, files })),
};
await writeFile(
  path.join(output, "inventory.json"),
  JSON.stringify(report, null, 2) + "\n",
);
// Offline contact sheets only: no remote downloads or invented product artwork.
const representatives = [...groups.values()].map((g) => g[0]);
for (let start = 0; start < representatives.length; start += 60) {
  const files = representatives.slice(start, start + 60);
  const cells = await Promise.all(
    files.map(async (filename, index) => {
      const x = (index % 6) * 240,
        y = Math.floor(index / 6) * 205;
      const thumbnail = await sharp(path.join(directory, filename))
        .resize(230, 165, { fit: "contain", background: "white" })
        .png()
        .toBuffer();
      const label = filename.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return [
        { input: thumbnail, left: x, top: y },
        {
          input: Buffer.from(
            `<svg width="240" height="40"><rect width="240" height="40" fill="white"/><text x="4" y="16" font-size="9">${label.slice(0, 42)}</text><text x="4" y="30" font-size="9">${label.slice(42, 84)}</text></svg>`,
          ),
          left: x,
          top: y + 165,
        },
      ];
    }),
  );
  await sharp({
    create: {
      width: 1440,
      height: Math.ceil(files.length / 6) * 205,
      channels: 3,
      background: "white",
    },
  })
    .composite(cells.flat())
    .png()
    .toFile(
      path.join(output, `sheet-${String(start / 60 + 1).padStart(3, "0")}.png`),
    );
}
console.log(JSON.stringify(report.summary));
