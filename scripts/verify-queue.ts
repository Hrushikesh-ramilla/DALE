import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { getDatabase } from "../src/server/database";
import { createWorkspace } from "../src/server/state";
import { claimJob, enqueueJob, finishJob } from "../src/server/jobs";

async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const url = new URL(config.DATABASE_URL);
  url.hostname = "127.0.0.1";
  url.port = process.env.DATABASE_TUNNEL_PORT || "3112";
  process.env.DATABASE_URL = url.toString();
  const db = await getDatabase();
  const workspace = await createWorkspace();
  const now = Date.now() + 3600000;
  const checks: {
    requirement: string;
    passed: boolean;
    expected: string;
    observed: string;
  }[] = [];
  try {
    const id = await enqueueJob(db, workspace.id, "reconcile", {
      validation: true,
    });
    await db.query("UPDATE jobs SET available_at=$2 WHERE id=$1", [
      id,
      new Date(now).toISOString(),
    ]);
    const claims = await Promise.all([
      claimJob(now, workspace.id),
      claimJob(now, workspace.id),
      claimJob(now, workspace.id),
    ]);
    const owners = claims.filter((job) => job?.id === id);
    const first = owners[0];
    checks.push({
      requirement: "BG07-queue-concurrency",
      expected: "one lease holder",
      observed: `${owners.length} lease holders`,
      passed: owners.length === 1,
    });
    if (!first) throw new Error("Validation job was not claimed.");
    const second = await claimJob(now + 6 * 60000, workspace.id);
    if (!second || second.id !== id)
      throw new Error("Validation lease was not recovered.");
    const stale = await finishJob(first, true, now + 6 * 60000);
    const current = await finishJob(second, true, now + 6 * 60000);
    checks.push({
      requirement: "BG07-queue-crash-recovery",
      expected: "stale acknowledgment rejected; current lease completes",
      observed: `stale=${stale}; current=${current}`,
      passed: !stale && current && second.attempts === 2,
    });
    const result = (
      await db.query<{ status: string }>(
        "SELECT status FROM jobs WHERE id=$1",
        [id],
      )
    ).rows[0];
    checks.push({
      requirement: "BG07-durable-result",
      expected: "completed",
      observed: result.status,
      passed: result.status === "completed",
    });
    await mkdir(".data/reports", { recursive: true });
    await writeFile(
      ".data/reports/queue-postgres.json",
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          build: config.BUILD_ID,
          environment: "Hosted PostgreSQL through restricted SSH tunnel",
          scope: "isolated queue metadata; no provider transactions",
          checks,
        },
        null,
        2,
      ),
    );
    for (const check of checks)
      console.log(`${check.passed ? "PASS" : "FAIL"}: ${check.requirement}`);
    if (checks.some((check) => !check.passed)) process.exitCode = 1;
  } finally {
    // Only resources created by this validation run are removed; no financial audit is reset.
    await db.query("DELETE FROM jobs WHERE workspace_id=$1", [workspace.id]);
    await db.query("DELETE FROM workspaces WHERE id=$1", [workspace.id]);
  }
}
void main()
  .then(() => process.exit(process.exitCode || 0))
  .catch(() => {
    console.error(
      "Queue verification failed; database credentials are not logged.",
    );
    process.exit(1);
  });
