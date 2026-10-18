import { createHash, randomUUID } from "node:crypto";
import { getDatabase, type Sql } from "./database";

export type OperatorJobStatus =
  | "pending"
  | "running"
  | "retry"
  | "review_required"
  | "completed"
  | "dead_letter";

export type OperatorJobKind =
  | "collect_census"
  | "stage_manifest"
  | "publish_manifest"
  | "review_revision"
  | "refresh_offers";

export interface OperatorJob {
  id: string;
  kind: OperatorJobKind;
  payload: Record<string, unknown>;
  status: OperatorJobStatus;
  attempts: number;
  locked_by: string | null;
  locked_at: string | null;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface OperatorJobResult {
  success: boolean;
  status?: "completed" | "review_required" | "retry" | "dead_letter";
  error?: string;
  output?: Record<string, unknown>;
}

const DEFAULT_LEASE_MS = 5 * 60000;
const DEFAULT_MAX_ATTEMPTS = 5;

function redactError(message: string): string {
  return message
    .replace(/(?:key|secret|token|password|bearer|auth)[=:\s]+[A-Za-z0-9_.-]+/gi, "[REDACTED]")
    .slice(0, 500);
}

export function deterministicJobId(kind: OperatorJobKind, payload: Record<string, unknown>): string {
  const content = JSON.stringify({ kind, payload });
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 32);
  return `opjob-${kind}-${hash}`;
}

export async function enqueueOperatorJob(
  kind: OperatorJobKind,
  payload: Record<string, unknown>,
  customId?: string,
  sqlClient?: Sql,
): Promise<{ id: string; enqueued: boolean }> {
  const id = customId || deterministicJobId(kind, payload);
  const database = sqlClient || (await getDatabase());
  const res = await database.query<{ id: string }>(
    `INSERT INTO catalog_operator_jobs (id, kind, payload, status)
     VALUES ($1, $2, $3::jsonb, 'pending')
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [id, kind, JSON.stringify(payload)],
  );
  return {
    id,
    enqueued: res.rows.length > 0,
  };
}

export async function claimOperatorJob(
  workerId: string = randomUUID(),
  now = Date.now(),
  leaseMs = DEFAULT_LEASE_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  jobId?: string,
): Promise<OperatorJob | undefined> {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    const expiredTimestamp = new Date(now - leaseMs).toISOString();

    // Expire stale leases
    await sql.query(
      `UPDATE catalog_operator_jobs
       SET status='dead_letter', locked_by=NULL, last_error='Lease expired after maximum attempts; operator review required.'
       WHERE status='running' AND locked_at < $1 AND attempts >= $2 AND ($3::text IS NULL OR id=$3)`,
      [expiredTimestamp, maxAttempts, jobId ?? null],
    );

    await sql.query(
      `UPDATE catalog_operator_jobs
       SET status='retry', locked_by=NULL, last_error='Lease expired; queued for retry.'
       WHERE status='running' AND locked_at < $1 AND attempts < $2 AND ($3::text IS NULL OR id=$3)`,
      [expiredTimestamp, maxAttempts, jobId ?? null],
    );

    // Fetch next eligible job
    const { rows } = await sql.query<OperatorJob>(
      `SELECT id, kind, payload, status, attempts, locked_by, locked_at, last_error, created_at, completed_at
       FROM catalog_operator_jobs
       WHERE status IN ('pending', 'retry') AND attempts < $1 AND ($2::text IS NULL OR id=$2)
       ORDER BY created_at ASC, id ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
      [maxAttempts, jobId ?? null],
    );

    const job = rows[0];
    if (!job) return undefined;

    const nextAttempts = job.attempts + 1;
    const nowIso = new Date(now).toISOString();

    await sql.query(
      `UPDATE catalog_operator_jobs
       SET status='running', attempts=$2, locked_at=$3, locked_by=$4
       WHERE id=$1`,
      [job.id, nextAttempts, nowIso, workerId],
    );

    return {
      ...job,
      attempts: nextAttempts,
      status: "running",
      locked_at: nowIso,
      locked_by: workerId,
    };
  });
}

export async function finishOperatorJob(
  job: OperatorJob,
  outcome: OperatorJobResult,
  now = Date.now(),
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
): Promise<boolean> {
  const database = await getDatabase();
  let targetStatus: OperatorJobStatus;

  if (outcome.status) {
    targetStatus = outcome.status;
  } else if (outcome.success) {
    targetStatus = "completed";
  } else if (job.attempts >= maxAttempts) {
    targetStatus = "dead_letter";
  } else {
    targetStatus = "retry";
  }

  const completedAt = targetStatus === "completed" ? new Date(now).toISOString() : null;
  const lastError = outcome.error ? redactError(outcome.error) : null;

  const { rows } = await database.query<{ id: string }>(
    `UPDATE catalog_operator_jobs
     SET status=$3, locked_at=NULL, locked_by=NULL, last_error=$4, completed_at=$5
     WHERE id=$1 AND status='running' AND locked_by=$2
     RETURNING id`,
    [job.id, job.locked_by, targetStatus, lastError, completedAt],
  );

  return rows.length === 1;
}

export async function processOperatorJobs(
  handler: (job: OperatorJob) => Promise<OperatorJobResult>,
  options: { workerId?: string; now?: number; limit?: number; jobId?: string } = {},
): Promise<{ completed: number; failures: number; reviewRequired: number }> {
  const workerId = options.workerId || randomUUID();
  const now = options.now ?? Date.now();
  const limit = options.limit ?? 25;

  let completed = 0;
  let failures = 0;
  let reviewRequired = 0;

  for (let i = 0; i < limit; i++) {
    const job = await claimOperatorJob(workerId, now, DEFAULT_LEASE_MS, DEFAULT_MAX_ATTEMPTS, options.jobId);
    if (!job) break;

    try {
      const result = await handler(job);
      const finished = await finishOperatorJob(job, result, now);
      if (finished) {
        if (result.status === "review_required") {
          reviewRequired++;
        } else if (result.success) {
          completed++;
        } else {
          failures++;
        }
      }
    } catch (err) {
      failures++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      await finishOperatorJob(job, { success: false, error: errorMessage }, now);
    }
  }

  return { completed, failures, reviewRequired };
}

export async function getOperatorJob(id: string): Promise<OperatorJob | undefined> {
  const database = await getDatabase();
  const res = await database.query<OperatorJob>(
    `SELECT id, kind, payload, status, attempts, locked_by, locked_at, last_error, created_at, completed_at
     FROM catalog_operator_jobs WHERE id=$1`,
    [id],
  );
  return res.rows[0];
}

export async function listOperatorJobs(status?: OperatorJobStatus): Promise<OperatorJob[]> {
  const database = await getDatabase();
  const res = await database.query<OperatorJob>(
    `SELECT id, kind, payload, status, attempts, locked_by, locked_at, last_error, created_at, completed_at
     FROM catalog_operator_jobs
     WHERE ($1::text IS NULL OR status=$1)
     ORDER BY created_at DESC`,
    [status ?? null],
  );
  return res.rows;
}
