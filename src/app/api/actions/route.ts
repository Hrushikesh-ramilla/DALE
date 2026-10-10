import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
import { actionSchema } from "@/domain/actions";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import * as service from "@/server/service";
import { issueCaptureSession } from "@/server/provenance";
import { authorizeReturn, returnShippingEvent } from "@/server/return-shipping";
import { cancelFulfillment, chooseRemedy } from "@/server/order-options";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "actions", 120);
    await takeDemoBudget(actor, "actions", 300);
    const input = actionSchema.parse(await jsonBody(request));
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
