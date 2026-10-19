import { getDatabase, type Database, type Sql } from "../database";
import type { Actor } from "../state";
import type { ConciergeState } from "@/domain/concierge";
import { AsyncLocalStorage } from "node:async_hooks";
import { publishConciergeChange } from "./changes";
const execution = new AsyncLocalStorage<{ owner: string; turnId: string }>();
export const withTurnFence = <T>(
  actor: Actor,
  turnId: string,
  fn: () => Promise<T>,
) => execution.run({ owner: ownerKey(actor), turnId }, fn);

let initialized: Database | undefined;
let initializing: Promise<void> | undefined;
export async function conciergeDatabase() {
  const db = await getDatabase();
  if (initialized !== db) {
    initializing ??= (async () => {
      await db.query(
        `CREATE TABLE IF NOT EXISTS concierge_documents (owner text PRIMARY KEY, state jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
      );
      await db.query(
        `CREATE TABLE IF NOT EXISTS concierge_embeddings (product_id text PRIMARY KEY, content_hash text NOT NULL, model text NOT NULL, vector jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
      );
      await db.query(
        `CREATE TABLE IF NOT EXISTS concierge_turn_ids (owner text NOT NULL, turn_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner,turn_id))`,
      );
      await db.query(
        `CREATE TABLE IF NOT EXISTS concierge_product_references (product_id text PRIMARY KEY, ref bigserial UNIQUE NOT NULL)`,
      );
      initialized = db;
    })().finally(() => {
      initializing = undefined;
    });
    await initializing;
  }
  return db;
}
export function assertBuyer(actor: Actor) {
  if (actor.role !== "buyer")
    throw new Error("Only the authenticated shopper can use the concierge.");
}
export const ownerKey = (actor: Actor) =>
  `${actor.workspaceId}:${actor.userId}`;
const empty = (): ConciergeState => ({
  revision: 0,
  messages: [],
  transcript: [],
  cart: [],
  wishlist: [],
  actions: [],
  confirmations: [],
  resultSets: [],
});
export async function readConcierge(actor: Actor) {
  assertBuyer(actor);
  const db = await conciergeDatabase();
  const result = await db.query<{ state: ConciergeState }>(
    "SELECT state FROM concierge_documents WHERE owner=$1",
    [ownerKey(actor)],
  );
  return result.rows[0]?.state || empty();
}
export async function changeConcierge<T>(
  actor: Actor,
  fn: (state: ConciergeState, sql: Sql) => T | Promise<T>,
) {
  assertBuyer(actor);
  let committedRevision = -1;
  const value = await (
    await conciergeDatabase()
  ).transaction(async (sql) => {
    await sql.query(
      "INSERT INTO concierge_documents(owner,state) VALUES($1,$2::jsonb) ON CONFLICT(owner) DO NOTHING",
      [ownerKey(actor), JSON.stringify(empty())],
    );
    const result = await sql.query<{ state: ConciergeState }>(
      "SELECT state FROM concierge_documents WHERE owner=$1 FOR UPDATE",
      [ownerKey(actor)],
    );
    const state = result.rows[0].state;
    const fence = execution.getStore();
    if (
      fence?.owner === ownerKey(actor) &&
      (state.turn?.id !== fence.turnId || state.turn.status !== "running")
    )
      throw new Error(
        "The originating turn is no longer active. No new mutation was applied.",
      );
    const value = await fn(state, sql);
    state.revision++;
    state.transcript = state.transcript.slice(-100);
    if (state.messages.length > 160) {
      const boundary = state.messages.findIndex(
        (m, i) => i >= 80 && m.role === "user",
      );
      if (boundary >= 0) state.messages = state.messages.slice(boundary);
    }
    state.actions = state.actions.slice(-100);
    for (const confirmation of state.confirmations) {
      if (
        confirmation.status === "pending" &&
        Date.parse(confirmation.expiresAt) <= Date.now()
      ) {
        confirmation.status = "failed";
        confirmation.result = {
          error:
            "Confirmation expired. Prepare a new operation with current terms.",
        };
      }
    }
    const active = state.confirmations.filter(
      (c) => c.status === "pending" || c.status === "executing",
    );
    const history = state.confirmations
      .filter((c) => c.status !== "pending" && c.status !== "executing")
      .slice(-30);
    state.confirmations = [...history, ...active];
    state.resultSets = state.resultSets.slice(-12);
    await sql.query(
      "UPDATE concierge_documents SET state=$2::jsonb,updated_at=now() WHERE owner=$1",
      [ownerKey(actor), JSON.stringify(state)],
    );
    committedRevision = state.revision;
    return value;
  });
  publishConciergeChange(ownerKey(actor), committedRevision);
  return value;
}
