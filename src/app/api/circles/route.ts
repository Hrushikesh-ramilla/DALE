import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { readCircles, commitCircle } from "@/server/circles";
import { takeRequestBudget } from "@/server/budgets";
export const runtime = "nodejs";
const query = z
  .object({
    circle: z.string().uuid().optional(),
    product: z.string().min(1).max(150).optional(),
    model: z.string().min(1).max(100).optional(),
  })
  .strict();
export async function GET(request: Request) {
  try {
    const input = query.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return json(
      await readCircles(
        {
          circleId: input.circle,
          productId: input.product,
          model: input.model,
        },
        await actorFromRequest().catch(() => undefined),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "circle-commit", 60);
    return json({
      circleId: await commitCircle(actor, await jsonBody(request)),
    });
  } catch (error) {
    return apiError(error);
  }
}
