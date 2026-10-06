import { takeRequestBudget } from "@/server/budgets";
import { briefSchema } from "@/domain/brief";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { shop } from "@/server/service";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "analysis", 10);
    const input = briefSchema.parse(await jsonBody(request));
    return json(await shop(input, actor));
  } catch (error) {
    return apiError(error);
  }
}
