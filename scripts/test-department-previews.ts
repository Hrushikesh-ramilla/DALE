import { getDatabase } from "../src/server/database";
import { departments, getDepartmentLeafs } from "../src/domain/departments";

async function main() {
  const db = await getDatabase();
  for (const dept of departments) {
    const leafs = getDepartmentLeafs(dept.id);
    const res = await db.query<{
      leaf_type: string;
      count: string;
      min_price: number;
      brands: string[];
      hero_name: string;
      hero_media: string;
    }>(`
      SELECT
        leaf_type,
        count(*)::text as count,
        min(price) as min_price,
        array_agg(DISTINCT brand ORDER BY brand) as brands,
        (array_agg(record->>'name' ORDER BY price DESC))[1] as hero_name,
        (array_agg(record->'media'->>'url' ORDER BY price DESC))[1] as hero_media
      FROM catalog_products
      WHERE publication='published' AND leaf_type = ANY($1::text[])
      GROUP BY leaf_type
    `, [leafs]);
    console.log(`Dept: ${dept.id} (${dept.title}) -> ${res.rows.length}/${leafs.length} leafs with published products`);
    for (const r of res.rows.slice(0, 3)) {
      console.log(`   * ${r.leaf_type}: ${r.count} items, hero: ${r.hero_name}, media: ${r.hero_media}`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
