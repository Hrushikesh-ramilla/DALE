import { getDatabase, type Database, type Sql } from "../database";
import type { Actor } from "../state";
import type { ConciergeState } from "@/domain/concierge";
import { AsyncLocalStorage } from "node:async_hooks";
import { publishConciergeChange } from "./changes";
import { randomUUID, createHash } from "node:crypto";
const execution = new AsyncLocalStorage<{
  owner: string;
  turnId: string;
  worker?: string;
}>();
const operation = new AsyncLocalStorage<{
  owner: string;
  key: string;
  step: number;
}>();
/** One identity per native function call. State effects and their replay receipts
 * commit together, even if the HTTP response or model continuation is lost. */
export const withOperation = <T>(
  actor: Actor,
  key: string,
  fn: () => Promise<T>,
) => operation.run({ owner: ownerKey(actor), key, step: 0 }, fn);
export function operationId() {
  const active = operation.getStore();
  if (!active) return randomUUID();
  const hex = createHash("sha256")
    .update(`${active.owner}:${active.key}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export const withTurnFence = <T>(
  actor: Actor,
  turnId: string,
  fn: () => Promise<T>,
  worker?: string,
) => execution.run({ owner: ownerKey(actor), turnId, worker }, fn);

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
      await db.query(`CREATE TABLE IF NOT EXISTS concierge_effects (
        owner text NOT NULL, key text NOT NULL, result jsonb NOT NULL,
        basket_before jsonb, basket_revision integer,
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner,key))`);
      await db.query(
        `CREATE TABLE IF NOT EXISTS concierge_product_references (product_id text PRIMARY KEY, ref bigserial UNIQUE NOT NULL)`,
      );
      await db.query(`CREATE TABLE IF NOT EXISTS concierge_conversations (
        owner text NOT NULL, id text NOT NULL, memory jsonb, legacy_snapshot jsonb,
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner,id))`);
      await db.query(`CREATE TABLE IF NOT EXISTS concierge_chat_messages (
        sequence bigserial PRIMARY KEY, owner text NOT NULL, conversation_id text NOT NULL,
        message_id text NOT NULL, sender text NOT NULL CHECK(sender IN ('user','assistant')),
        content text NOT NULL, timestamp bigint NOT NULL,
        UNIQUE(owner,conversation_id,message_id),
        FOREIGN KEY(owner,conversation_id) REFERENCES concierge_conversations(owner,id))`);
      await db.query(
        `CREATE INDEX IF NOT EXISTS concierge_chat_history ON concierge_chat_messages(owner,conversation_id,sequence)`,
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
  basketRevision: 0,
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
  const active = operation.getStore();
  const effectKey =
    active?.owner === ownerKey(actor)
      ? `${active.key}:${active.step++}`
      : undefined;
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
      (state.turn?.id !== fence.turnId ||
        state.turn.status !== "running" ||
        (fence.worker && state.execution?.worker !== fence.worker))
    )
      throw new Error(
        "The originating turn is no longer active. No new mutation was applied.",
      );
    if (effectKey) {
      const receipt = await sql.query<{ result: { value?: T } }>(
        "SELECT result FROM concierge_effects WHERE owner=$1 AND key=$2",
        [ownerKey(actor), effectKey],
      );
      if (receipt.rows.length) return receipt.rows[0].result.value as T;
    }
    if (!state.conversationId) {
      state.conversationId = randomUUID();
      // Preserve the original legacy document before replacing its UI caches.
      await sql.query(
        "INSERT INTO concierge_conversations(owner,id,legacy_snapshot) VALUES($1,$2,$3::jsonb)",
        [
          ownerKey(actor),
          state.conversationId,
          JSON.stringify(result.rows[0].state),
        ],
      );
      await archiveTranscript(sql, ownerKey(actor), state);
    }
    // Chat/tool bookkeeping must not stale a shopper's basket observation.
    // Legacy documents start at their last public revision without data loss.
    const basketRevision = state.basketRevision ?? state.revision;
    const beforeBasket = JSON.stringify([state.cart, state.wishlist]);
    const value = await fn(state, sql);
    state.basketRevision =
      basketRevision +
      Number(beforeBasket !== JSON.stringify([state.cart, state.wishlist]));
    if (effectKey)
      await sql.query(
        "INSERT INTO concierge_effects(owner,key,result,basket_before,basket_revision) VALUES($1,$2,$3::jsonb,$4::jsonb,$5)",
        [
          ownerKey(actor),
          effectKey,
          JSON.stringify({ value }),
          beforeBasket !== JSON.stringify([state.cart, state.wishlist])
            ? beforeBasket
            : null,
          state.basketRevision,
        ],
      );
    state.revision++;
    await archiveTranscript(sql, ownerKey(actor), state);
    // Bounded UI/native caches only. The append-only archive above is authoritative
    // for model memory and paginated history; no archived message is pruned.
    state.transcript = state.transcript.slice(-50);
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
  if (committedRevision >= 0)
    publishConciergeChange(ownerKey(actor), committedRevision);
  return value;
}

async function archiveTranscript(
  sql: Sql,
  owner: string,
  state: ConciergeState,
) {
  if (!state.transcript.length) return;
  await sql.query(
    `INSERT INTO concierge_chat_messages(owner,conversation_id,message_id,sender,content,timestamp)
    SELECT $1,$2,m.value->>'id',m.value->>'sender',m.value->>'text',(m.value->>'timestamp')::bigint
    FROM jsonb_array_elements($3::jsonb) WITH ORDINALITY m(value,ordinality)
    ORDER BY m.ordinality ON CONFLICT(owner,conversation_id,message_id) DO NOTHING`,
    [owner, state.conversationId, JSON.stringify(state.transcript)],
  );
}

export type ChatMessage = ConciergeState["transcript"][number] & {
  sequence: number;
};
export async function conversationMessages(
  actor: Actor,
  conversationId: string,
): Promise<ChatMessage[]> {
  assertBuyer(actor);
  const rows = await (
    await conciergeDatabase()
  ).query<{
    sequence: string;
    message_id: string;
    sender: "user" | "assistant";
    content: string;
    timestamp: string;
  }>(
    "SELECT sequence,message_id,sender,content,timestamp FROM concierge_chat_messages WHERE owner=$1 AND conversation_id=$2 ORDER BY sequence",
    [ownerKey(actor), conversationId],
  );
  return rows.rows.map((r) => ({
    id: r.message_id,
    sender: r.sender,
    text: r.content,
    timestamp: Number(r.timestamp),
    sequence: Number(r.sequence),
  }));
}
export async function conversationPage(
  actor: Actor,
  conversationId: string,
  before?: number,
) {
  assertBuyer(actor);
  const current = await readConcierge(actor);
  if (current.conversationId !== conversationId)
    throw new Error("Conversation changed. Refresh before loading history.");
  const db = await conciergeDatabase();
  const rows = await db.query<{
    sequence: string;
    message_id: string;
    sender: "user" | "assistant";
    content: string;
    timestamp: string;
  }>(
    `SELECT sequence,message_id,sender,content,timestamp FROM concierge_chat_messages WHERE owner=$1 AND conversation_id=$2 AND ($3::bigint IS NULL OR sequence<$3) ORDER BY sequence DESC LIMIT 51`,
    [ownerKey(actor), conversationId, before ?? null],
  );
  const messages = rows.rows
    .slice(0, 50)
    .reverse()
    .map((r) => ({
      id: r.message_id,
      sender: r.sender,
      text: r.content,
      timestamp: Number(r.timestamp),
      sequence: Number(r.sequence),
    }));
  const count = await db.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM concierge_chat_messages WHERE owner=$1 AND conversation_id=$2",
    [ownerKey(actor), conversationId],
  );
  return {
    id: conversationId,
    messages,
    hasEarlier: rows.rows.length > 50,
    before: messages.length ? messages[0].sequence : null,
    total: Number(count.rows[0].count),
  };
}
export async function startConversation(actor: Actor) {
  await changeConcierge(actor, async (s, sql) => {
    if (
      s.turn &&
      ["running", "awaiting_ui"].includes(s.turn.status) &&
      s.turn.leaseUntil > Date.now()
    )
      throw new Error("Stop the current reply before starting a new chat.");
    await archiveTranscript(sql, ownerKey(actor), s);
    const id = randomUUID();
    await sql.query(
      "INSERT INTO concierge_conversations(owner,id) VALUES($1,$2)",
      [ownerKey(actor), id],
    );
    s.conversationId = id;
    s.transcript = [];
    s.messages = [];
    s.turn = undefined;
    s.execution = undefined;
    s.activeTabId = undefined;
    s.resultSets = [];
    for (const action of s.actions)
      if (action.status === "pending") action.status = "failed";
  });
}
