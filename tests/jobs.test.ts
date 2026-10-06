import { beforeEach, expect, it } from "vitest";
import { getDatabase } from "../src/server/database";
import { createWorkspace } from "../src/server/state";
import {
  claimJob,
  enqueueJob,
  finishJob,
  processJobs,
} from "../src/server/jobs";

beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
});
async function setup() {
  const state = await createWorkspace();
  const db = await getDatabase();
  await db.query("DELETE FROM jobs");
  const id = await enqueueJob(db, state.id, "reconcile", {});
  return { id, db };
}

it("claims each job once across concurrent consumers and deduplicates outbox inserts", async () => {
  const { id, db } = await setup();
  const workspace = await createWorkspace();
  await enqueueJob(db, workspace.id, "reconcile", {}, id);
  const jobs = await Promise.all([claimJob(), claimJob(), claimJob()]);
  expect(jobs.filter(Boolean)).toHaveLength(1);
  expect(jobs.find(Boolean)?.attempts).toBe(1);
});

it("reclaims interrupted work after its lease and rejects a stale acknowledgment", async () => {
  await setup();
  const now = Date.now();
  const first = (await claimJob(now))!;
  expect(await claimJob(now + 60000)).toBeUndefined();
  const second = (await claimJob(now + 6 * 60000))!;
  expect(second.id).toBe(first.id);
  expect(second.attempts).toBe(2);
  expect(await finishJob(first, true)).toBe(false);
  expect(await finishJob(second, true)).toBe(true);
});

it("retries failed jobs with bounded backoff, records no private exception, and stops after six attempts", async () => {
  const { id, db } = await setup();
  let now = Date.now();
  for (let attempt = 1; attempt <= 6; attempt++) {
    expect(
      (
        await processJobs(async () => {
          throw new Error("private-token-must-not-leak");
        }, now)
      ).failures,
    ).toBe(1);
    const row = (
      await db.query<{ status: string; last_error: string; attempts: number }>(
        "SELECT status,last_error,attempts FROM jobs WHERE id=$1",
        [id],
      )
    ).rows[0];
    expect(row.status).toBe(attempt === 6 ? "dead" : "pending");
    expect(row.last_error).not.toContain("private-token");
    expect(await claimJob(now + 1)).toBeUndefined();
    now += 2 ** attempt * 1000;
  }
  expect(await claimJob(now + 86400000)).toBeUndefined();
});

it("does not mark unrelated jobs completed after a different job succeeds", async () => {
  const { id, db } = await setup();
  const workspace = await createWorkspace();
  const second = await enqueueJob(db, workspace.id, "reconcile", {});
  expect((await processJobs(async () => {}, Date.now(), 1)).completed).toBe(1);
  const rows = (
    await db.query<{ id: string; status: string }>(
      "SELECT id,status FROM jobs WHERE id IN ($1,$2)",
      [id, second],
    )
  ).rows;
  expect(rows.filter((row) => row.status === "completed")).toHaveLength(1);
  expect(rows.filter((row) => row.status === "pending")).toHaveLength(1);
});

it("rolls back a job with its parent command when the transaction fails", async () => {
  const { db } = await setup();
  const workspace = await createWorkspace();
  await expect(
    db.transaction(async (sql) => {
      await enqueueJob(sql, workspace.id, "reconcile", {}, "rolled-back-job");
      throw new Error("abort");
    }),
  ).rejects.toThrow("abort");
  expect(
    (await db.query("SELECT id FROM jobs WHERE id='rolled-back-job'")).rows,
  ).toHaveLength(0);
});
