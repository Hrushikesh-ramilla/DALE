import { randomUUID } from "node:crypto";
import { getDatabase, type Sql } from "./database";
import type { Quote } from "../domain/guard";
import type { ClaimAnalysis, Evidence } from "../domain/claims";
import type { PurchaseBrief } from "../domain/brief";
export type { Evidence } from "../domain/claims";
export type Role = "buyer" | "seller" | "reviewer";
export type Actor = { workspaceId: string; userId: string; role: Role };
export type StoredQuote = Quote & {
  buyerId: string;
  fingerprint: string;
  briefVersion?: number;
  invalidatedAt?: string;
};
export type Order = {
  id: string;
  buyerId: string;
  quote: StoredQuote;
  status:
    | "checkout_pending"
    | "paid"
    | "shipped"
    | "delivered"
    | "refund_pending"
    | "refund_failed"
    | "refunded"
    | "replacement"
    | "canceled";
  createdAt: string;
  providerOrderId?: string;
  captureId?: string;
  refundedAmount: number;
  refund?: {
    status: "processing" | "completed" | "failed" | "unknown";
    reference?: string;
    nextStep: string;
    updatedAt: string;
  };
  returnId?: string;
  replacementOf?: string;
  dispatchEvidence: Evidence[];
  events: { at: string; text: string }[];
};
export type Group = {
  id: string;
  productId: string;
  model: string;
  members: string[];
  status: "forming" | "ready" | "expired";
  expiresAt: string;
  checkoutExpiresAt?: string;
  amount?: number;
};
export type ReturnCase = {
  id: string;
  orderId: string;
  buyerId: string;
  reason: "damaged" | "wrong_item" | "not_delivered" | "canceled";
  request: "refund" | "replacement";
  status:
    | "open"
    | "review"
    | "approved"
    | "refund_pending"
    | "refund_failed"
    | "resolved"
    | "appealed";
  createdAt: string;
  deadlineAt: string;
  sellerResponded: boolean;
  evidence: Evidence[];
  analysis?: ClaimAnalysis;
  resolutionNote?: string;
  remedy?: string;
  appeal?: string;
};
export type Operation = {
  id: string;
  orderId: string;
  kind: "create" | "capture" | "refund";
  state: "pending" | "succeeded" | "unknown" | "failed";
  resultId?: string;
  amount: number;
  createdAt?: string;
};
export type Workspace = {
  id: string;
  invite: string;
  quotes: StoredQuote[];
  briefs?: PurchaseBrief[];
  orders: Order[];
  groups: Group[];
  cases: ReturnCase[];
  operations: Operation[];
  audit: {
    id: string;
    at: string;
    actor: string;
    action: string;
    resource: string;
  }[];
  webhookIds: string[];
};
export async function createWorkspace() {
  const state: Workspace = {
    id: randomUUID(),
    invite: randomUUID(),
    quotes: [],
    orders: [],
    groups: [],
    cases: [],
    operations: [],
    audit: [],
    webhookIds: [],
  };
  await (
    await getDatabase()
  ).query("INSERT INTO workspaces(id,state) VALUES ($1,$2::jsonb)", [
    state.id,
    JSON.stringify(state),
  ]);
  return state;
}
export async function getWorkspace(id: string): Promise<Workspace> {
  const { rows } = await (
    await getDatabase()
  ).query<{ state: Workspace }>("SELECT state FROM workspaces WHERE id=$1", [
    id,
  ]);
  if (!rows[0]) throw new Error("Workspace not found");
  return rows[0].state;
}
export async function mutateWorkspace<T>(
  id: string,
  fn: (state: Workspace, sql: Sql) => Promise<T> | T,
): Promise<T> {
  return (await getDatabase()).transaction(async (sql) => {
    const { rows } = await sql.query<{ state: Workspace }>(
      "SELECT state FROM workspaces WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!rows[0]) throw new Error("Workspace not found");
    const state = rows[0].state;
    const result = await fn(state, sql);
    await sql.query("UPDATE workspaces SET state=$2::jsonb WHERE id=$1", [
      id,
      JSON.stringify(state),
    ]);
    return result;
  });
}
export function audit(
  state: Workspace,
  actor: Actor,
  action: string,
  resource: string,
) {
  state.audit.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    actor: actor.userId,
    action,
    resource,
  });
}
export function ownedOrder(state: Workspace, actor: Actor, id: string) {
  const order = state.orders.find(
    (o) =>
      o.id === id && (actor.role !== "buyer" || o.buyerId === actor.userId),
  );
  if (!order) throw new Error("Order not found");
  return order;
}
export function ownedCase(state: Workspace, actor: Actor, id: string) {
  const item = state.cases.find(
    (c) =>
      c.id === id && (actor.role !== "buyer" || c.buyerId === actor.userId),
  );
  if (!item) throw new Error("Case not found");
  return item;
}
