import { getDatabase } from "./database";
import type { Actor } from "./state";
export async function takeRequestBudget(
  actor: Actor,
  bucket: string,
  limit: number,
  now = Date.now(),
  exhaustedMessage = "Request rate limit reached. Please wait until the next minute.",
) {
  const window = new Date(Math.floor(now / 60000) * 60000).toISOString();
  const { rows } = await (
    await getDatabase()
  ).query<{ used: number }>(
    "INSERT INTO request_budgets(id,window_at,used) VALUES($1,$2,1) ON CONFLICT(id) DO UPDATE SET window_at=EXCLUDED.window_at, used=CASE WHEN request_budgets.window_at=EXCLUDED.window_at THEN request_budgets.used+1 ELSE 1 END RETURNING used",
    [`${actor.workspaceId}:${actor.userId}:${bucket}`, window],
  );
  if (rows[0].used > limit) throw new Error(exhaustedMessage);
}
