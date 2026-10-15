import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { catalogManifestSchema } from "../src/domain/catalog-manifest";
import { catalogCheckpoint } from "./catalog-checkpoint";
import {
  parseManufacturerFragrance,
  normalizeFragranceName,
  isIndividualFragrance,
  feedProductIdentitySchema,
  type FragranceFeedProfile,
} from "../src/server/manufacturer-fragrance-feed";
const profiles: Record<string, FragranceFeedProfile & { models: string[] }> = {
  pdm: {
    key: "pdm",
    host: "us.parfums-de-marly.com",
    brand: "Parfums de Marly",
    mediaPath: "/s/files/1/0555/6279/7250/",
    concentration: "title",
    models: [
      "Herod",
      "Carlisle",
      "Althaïr",
      "Valaya",
      "Delina Exclusif",
      "Delina La Rosée",
      "Oriana",
      "Pegasus",
      "Pegasus Exclusif",
      "Percival",
      "Greenley",
      "Sedley",
      "Haltane",
      "Palatine",
    ],
  },
  amouage: {
    key: "amouage",
    host: "amouage.com",
    brand: "Amouage",
    mediaPath: "/s/files/1/0823/5099/7796/",
    concentration: "catalog_type",
    models: [
      "Interlude Man",
      "Epic Man",
      "Jubilation XXV Man",
      "Honour Man",
      "Dia Man",
      "Gold Man",
      "Honour Woman",
      "Dia Woman",
      "Gold Woman",
      "Guidance",
      "Purpose",
      "Existence",
      "Decision",
      "Lineage",
    ],
  },
  initio: {
    key: "initio",
    host: "us.initioparfums.com",
    brand: "Initio",
    mediaPath: "/s/files/1/0607/4816/9444/",
    concentration: "product_categories",
    models: [
      "OUD FOR GREATNESS",
      "OUD FOR GREATNESS NEO",
      "OUD FOR HAPPINESS",
      "SIDE EFFECT",
      "ATOMIC ROSE",
      "PSYCHEDELIC LOVE",
      "HIGH FREQUENCY",
      "ADDICTIVE VIBRATION",
      "BLESSED BARAKA",
      "NARCOTIC DELIGHT",
      "MYSTIC EXPERIENCE",
      "REHAB",
      "MUSK THERAPY",
      "PARAGON",
      "POWER SELF",
    ],
  },
};
const profile = profiles[process.argv[2]];
if (!profile)
  throw new Error("Supply approved manufacturer: pdm, amouage or initio.");
async function readSource(url: string, limit: number) {
  const origin = new URL(url).origin;
  let response: Response | undefined;
  for (let hop = 0; hop < 4; hop++) {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const next = new URL(response.headers.get("location") || "", url);
    await response.body?.cancel();
    if (hop === 3 || next.origin !== origin || next.username || next.password)
      throw new Error("Unreviewed manufacturer redirect.");
    url = next.href;
  }
  if (!response) throw new Error("Missing manufacturer response.");
  if (!response.ok)
    throw new Error(
      `Public manufacturer source returned ${response.status}; batch remains unpublished.`,
    );
  const reader = response.body!.getReader(),
    parts: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error("Manufacturer source exceeds review size limit.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts).toString("utf8");
}
const checkedAt = new Date().toISOString().slice(0, 10),
  feedUrl = `https://${profile.host}/products.json?limit=250`;
const feedText = await readSource(feedUrl, 5_000_000),
  feed = JSON.parse(feedText) as {
    products: {
      title: string;
      variants: { title: string }[];
      handle: string;
      product_type: string;
      tags: string[];
    }[];
  };
if (!Array.isArray(feed.products))
  throw new Error("Unexpected public manufacturer catalog.");
const products = [],
  observations = [];
const journal = await catalogCheckpoint(
  `.data/catalog-ingestion/fragrance-${profile.key}-${checkedAt}`,
  {
    profile,
    checkedAt,
    feedSha256: createHash("sha256").update(feedText).digest("hex"),
  },
);
for (const model of profile.models) {
  const retained = await journal.get<{
    product: ReturnType<typeof parseManufacturerFragrance>;
    observation: unknown;
  }>(model);
  if (retained) {
    products.push(retained.product);
    observations.push(retained.observation);
    console.log(`Resumed reviewed ${retained.product.name}`);
    continue;
  }
  const matches = feed.products.filter(
    (p) =>
      normalizeFragranceName(p.title) === normalizeFragranceName(model) &&
      isIndividualFragrance(p) &&
      p.variants.some(
        (v) => /^\d+\s*ml$/i.test(v.title) && parseInt(v.title) >= 50,
      ),
  );
  const preferred = matches.filter((p) =>
    p.variants.some((v) => /^100\s*ml$/i.test(v.title)),
  );
  const candidates = preferred.length ? preferred : matches;
  if (candidates.length !== 1)
    throw new Error(
      `Exact family ${model} is missing or ambiguous; no manifest written.`,
    );
  const item = candidates[0],
    source = `https://${profile.host}/products/${item.handle}`;
  const html = await readSource(source, 3_000_000);
  const product = parseManufacturerFragrance(profile, item, html, checkedAt);
  const image = await fetch(product.media!.url, {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (
    !image.ok ||
    !image.headers.get("content-type")?.startsWith("image/") ||
    Number(image.headers.get("content-length")) > 5_000_000
  )
    throw new Error(`Manufacturer photograph requires review for ${model}.`);
  products.push(product);
  const observation = {
    source,
    catalogProduct: feedProductIdentitySchema.parse(item),
    htmlSha256: createHash("sha256").update(html).digest("hex"),
    imageStatus: image.status,
    imageType: image.headers.get("content-type"),
    imageBytes: Number(image.headers.get("content-length")) || null,
  };
  await journal.put(model, { product, observation });
  observations.push(observation);
  console.log(`Reviewed ${product.name}`);
}
const id = `fragrance-${profile.key}-${checkedAt}-v1`;
const manifest = catalogManifestSchema.parse({
  schemaVersion: "catalog-manifest-v1",
  id,
  reviewedBy: "manufacturer-catalog-and-product-page-review",
  reviewedAt: checkedAt,
  approvedSourceHosts: [profile.host],
  products,
});
await mkdir("catalog/manifests", { recursive: true });
await writeFile(
  `catalog/manifests/${id}.json`,
  JSON.stringify(manifest, null, 2) + "\n",
  { flag: "wx" },
);
await writeFile(
  `catalog/manifests/${id}.observations.json`,
  JSON.stringify(
    {
      checkedAt,
      profile,
      feedUrl,
      feedSha256: createHash("sha256").update(feedText).digest("hex"),
      observations,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log(
  `Saved ${products.length} distinct manufacturer families; publication remains separate.`,
);
