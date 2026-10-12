import { actorFromRequest } from "@/server/auth";
import { apiError, json, limitedBody, requireSameOrigin } from "@/server/http";
import { voiceAvailability } from "@/server/voice";
import {
  maximumSpeechBytes,
  transcribeLocalSpeech,
} from "@/server/local-speech";
import { takeRequestBudget } from "@/server/budgets";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    if ((await voiceAvailability(actor)).mode !== "local")
      throw new Error("Local recognition is unavailable in this session.");
    if (request.headers.get("content-type") !== "audio/wav")
      throw new Error("Use an audio/wav recording.");
    await takeRequestBudget(actor, "local-speech", 2);
    await takeRequestBudget(
      { workspaceId: "speech-global", userId: "budget", role: "buyer" },
      "recognitions",
      6,
    );
    return json(
      await transcribeLocalSpeech(
        await limitedBody(request, maximumSpeechBytes),
        request.signal,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
