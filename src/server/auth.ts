import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { getDatabase } from "./database";
import { createWorkspace, getWorkspace, type Actor, type Role, type Workspace } from "./state";
const COOKIE = "bg_session";
let localSecret: Promise<string> | undefined;
async function secret() {
  if (process.env.SESSION_SECRET) {
    if (process.env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required");
  return localSecret ??= (async () => {
    const dir = process.env.LOCAL_DATA_DIR === ":memory:" ? ".data/test-secrets" : process.env.LOCAL_DATA_DIR || ".data";
    await mkdir(dir, { recursive: true }); const file = path.join(dir, "session-secret");
    try { return (await readFile(file, "utf8")).trim(); } catch {
      const value = randomBytes(32).toString("hex"); await writeFile(file, value, { flag: "wx", mode: 0o600 }); return value;
    }
  })();
}
async function hash(token: string) { return createHmac("sha256", await secret()).update(token).digest("hex"); }
function equal(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export async function createSession(input: { role: Role; accessCode?: string; workspaceId?: string; invite?: string }) {
  if (input.role !== "buyer") {
    if (!process.env.OPERATOR_ACCESS_CODE || !equal(input.accessCode || "", process.env.OPERATOR_ACCESS_CODE)) throw new Error("A valid operator access code is required");
  } else if (process.env.DEMO_ACCESS_CODE && !equal(input.accessCode || "", process.env.DEMO_ACCESS_CODE)) throw new Error("A valid demo access code is required");
  let workspace: Workspace;
  if (input.role !== "buyer" && input.workspaceId) workspace = await getWorkspace(input.workspaceId);
  else if (input.invite && input.role === "buyer") {
    const { rows } = await (await getDatabase()).query<{ state: Workspace }>("SELECT state FROM workspaces WHERE state->>'invite'=$1", [input.invite]);
    if (!rows[0]) throw new Error("Group invitation not found"); workspace = rows[0].state;
  } else workspace = await createWorkspace();
  const token = randomBytes(32).toString("hex");
  const actor: Actor = { workspaceId: workspace.id, userId: randomBytes(16).toString("hex"), role: input.role };
  await (await getDatabase()).query("INSERT INTO sessions(token_hash,workspace_id,user_id,role,expires_at) VALUES ($1,$2,$3,$4,$5)", [await hash(token), actor.workspaceId, actor.userId, actor.role, new Date(Date.now() + 86400000)]);
  return { actor, token };
}
export async function actorFromToken(token?: string): Promise<Actor> {
  if (!token) throw new Error("Please start a shopping session");
  const { rows } = await (await getDatabase()).query<{ workspace_id: string; user_id: string; role: Role }>("SELECT workspace_id,user_id,role FROM sessions WHERE token_hash=$1 AND expires_at>now()", [await hash(token)]);
  if (!rows[0]) throw new Error("Your session expired. Please sign in again.");
  return { workspaceId: rows[0].workspace_id, userId: rows[0].user_id, role: rows[0].role };
}
export async function actorFromRequest() { return actorFromToken((await cookies()).get(COOKIE)?.value); }
export async function setSessionCookie(token: string) { (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.APP_URL?.startsWith("https://") ?? false, sameSite: "strict", path: "/", maxAge: 86400 }); }
export async function logout() { const jar = await cookies(); const token = jar.get(COOKIE)?.value; if (token) await (await getDatabase()).query("DELETE FROM sessions WHERE token_hash=$1", [await hash(token)]); jar.delete(COOKIE); }
