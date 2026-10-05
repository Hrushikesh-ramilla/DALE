import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import * as service from "@/server/service";
import { issueCaptureSession } from "@/server/provenance";
import { authorizeReturn, returnShippingEvent } from "@/server/return-shipping";
import { cancelFulfillment, chooseRemedy } from "@/server/order-options";
const id = z.string().uuid();
const checkpoint = z.enum([
  "seller_dispatch",
  "buyer_receipt",
  "buyer_return",
  "seller_return",
]);
const schema = z.discriminatedUnion("action", [
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
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    const input = schema.parse(await jsonBody(request));
    let result: unknown;
    switch (input.action) {
      case "cancel_fulfillment":
        result = await cancelFulfillment(actor, input.orderId, input.reason);
        break;
      case "choose_remedy":
        result = await chooseRemedy(actor, input.caseId, input.request);
        break;
      case "authorize_return":
        result = await authorizeReturn(
          actor,
          input.caseId,
          input.decision,
          input.reason,
          input.labelReference,
        );
        break;
      case "return_shipping":
        result = await returnShippingEvent(
          actor,
          input.caseId,
          input.status,
          input.trackingReference,
        );
        break;
      case "capture_session":
        result = await issueCaptureSession(actor, input, input.checkpoint);
        break;
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
        result = await service.checkMessage(input.message, actor);
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
