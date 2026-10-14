import "dotenv/config";
import { readFile } from "node:fs/promises";
import {
  stageCatalog,
  publishCatalog,
  retireCatalog,
  restoreCatalog,
} from "../src/server/catalog-publishing";
import { closeDatabase } from "../src/server/database";
const [action, target, hash] = process.argv.slice(2);
try {
  if (action === "stage" && target)
    console.log(
      JSON.stringify(
        await stageCatalog(JSON.parse(await readFile(target, "utf8"))),
      ),
    );
  else if (action === "publish" && target && hash)
    console.log(JSON.stringify(await publishCatalog(target, hash)));
  else if (action === "restore" && target && hash)
    console.log(JSON.stringify(await restoreCatalog(target, hash)));
  else if (action === "retire" && target)
    console.log(JSON.stringify(await retireCatalog(target)));
  else
    throw new Error(
      "Usage: catalog-release.ts stage <manifest.json> | publish <release-id> <reviewed-hash> | retire <release-id> | restore <release-id> <reviewed-hash>",
    );
} finally {
  await closeDatabase();
}
