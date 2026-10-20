import { z } from "zod";
import {
  actorFromRequest,
  createSession,
  logout,
  setSessionCookie,
} from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { snapshot } from "@/server/service";
import { closeCustomerTask } from "@/server/concierge/session";
export const runtime = "nodejs";
export async function GET() {
  const startedAt = performance.now();
  try {
    return json(await snapshot(await actorFromRequest()), startedAt);
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = z
      .object({
        role: z.enum(["buyer", "seller", "reviewer"]),
        accessCode: z.string().max(200).optional(),
        workspaceId: z.string().uuid().optional(),
        invite: z.string().uuid().optional(),
      })
      .parse(await jsonBody(request));
    const current = await actorFromRequest().catch(() => undefined);
    const { actor, token } = await createSession(input);
    if (
      current &&
      (current.userId !== actor.userId ||
        current.workspaceId !== actor.workspaceId ||
        current.role !== actor.role)
    )
      await closeCustomerTask(current);
    await setSessionCookie(token);
    return json(await snapshot(actor));
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    await closeCustomerTask(await actorFromRequest().catch(() => undefined));
    await logout();
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
