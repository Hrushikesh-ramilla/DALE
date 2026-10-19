import "dotenv/config";
import { indexCatalog } from "../src/server/concierge/retrieval";
import { closeDatabase } from "../src/server/database";
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => controller.abort());
try {
  while (!controller.signal.aborted) {
    try {
      const result = await indexCatalog(8, controller.signal);
      console.log(
        JSON.stringify({
          event: "concierge.index",
          at: new Date().toISOString(),
          ...result,
        }),
      );
    } catch (e) {
      if (!controller.signal.aborted)
        console.warn(
          JSON.stringify({
            event: "concierge.index.failed",
            error: e instanceof Error ? e.message : "Index update failed",
          }),
        );
    }
    if (!controller.signal.aborted)
      await new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          controller.signal.removeEventListener("abort", finish);
          resolve();
        };
        const timer = setTimeout(finish, 300000);
        controller.signal.addEventListener("abort", finish, { once: true });
        if (controller.signal.aborted) finish();
      });
  }
} finally {
  await closeDatabase();
}
