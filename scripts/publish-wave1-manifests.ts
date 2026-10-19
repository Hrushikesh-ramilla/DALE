import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadAndPublishManifestFixture } from "../src/server/catalog-fixture-loader";
import { getDatabase } from "../src/server/database";

const leaves = [
  "laptops",
  "tablets",
  "phones",
  "headphones",
  "earbuds",
  "speakers",
  "wall-chargers",
  "power-banks",
  "portable-ssds",
  "internal-ssds",
  "hard-drives",
  "keyboards",
  "mice",
];

async function publishWave1() {
  console.log("=== PUBLISHING WAVE 1 CORE ELECTRONICS MANIFESTS ===");
  const db = await getDatabase();

  for (const leaf of leaves) {
    const manifestPath = resolve(process.cwd(), `catalog/manifests/${leaf}-core-2026-10-11-v2.json`);
    if (!existsSync(manifestPath)) {
      console.warn(`Manifest not found: ${manifestPath}`);
      continue;
    }

    const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
    try {
      const result = await loadAndPublishManifestFixture(raw, { publish: true });
      console.log(`[${leaf}] Release: ${result.releaseId} | Status: ${result.status} | Count: ${result.count}`);
    } catch (err) {
      console.error(`[${leaf}] Error loading manifest:`, err);
    }
  }

  // Verify published count in database
  const publishedCount = await db.query<{ count: string }>(
    "SELECT count(*) FROM catalog_products WHERE publication='published'",
  );
  const leafCounts = await db.query<{ leaf_type: string; count: string }>(
    "SELECT leaf_type, count(*) FROM catalog_products WHERE publication='published' AND leaf_type IS NOT NULL GROUP BY leaf_type ORDER BY leaf_type",
  );
  const accessoryCount = await db.query<{ count: string }>(
    "SELECT count(*) FROM catalog_device_accessories",
  );

  console.log("\n=== DATABASE PUBLICATION SUMMARY ===");
  console.log(`Total Published Products in DB: ${publishedCount.rows[0].count}`);
  console.log(`Total Device Accessories Relations in DB: ${accessoryCount.rows[0].count}`);
  console.log("Leaf Counts:");
  for (const row of leafCounts.rows) {
    console.log(`  - ${row.leaf_type}: ${row.count}`);
  }
}

publishWave1()
  .then(() => {
    console.log("Wave 1 publishing completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Wave 1 publishing failed:", err);
    process.exit(1);
  });
