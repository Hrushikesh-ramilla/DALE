import { catalog, publicCatalog } from "@/domain/catalog";
import { brandedCatalog } from "@/domain/branded-catalog";
import { withReviewedProductFacts } from "@/domain/reviewed-product-facts";
import type { Sql } from "./database";
import { bootstrapReviewedCatalog } from "./bundled-catalog";

/** Classify legacy IDs once; never overwrite imported records during a read or restart. */
export async function bootstrapCatalog(sql: Sql) {
  const existing = await sql.query("SELECT 1 FROM catalog_products LIMIT 1");
  if (existing.rows.length > 0) return;

  const publicIds = new Set(publicCatalog.map((product) => product.id));
  const records = [
    ...new Map(
      [...catalog, ...publicCatalog, ...brandedCatalog].map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  ].map(withReviewedProductFacts);
  const rows = records.map((product) => ({
    id: product.id,
    category: product.category,
    price: product.price,
    record: product,
    publication: publicIds.has(product.id)
      ? "published"
      : product.comparisonOnly
        ? "retired"
        : "fixture",
  }));
  await sql.query(
    `INSERT INTO catalog_products(id,category,price,record,publication,release_id)
    SELECT id,category,price,record,publication,'bootstrap-v1' FROM jsonb_to_recordset($1::jsonb)
    AS items(id text,category text,price integer,record jsonb,publication text)
    ON CONFLICT(id) DO NOTHING`,
    [JSON.stringify(rows)],
  );
  for (const publication of ["published", "retired", "fixture"]) {
    await sql.query(
      `UPDATE catalog_products SET publication=$1,release_id='bootstrap-v1'
      WHERE publication='unclassified' AND release_id IS NULL AND id=ANY($2::text[])`,
      [
        publication,
        rows
          .filter((row) => row.publication === publication)
          .map((row) => row.id),
      ],
    );
  }
  await bootstrapReviewedCatalog(sql);
}
