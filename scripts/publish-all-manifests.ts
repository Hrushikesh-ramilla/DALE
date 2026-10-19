import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { leafTypeKeys } from "../src/domain/departments";
import { loadAndPublishManifestFixture } from "../src/server/catalog-fixture-loader";
import { getDatabase } from "../src/server/database";

export async function publishAllManifests() {
  console.log("=== PUBLISHING ALL EXPANDED CATALOG MANIFESTS ===");
  const db = await getDatabase();
  let successCount = 0;
  let totalProductsPublished = 0;

  for (const leaf of leafTypeKeys) {
    const manifestPath = resolve(process.cwd(), `catalog/manifests/${leaf}-core-2026-10-11-v2.json`);
    if (!existsSync(manifestPath)) {
      continue;
    }

    try {
      const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const result = await loadAndPublishManifestFixture(raw, { publish: true });
      console.log(`[OK] ${leaf.padEnd(20)} | Release: ${result.releaseId} | Status: ${result.status} | Models: ${result.count}`);
      successCount++;
      totalProductsPublished += result.count;
    } catch (err) {
      console.error(`[ERR] ${leaf.padEnd(20)} | Failed:`, (err as Error).message);
    }
  }

  // Also publish any legacy v1 starter manifests if not yet published
  const legacyStarters = [
    "eyewear-oakley-2026-10-11-v1",
    "watches-tissot-2026-10-11-v1",
    "watches-rolex-2026-10-11-v1",
    "eyewear-ray-ban-2026-10-11-v1",
    "phones-apple-2026-10-11-v1",
    "fragrance-mfk-2026-10-11-v1",
    "fragrance-pdm-2026-10-11-v1",
    "fragrance-amouage-2026-10-11-v1",
    "fragrance-initio-2026-10-11-v1",
  ];
  for (const starter of legacyStarters) {
    const p = resolve(process.cwd(), `catalog/manifests/${starter}.json`);
    if (existsSync(p)) {
      try {
        const raw = JSON.parse(readFileSync(p, "utf-8"));
        await loadAndPublishManifestFixture(raw, { publish: true });
      } catch {
        // already published or hash checked
      }
    }
  }

  const publishedInDb = await db.query<{ count: string }>(
    "SELECT count(*) FROM catalog_products WHERE publication='published'",
  );
  const leafCounts = await db.query<{ leaf_type: string; count: string }>(
    "SELECT COALESCE(leaf_type, category) as leaf_type, count(*) FROM catalog_products WHERE publication='published' GROUP BY COALESCE(leaf_type, category) ORDER BY leaf_type",
  );
  const accessoryCount = await db.query<{ count: string }>(
    "SELECT count(*) FROM catalog_device_accessories",
  );

  console.log("\n================ DATABASE SUMMARY ================");
  console.log(`Total Published Products in Database: ${publishedInDb.rows[0].count}`);
  console.log(`Total Device Accessories Relations: ${accessoryCount.rows[0].count}`);
  console.log(`Published Leaves (${leafCounts.rows.length}):`);
  for (const row of leafCounts.rows) {
    console.log(`  - ${row.leaf_type.padEnd(22)}: ${row.count}`);
  }
}

if (process.argv[1]?.endsWith("publish-all-manifests.ts")) {
  publishAllManifests().catch((err) => {
    console.error("Fatal publication error:", err);
    process.exit(1);
  });
}
