import { searchCatalog, type Product } from "@/domain/catalog";
import { departments } from "@/domain/departments";
import { getDatabase, type Sql } from "./database";
import {
  catalogFilterHash,
  decodeCatalogCursor,
  encodeCatalogCursor,
} from "./catalog-cursor";

export async function catalogSummary() {
  const database = await getDatabase();
  const counts = await database.query<{ category: string; count: string }>(
    "SELECT category,count(*) FROM catalog_products WHERE publication='published' GROUP BY category ORDER BY category",
  );
  const facets = await database.query<{
    category: string;
    key: string;
    values: string[];
  }>(
    `SELECT category,a.key,array_agg(DISTINCT a.value ORDER BY a.value) AS values
    FROM catalog_products CROSS JOIN LATERAL jsonb_each_text(coalesce(record->'attributes','{}'::jsonb)) a
    WHERE publication='published' GROUP BY category,a.key`,
  );
  const featured = await database.query<{ record: Product }>(
    `SELECT record FROM (SELECT record,row_number() OVER(PARTITION BY category ORDER BY id) AS n
    FROM catalog_products WHERE publication='published') picks WHERE n=1`,
  );
  return {
    counts: Object.fromEntries(
      counts.rows.map((row) => [row.category, Number(row.count)]),
    ),
    facets: Object.fromEntries(
      counts.rows.map((row) => [
        row.category,
        Object.fromEntries(
          facets.rows
            .filter((f) => f.category === row.category)
            .map((f) => [f.key, f.values]),
        ),
      ]),
    ),
    featured: featured.rows.map((row) => row.record),
  };
}

export async function getStoredProduct(
  id: string,
  sql?: Sql,
  purchasable = false,
): Promise<Product> {
  const database = sql || (await getDatabase());
  const result = await database.query<{ record: Product; publication: string }>(
    `SELECT record,publication FROM catalog_products WHERE id=$1${sql ? " FOR SHARE" : ""}`,
    [id],
  );
  if (!result.rows[0]) throw new Error("Unknown product");
  if (
    purchasable &&
    result.rows[0].publication === "retired" &&
    !result.rows[0].record.comparisonOnly
  )
    throw new Error(
      "This catalog offer has been retired. Review another published product.",
    );
  return result.rows[0].record;
}

export async function getStoredProducts(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const database = await getDatabase();
  const rows = await database.query<{ record: Product }>(
    "SELECT record FROM catalog_products WHERE id=ANY($1::text[])",
    [Array.from(new Set(ids))],
  );
  return rows.rows.map((row) => row.record);
}
export async function browseCatalog(input: {
  category?: string;
  query?: string;
  budget?: number;
  page?: number;
  cursor?: string;
  requirements?: Record<string, string | number>;
  fixtures?: boolean;
}) {
  const database = await getDatabase();
  const filter = catalogFilterHash(input);
  const position = input.cursor
    ? decodeCatalogCursor(input.cursor, filter)
    : undefined;
  const values = [
    input.category || "",
    input.query || "",
    input.budget ?? 1000000,
    JSON.stringify(input.requirements || {}),
    Boolean(input.fixtures),
  ];
  const where = `($1='' OR category=$1) AND ($2='' OR to_tsvector('simple',coalesce(record->>'name','') || ' ' || coalesce(record->>'description','') || ' ' || coalesce(record->>'specs','')) @@ plainto_tsquery('simple',$2))
    AND price<=$3 AND coalesce(record->'attributes','{}'::jsonb) @> $4::jsonb
    AND (publication='published' OR ($5 AND publication='fixture'))`;
  const total = await database.query<{ count: string }>(
    `SELECT count(*) FROM catalog_products WHERE ${where}`,
    values,
  );
  const rows = await database.query<{ record: Product }>(
    position
      ? `SELECT record FROM catalog_products WHERE ${where} AND (price,id)>($6,$7) ORDER BY price,id LIMIT 49`
      : `SELECT record FROM catalog_products WHERE ${where} ORDER BY price,id LIMIT 49 OFFSET $6`,
    position
      ? [...values, position.price, position.id]
      : [...values, ((input.page || 1) - 1) * 48],
  );
  const counts = await database.query<{ category: string; count: string }>(
    "SELECT category,count(*) FROM catalog_products WHERE publication='published' GROUP BY category ORDER BY category",
  );
  const products = rows.rows.slice(0, 48).map((row) => row.record);
  const last = products.at(-1);
  return {
    products,
    nextCursor:
      rows.rows.length > 48 && last
        ? encodeCatalogCursor(filter, last.price, last.id)
        : null,
    total: Number(total.rows[0].count),
    page: input.page || 1,
    pageSize: 48,
    departments: departments.filter((d) =>
      d.categories.some((c) =>
        counts.rows.some((row) => row.category === c && Number(row.count) > 0),
      ),
    ),
    categoryCounts: Object.fromEntries(
      counts.rows.map((row) => [row.category, Number(row.count)]),
    ),
    provenance:
      "Manufacturer product identities and recorded specifications; DALE offer prices, stock, payments and fulfillment are sandbox data. Missing facts are disclosed per record.",
  };
}
export async function searchStoredCatalog(
  input: Parameters<typeof searchCatalog>[0],
  fixtures = false,
) {
  const database = await getDatabase();
  const rows = await database.query<{ record: Product }>(
    `SELECT record FROM catalog_products WHERE price<=$1 AND ($2='' OR category=$2)
    AND coalesce(record->'attributes','{}'::jsonb) @> $3::jsonb AND (publication='published' OR ($4 AND publication='fixture'))
    ORDER BY price,id LIMIT 100`,
    [
      input.budget,
      input.category || "",
      JSON.stringify(input.requirements || {}),
      fixtures,
    ],
  );
  return searchCatalog(
    input,
    rows.rows.map((row) => row.record),
  );
}

/** Resolve only brand/model records mentioned in this task; never send a full inventory to the model. */
export async function catalogLanguageContext(task: string) {
  const database = await getDatabase();
  const rows = await database.query<{ record: Product }>(
    `SELECT record FROM catalog_products WHERE publication='published'
    AND ((length(record->>'brand')>1 AND (strpos(lower($1),lower(record->>'brand'))>0
      OR (length(regexp_replace(lower(record->>'brand'),'[^a-z0-9]','','g'))>1
        AND strpos(regexp_replace(lower($1),'[^a-z0-9]','','g'),regexp_replace(lower(record->>'brand'),'[^a-z0-9]','','g'))>0)))
    OR (length(record->'attributes'->>'modelName')>2 AND strpos(lower($1),lower(record->'attributes'->>'modelName'))>0))
    ORDER BY id LIMIT 100`,
    [task],
  );
  return rows.rows.map((row) => row.record);
}
