import { conciergeDatabase } from "./store";

// Short public inventory references help small models copy IDs accurately. The
// database mapping survives restarts; ownership is still enforced by each tool.
const reference = /^item:([1-9][0-9]*)$/;
const scalarKeys = new Set(["productId", "product_id"]);
const arrayKeys = new Set(["product_ids", "productIds"]);

export async function resolveProductReferences(raw: unknown): Promise<unknown> {
  async function resolve(value: unknown): Promise<unknown> {
    if (typeof value !== "string" || !value.startsWith("item:")) return value;
    const match = reference.exec(value);
    if (!match)
      throw new Error(
        "Invalid product reference. Read the product list again.",
      );
    const db = await conciergeDatabase();
    const result = await db.query<{ product_id: string }>(
      "SELECT product_id FROM concierge_product_references WHERE ref=$1::bigint",
      [match[1]],
    );
    if (!result.rows[0])
      throw new Error(
        "Unknown product reference. Read the product list again.",
      );
    return result.rows[0].product_id;
  }
  async function walk(value: unknown): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map(walk));
    if (!value || typeof value !== "object") return value;
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      await Promise.all(
        Object.entries(object).map(async ([key, child]) => [
          key,
          scalarKeys.has(key) ||
          (key === "entity_id" && object.destination === "product")
            ? await resolve(child)
            : arrayKeys.has(key) && Array.isArray(child)
              ? await Promise.all(child.map(resolve))
              : await walk(child),
        ]),
      ),
    );
  }
  return walk(raw);
}

export async function modelProductReferences(data: unknown): Promise<unknown> {
  const values = new Set<string>();
  function collect(value: unknown) {
    if (typeof value === "string") values.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object")
      Object.values(value).forEach(collect);
  }
  collect(data);
  if (!values.size) return data;
  const db = await conciergeDatabase();
  // Only published product identities can enter this namespace. Never alias
  // order, group, confirmation IDs, URLs or strings merely containing an ID.
  await db.query(
    `INSERT INTO concierge_product_references(product_id)
     SELECT id FROM catalog_products WHERE id=ANY($1::text[]) AND publication='published'
     ORDER BY id ON CONFLICT(product_id) DO NOTHING`,
    [[...values]],
  );
  const result = await db.query<{ product_id: string; ref: string | number }>(
    "SELECT product_id,ref FROM concierge_product_references WHERE product_id=ANY($1::text[])",
    [[...values]],
  );
  const aliases = new Map(
    result.rows.map((r) => [r.product_id, `item:${r.ref}`]),
  );
  function walk(value: unknown): unknown {
    if (typeof value === "string") return aliases.get(value) ?? value;
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, walk(child)]),
      );
    return value;
  }
  return walk(data);
}
