import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { takeRequestBudget } from "@/server/budgets";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { conciergeView } from "@/server/concierge/engine";
import { confirmOperation } from "@/server/concierge/shopping";
const input = z
  .object({
    confirmation_id: z.string().uuid(),
    cancel: z.boolean().default(false),
  })
  .strict();
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "concierge-confirm", 20);
    const data = input.parse(await jsonBody(request));
    const result = await confirmOperation(
      actor,
      data.confirmation_id,
      data.cancel,
    );
    return json({ result, state: await conciergeView(actor) });
  } catch (e) {
    return apiError(e);
  }
}
