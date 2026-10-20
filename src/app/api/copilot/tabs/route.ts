import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { takeRequestBudget } from "@/server/budgets";
import { registerTab, tabState } from "@/server/concierge/tabs";
export async function GET() {
  try {
    return json(await tabState(await actorFromRequest()));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "concierge-tab-observations", 120);
    return json(await registerTab(actor, await jsonBody(request)));
  } catch (e) {
    return apiError(e);
  }
}
