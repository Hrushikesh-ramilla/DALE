import { briefSchema } from "@/domain/brief";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { updateBrief } from "@/server/service";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    return json(
      await updateBrief(actor, briefSchema.parse(await jsonBody(request))),
    );
  } catch (error) {
    return apiError(error);
  }
}
