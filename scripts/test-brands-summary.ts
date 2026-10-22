import { getCategoryBrandsSummary } from "../src/server/catalog-store";

async function main() {
  const brands = await getCategoryBrandsSummary("phones");
  console.log("Brands count:", brands.length);
  for (const b of brands) {
    console.log(`[${b.name}] count: ${b.count}, minPrice: ${b.minPrice}, hero: ${b.heroImage}`);
  }
  process.exit(0);
}

main().catch(console.error);
