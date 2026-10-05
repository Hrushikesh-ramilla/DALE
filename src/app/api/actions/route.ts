import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import * as service from "@/server/service";
const id = z.string().uuid();
const checkpoint = z.enum([
  "seller_dispatch",
  "buyer_receipt",
  "buyer_return",
  "seller_return",
]);
const schema = z.discriminatedUnion("action", [
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
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    const input = schema.parse(await jsonBody(request));
    let result: unknown;
    switch (input.action) {
      case "quote":
        result = await service.makeQuote(
          actor,
          input.productId,
          input.model,
          input.groupId,
        );
        break;
      case "join_group":
        result = await service.joinGroup(actor, input.productId, input.model);
        break;
      case "leave_group":
        result = await service.leaveGroup(actor, input.groupId);
        break;
      case "checkout":
        result = await service.checkout(
          actor,
          input.quoteId,
          input.fingerprint,
        );
        break;
      case "capture":
        result = await service.capture(actor, input.orderId);
        break;
      case "scam":
        result = await service.checkMessage(input.message);
        break;
      case "return":
        result = await service.openReturn(
          actor,
          input.orderId,
          input.reason,
          input.request,
        );
        break;
      case "evidence":
        result = await service.addEvidence(actor, input.caseId, input);
        break;
      case "dispatch":
        result = await service.addDispatchEvidence(actor, input.orderId, input);
        break;
      case "analyze":
        result = await service.analyzeCase(actor, input.caseId);
        break;
      case "resolve":
        result = await service.resolveCase(
          actor,
          input.caseId,
          input.remedy,
          input.note,
        );
        break;
      case "appeal":
        result = await service.appealCase(actor, input.caseId, input.note);
        break;
      case "ship":
        result = await service.shippingEvent(
          actor,
          input.orderId,
          input.status,
        );
        break;
    }
    return json({ result, snapshot: await service.snapshot(actor) });
  } catch (error) {
    return apiError(error);
  }
}
