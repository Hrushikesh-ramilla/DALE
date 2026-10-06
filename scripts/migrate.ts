import "dotenv/config";
import { getDatabase, closeDatabase } from "../src/server/database";
await getDatabase();
console.log("Database schema ready.");
await closeDatabase();
