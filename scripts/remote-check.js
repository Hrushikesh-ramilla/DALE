const { Client } = require("pg");
const c = new Client({ database: "buyerguard", user: "buyerguard" });
(async () => {
  await c.connect();
  const res = await c.query("SELECT id, name, brand, leaf_type, record->>'brand' as rec_brand, record->'media'->>'url' as media_url FROM catalog_products WHERE price = 74900 LIMIT 3;");
  console.log(res.rows);
  await c.end();
})();
