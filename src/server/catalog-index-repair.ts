import { catalogLeaf } from "@/domain/catalog-classification";
import type { Product } from "@/domain/catalog";
import type { Sql } from "./database";

/** Legacy rows contain real brand/type metadata in JSON but have empty indexed
 * columns. Fill only missing indexes so browse counts and AI scopes agree. */
export async function repairCatalogIndexes(sql: Sql) {
  const id = "catalog-index-repair-2026-10-24-v1";
  if (
    (await sql.query("SELECT id FROM catalog_operator_jobs WHERE id=$1", [id]))
      .rows.length
  )
    return;
  const result = await sql.query<{
    id: string;
    record: Product;
    leaf_type: string | null;
    brand: string | null;
    model_name: string | null;
    sku_variant: string | null;
  }>(
    "SELECT id,record,leaf_type,brand,model_name,sku_variant FROM catalog_products WHERE publication='published' AND (leaf_type IS NULL OR brand IS NULL OR model_name IS NULL OR sku_variant IS NULL) FOR UPDATE",
  );
  const changes = result.rows.flatMap((row) => {
    const after = {
      id: row.id,
      leaf_type: row.leaf_type || catalogLeaf(row.record) || null,
      brand: row.brand || row.record.brand || null,
      model_name:
        row.model_name ||
        row.record.modelName ||
        row.record.attributes?.modelName ||
        null,
      sku_variant:
        row.sku_variant ||
        row.record.skuVariant ||
        row.record.attributes?.size ||
        null,
    };
    const before = {
      id: row.id,
      leaf_type: row.leaf_type,
      brand: row.brand,
      model_name: row.model_name,
      sku_variant: row.sku_variant,
    };
    return JSON.stringify(before) === JSON.stringify(after)
      ? []
      : [{ before, after }];
  });
  if (changes.length)
    await sql.query(
      `UPDATE catalog_products p SET leaf_type=c.leaf_type,brand=c.brand,model_name=c.model_name,sku_variant=c.sku_variant
    FROM jsonb_to_recordset($1::jsonb) AS c(id text,leaf_type text,brand text,model_name text,sku_variant text) WHERE p.id=c.id`,
      [JSON.stringify(changes.map((c) => c.after))],
    );
  await sql.query(
    "INSERT INTO catalog_operator_jobs(id,kind,payload,status,completed_at) VALUES($1,'catalog_index_repair',$2::jsonb,'completed',now())",
    [
      id,
      JSON.stringify({
        policy:
          "Fill missing indexes from recorded product metadata; no verification claim or product fact changed",
        count: changes.length,
        changes,
      }),
    ],
  );
}
