import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { getDatabase, closeDatabase } from "../src/server/database";
import { parseAnyCatalogManifest } from "../src/domain/catalog-manifest";
import { withVerifiedProductMedia } from "../src/domain/product-media-presentation";

async function main() {
  console.log("=== SYNCHRONIZING ALL 5,666 PRODUCTS TO LOCAL DATABASE ===");
  const db = await getDatabase();
  const manifestsDir = "catalog/manifests";

  const files = readdirSync(manifestsDir).filter(
    (f) => f.endsWith(".json") && !f.includes("observations")
  );

  let updatedProducts = 0;
  let totalManifests = 0;

  for (const fn of files) {
    const fp = join(manifestsDir, fn);
    try {
      const raw = JSON.parse(readFileSync(fp, "utf-8"));
      if (!raw.products || !Array.isArray(raw.products)) continue;

      totalManifests++;
      for (const p of raw.products) {
        const withMedia = withVerifiedProductMedia(p);
        const recordJson = JSON.stringify(withMedia);

        // Upsert product record in database
        const res = await db.query(
          `INSERT INTO catalog_products (id, category, price, publication, release_id, leaf_type, brand, model_name, sku_variant, record)
          VALUES ($1, $2, $3, 'published', $4, $5, $6, $7, $8, $9::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            price = EXCLUDED.price,
            publication = 'published',
            leaf_type = EXCLUDED.leaf_type,
            brand = EXCLUDED.brand,
            model_name = EXCLUDED.model_name,
            sku_variant = EXCLUDED.sku_variant,
            record = EXCLUDED.record`,
          [
            p.id,
            p.category,
            p.price,
            raw.id || "manual-sync",
            p.leafType || p.category,
            p.brand || null,
            p.modelName || null,
            p.skuVariant || null,
            recordJson,
          ],
        );

        if (res.rows) {
          updatedProducts++;
        }
      }
      console.log(`[OK] Processed ${fn} (${raw.products.length} products)`);
    } catch (e: any) {
      console.error(`[ERR] Error in ${fn}:`, e.message);
    }
  }

  const countRes = await db.query<{ count: string }>(
    "SELECT count(*) FROM catalog_products"
  );
  console.log(`\nSynchronization complete!`);
  console.log(`Total products updated in DB: ${updatedProducts}`);
  console.log(`Total products currently in DB: ${countRes.rows[0]?.count}`);

  await closeDatabase();
}

main().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
