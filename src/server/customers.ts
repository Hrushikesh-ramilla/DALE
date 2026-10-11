import {
  randomUUID,
  randomBytes,
  scrypt as derive,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { getDatabase } from "./database";
import { createWorkspace, type Actor } from "./state";
import { issueSession } from "./auth";
import { takeRequestBudget } from "./budgets";

const scrypt = promisify(derive);
export const customerInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("guest") }).strict(),
  z
    .object({
      action: z.literal("register"),
      name: z.string().trim().min(1).max(80),
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(12).max(128),
    })
    .strict(),
  z
    .object({
      action: z.literal("login"),
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(1).max(128),
    })
    .strict(),
]);
async function passwordHash(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
// The singleton store shares group/stock state; snapshot and order ownership
// still isolate every customer's private records. Demo workspaces stay separate.
export async function storeWorkspace() {
  const db = await getDatabase();
  const existing = await db.query<{ workspace_id: string }>(
    "SELECT workspace_id FROM storefronts WHERE id='primary'",
  );
  if (existing.rows[0]) return existing.rows[0].workspace_id;
  const candidate = await createWorkspace();
  await db.query(
    "INSERT INTO storefronts(id,workspace_id) VALUES('primary',$1) ON CONFLICT(id) DO NOTHING",
    [candidate.id],
  );
  const result = await db.query<{ workspace_id: string }>(
    "SELECT workspace_id FROM storefronts WHERE id='primary'",
  );
  if (result.rows[0].workspace_id !== candidate.id)
    await db.query("DELETE FROM workspaces WHERE id=$1", [candidate.id]);
  return result.rows[0].workspace_id;
}
export async function customerSession(raw: unknown, current?: Actor) {
  const input = customerInput.parse(raw);
  const workspaceId = await storeWorkspace();
  await takeRequestBudget(
    { workspaceId, userId: "account-entry", role: "buyer" },
    "entry",
    60,
  );
  const db = await getDatabase();
  let id: string;
  if (input.action === "guest") {
    if (current?.role === "buyer" && current.workspaceId === workspaceId)
      return issueSession(current);
    id = randomUUID();
    await db.query(
      "INSERT INTO customer_accounts(id,name) VALUES($1,'Guest')",
      [id],
    );
  } else if (input.action === "register") {
    const guest =
      current?.role === "buyer" && current.workspaceId === workspaceId
        ? await db.query<{ id: string }>(
            "SELECT id FROM customer_accounts WHERE id=$1 AND email IS NULL",
            [current.userId],
          )
        : { rows: [] };
    id = guest.rows[0]?.id || randomUUID();
    const hashed = await passwordHash(input.password);
    try {
      if (guest.rows[0]) {
        const upgraded = await db.query(
          "UPDATE customer_accounts SET email=$2,name=$3,password_hash=$4 WHERE id=$1 AND email IS NULL RETURNING id",
          [id, input.email, input.name, hashed],
        );
        if (!upgraded.rows.length) throw new Error("Guest already converted");
      } else
        await db.query(
          "INSERT INTO customer_accounts(id,email,name,password_hash) VALUES($1,$2,$3,$4)",
          [id, input.email, input.name, hashed],
        );
    } catch {
      throw new Error("Account could not be created. Try signing in instead.");
    }
  } else {
    const result = await db.query<{ id: string; password_hash: string }>(
      "SELECT id,password_hash FROM customer_accounts WHERE email=$1",
      [input.email],
    );
    const stored =
      result.rows[0]?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`;
    const proposed = await passwordHash(input.password, stored.split(":")[0]);
    if (
      !result.rows[0] ||
      !timingSafeEqual(Buffer.from(stored), Buffer.from(proposed))
    )
      throw new Error("Invalid email or password.");
    id = result.rows[0].id;
  }
  return issueSession({ workspaceId, userId: id, role: "buyer" });
}
export async function customerProfile(actor: Actor) {
  if (actor.role !== "buyer") return undefined;
  const result = await (
    await getDatabase()
  ).query<{ name: string; email: string | null }>(
    "SELECT name,email FROM customer_accounts WHERE id=$1",
    [actor.userId],
  );
  return result.rows[0];
}
