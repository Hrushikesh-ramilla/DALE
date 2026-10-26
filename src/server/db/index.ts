import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { getDatabase } from "../database";

export * from "./schema";

let drizzleInstance: ReturnType<typeof drizzlePglite<typeof schema>> | ReturnType<typeof drizzlePg<typeof schema>> | null = null;

export async function getDrizzle() {
  if (drizzleInstance) return drizzleInstance;

  // Access the underlying database instance
  await getDatabase();

  // If running embedded PGlite, wire Drizzle to PGlite
  const directory = process.env.LOCAL_DATA_DIR || ".data";
  if (!process.env.DATABASE_URL) {
    const { PGlite } = await import("@electric-sql/pglite");
    const path = await import("node:path");
    const engine = new PGlite(
      directory === ":memory:" ? undefined : path.join(directory, "postgres"),
    );
    drizzleInstance = drizzlePglite(engine, { schema });
    return drizzleInstance;
  }

  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
  });
  drizzleInstance = drizzlePg(pool, { schema });
  return drizzleInstance;
}
