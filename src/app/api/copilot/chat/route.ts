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
  const started = performance.now();
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    const authMs = performance.now() - started;
    await takeRequestBudget(
      { workspaceId: "concierge-public", userId: "global", role: "buyer" },
      "agent-turn",
      60,
    );
    await takeRequestBudget(actor, "concierge-turn", 15);
    const input = turnInput.parse(await jsonBody(request));
    const preflightMs = performance.now() - started;
    const response =
      request.headers.get("accept")?.includes("text/event-stream") &&
      process.env.CONCIERGE_STREAMING !== "false"
        ? chatStream(actor, input, request.signal)
        : json(
            await withAgentTrace(
              createAgentTrace({ beforeAttempt: admitProviderAttempt }),
              () => runConcierge(actor, input, request.signal),
            ),
          );
    response.headers.set(
      "Server-Timing",
      `auth;dur=${authMs.toFixed(2)}, preflight;dur=${preflightMs.toFixed(2)}`,
    );
    return response;
  } catch (e) {
    return apiError(e);
  }
}
