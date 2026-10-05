import "dotenv/config";
import { workerTick } from "../src/server/recovery";
let stopping = false;
process.on("SIGTERM", () => { stopping = true; }); process.on("SIGINT", () => { stopping = true; });
while (!stopping) {
  try { const result = await workerTick(); console.log(JSON.stringify({ at: new Date().toISOString(), event: "worker.tick", failures: result.failures })); }
  catch { console.error("Worker tick failed; pending operations remain persisted for the next attempt."); }
  if (!stopping) await new Promise((resolve) => setTimeout(resolve, 30000));
}
process.exit(0);
