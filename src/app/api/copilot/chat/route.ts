import { actorFromRequest } from "@/server/auth";
import { takeRequestBudget } from "@/server/budgets";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { runConcierge } from "@/server/concierge/engine";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(
      { workspaceId: "concierge-public", userId: "global", role: "buyer" },
      "agent-turn",
      60,
    );
    await takeRequestBudget(actor, "concierge-turn", 15);
    return json(
      await runConcierge(actor, await jsonBody(request), request.signal),
    );
  } catch (e) {
    return apiError(e);
  }
}
