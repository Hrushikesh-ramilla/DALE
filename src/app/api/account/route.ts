import { actorFromRequest, setSessionCookie } from "@/server/auth";
import { customerSession } from "@/server/customers";
import { snapshot } from "@/server/service";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { closeCustomerTask } from "@/server/concierge/session";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const current = await actorFromRequest().catch(() => undefined);
    const { actor, token } = await customerSession(
      await jsonBody(request),
      current,
    );
    if (
      current &&
      (current.userId !== actor.userId ||
        current.workspaceId !== actor.workspaceId)
    )
      await closeCustomerTask(current);
    await setSessionCookie(token);
    return json(await snapshot(actor));
  } catch (error) {
    return apiError(error);
  }
}
