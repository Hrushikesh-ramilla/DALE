import { actorFromRequest } from "@/server/auth";
import { takeRequestBudget } from "@/server/budgets";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { acknowledgeBrowser } from "@/server/concierge/engine";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "concierge-receipts", 60);
    return json(await acknowledgeBrowser(actor, await jsonBody(request)));
  } catch (e) {
    return apiError(e);
  }
}
