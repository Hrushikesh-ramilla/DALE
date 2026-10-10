import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { voiceRequest, understandVoice } from "@/domain/voice";
import { shop, snapshot } from "@/server/service";
import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
import { runAgent } from "@/server/agent";
import { fallbackPlan } from "@/domain/agent-plan";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    if (actor.role !== "buyer")
      throw new Error("Only the shopper can prepare a voice request.");
    await takeRequestBudget(actor, "voice-intent", 10);
    await takeDemoBudget(actor, "analysis", 50);
    const input = voiceRequest.parse(await jsonBody(request));
    const context = (await snapshot(actor)).agentRuns.at(-1)?.context;
    const task = {
      task: input.transcript,
      model: input.model,
      budget: input.budget,
    };
    if (fallbackPlan(task, context).tool !== "legacy_task")
      return json(await runAgent(actor, task));
    const intent = understandVoice(input);
    if (intent.kind === "shopping")
      return json({
        intent,
        result: await shop(intent.brief, actor, "fixture"),
        snapshot: await snapshot(actor),
      });
    return json({ intent });
  } catch (error) {
    return apiError(error);
  }
}
