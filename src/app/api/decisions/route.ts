import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { prepareShoppingDecision, shoppingDecision } from "@/server/concierge/decisions";
import { makeQuote } from "@/server/service";
import { lifestyleProfile } from "@/domain/departments";
import { takeRequestBudget } from "@/server/budgets";
import { decisionReviewInput, discoveryInput } from "@/domain/shopping-decision";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id") || undefined;
    if (id) z.string().uuid().parse(id);
    return json(await shoppingDecision(await actorFromRequest(), id));
  } catch (error) {
    console.error("[api/decisions error]", error);
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "decision-review", 30);
    const body = await jsonBody(request);
    if (body && typeof body === "object" && "purpose" in body) {
      const input = discoveryInput.parse(body);
      return json(await prepareShoppingDecision(actor, input));
    }
    const input = decisionReviewInput.parse(body);
    return json(
      await makeQuote(
        actor,
        input.productId,
        lifestyleProfile,
        input.groupId,
        input.decisionId,
      ),
    );
  } catch (error) {
    console.error("[api/decisions error]", error);
    return apiError(error);
  }
}
