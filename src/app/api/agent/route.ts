import { actorFromRequest } from "@/server/auth";
import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { agentRequest } from "@/domain/agent";
import { runAgent } from "@/server/agent";
import { getWorkspace } from "@/server/state";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    const workspace = await getWorkspace(actor.workspaceId);
    if (!workspace.demo && !workspace.fixtureWorkspace)
      throw new Error("Legacy scripted tasks are only available in isolated engineering fixtures. Use the DALE concierge for shopping.");
    if (actor.role !== "buyer")
      throw new Error("Only the shopper can run an agent task.");
    const input = agentRequest.parse(await jsonBody(request));
    await takeRequestBudget(actor, "agent-task", 10);
    await takeDemoBudget(actor, "analysis", 50);
    return json(await runAgent(actor, input));
  } catch (error) {
    return apiError(error);
  }
}
