import { createHash } from "node:crypto";
import watches from "../../catalog/manifests/watches-tissot-2026-10-11-v1.json";
import rolex from "../../catalog/manifests/watches-rolex-2026-10-11-v1.json";
import eyewear from "../../catalog/manifests/eyewear-oakley-2026-10-11-v1.json";
import { catalogManifestSchema } from "@/domain/catalog-manifest";
import type { Sql } from "./database";

/** Deploy the reviewed starter batch once. Withdrawal survives subsequent restarts. */
export async function bootstrapReviewedCatalog(sql: Sql) {
  for (const input of [eyewear, watches, rolex]) {
    const manifest = catalogManifestSchema.parse(input);
    const content = JSON.stringify(manifest);
    const hash = createHash("sha256").update(content).digest("hex");
    const existing = await sql.query<{ content_hash: string }>(
      "SELECT content_hash FROM catalog_releases WHERE id=$1",
      [manifest.id],
    );
    if (existing.rows.length) {
      if (existing.rows[0].content_hash !== hash)
        throw new Error(
          "Bundled catalog release identity changed; publish a new manifest ID.",
        );
      continue;
    }
    const collision = await sql.query(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length)
      throw new Error(
        "Bundled catalog cannot replace existing product identities.",
      );
    if (manifest.products.some((p) => !p.media || p.comparisonOnly))
      throw new Error(
        "The reviewed starter batch requires purchasable records and attributed media.",
      );
    await sql.query(
      "INSERT INTO catalog_releases(id,content_hash,status,manifest,reviewed_by,published_at) VALUES($1,$2,'published',$3::jsonb,$4,now())",
      [manifest.id, hash, content, manifest.reviewedBy],
    );
    await sql.query(
      `INSERT INTO catalog_products(id,category,price,record,publication,release_id)
    SELECT id,category,price,record,'published',$2 FROM jsonb_to_recordset($1::jsonb)
    AS items(id text,category text,price integer,record jsonb)`,
      [
        JSON.stringify(
          manifest.products.map((record) => ({
            id: record.id,
            category: record.category,
            price: record.price,
            record,
          })),
        ),
        manifest.id,
      ],
    );
  }
}
