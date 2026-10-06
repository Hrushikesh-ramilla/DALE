import { z } from "zod";
import { actorFromRequest, setSessionCookie } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { createScenario, scenarioKind } from "@/server/scenarios";
import { snapshot } from "@/server/service";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
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
