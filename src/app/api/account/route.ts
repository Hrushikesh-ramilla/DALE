import { actorFromRequest, setSessionCookie } from "@/server/auth";
import { customerSession } from "@/server/customers";
import { snapshot } from "@/server/service";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const current = await actorFromRequest().catch(() => undefined);
    const { actor, token } = await customerSession(
      await jsonBody(request),
      current,
    );
    await setSessionCookie(token);
    return json(await snapshot(actor));
  } catch (error) {
    return apiError(error);
  }
}
