import { takeRequestBudget } from "@/server/budgets";
import { z } from "zod";
import { actorFromRequest, setSessionCookie } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { createScenario, scenarioKind } from "@/server/scenarios";
import { snapshot } from "@/server/service";
import { getWorkspace } from "@/server/state";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    if ((await getWorkspace(actor.workspaceId)).demo)
      throw new Error(
        "Demo scenarios must use the owned guided launcher. Operator authorization is required for this endpoint.",
      );
    await takeRequestBudget(actor, "engineering", 20);
    const input = z
      .object({ action: z.enum(["create", "reset"]), kind: scenarioKind })
      .parse(await jsonBody(request));
    const result = await createScenario(
      actor,
      input.kind,
      input.action === "reset",
    );
    await setSessionCookie(result.token);
    return json({
      scenario: result.kind,
      snapshot: await snapshot(result.actor),
    });
  } catch (error) {
    return apiError(error);
  }
}
