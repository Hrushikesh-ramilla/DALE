import { z } from "zod";
const id = z.string().uuid();
const checkpoint = z.enum([
  "seller_dispatch",
  "buyer_receipt",
  "buyer_return",
  "seller_return",
]);
export const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("agent_group_commit"),
    productId: z.string().min(1).max(100),
    briefVersion: z.number().int().min(1),
  }),
  z.object({
    action: z.literal("cancel_fulfillment"),
    orderId: id,
    reason: z.string().min(1).max(2000),
  }),
  z.object({
    action: z.literal("choose_remedy"),
    caseId: id,
    request: z.enum(["refund", "replacement"]),
  }),
  z.object({
    action: z.literal("authorize_return"),
    caseId: id,
    decision: z.enum(["prepaid", "waive"]),
    reason: z.string().min(1).max(2000),
    labelReference: z.string().max(100).optional(),
  }),
  z.object({
    action: z.literal("return_shipping"),
    caseId: id,
    status: z.enum(["in_transit", "received"]),
    trackingReference: z.string().min(1).max(100),
  }),
  z.object({
    action: z.literal("capture_session"),
    caseId: id.optional(),
    orderId: id.optional(),
    checkpoint,
  }),
  z.object({
    action: z.literal("quote"),
    productId: z.string().max(20),
    model: z.string().max(80),
    groupId: id.optional(),
  }),
  z.object({
    action: z.literal("join_group"),
    productId: z.string().max(20),
    model: z.string().max(80),
  }),
  z.object({ action: z.literal("leave_group"), groupId: id }),
  z.object({
    action: z.literal("checkout"),
    quoteId: id,
    fingerprint: z.string().length(64),
  }),
  z.object({ action: z.literal("capture"), orderId: id }),
  z.object({ action: z.literal("scam"), message: z.string().min(1).max(6000) }),
  z.object({
    action: z.literal("return"),
    orderId: id,
    reason: z.enum(["damaged", "wrong_item", "not_delivered", "canceled"]),
    request: z.enum(["refund", "replacement"]),
  }),
  z.object({
    action: z.literal("evidence"),
    caseId: id,
    checkpoint,
    serial: z.string().max(100),
    note: z.string().min(1).max(2000),
  }),
  z.object({
    action: z.literal("dispatch"),
    orderId: id,
    serial: z.string().max(100),
    note: z.string().min(1).max(2000),
  }),
  z.object({ action: z.literal("analyze"), caseId: id }),
  z.object({
    action: z.literal("resolve"),
    caseId: id,
    remedy: z.enum(["refund", "replacement"]),
    note: z.string().min(1).max(2000),
  }),
  z.object({
    action: z.literal("appeal"),
    caseId: id,
    note: z.string().min(1).max(2000),
  }),
  z.object({
    action: z.literal("ship"),
    orderId: id,
    status: z.enum(["shipped", "delivered"]),
  }),
]);
