import "dotenv/config";
import { getDatabase } from "../src/server/database";
await getDatabase();
console.log("Database schema ready.");
process.exit(0);
