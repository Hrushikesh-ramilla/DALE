import { beforeAll, afterAll, it, expect } from "vitest";
import { getDatabase, closeDatabase } from "../src/server/database";
import { browseCatalog } from "../src/server/catalog-store";
import type { Product } from "../src/domain/catalog";

const products: Product[] = Array.from({ length: 105 }, (_, n) => ({
  id: `order-contract-${n.toString().padStart(3, "0")}`,
  name: `CollectionOrderContract ${n}`,
  category: "fragrance",
  brand: ["Zeta", "Alpha", "Mu"][n % 3],
  price: 1000 + Math.floor(n / 3),
  description: "Isolated ordering fixture",
  specs: [],
  compatibleModels: [],
  stock: 20,
  color: "black",
  sponsored: false,
  source: "https://example.com/owned-test-fixture",
}));
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  const db = await getDatabase();
  for (const product of products)
    await db.query(
      "INSERT INTO catalog_products(id,category,price,record,publication,brand,leaf_type) VALUES($1,'fragrance',$2,$3::jsonb,'published',$4,'fragrance')",
      [product.id, product.price, JSON.stringify(product), product.brand],
    );
}, 60000);
afterAll(closeDatabase);

for (const sort of ["price-asc", "price-desc", "brand-asc"] as const)
  it(`orders the full catalog before ${sort} cursor pagination, including ties`, async () => {
    let cursor: string | undefined;
    const received: Product[] = [];
    do {
      const page = await browseCatalog({
        query: "CollectionOrderContract",
        sort,
        cursor,
      });
      expect(page.total).toBe(products.length);
      received.push(...page.products);
      cursor = page.nextCursor || undefined;
    } while (cursor);
    const expected = [...products].sort((a, b) =>
      sort === "brand-asc"
        ? a.brand!.localeCompare(b.brand!) || a.id.localeCompare(b.id)
        : sort === "price-desc"
          ? b.price - a.price || b.id.localeCompare(a.id)
          : a.price - b.price || a.id.localeCompare(b.id),
    );
    expect(received.map((p) => p.id)).toEqual(expected.map((p) => p.id));
    expect(new Set(received.map((p) => p.id)).size).toBe(products.length);
  });

it("rejects a continuation reused after changing the sort", async () => {
  const first = await browseCatalog({
    query: "CollectionOrderContract",
    sort: "price-desc",
  });
  await expect(
    browseCatalog({
      query: "CollectionOrderContract",
      sort: "brand-asc",
      cursor: first.nextCursor!,
    }),
  ).rejects.toThrow("Invalid catalog continuation");
});
