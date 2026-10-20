import { actorFromRequest } from "@/server/auth";
import { takeRequestBudget } from "@/server/budgets";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { runConcierge } from "@/server/concierge/engine";
import { chatStream } from "@/server/concierge/chat-stream";
import { turnInput } from "@/domain/concierge";
import { createAgentTrace, withAgentTrace } from "@/server/concierge/latency";
import { admitProviderAttempt } from "@/server/concierge/provider-admission";
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
    const input = turnInput.parse(await jsonBody(request));
    if (
      request.headers.get("accept")?.includes("text/event-stream") &&
      process.env.CONCIERGE_STREAMING !== "false"
    )
      return chatStream(actor, input, request.signal);
    return json(
      await withAgentTrace(
        createAgentTrace({ beforeAttempt: admitProviderAttempt }),
        () => runConcierge(actor, input, request.signal),
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
