import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { voiceRequest, understandVoice } from "@/domain/voice";
import { shop, snapshot } from "@/server/service";
import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    if (actor.role !== "buyer")
      throw new Error("Only the shopper can prepare a voice request.");
    await takeRequestBudget(actor, "voice-intent", 10);
    await takeDemoBudget(actor, "analysis", 50);
    const input = voiceRequest.parse(await jsonBody(request));
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
