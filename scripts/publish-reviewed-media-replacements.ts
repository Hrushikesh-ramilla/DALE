import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { z } from "zod";
import { parseAnyCatalogManifest } from "../src/domain/catalog-manifest";
import {
  resolveVerifiedProductImage,
  type VerifiedImage,
} from "../src/domain/verified-product-image";
import {
  stageCatalog,
  publishCatalog,
  type ReviewedOfferReplacement,
} from "../src/server/catalog-publishing";
import { getStoredProduct } from "../src/server/catalog-store";
import { closeDatabase, getDatabase } from "../src/server/database";

const [action, path] = process.argv.slice(2);
if (!path || !["review", "apply"].includes(action))
  throw new Error(
    "Usage: publish-reviewed-media-replacements.ts review|apply <batch.json>",
  );
try {
  const batch = z
    .object({
      manifest: z.unknown(),
      replacements: z.array(
        z
          .object({
            oldProductId: z.string().min(1),
            newProductId: z.string().min(1),
          })
          .strict(),
      ),
      evidence: z.array(
        z
          .object({
            productId: z.string(),
            manufacturerSku: z.string(),
            source: z.url(),
          })
          .passthrough(),
      ),
      publication: z.string(),
    })
    .strict()
    .parse(JSON.parse(await readFile(path, "utf8")));
  const manifest = parseAnyCatalogManifest(batch.manifest);
  const registry = JSON.parse(
    await readFile("catalog/media/verified-product-images.json", "utf8"),
  ).entries as Record<string, VerifiedImage>;
  if (
    manifest.products.length !== batch.replacements.length ||
    manifest.products.length !== batch.evidence.length
  )
    throw new Error("Every replacement needs its own reviewed evidence.");
  for (const product of manifest.products) {
    const evidence = batch.evidence.find(
      (item) => item.productId === product.id,
    );
    const image = resolveVerifiedProductImage(product, registry);
    if (
      !image.url ||
      !evidence ||
      image.source !== product.source ||
      image.source !== evidence.source ||
      registry[product.id]?.sourceSku !== evidence.manufacturerSku
    )
      throw new Error(
        "Exact reviewed manufacturer photo/identity required: " + product.id,
      );
  }
  const database = await getDatabase();
  const prior = await database.query<{
    payload: { releaseHash: string; replacements: ReviewedOfferReplacement[] };
  }>(
    "SELECT payload FROM catalog_operator_jobs WHERE id=$1 AND status='completed'",
    ["media-replacement:" + manifest.id],
  );
  const replacements: ReviewedOfferReplacement[] =
    prior.rows[0]?.payload.replacements ??
    (await Promise.all(
      batch.replacements.map(async (item) => ({
        ...item,
        expectedRecordHash: createHash("sha256")
          .update(JSON.stringify(await getStoredProduct(item.oldProductId)))
          .digest("hex"),
      })),
    ));
  if (
    replacements.length !== batch.replacements.length ||
    batch.replacements.some(
      (item, index) =>
        item.oldProductId !== replacements[index].oldProductId ||
        item.newProductId !== replacements[index].newProductId,
    )
  )
    throw new Error("Replacement audit differs from batch.");
  if (action === "apply") {
    const staged = await stageCatalog(manifest);
    await publishCatalog(staged.id, staged.hash, replacements);
  }
  console.log(
    JSON.stringify({
      status: action === "apply" ? "published" : "review-passed",
      products: manifest.products.length,
      originalRecordsDeleted: 0,
    }),
  );
} finally {
  await closeDatabase();
}
