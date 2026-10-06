import { randomUUID } from "node:crypto";
import { getDatabase, type Sql } from "./database";

export type Job = {
  id: string;
  workspace_id: string;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
  locked_by: string;
};
const maxAttempts = 6;
const leaseMs = 5 * 60000;

export async function enqueueJob(
  sql: Sql,
  workspaceId: string,
  kind: string,
  payload: Record<string, unknown>,
  id: string = randomUUID(),
) {
  await sql.query(
    "INSERT INTO jobs(id,workspace_id,kind,payload) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING",
    [id, workspaceId, kind, JSON.stringify(payload)],
  );
  return id;
}

export async function claimJob(
  now = Date.now(),
  workspaceId?: string,
): Promise<Job | undefined> {
  return (await getDatabase()).transaction(async (sql) => {
    const expired = new Date(now - leaseMs).toISOString();
    await sql.query(
      "UPDATE jobs SET status='dead',locked_by=NULL,last_error='Lease expired after maximum attempts; operator review required.' WHERE status='running' AND locked_at<$1 AND attempts>=$2 AND ($3::text IS NULL OR workspace_id=$3)",
      [expired, maxAttempts, workspaceId ?? null],
    );
    const { rows } = await sql.query<Job>(
      "SELECT id,workspace_id,kind,payload,attempts,locked_by FROM jobs WHERE attempts<$1 AND ($4::text IS NULL OR workspace_id=$4) AND ((status='pending' AND available_at<=$2) OR (status='running' AND locked_at<$3)) ORDER BY available_at,id LIMIT 1 FOR UPDATE SKIP LOCKED",
      [maxAttempts, new Date(now).toISOString(), expired, workspaceId ?? null],
    );
    const job = rows[0];
    if (!job) return;
    job.attempts++;
    job.locked_by = randomUUID();
    await sql.query(
      "UPDATE jobs SET status='running',attempts=$2,locked_at=$3,locked_by=$4 WHERE id=$1",
      [job.id, job.attempts, new Date(now).toISOString(), job.locked_by],
    );
    return job;
  });
}

export async function finishJob(job: Job, success: boolean, now = Date.now()) {
  // A stale worker cannot acknowledge work taken over by another lease holder.
  const status = success
    ? "completed"
    : job.attempts >= maxAttempts
      ? "dead"
      : "pending";
  const delay = Math.min(30 * 60000, 1000 * 2 ** job.attempts);
  const { rows } = await (
    await getDatabase()
  ).query(
    "UPDATE jobs SET status=$3,available_at=$4,locked_at=NULL,locked_by=NULL,last_error=$5 WHERE id=$1 AND status='running' AND locked_by=$2 RETURNING id",
    [
      job.id,
      job.locked_by,
      status,
      new Date(now + (success ? 0 : delay)).toISOString(),
      success
        ? null
        : "Processing failed; private details omitted. Retry or operator review required.",
    ],
  );
  return rows.length === 1;
}

export async function processJobs(
  handler: (job: Job) => Promise<void>,
  now = Date.now(),
  limit = 25,
) {
  let completed = 0,
    failures = 0;
  for (let count = 0; count < limit; count++) {
    const job = await claimJob(now);
    if (!job) break;
    try {
      await handler(job);
      if (await finishJob(job, true, now)) completed++;
    } catch {
      failures++;
      await finishJob(job, false, now);
    }
  }
  return { completed, failures };
}

export async function recoveryStatus(workspaceId: string) {
  const db = await getDatabase();
  const queue = await db.query<{ status: string; count: string }>(
    "SELECT status,count(*)::text AS count FROM jobs WHERE workspace_id=$1 GROUP BY status",
    [workspaceId],
  );
  const heartbeat = await db.query<{
    seen_at: Date | string;
    failures: number;
  }>("SELECT seen_at,failures FROM worker_heartbeats WHERE id='recovery'");
  const seenAt = heartbeat.rows[0]?.seen_at;
  return {
    queue: Object.fromEntries(
      queue.rows.map((row) => [row.status, Number(row.count)]),
    ),
    lastSeenAt: seenAt ? new Date(seenAt).toISOString() : null,
    healthy: !!seenAt && Date.now() - new Date(seenAt).getTime() < 90000,
    failures: heartbeat.rows[0]?.failures ?? null,
  };
}
