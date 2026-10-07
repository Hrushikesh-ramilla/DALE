import { actorFromRequest } from "@/server/auth";
import { apiError, json, requireSameOrigin } from "@/server/http";
import { createVoiceToken, voiceAvailability } from "@/server/voice";
export async function GET() {
  try {
    return json(await voiceAvailability(await actorFromRequest()));
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    return json(await createVoiceToken(await actorFromRequest()));
  } catch (error) {
    return apiError(error);
  }
}
