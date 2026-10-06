import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { mkdir } from "node:fs/promises";
import path from "node:path";
export interface Sql {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}
export interface Database extends Sql {
  transaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T>;
}
declare global {
  var buyerGuardDatabase: Promise<Database> | undefined;
}
const schema = `
CREATE TABLE IF NOT EXISTS workspaces (id text PRIMARY KEY, state jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id), user_id text NOT NULL, role text NOT NULL CHECK (role IN ('buyer','seller','reviewer')), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS assets (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id), case_id text NOT NULL, owner_id text NOT NULL, checkpoint text NOT NULL, mime text NOT NULL, hash text NOT NULL, storage_key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS jobs (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id), kind text NOT NULL, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), locked_at timestamptz, last_error text);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locked_by text;
CREATE INDEX IF NOT EXISTS jobs_ready ON jobs(status,available_at);
CREATE TABLE IF NOT EXISTS worker_heartbeats (id text PRIMARY KEY, seen_at timestamptz NOT NULL, failures integer NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_receipts (id text PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now());
`;
export function getDatabase(): Promise<Database> {
  return (globalThis.buyerGuardDatabase ??= initialize());
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
  return {
    ...wrap(engine),
    transaction: (fn) => engine.transaction((tx) => fn(wrap(tx))),
  };
}
