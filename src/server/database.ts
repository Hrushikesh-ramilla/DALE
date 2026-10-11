import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bootstrapCatalog } from "./catalog-bootstrap";
export interface Sql {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}
export interface Database extends Sql {
  transaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
declare global {
  var buyerGuardDatabase: Promise<Database> | undefined;
}
const schema = `
CREATE TABLE IF NOT EXISTS catalog_products (id text PRIMARY KEY, category text NOT NULL, price integer NOT NULL CHECK(price>0), record jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS catalog_category_price ON catalog_products(category,price,id);
CREATE INDEX IF NOT EXISTS catalog_attributes ON catalog_products USING gin ((record->'attributes'));
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS publication text NOT NULL DEFAULT 'unclassified';
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS release_id text;
CREATE INDEX IF NOT EXISTS catalog_search_document ON catalog_products USING gin (to_tsvector('simple',coalesce(record->>'name','') || ' ' || coalesce(record->>'description','') || ' ' || coalesce(record->>'specs','')));
CREATE INDEX IF NOT EXISTS catalog_publication_category ON catalog_products(publication,category,price,id);
CREATE TABLE IF NOT EXISTS catalog_releases (id text PRIMARY KEY, content_hash text NOT NULL, status text NOT NULL CHECK(status IN ('staged','published','retired')), manifest jsonb NOT NULL, reviewed_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz);
CREATE TABLE IF NOT EXISTS workspaces (id text PRIMARY KEY, state jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS storefronts (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id));
CREATE TABLE IF NOT EXISTS customer_accounts (id text PRIMARY KEY, email text UNIQUE, name text NOT NULL, password_hash text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id), user_id text NOT NULL, role text NOT NULL CHECK (role IN ('buyer','seller','reviewer')), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS assets (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id), case_id text NOT NULL, owner_id text NOT NULL, checkpoint text NOT NULL, mime text NOT NULL, hash text NOT NULL, storage_key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS jobs (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id), kind text NOT NULL, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), locked_at timestamptz, last_error text);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locked_by text;
CREATE INDEX IF NOT EXISTS jobs_ready ON jobs(status,available_at);
CREATE TABLE IF NOT EXISTS worker_heartbeats (id text PRIMARY KEY, seen_at timestamptz NOT NULL, failures integer NOT NULL);
CREATE TABLE IF NOT EXISTS request_budgets (id text PRIMARY KEY, window_at timestamptz NOT NULL, used integer NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_receipts (id text PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS leaf_type text;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS model_name text;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS sku_variant text;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS revision_id text;
CREATE INDEX IF NOT EXISTS catalog_leaf_price ON catalog_products(leaf_type,price,id);
CREATE INDEX IF NOT EXISTS catalog_brand_model ON catalog_products(brand,model_name);
CREATE TABLE IF NOT EXISTS catalog_fact_revisions (revision_id text PRIMARY KEY, product_id text NOT NULL, leaf_type text NOT NULL, brand text NOT NULL, model_name text NOT NULL, sku_variant text, facts jsonb NOT NULL, source_url text NOT NULL, observed_at timestamptz NOT NULL, observed_region text NOT NULL, operator_audit text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), superseded_at timestamptz);
CREATE INDEX IF NOT EXISTS fact_revisions_product ON catalog_fact_revisions(product_id, created_at DESC);
CREATE TABLE IF NOT EXISTS catalog_device_accessories (id text PRIMARY KEY, device_id text NOT NULL, accessory_id text NOT NULL, compatibility_state text NOT NULL CHECK(compatibility_state IN ('fits','does_not_fit','unknown')), evidence jsonb NOT NULL, observed_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS device_accessories_lookup ON catalog_device_accessories(device_id, accessory_id);
CREATE TABLE IF NOT EXISTS catalog_operator_jobs (id text PRIMARY KEY, kind text NOT NULL, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','retry','review_required','completed','dead_letter')), attempts integer NOT NULL DEFAULT 0, locked_at timestamptz, locked_by text, last_error text, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz);
CREATE INDEX IF NOT EXISTS catalog_operator_jobs_status ON catalog_operator_jobs(status);
`;
export function getDatabase(): Promise<Database> {
  return (globalThis.buyerGuardDatabase ??= initialize());
}
export async function closeDatabase() {
  const pending = globalThis.buyerGuardDatabase;
  globalThis.buyerGuardDatabase = undefined;
  if (pending) await (await pending).close();
}
async function initialize(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
    });
    const wrap = (client: Pick<Pool, "query">): Sql => ({
      async query<T>(sql: string, values: unknown[] = []) {
        const result = await client.query(sql, values);
        return { rows: result.rows as T[] };
      },
    });
    const db: Database = {
      ...wrap(pool),
      close: () => pool.end(),
      async transaction(fn) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn(wrap(client));
          await client.query("COMMIT");
          return result;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      },
    };
    await db.transaction(async (sql) => {
      // App and worker may start together on a fresh host. Serialize compatible DDL.
      await sql.query("SELECT pg_advisory_xact_lock(72190461)");
      await sql.query(schema);
      await bootstrapCatalog(sql);
    });
    return db;
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_EMBEDDED_DATABASE !== "true"
  )
    throw new Error("DATABASE_URL is required for deployment.");
  const directory = process.env.LOCAL_DATA_DIR || ".data";
  if (directory !== ":memory:") await mkdir(directory, { recursive: true });
  const engine = new PGlite(
    directory === ":memory:" ? undefined : path.join(directory, "postgres"),
  );
  await engine.exec(schema);
  const wrap = (client: Pick<PGlite, "query">): Sql => ({
    async query<T>(sql: string, values: unknown[] = []) {
      const result = await client.query<T>(sql, values);
      return { rows: result.rows };
    },
  });
  await engine.transaction((tx) => bootstrapCatalog(wrap(tx)));
  return {
    ...wrap(engine),
    close: () => engine.close(),
    transaction: (fn) => engine.transaction((tx) => fn(wrap(tx))),
  };
}
