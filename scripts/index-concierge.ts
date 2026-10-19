import "dotenv/config";
import { indexCatalog } from "../src/server/concierge/retrieval";
import { closeDatabase } from "../src/server/database";
try {
  console.log(JSON.stringify(await indexCatalog()));
} finally {
  await closeDatabase();
}
