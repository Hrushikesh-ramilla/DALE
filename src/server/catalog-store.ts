import { knownModels, searchCatalog, type Product } from "@/domain/catalog";
import {
  departments,
  retailCategories,
  lifestyleProfile,
} from "@/domain/departments";
import { expandCatalogBrandAliases } from "@/domain/branded-shopping";
import { getDatabase, type Sql } from "./database";
import { getDrizzle, catalogProducts } from "./db";
import { eq, inArray } from "drizzle-orm";
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
  const leafCounts = await database.query<{ leaf_type: string; count: string }>(
    "SELECT leaf_type,count(*) FROM catalog_products WHERE publication='published' AND leaf_type IS NOT NULL GROUP BY leaf_type ORDER BY leaf_type",
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
    leafCounts: Object.fromEntries(
      leafCounts.rows.map((row) => [row.leaf_type, Number(row.count)]),
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

export interface DepartmentLeafPreview {
  leafType: string;
  count: number;
  minPrice: number;
  brands: string[];
  heroProduct: Product;
}

const curatedLeafHeroProducts: Partial<
  Record<string, { image: string; name: string }>
> = {
  suits: {
    image:
      "/images/products/suits-prod-suits-tom-ford-tom-ford-shelton-super150s-wool-suit.webp",
    name: "Tom Ford Shelton Super 150s Wool Suit",
  },
  "t-shirts": {
    image:
      "/images/products/t-shirts-celine-triomphe-embroidered-cotton-jersey-t-shirt.webp",
    name: "Celine Triomphe Cotton Jersey T-Shirt",
  },
  trousers: {
    image:
      "/images/products/trousers-saint-laurent-classic-flat-front-super-120s-wool-gabardine-tr.webp",
    name: "Saint Laurent Classic Flat-Front Wool Trousers",
  },
  denim: {
    image:
      "/images/products/denim-tom-ford-buckley-slim-fit-selvedge-denim-jeans.webp",
    name: "Tom Ford Buckley Selvedge Denim Jeans",
  },
  dresses: {
    image:
      "/images/products/dresses-valentino-toile-iconographe-patterned-silk-twill-shirtdress.webp",
    name: "Valentino Toile Iconographe Silk Shirtdress",
  },
  jackets: {
    image:
      "/images/products/jackets-prod-jackets-prada-prada-denim-blouson-jacket.webp",
    name: "Prada Denim Blouson Jacket",
  },
  handbags: {
    image:
      "/images/products/handbags-prod-handbags-chanel-chanel-classic-11-12-flap.webp",
    name: "Chanel Classic 11.12 Double Flap Bag",
  },
  backpacks: {
    image:
      "/images/products/backpacks-prod-backpacks-rimowa-rimowa-never-still-leather.webp",
    name: "Rimowa Never Still Leather Backpack",
  },
  wallets: {
    image:
      "/images/products/wallets-prod-wallets-goyard-goyard-victoire-wallet.webp",
    name: "Goyard Victoire Wallet",
  },
  loafers: {
    image:
      "/images/products/loafers-prod-loafers-loro-piana-loro-piana-summer-charms-walk-loafers.webp",
    name: "Loro Piana Summer Charms Loafers",
  },
  "formal-shoes": {
    image:
      "/images/products/formal-shoes-prod-formal-shoes-christian-louboutin-louboutin-greggo-oxford.webp",
    name: "Christian Louboutin Greggo Oxford",
  },
  fragrance: {
    image:
      "/images/products/fragrance-prod-fragrance-maison-francis-kurkdjian-baccarat-rouge-540-extrait.webp",
    name: "Maison Francis Kurkdjian Baccarat Rouge 540",
  },
  phones: {
    image:
      "/images/products/phones-prod-phones-apple-apple-iphone-16-pro-max.webp",
    name: "Apple iPhone 16 Pro Max",
  },
  laptops: {
    image:
      "/images/products/laptops-prod-laptops-apple-apple-macbook-pro-16-m3-max.webp",
    name: "Apple MacBook Pro 16 M3 Max",
  },
  tablets: {
    image:
      "/images/products/tablets-prod-tablets-apple-apple-ipad-pro-13-m4.webp",
    name: "Apple iPad Pro 13 M4",
  },
  headphones: {
    image:
      "/images/products/headphones-prod-headphones-apple-airpods-max-usb-c.webp",
    name: "Apple AirPods Max",
  },
};

const curatedBrandHeroPackshots: Record<string, Record<string, string>> = {
  loafers: {
    Berluti:
      "/images/products/loafers-prod-loafers-berluti-berluti-andy-demesure-leather-loafer.webp",
  },
  suits: {
    Canali:
      "/images/products/suits-prod-suits-canali-canali-black-tie-shawl-lapel-tuxedo.webp",
    "Dior Men":
      "/images/products/suits-dior-men-officer-collar-tailored-barathea-suit.webp",
    Brioni:
      "/images/products/suits-prod-suits-brioni-brioni-brunico-two-button-navy-worsted-suit.webp",
    Balenciaga:
      "/images/products/suits-prod-suits-balenciaga-balenciaga-hourglass-single-breasted-wool-suit.webp",
  },
  fragrance: {
    "Louis Vuitton":
      "/images/products/fragrance-louis-vuitton-imagination-100ml.webp",
    Amouage: "/images/products/fragrance-amouage-interlude-man.webp",
    "Parfums de Marly":
      "/images/products/fragrance-prod-fragrance-parfums-de-marly-pdm-althair.webp",
    "Tom Ford": "/images/products/fragrance-tom-ford-tobacco-vanille.webp",
  },
  "t-shirts": {
    Celine:
      "/images/products/t-shirts-celine-triomphe-embroidered-cotton-jersey-t-shirt.webp",
    Givenchy:
      "/images/products/t-shirts-givenchy-givenchy-archetype-slim-fit-t-shirt.webp",
    Balenciaga:
      "/images/products/t-shirts-prod-t-shirts-balenciaga-balenciaga-crest-piqu-polo-shirt.webp",
  },
};

export async function getDepartmentPreviews(
  leafs: string[],
): Promise<Record<string, DepartmentLeafPreview>> {
  if (!leafs.length) return {};
  const database = await getDatabase();
  const res = await database.query<{
    leaf_type: string;
    count: string;
    min_price: number;
    brands: string[];
    record: Product;
  }>(
    `SELECT
      leaf_type,
      count(*)::text as count,
      min(price) as min_price,
      array_agg(DISTINCT brand ORDER BY brand) as brands,
      (array_agg(record ORDER BY price DESC))[1] as record
    FROM catalog_products
    WHERE publication='published' AND leaf_type = ANY($1::text[])
    GROUP BY leaf_type`,
    [leafs],
  );

  const previews: Record<string, DepartmentLeafPreview> = {};
  for (const row of res.rows) {
    const curated = curatedLeafHeroProducts[row.leaf_type];
    const heroProduct = { ...row.record };
    if (curated) {
      heroProduct.media = {
        url: curated.image,
        source: row.record?.media?.source || "official_catalog",
        alt:
          curated.name ||
          row.record?.media?.alt ||
          row.record?.name ||
          "Product packshot",
        attribution:
          row.record?.media?.attribution || "DALE Official Brand Packshot",
        reviewedAt: row.record?.media?.reviewedAt || new Date().toISOString(),
        usage: "catalog_packshot",
      };
      if (curated.name) {
        heroProduct.name = curated.name;
      }
    }

    previews[row.leaf_type] = {
      leafType: row.leaf_type,
      count: Number(row.count),
      minPrice: Number(row.min_price),
      brands: (row.brands || []).filter(Boolean),
      heroProduct,
    };
  }
  return previews;
}

export interface CategoryBrandSummary {
  name: string;
  count: number;
  minPrice: number;
  heroImage?: string;
  sampleProduct?: Product;
}

export async function getCategoryBrandsSummary(
  leaf: string,
): Promise<CategoryBrandSummary[]> {
  const database = await getDatabase();
  const res = await database.query<{
    brand: string;
    count: string;
    min_price: number;
    hero_img: string;
    record: Product;
  }>(
    `SELECT
      coalesce(brand, record->>'brand', 'Unknown') as brand,
      count(*)::text as count,
      min(price) as min_price,
      (array_agg(record->'media'->>'url' ORDER BY price DESC))[1] as hero_img,
      (array_agg(record ORDER BY price DESC))[1] as record
    FROM catalog_products
    WHERE publication='published' AND (leaf_type = $1 OR category = $1)
    GROUP BY coalesce(brand, record->>'brand', 'Unknown')
    ORDER BY count(*) DESC, brand ASC`,
    [leaf],
  );

  const brandOverrides = curatedBrandHeroPackshots[leaf] || {};

  return res.rows.map((row) => {
    const override = brandOverrides[row.brand];
    return {
      name: row.brand,
      count: Number(row.count),
      minPrice: Number(row.min_price),
      heroImage: override || row.hero_img || undefined,
      sampleProduct: row.record,
    };
  });
}

export async function getStoredProduct(
  id: string,
  sql?: Sql,
  purchasable = false,
): Promise<Product> {
  if (!sql) {
    const drizzle = await getDrizzle();
    const rows = await drizzle
      .select({
        record: catalogProducts.record,
        publication: catalogProducts.publication,
      })
      .from(catalogProducts)
      .where(eq(catalogProducts.id, id))
      .limit(1);

    const productRow = rows[0];
    if (!productRow) throw new Error("Unknown product");
    if (
      purchasable &&
      productRow.publication === "retired" &&
      !productRow.record.comparisonOnly
    ) {
      throw new Error(
        "This catalog offer has been retired. Review another published product.",
      );
    }
    return productRow.record;
  }

  const database = sql;
  const result = await database.query<{ record: Product; publication: string }>(
    `SELECT record,publication FROM catalog_products WHERE id=$1 FOR SHARE`,
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
  const drizzle = await getDrizzle();
  const rows = await drizzle
    .select({
      record: catalogProducts.record,
    })
    .from(catalogProducts)
    .where(inArray(catalogProducts.id, Array.from(new Set(ids))));
  return rows.map((row) => row.record);
}
export async function browseCatalog(input: {
  category?: string;
  leafType?: string;
  brand?: string;
  query?: string;
  budget?: number;
  page?: number;
  cursor?: string;
  requirements?: Record<string, string | number>;
  fixtures?: boolean;
  sort?: "featured" | "price-asc" | "price-desc" | "brand-asc";
}) {
  const database = await getDatabase();
  const filter = catalogFilterHash(input);
  const position = input.cursor
    ? decodeCatalogCursor(input.cursor, filter)
    : undefined;
  const byBrand = input.sort === "brand-asc";
  const descending = input.sort === "price-desc";
  const brandColumn = "coalesce(brand,record->>'brand','')";
  const order = byBrand
    ? `${brandColumn},id`
    : descending
      ? "price DESC,id DESC"
      : "price,id";
  if (position && byBrand && position.brand === undefined)
    throw new Error("Invalid catalog continuation. Restart this search.");
  const values = [
    input.category || "",
    input.query || "",
    input.budget ?? 100000000,
    JSON.stringify(input.requirements || {}),
    Boolean(input.fixtures),
    input.leafType || "",
    input.brand || "",
  ];
  const where = `($1='' OR category=$1 OR leaf_type=$1)
    AND ($6='' OR leaf_type=$6 OR record->>'leafType'=$6 OR category=$6)
    AND ($7='' OR lower(coalesce(brand, record->>'brand', record->'attributes'->>'brand', ''))=lower($7))
    AND ($2='' OR to_tsvector('simple',coalesce(record->>'name','') || ' ' || coalesce(record->>'description','') || ' ' || coalesce(record->>'specs','')) @@ plainto_tsquery('simple',$2))
    AND price<=$3 AND coalesce(record->'attributes','{}'::jsonb) @> $4::jsonb
    AND (publication='published' OR ($5 AND publication='fixture'))`;
  const total = await database.query<{ count: string }>(
    `SELECT count(*) FROM catalog_products WHERE ${where}`,
    values,
  );
  const rows = await database.query<{ record: Product }>(
    position
      ? `SELECT record FROM catalog_products WHERE ${where} AND (${byBrand ? brandColumn : "price"},id)${descending ? "<" : ">"}($8,$9) ORDER BY ${order} LIMIT 49`
      : `SELECT record FROM catalog_products WHERE ${where} ORDER BY ${order} LIMIT 49 OFFSET $8`,
    position
      ? [...values, byBrand ? position.brand! : position.price, position.id]
      : [...values, ((input.page || 1) - 1) * 48],
  );
  const counts = await database.query<{ category: string; count: string }>(
    "SELECT category,count(*) FROM catalog_products WHERE publication='published' GROUP BY category ORDER BY category",
  );
  const leafCounts = await database.query<{ leaf_type: string; count: string }>(
    "SELECT leaf_type,count(*) FROM catalog_products WHERE publication='published' AND leaf_type IS NOT NULL GROUP BY leaf_type ORDER BY leaf_type",
  );
  const brandList = await database.query<{
    brand: string;
    count: string;
    min_price: number;
    hero_img: string;
  }>(
    `SELECT
      coalesce(brand, record->>'brand', 'Unknown') as brand,
      count(*)::text as count,
      min(price) as min_price,
      (array_agg(record->'media'->>'url' ORDER BY price DESC))[1] as hero_img
    FROM catalog_products
    WHERE publication='published' AND ($1='' OR leaf_type=$1 OR category=$1)
    GROUP BY coalesce(brand, record->>'brand', 'Unknown')
    ORDER BY count(*) DESC, brand ASC`,
    [input.leafType || input.category || ""],
  );
  const products = rows.rows.slice(0, 48).map((row) => row.record);
  const last = products.at(-1);
  return {
    products,
    nextCursor:
      rows.rows.length > 48 && last
        ? encodeCatalogCursor(
            filter,
            last.price,
            last.id,
            byBrand ? last.brand || "" : undefined,
          )
        : null,
    total: Number(total.rows[0].count),
    page: input.page || 1,
    pageSize: 48,
    categoryBrands: brandList.rows.map((r) => ({
      name: r.brand,
      count: Number(r.count),
      minPrice: Number(r.min_price),
      heroImage:
        curatedBrandHeroPackshots[input.leafType || input.category || ""]?.[
          r.brand
        ] ||
        r.hero_img ||
        undefined,
    })),
    availableBrands: brandList.rows.map((r) => r.brand),
    departments: departments.filter((d) =>
      d.categories.some((c) =>
        counts.rows.some((row) => row.category === c && Number(row.count) > 0),
      ),
    ),
    categoryCounts: Object.fromEntries(
      counts.rows.map((row) => [row.category, Number(row.count)]),
    ),
    leafCounts: Object.fromEntries(
      leafCounts.rows.map((row) => [row.leaf_type, Number(row.count)]),
    ),
    provenance:
      "Manufacturer product identities and recorded specifications; DALE offer prices, stock, payments and fulfillment are sandbox data. Missing facts are disclosed per record.",
  };
}
export async function searchStoredCatalog(
  input: Parameters<typeof searchCatalog>[0],
  fixtures = false,
) {
  // Validate the domain scoring contract before evaluating SQL weights.
  searchCatalog(input, []);
  if (!knownModels.includes(input.model) || input.budget <= 0) return [];
  const database = await getDatabase();
  const rows = await database.query<{ record: Product }>(
    `WITH candidates AS (SELECT record,id,price,
    CASE WHEN $8<>'' AND strpos(lower(array_to_string(ARRAY(SELECT jsonb_array_elements_text(record->'specs')),' ')),lower($8))>0 THEN 1 ELSE 0 END AS feature_match
    FROM catalog_products WHERE price<=$1 AND ($2='' OR category=$2)
    AND coalesce(record->'attributes','{}'::jsonb) @> $3::jsonb AND (publication='published' OR ($4 AND publication='fixture'))
    AND CASE WHEN category=ANY($6::text[]) OR record->>'provenance'='manufacturer_evidence'
      THEN $5=$7 ELSE coalesce(record->'compatibleModels','[]'::jsonb) ? $5 END)
    SELECT record FROM candidates ORDER BY
      CASE WHEN $9::boolean THEN -($10::float8*(1-price::float8/$1)+$11::float8*feature_match) ELSE 0 END,
      CASE WHEN $12::boolean THEN -feature_match ELSE 0 END,price,-feature_match,id LIMIT 100`,
    [
      input.budget,
      input.category || "",
      JSON.stringify(input.requirements || {}),
      fixtures,
      input.model,
      [...retailCategories],
      lifestyleProfile,
      input.preference || "",
      Boolean(input.weights),
      input.weights?.price || 0,
      input.weights?.features || 0,
      !input.weights && input.priority === "features",
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
    [expandCatalogBrandAliases(task)],
  );
  return rows.rows.map((row) => row.record);
}
