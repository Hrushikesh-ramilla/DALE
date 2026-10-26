import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { getDatabase } from "../database";

export * from "./schema";

let drizzleInstance:
  | ReturnType<typeof drizzlePglite<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>
  | null = null;

export async function getDrizzle() {
  if (drizzleInstance) return drizzleInstance;

  const db = await getDatabase();
  const raw = db.rawEngine;

  if (process.env.DATABASE_URL) {
    drizzleInstance = drizzlePg(raw as any, { schema });
  } else {
    drizzleInstance = drizzlePglite(raw as any, { schema });
  }
  return drizzleInstance;
}
