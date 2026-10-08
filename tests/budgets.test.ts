import { beforeAll, expect, it } from "vitest";
import { createWorkspace, type Actor } from "../src/server/state";
import { takeRequestBudget } from "../src/server/budgets";
import { publicDemoLaunchLimit } from "../src/server/demo";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
it("permits a five-engineer scenario burst while retaining a bounded public launch window", async () => {
  const actor: Actor = {
    workspaceId: "public-demo",
    userId: "launches",
    role: "buyer",
  };
  const now = 1800000120000;
  const results = await Promise.allSettled(
    Array.from({ length: publicDemoLaunchLimit + 1 }, () =>
      takeRequestBudget(actor, "launch", publicDemoLaunchLimit, now),
    ),
  );
  expect(publicDemoLaunchLimit).toBeGreaterThanOrEqual(5 * 9);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(publicDemoLaunchLimit);
  expect(results.filter((result) => result.status === "rejected")).toHaveLength(
    1,
  );
  await expect(
    takeRequestBudget(actor, "launch", publicDemoLaunchLimit, now + 60000),
  ).resolves.toBeUndefined();
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
