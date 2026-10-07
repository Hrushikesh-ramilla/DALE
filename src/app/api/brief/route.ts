import { briefSchema } from "@/domain/brief";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { updateBrief } from "@/server/service";
import { takeDemoBudget } from "@/server/demo";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeDemoBudget(actor, "actions", 300);
    return json(
      await updateBrief(actor, briefSchema.parse(await jsonBody(request))),
    );
  } catch (error) {
    return apiError(error);
  }
}
