import { catalog, searchCatalog, type Product } from "@/domain/catalog";
import { realProducts } from "@/domain/research";
import { departments } from "@/domain/departments";
import { getDatabase, type Database } from "./database";
const initialized = new WeakMap<Database, Promise<void>>();
async function catalogDatabase() {
  const database = await getDatabase();
  let pending = initialized.get(database);
  if (!pending) {
    pending = database.transaction(async (sql) => {
      const products = [...catalog, ...realProducts].map((product) => ({
        id: product.id,
        category: product.category,
        price: product.price,
        record: product,
      }));
      await sql.query(
        `INSERT INTO catalog_products(id,category,price,record)
        SELECT id,category,price,record FROM jsonb_to_recordset($1::jsonb)
        AS items(id text,category text,price integer,record jsonb)
        ON CONFLICT(id) DO UPDATE SET category=excluded.category,price=excluded.price,record=excluded.record`,
        [JSON.stringify(products)],
      );
    });
    initialized.set(database, pending);
    pending.catch(() => initialized.delete(database));
  }
  await pending;
  return database;
}
export async function browseCatalog(input: {
  category?: string;
  query?: string;
  budget?: number;
  page?: number;
  requirements?: Record<string, string | number>;
}) {
  const database = await catalogDatabase();
  const values = [
    input.category || "",
    input.query || "",
    input.budget ?? 100000,
    JSON.stringify(input.requirements || {}),
  ];
  const where = `($1='' OR category=$1) AND ($2='' OR strpos(lower(record->>'name'),lower($2))>0)
    AND price<=$3 AND coalesce(record->'attributes','{}'::jsonb) @> $4::jsonb`;
  const total = await database.query<{ count: string }>(
    `SELECT count(*) FROM catalog_products WHERE ${where}`,
    values,
  );
  const rows = await database.query<{ record: Product }>(
    `SELECT record FROM catalog_products WHERE ${where}
    ORDER BY price,id LIMIT 48 OFFSET $5`,
    [...values, ((input.page || 1) - 1) * 48],
  );
  return {
    products: rows.rows.map((row) => row.record),
    total: Number(total.rows[0].count),
    page: input.page || 1,
    pageSize: 48,
    departments,
    provenance:
      "Merchant-authored lifestyle samples; reviewed manufacturer records are separately sourced. Stock and fulfillment are simulated.",
  };
}
export async function searchStoredCatalog(
  input: Parameters<typeof searchCatalog>[0],
) {
  const database = await catalogDatabase();
  const rows = await database.query<{ record: Product }>(
    `SELECT record FROM catalog_products
    WHERE price<=$1 AND ($2='' OR category=$2) AND coalesce(record->'attributes','{}'::jsonb) @> $3::jsonb`,
    [
      input.budget,
      input.category || "",
      JSON.stringify(input.requirements || {}),
    ],
  );
  return searchCatalog(
    input,
    rows.rows.map((row) => row.record),
  );
}
