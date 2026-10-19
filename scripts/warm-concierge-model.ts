import { readFile } from "node:fs/promises";
import { parse } from "dotenv";
import { warmConcierge } from "../src/server/concierge/engine";
Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
if (process.env.CONCIERGE_PROVIDER !== "self_hosted")
  throw new Error("This launcher only warms private self-hosted inference.");
const start = Date.now();
await warmConcierge();
console.log(
  JSON.stringify({
    event: "concierge.prompt_warmed",
    elapsedMs: Date.now() - start,
    model: process.env.CONCIERGE_MODEL,
    customerActions: 0,
  }),
);
