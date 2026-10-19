import { z } from "zod";
import { actorFromRequest, setSessionCookie } from "@/server/auth";
import { customerSession } from "@/server/customers";
import { takeRequestBudget } from "@/server/budgets";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { conciergeView, cancelTurn } from "@/server/concierge/engine";
import {
  basketInput,
  manageBasket,
  prepareCheckout,
} from "@/server/concierge/shopping";
export async function GET() {
  try {
    return json(await conciergeView(await actorFromRequest()));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const raw = await jsonBody(request);
    if (
      z
        .object({ action: z.literal("start") })
        .strict()
        .safeParse(raw).success
    ) {
      const existing = await actorFromRequest().catch(() => undefined);
      if (existing) return json(await conciergeView(existing));
      await takeRequestBudget(
        { workspaceId: "concierge-public", userId: "global", role: "buyer" },
        "guest-start",
        20,
      );
      const session = await customerSession({ action: "guest" });
      await setSessionCookie(session.token);
      return json(await conciergeView(session.actor));
    }
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "concierge-state", 120);
    if (
      z
        .object({ action: z.literal("prepare_checkout") })
        .strict()
        .safeParse(raw).success
    ) {
      await prepareCheckout(actor);
      return json(await conciergeView(actor));
    }
    if (
      z
        .object({ action: z.literal("cancel") })
        .strict()
        .safeParse(raw).success
    )
      return json(await cancelTurn(actor));
    await manageBasket(actor, basketInput.parse(raw));
    return json(await conciergeView(actor));
  } catch (e) {
    return apiError(e);
  }
}
