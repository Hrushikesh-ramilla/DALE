import { cleanCatalogCopy } from "@/domain/catalog-copy";
import type { Product } from "@/domain/catalog";
import type { Sql } from "./database";

/** A reversible copy-only migration. Original records are archived; no product
 * is hidden, reclassified, or marked verified by this operation. */
export async function cleanStoredCatalogCopy(sql: Sql) {
  const id = "catalog-copy-cleanup-2026-10-24-v1";
  if (
    (await sql.query("SELECT id FROM catalog_operator_jobs WHERE id=$1", [id]))
      .rows.length
  )
    return;
  const result = await sql.query<{ record: Product }>(
    "SELECT record FROM catalog_products WHERE publication='published' FOR UPDATE",
  );
  const changes = result.rows.flatMap(({ record }) => {
    const next = cleanCatalogCopy(record);
    return next === record
      ? []
      : [
          {
            id: record.id,
            before: record,
            name: next.name,
            description: next.description,
            specs: next.specs,
          },
        ];
  });
  if (changes.length)
    await sql.query(
      `UPDATE catalog_products p SET record=p.record || jsonb_build_object('name',c.name,'description',c.description,'specs',c.specs)
    FROM jsonb_to_recordset($1::jsonb) AS c(id text,name text,description text,specs jsonb) WHERE p.id=c.id`,
      [
        JSON.stringify(
          changes.map(({ id, name, description, specs }) => ({
            id,
            name,
            description,
            specs,
          })),
        ),
      ],
    );
  await sql.query(
    "INSERT INTO catalog_operator_jobs(id,kind,payload,status,completed_at) VALUES($1,'catalog_copy_cleanup',$2::jsonb,'completed',now())",
    [
      id,
      JSON.stringify({
        policy:
          "Copy only: no verification or factual claims added; all prices, inventory, attributes and photos preserved",
        count: changes.length,
        before: changes.map((c) => c.before),
      }),
    ],
  );
}
