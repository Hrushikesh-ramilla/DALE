import { z } from "zod";
import { createSession } from "./auth";
import {
  audit,
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "./state";
import {
  addDispatchEvidence,
  addEvidence,
  analyzeCase,
  capture,
  checkout,
  joinGroup,
  makeQuote,
  openReturn,
  resolveCase,
  shippingEvent,
} from "./service";
import { recoverWorkspace } from "./recovery";

export const scenarioKind = z.enum([
  "fresh",
  "delivered",
  "identifier_conflict",
  "seller_silence",
  "refund_failure",
  "refund_timeout",
  "group_partial",
]);
export type ScenarioKind = z.infer<typeof scenarioKind>;
export const scenarioDescriptions: Record<ScenarioKind, string> = {
  fresh: "Fresh shopper workspace",
  delivered: "Delivered item ready for a return",
  identifier_conflict: "Conflicting return identifiers for human review",
  seller_silence: "Missed seller response deadline",
  refund_failure: "Rejected provider refund with an open request",
  refund_timeout: "Interrupted refund recovered with its original operation",
  group_partial: "Group discount after another participant declines payment",
};

export async function createScenario(
  operator: Actor,
  kind: ScenarioKind,
  reset = false,
) {
  if (operator.role !== "reviewer")
    throw new Error(
      "Reviewer authorization is required for engineering scenarios.",
    );
  if (reset) {
    await mutateWorkspace(operator.workspaceId, (state) => {
      if (
        !state.fixtureWorkspace ||
        state.adapterModes?.payments !== "fixture" ||
        state.orders.some((order) => order.quote.provider !== "fixture")
      )
        throw new Error("Reset is restricted to isolated fixture workspaces.");
      state.archivedAt = new Date().toISOString();
      audit(state, operator, "fixture.archived", state.id);
    });
  }
  const workspace = await createWorkspace({ fixture: true });
  const session = await createSession({
    role: "buyer",
    invite: workspace.invite,
    accessCode: process.env.DEMO_ACCESS_CODE,
  });
  const buyer = session.actor;
  const seller: Actor = { ...buyer, userId: "fixture-seller", role: "seller" };
  const reviewer: Actor = {
    ...buyer,
    userId: "fixture-reviewer",
    role: "reviewer",
  };
  await mutateWorkspace(workspace.id, (state) =>
    audit(state, operator, `fixture.created:${kind}`, workspace.id),
  );
  if (kind === "fresh") return { ...session, kind };
  if (kind === "group_partial") {
    const second: Actor = { ...buyer, userId: "fixture-participant" };
    const groupId = await joinGroup(buyer, "P001", "Atlas 14");
    await joinGroup(second, "P001", "Atlas 14");
    const quote = await makeQuote(second, "P001", "Atlas 14", groupId);
    const unpaid = await checkout(second, quote.id, quote.fingerprint);
    await mutateWorkspace(workspace.id, (state) => {
      const order = state.orders.find((order) => order.id === unpaid.id)!;
      order.status = "canceled";
      order.events.push({
        at: new Date().toISOString(),
        text: "Fixture participant declined payment. No charge was made; other participants keep the locked price.",
      });
      audit(state, reviewer, "fixture.payment_declined", order.id);
    });
    return { ...session, kind };
  }
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  await addDispatchEvidence(seller, order.id, {
    serial: "FIXTURE-100",
    note: "Synthetic dispatch record; not a physical shipping claim.",
  });
  await shippingEvent(seller, order.id, "shipped");
  await shippingEvent(seller, order.id, "delivered");
  if (kind === "delivered") return { ...session, kind };
  const item = await openReturn(
    buyer,
    order.id,
    kind === "identifier_conflict" ? "wrong_item" : "damaged",
    "refund",
  );
  if (kind === "identifier_conflict") {
    await addEvidence(buyer, item.id, {
      checkpoint: "buyer_receipt",
      serial: "FIXTURE-100",
      note: "Synthetic customer receipt record.",
    });
    await addEvidence(buyer, item.id, {
      checkpoint: "buyer_return",
      serial: "FIXTURE-100",
      note: "Synthetic return dispatch record.",
    });
    await addEvidence(seller, item.id, {
      checkpoint: "seller_return",
      serial: "FIXTURE-200",
      note: "Synthetic conflicting seller receipt record.",
    });
    await analyzeCase(reviewer, item.id);
  } else if (kind === "seller_silence") {
    await mutateWorkspace(workspace.id, (state) => {
      state.cases[0].deadlineAt = new Date(Date.now() - 1000).toISOString();
      audit(state, reviewer, "fixture.deadline_advanced", item.id);
    });
    await recoverWorkspace(workspace.id);
  } else {
    await mutateWorkspace(workspace.id, (state) => {
      state.fixtureFaults = {
        refund: kind === "refund_failure" ? "failed" : "timeout_once",
      };
    });
    try {
      await resolveCase(
        reviewer,
        item.id,
        "refund",
        "Synthetic scenario: customer-requested refund authorized under the demo damage policy.",
      );
    } catch (error) {
      if (
        kind !== "refund_timeout" ||
        !(error instanceof Error) ||
        !error.message.startsWith("Simulated provider timeout")
      )
        throw error;
    }
  }
  return { ...session, kind };
}

export async function scenarioAudit(actor: Actor) {
  if (actor.role !== "reviewer")
    throw new Error("Reviewer authorization is required for scenario audit.");
  return (await getWorkspace(actor.workspaceId)).audit;
}
