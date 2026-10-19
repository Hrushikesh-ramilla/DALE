import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const revision = "9547200";
const files = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", revision, "catalog/manifests"],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter((f) => f.endsWith(".json") && !f.includes("observations"));
const originals = files
  .flatMap(
    (file) =>
      JSON.parse(
        execFileSync("git", ["show", `${revision}:${file}`], {
          encoding: "utf8",
          maxBuffer: 10_000_000,
        }),
      ).products || [],
  )
  .filter((p) => p.media?.url?.startsWith("https://"));
const directory = "public/images/verified";
await mkdir(directory, { recursive: true });
await mkdir("catalog/media", { recursive: true });
await mkdir(".data/product-media-audit", { recursive: true });
const entries = {},
  failures = [];
const hosts = new Set([
  "assets2.oakley.com",
  "images2.ray-ban.com",
  "www.tissotwatches.com",
  "media.rolex.com",
  "cdsassets.apple.com",
  "www.franciskurkdjian.com",
  "cdn.shopify.com",
]);
let previous = {};
try {
  previous = JSON.parse(
    await readFile("catalog/media/verified-product-images.json", "utf8"),
  ).entries;
} catch {}
for (let start = 0; start < originals.length; start += 3) {
  await Promise.all(
    originals.slice(start, start + 3).map(async (p) => {
      if (previous[p.id]) {
        entries[p.id] = previous[p.id];
        return;
      }
      try {
        const url = new URL(p.media.url);
        if (
          url.protocol !== "https:" ||
          !hosts.has(url.hostname) ||
          url.username ||
          url.password
        )
          throw new Error("Unreviewed origin");
        const response = await fetch(url, {
          redirect: "error",
          signal: AbortSignal.timeout(20000),
        });
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/")
        )
          throw new Error(`Image HTTP ${response.status}`);
        const reader = response.body.getReader(),
          parts = [];
        let length = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.length;
          if (length > 10_000_000) {
            await reader.cancel();
            throw new Error("Source exceeds limit");
          }
          parts.push(value);
        }
        const bytes = Buffer.concat(parts);
        const meta = await sharp(bytes, {
          limitInputPixels: 40_000_000,
        }).metadata();
        if (
          !meta.width ||
          !meta.height ||
          meta.width < 150 ||
          meta.height < 150 ||
          !["jpeg", "png", "webp", "avif", "heif"].includes(meta.format)
        )
          throw new Error("Unsupported source dimensions/format");
        let optimized;
        for (const [width, quality] of [
          [960, 78],
          [960, 70],
          [800, 68],
          [640, 65],
        ]) {
          optimized = await sharp(bytes, { limitInputPixels: 40_000_000 })
            .rotate()
            .resize({
              width,
              height: width,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality, effort: 6 })
            .toBuffer();
          if (optimized.length <= 140_000) break;
        }
        if (optimized.length > 140_000)
          throw new Error("Optimized image exceeds budget");
        const hash = createHash("sha256").update(optimized).digest("hex");
        const filename = `${p.id.toLowerCase()}-${hash.slice(0, 16)}.webp`;
        await writeFile(`${directory}/${filename}`, optimized);
        const dimensions = await sharp(optimized).metadata();
        entries[p.id] = {
          productName: p.name,
          brand: p.brand,
          attributes: p.attributes || {},
          url: `/images/verified/${filename}`,
          alt: p.name,
          sourcePage: p.media.source,
          sourceImage: p.media.url,
          attribution: p.media.attribution,
          reviewedAt: new Date().toISOString().slice(0, 10),
          evidenceRevision: revision,
          reviewMethod:
            "retained-manufacturer-product-variant-observation; visual-review-pending",
          sha256: hash,
          bytes: optimized.length,
          width: dimensions.width,
          height: dimensions.height,
          verified: false,
        };
        console.log(`Recovered candidate: ${p.id}`);
      } catch (error) {
        failures.push({
          id: p.id,
          name: p.name,
          reason: String(error.message),
        });
      }
    }),
  );
  await writeFile(
    "catalog/media/verified-product-images.json",
    JSON.stringify({ schemaVersion: 1, entries }, null, 2) + "\n",
  );
}
await writeFile(
  ".data/product-media-audit/recovery.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      sourceRevision: revision,
      candidates: Object.keys(entries).length,
      failures,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    candidates: Object.keys(entries).length,
    failed: failures.length,
    total: originals.length,
  }),
);
