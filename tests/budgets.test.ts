import { beforeAll, expect, it } from "vitest";
import { createWorkspace, type Actor } from "../src/server/state";
import { takeRequestBudget } from "../src/server/budgets";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
it("atomically limits concurrent requests while isolating actors and renewing the minute window", async () => {
  const workspace = await createWorkspace({ fixture: true });
  const actor: Actor = {
    workspaceId: workspace.id,
    userId: "buyer",
    role: "buyer",
  };
  const now = 1800000000000;
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      takeRequestBudget(actor, "uploads", 3, now),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
  await expect(takeRequestBudget(actor, "uploads", 3, now)).rejects.toThrow(
    "rate limit",
  );
  await takeRequestBudget({ ...actor, userId: "other" }, "uploads", 3, now);
  await takeRequestBudget(actor, "actions", 3, now);
  await takeRequestBudget(actor, "uploads", 3, now + 60000);
});
