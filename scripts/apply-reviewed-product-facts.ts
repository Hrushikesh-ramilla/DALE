import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parse } from "dotenv";
import {
  reviewedProductFacts,
  withReviewedProductFacts,
} from "../src/domain/reviewed-product-facts";
import { createProductRevision } from "../src/server/catalog-publishing";
import { getDatabase, closeDatabase } from "../src/server/database";
import type { Product } from "../src/domain/catalog";

Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
// Operator command: stop the PGlite app first. Dry run unless --apply is supplied.
try {
  const db = await getDatabase();
  for (const entry of reviewedProductFacts) {
    const existing = await db.query(
      "SELECT revision_id FROM catalog_fact_revisions WHERE revision_id=$1",
      [entry.revisionId],
    );
    if (existing.rows.length) {
      console.log(
        JSON.stringify({ revision: entry.revisionId, existing: true }),
      );
      continue;
    }
    const rows = await db.query<{ record: Product }>(
      "SELECT record FROM catalog_products WHERE id=$1",
      [entry.productId],
    );
    const current = rows.rows[0]?.record;
    if (!current)
      throw new Error(`Reviewed product ${entry.productId} is not present.`);
    const revised = withReviewedProductFacts(current);
    if (revised === current)
      throw new Error(
        "Product identity/source changed; review facts again before applying.",
      );
    if (!process.argv.includes("--apply")) {
      console.log(
        JSON.stringify({
          productId: current.id,
          plannedFacts: entry.facts,
          dryRun: true,
        }),
      );
      continue;
    }
    const result = await createProductRevision({
      ...entry,
      specs: revised.specs,
      expectedRecordHash: createHash("sha256")
        .update(JSON.stringify(current))
        .digest("hex"),
    });
    console.log(JSON.stringify(result));
  }
} finally {
  await closeDatabase();
}
