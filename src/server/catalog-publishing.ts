import { createHash } from "node:crypto";
import { catalogManifestSchema } from "@/domain/catalog-manifest";
import { getDatabase } from "./database";

/** Privileged local operator service. No anonymous publish endpoint exists. */
export async function stageCatalog(input: unknown) {
  const manifest = catalogManifestSchema.parse(input);
  const content = JSON.stringify(manifest);
  const hash = createHash("sha256").update(content).digest("hex");
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const existing = await sql.query<{ content_hash: string }>(
      "SELECT content_hash FROM catalog_releases WHERE id=$1",
      [manifest.id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].content_hash !== hash)
        throw new Error(
          "Release ID already belongs to a different immutable manifest.",
        );
      return {
        id: manifest.id,
        hash,
        count: manifest.products.length,
        existing: true,
      };
    }
    const collision = await sql.query<{ id: string }>(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length)
      throw new Error(
        "Imported IDs cannot replace existing product identities.",
      );
    await sql.query(
      "INSERT INTO catalog_releases(id,content_hash,status,manifest,reviewed_by) VALUES($1,$2,'staged',$3::jsonb,$4)",
      [manifest.id, hash, content, manifest.reviewedBy],
    );
    return {
      id: manifest.id,
      hash,
      count: manifest.products.length,
      existing: false,
    };
  });
}
export async function publishCatalog(id: string, expectedHash: string) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const release = await sql.query<{
      status: string;
      content_hash: string;
      manifest: unknown;
    }>(
      "SELECT status,content_hash,manifest FROM catalog_releases WHERE id=$1 FOR UPDATE",
      [id],
    );
    const row = release.rows[0];
    if (!row || row.content_hash !== expectedHash)
      throw new Error("Reviewed release hash does not match.");
    if (row.status === "published")
      return { id, status: "published", existing: true };
    if (row.status !== "staged")
      throw new Error("A retired release cannot be republished.");
    const manifest = catalogManifestSchema.parse(row.manifest);
    if (
      manifest.products.some(
        (product) => !product.comparisonOnly && !product.media,
      )
    )
      throw new Error(
        "Reviewed exact-product media is required before publishing a shopping offer.",
      );
    const collision = await sql.query(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length)
      throw new Error("A product identity collision occurred since staging.");
    const records = manifest.products.map((p) => ({
      id: p.id,
      category: p.category,
      price: p.price,
      record: p,
      publication: p.comparisonOnly ? "retired" : "published",
    }));
    await sql.query(
      `INSERT INTO catalog_products(id,category,price,record,publication,release_id)
      SELECT id,category,price,record,publication,$2 FROM jsonb_to_recordset($1::jsonb)
      AS items(id text,category text,price integer,record jsonb,publication text)`,
      [JSON.stringify(records), id],
    );
    await sql.query(
      "UPDATE catalog_releases SET status='published',published_at=now() WHERE id=$1",
      [id],
    );
    return { id, status: "published", existing: false };
  });
}
export async function retireCatalog(id: string) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const rows = await sql.query(
      "UPDATE catalog_releases SET status='retired' WHERE id=$1 AND status='published' RETURNING id",
      [id],
    );
    if (!rows.rows.length) throw new Error("Published release not found.");
    await sql.query(
      "UPDATE catalog_products SET publication='retired' WHERE release_id=$1",
      [id],
    );
    return { id, status: "retired" };
  });
}

/** Restore the same reviewed records after withdrawal; no data is rewritten. */
export async function restoreCatalog(id: string, expectedHash: string) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const result = await sql.query<{ status: string; content_hash: string }>(
      "SELECT status,content_hash FROM catalog_releases WHERE id=$1 FOR UPDATE",
      [id],
    );
    const row = result.rows[0];
    if (!row || row.content_hash !== expectedHash)
      throw new Error("Reviewed release hash does not match.");
    if (row.status === "published")
      return { id, status: "published", existing: true };
    if (row.status !== "retired")
      throw new Error("Only a retired release can be restored.");
    await sql.query(
      "UPDATE catalog_products SET publication=CASE WHEN coalesce((record->>'comparisonOnly')::boolean,false) THEN 'retired' ELSE 'published' END WHERE release_id=$1",
      [id],
    );
    await sql.query(
      "UPDATE catalog_releases SET status='published' WHERE id=$1",
      [id],
    );
    return { id, status: "published", existing: false };
  });
}
