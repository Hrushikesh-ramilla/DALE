import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  createProductRevision,
  getProductRevisions,
} from "../src/server/catalog-publishing";
import { getStoredProduct } from "../src/server/catalog-store";
import { closeDatabase } from "../src/server/database";
import {
  hasConsistentBottleVolume,
  resolveVerifiedProductImage,
  type VerifiedImage,
} from "../src/domain/verified-product-image";

const schema = z
  .object({
    repairs: z.array(
      z
        .object({
          productId: z.string().min(1),
          revisionId: z.string().min(1),
          previousVolumeMl: z.number().positive(),
          volumeMl: z.number().positive(),
          sourceUrl: z
            .url()
            .refine((value) => new URL(value).protocol === "https:"),
          manufacturerSku: z.string().min(1),
          operatorAudit: z.string().min(20),
        })
        .strict(),
    ),
  })
  .strict();
const [action, path] = process.argv.slice(2);
if (!path || !["review", "apply"].includes(action))
  throw new Error(
    "Usage: apply-reviewed-media-repairs.ts review|apply <reviewed-repairs.json>",
  );
try {
  const plan = schema.parse(JSON.parse(await readFile(path, "utf8")));
  const registry = JSON.parse(
    await readFile("catalog/media/verified-product-images.json", "utf8"),
  ).entries as Record<string, VerifiedImage>;
  for (const repair of plan.repairs) {
    const revisions = await getProductRevisions(repair.productId);
    const current = await getStoredProduct(repair.productId);
    if (
      revisions.some((revision) => revision.revision_id === repair.revisionId)
    ) {
      if (
        current.attributes?.volumeMl !== repair.volumeMl ||
        current.source !== repair.sourceUrl ||
        !resolveVerifiedProductImage(current, registry).url
      )
        throw new Error(
          "Previously reviewed repair no longer matches current product: " +
            repair.productId,
        );
      console.log(
        JSON.stringify({
          productId: repair.productId,
          status: "already-applied",
        }),
      );
      continue;
    }
    if (current.attributes?.volumeMl !== repair.previousVolumeMl)
      throw new Error("Reviewed preimage differs for " + repair.productId);
    const corrected = {
      ...current,
      attributes: { ...current.attributes, volumeMl: repair.volumeMl },
    };
    if (!hasConsistentBottleVolume(corrected))
      throw new Error(
        "Selected bottle variant still conflicts for " + repair.productId,
      );
    const image = resolveVerifiedProductImage(corrected, registry);
    if (registry[repair.productId]?.sourceSku !== repair.manufacturerSku)
      throw new Error(
        "Reviewed manufacturer SKU differs for " + repair.productId,
      );
    if (!image.url || image.source !== repair.sourceUrl)
      throw new Error(
        "Approved exact corrected-variant photograph is missing for " +
          repair.productId,
      );
    if (action === "apply")
      await createProductRevision({
        productId: repair.productId,
        revisionId: repair.revisionId,
        expectedRecordHash: createHash("sha256")
          .update(JSON.stringify(current))
          .digest("hex"),
        facts: { volumeMl: repair.volumeMl },
        attributes: { ...current.attributes, volumeMl: repair.volumeMl },
        specs: current.specs.map((value) =>
          /^volumeMl:/i.test(value) ? "volumeMl: " + repair.volumeMl : value,
        ),
        sourceUrl: repair.sourceUrl,
        observedAt: new Date().toISOString(),
        observedRegion: "Manufacturer exact bottle/SKU reference",
        operatorAudit:
          repair.operatorAudit + "; manufacturer SKU " + repair.manufacturerSku,
        media: {
          url: image.url,
          source: image.source,
          alt: image.alt,
          attribution: image.attribution,
          reviewedAt: image.reviewedAt,
          usage: "external_reference",
        },
      });
    console.log(
      JSON.stringify({
        productId: repair.productId,
        status: action === "apply" ? "repaired" : "review-passed",
        volumeMl: repair.volumeMl,
      }),
    );
  }
} finally {
  await closeDatabase();
}
