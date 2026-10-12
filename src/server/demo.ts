import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { issueSession } from "./auth";
import { createScenario, type ScenarioKind } from "./scenarios";
import {
  audit,
  getWorkspace,
  mutateWorkspace,
  type Actor,
  type Role,
} from "./state";
import { takeRequestBudget } from "./budgets";
import { getDatabase } from "./database";
import { z } from "zod";
import { scenarioKind } from "./scenarios";
// Five independent engineers can each exercise nine scenarios in a burst.
// The lifetime workspace/storage ceilings remain independent of this window.
export const publicDemoLaunchLimit = 60;
export const demoRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("launch"), kind: scenarioKind }),
  z.object({ action: z.literal("reset"), kind: scenarioKind }),
  z.object({
    action: z.literal("persona"),
    persona: z.enum(["buyer", "second_buyer", "seller", "reviewer"]),
  }),
]);
const COOKIE = "dale_demo";
const ownerHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function assertDemoOwner(actor: Actor, token: string) {
  const state = await getWorkspace(actor.workspaceId);
  const expected = state.demo?.ownerHash || "";
  const supplied = ownerHash(token);
  if (
    !state.fixtureWorkspace ||
    state.adapterModes?.payments !== "fixture" ||
    state.adapterModes?.ai !== "fixture" ||
    !state.demo ||
    Date.parse(state.demo.expiresAt) <= Date.now() ||
    state.archivedAt ||
    expected.length !== supplied.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  )
    throw new Error(
      "Demo owner authorization is required for this isolated workspace.",
    );
  return state;
}
export async function launchDemo(
  kind: ScenarioKind,
  previous?: { actor: Actor; token: string },
) {
  if (previous) await assertDemoOwner(previous.actor, previous.token);
  const limiter = {
    workspaceId: "public-demo",
    userId: "launches",
    role: "buyer",
  } satisfies Actor;
  await takeRequestBudget(limiter, "launch", publicDemoLaunchLimit);
  // A lifetime ceiling bounds demo storage without deleting audit/payment records.
  await takeRequestBudget(
    limiter,
    "retained-workspaces",
    200,
    0,
    "Demo workspace storage limit reached. An operator must review retained demo data before more scenarios can start.",
  );
  const result = await createScenario(
    { workspaceId: randomUUID(), userId: "demo-launcher", role: "reviewer" },
    kind,
  );
  const token = randomBytes(32).toString("hex");
  await mutateWorkspace(result.actor.workspaceId, (state) => {
    state.demo = {
      ownerHash: ownerHash(token),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      buyerId: result.actor.userId,
      kind,
    };
    audit(state, result.actor, "demo.launched", state.id);
  });
  if (previous) {
    await mutateWorkspace(previous.actor.workspaceId, (state) => {
      state.archivedAt = new Date().toISOString();
      audit(state, previous.actor, "demo.archived", state.id);
    });
    await (
      await getDatabase()
    ).query("DELETE FROM sessions WHERE workspace_id=$1", [
      previous.actor.workspaceId,
    ]);
  }
  return { ...result, ownerToken: token };
}
export async function takeDemoBudget(
  actor: Actor,
  bucket: string,
  limit: number,
) {
  const state = await getWorkspace(actor.workspaceId);
  if (!state.demo) return;
  await takeRequestBudget(
    { ...actor, userId: "demo-workspace" },
    `demo-${bucket}`,
    limit,
    0,
    "This demo scenario has reached its activity limit. Start a fresh scenario to continue; previous audit history is retained.",
  );
  if (bucket === "uploads")
    await takeRequestBudget(
      { workspaceId: "public-demo", userId: "assets", role: "buyer" },
      "retained-uploads",
      128,
      0,
      "Demo evidence storage limit reached. An operator must review retained demo data before more images can be uploaded.",
    );
}
export async function switchDemoPersona(
  actor: Actor,
  token: string,
  persona: Role | "second_buyer",
) {
  const state = await assertDemoOwner(actor, token);
  await takeDemoBudget(actor, "actions", 300);
  const role = persona === "second_buyer" ? "buyer" : persona;
  const userId =
    persona === "buyer"
      ? state.demo!.buyerId
      : persona === "second_buyer"
        ? "fixture-participant"
        : `fixture-${persona}`;
  const next = { workspaceId: state.id, userId, role };
  await mutateWorkspace(state.id, (current) =>
    audit(current, next, "demo.persona_changed", persona),
  );
  return issueSession(next);
}
export async function demoToken() {
  return (await cookies()).get(COOKIE)?.value || "";
}
export async function setDemoCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    sameSite: "strict",
    path: "/",
    maxAge: 86400,
  });
}
