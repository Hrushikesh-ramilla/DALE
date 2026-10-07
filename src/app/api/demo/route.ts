import { z } from "zod";
import { actorFromRequest, setSessionCookie } from "@/server/auth";
import {
  assertDemoOwner,
  demoToken,
  launchDemo,
  setDemoCookie,
  switchDemoPersona,
} from "@/server/demo";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { scenarioKind, scenarioDescriptions } from "@/server/scenarios";
import { snapshot } from "@/server/service";
import { getWorkspace } from "@/server/state";
import { takeRequestBudget } from "@/server/budgets";
export async function GET() {
  try {
    const actor = await actorFromRequest();
    await assertDemoOwner(actor, await demoToken());
    const state = await getWorkspace(actor.workspaceId);
    return json({
      scenario: state.demo!.kind,
      description:
        scenarioDescriptions[
          state.demo!.kind as keyof typeof scenarioDescriptions
        ],
      snapshot: await snapshot(actor),
      audit: state.audit.map(({ at, action }) => ({ at, action })),
      synthetic: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("launch"), kind: scenarioKind }),
        z.object({ action: z.literal("reset"), kind: scenarioKind }),
        z.object({
          action: z.literal("persona"),
          persona: z.enum(["buyer", "second_buyer", "seller", "reviewer"]),
        }),
      ])
      .parse(await jsonBody(request));
    if (input.action === "persona") {
      const actor = await actorFromRequest();
      await takeRequestBudget(actor, "demo-persona", 20);
      const next = await switchDemoPersona(
        actor,
        await demoToken(),
        input.persona,
      );
      await setSessionCookie(next.token);
      return json(await snapshot(next.actor));
    }
    const previous =
      input.action === "reset"
        ? { actor: await actorFromRequest(), token: await demoToken() }
        : undefined;
    const next = await launchDemo(input.kind, previous);
    await setDemoCookie(next.ownerToken);
    await setSessionCookie(next.token);
    return json(await snapshot(next.actor));
  } catch (error) {
    return apiError(error);
  }
}
