import { getDatabase } from "../src/server/database";

async function main() {
  const db = await getDatabase();
  const categoriesToTest = ["suits", "phones", "fragrance", "t-shirts", "laptops"];

  for (const leaf of categoriesToTest) {
    const res = await db.query<{
      brand: string;
      count: string;
      min_price: number;
      hero_name: string;
      hero_img: string;
    }>(`
      SELECT
        coalesce(brand, record->>'brand', 'Unknown') as brand,
        count(*)::text as count,
        min(price) as min_price,
        (array_agg(record->>'name' ORDER BY price DESC))[1] as hero_name,
        (array_agg(record->'media'->>'url' ORDER BY price DESC))[1] as hero_img
      FROM catalog_products
      WHERE publication='published' AND (leaf_type = $1 OR category = $1)
      GROUP BY coalesce(brand, record->>'brand', 'Unknown')
      ORDER BY count(*) DESC, brand ASC
    `, [leaf]);

    console.log(`\n=== Category: ${leaf} (${res.rows.length} brands) ===`);
    for (const b of res.rows.slice(0, 6)) {
      console.log(`   - ${b.brand} (${b.count} models, from $${b.min_price / 100}) -> hero: ${b.hero_name} [${b.hero_img}]`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
