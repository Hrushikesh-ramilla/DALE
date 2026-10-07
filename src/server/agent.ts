import { randomUUID } from "node:crypto";
import { deviceLabel } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import {
  agentRequest,
  understandAgent,
  type AgentRequest,
  type AgentRun,
} from "@/domain/agent";
import { audit, mutateWorkspace, type Actor } from "./state";
import { shop, snapshot } from "./service";

export async function runAgent(actor: Actor, raw: AgentRequest) {
  if (actor.role !== "buyer")
    throw new Error("Only the shopper can run an agent task.");
  const input = agentRequest.parse(raw);
  if (
    (input.expectedWorkspaceId &&
      input.expectedWorkspaceId !== actor.workspaceId) ||
    (input.expectedBuyerId && input.expectedBuyerId !== actor.userId)
  )
    throw new Error(
      "Your shopper session changed. Reload before running this task.",
    );
  const intent = understandAgent(input);
  const run: AgentRun = {
    id: randomUUID(),
    task: input.task,
    at: new Date().toISOString(),
    status: "needs_input",
    reply: "",
    steps: ["Interpreted the request within the supported task types."],
    productIds: [],
    intent,
  };
  let result: Awaited<ReturnType<typeof shop>> | undefined;
  if (intent.kind === "shopping") {
    result = await shop(intent.brief, actor, "fixture");
    run.productIds = result.products.slice(0, 3).map((p) => p.id);
    run.briefVersion = result.brief?.version;
    run.status =
      result.questions.length || !result.products.length
        ? "needs_input"
        : "ready_for_review";
    run.reply = result.questions.length
      ? result.questions.join(" ")
      : result.products.length
        ? `I found ${result.products.length} sample options for ${deviceLabel(intent.brief.model)} within ${formatMoney(intent.brief.budget)}. The lowest listed price is ${formatMoney(Math.min(...result.products.map((p) => p.price)))}. These are sample records, not verified manufacturer offers. Choose an option to review; no purchase has been made.`
        : "No sample options meet that device profile and budget. Change the constraints; I have not created a purchase.";
    run.steps.push(
      "Filtered the sample catalog by the stated profile, category and budget.",
      "Returned recorded specifications and source identifiers for comparison.",
      "Left purchase approval with the shopper.",
    );
  } else if (intent.kind === "navigate") {
    run.status = "opened_workspace";
    run.reply =
      intent.destination === "orders"
        ? "Opened your order workspace. Only your own orders are shown."
        : "Opened customer support. Choose the order you want help with.";
    run.steps.push(
      "Selected the requested workspace without changing an order or payment.",
    );
  } else if (intent.kind === "support_draft") {
    run.status = "draft_prepared";
    run.reply =
      "Prepared your support draft. Choose the relevant order, review the issue and remedy, then explicitly submit. No refund or replacement has been authorized.";
    run.steps.push(
      "Prepared the stated issue and requested remedy.",
      "Left case submission and financial approval with the shopper.",
    );
  } else {
    run.reply =
      intent.kind === "review_required"
        ? "I cannot approve payments, execute code or authorize a financial remedy from a task message. Use the protected review controls."
        : intent.message;
    run.steps.push(
      "Stopped without changing the shopping brief, orders or payments.",
    );
  }
  await mutateWorkspace(actor.workspaceId, (state) => {
    const others = (state.agentRuns || []).filter(
      (item) => item.buyerId !== actor.userId,
    );
    const own = (state.agentRuns || []).filter(
      (item) => item.buyerId === actor.userId,
    );
    state.agentRuns = [
      ...others,
      ...own.slice(-11),
      { ...run, buyerId: actor.userId },
    ];
    audit(state, actor, "agent.task", run.id);
  });
  return { run, intent, result, snapshot: await snapshot(actor) };
}
