import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { conversationPage } from "@/server/concierge/store";
import { apiError, json } from "@/server/http";
import { takeRequestBudget } from "@/server/budgets";
export async function GET(request: Request) {
  try {
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "conversation-history", 120);
    const url = new URL(request.url);
    const id = z.uuid().parse(url.searchParams.get("conversation_id"));
    const cursor = url.searchParams.get("before");
    const before =
      cursor === null
        ? undefined
        : z.coerce
            .number()
            .int()
            .positive()
            .max(Number.MAX_SAFE_INTEGER)
            .parse(cursor);
    return json(await conversationPage(actor, id, before));
  } catch (error) {
    return apiError(error);
  }
}
