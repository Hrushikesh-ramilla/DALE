import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { voiceRequest, understandVoice } from "@/domain/voice";
import { mentionedModels } from "@/domain/identification";
import { snapshot } from "@/server/service";
import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
import { runAgent } from "@/server/agent";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    if (actor.role !== "buyer")
      throw new Error("Only the shopper can prepare a voice request.");
    await takeRequestBudget(actor, "voice-intent", 10);
    await takeDemoBudget(actor, "analysis", 50);
    const input = voiceRequest.parse(await jsonBody(request));
    const state = await snapshot(actor);
    // Guided sample shopping uses the visible selected profile. Real devices
    // still require sourced identification and never inherit a demo profile.
    const sampleContext =
      state.fixtureWorkspace &&
      understandVoice(input).kind === "shopping" &&
      !mentionedModels(input.transcript).length &&
      !/\b(?:macbook|iphone|ipad|thinkpad|surface|galaxy|dell|lenovo|asus|acer|samsung|apple|zenbook|ideapad|pavilion|latitude|inspiron)\b/i.test(
        input.transcript,
      );
    const task = {
      task: sampleContext
        ? `${input.transcript}. Use selected sample profile: ${input.model}.`
        : input.transcript,
      model: input.model,
      budget: input.budget,
    };
    // Typed tasks and confirmed transcripts use the same planner, private memory,
    // source grounding and approval boundaries. Recognition alone has no authority.
    return json(await runAgent(actor, task));
  } catch (error) {
    return apiError(error);
  }
}
