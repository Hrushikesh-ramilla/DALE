import { randomUUID } from "node:crypto";
import { deviceLabel, productById } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import {
  agentRequest,
  understandAgent,
  type AgentRequest,
  type AgentRun,
} from "@/domain/agent";
import { scanMessage } from "@/domain/scams";
import { fallbackPlan } from "@/domain/agent-plan";
import { audit, mutateWorkspace, type Actor } from "./state";
import { shop, snapshot } from "./service";
import { planAgent, compareWithModel } from "./agent-planner";
import type { VoiceIntent } from "@/domain/voice";

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
  const before = await snapshot(actor);
  if (before.archivedAt) throw new Error("This workspace is archived.");
  const previous = before.agentRuns.at(-1)?.context;
  // Engineering fixtures never incur model spend, even if the host is live.
  const planned = before.fixtureWorkspace
    ? { plan: fallbackPlan(input, previous), mode: "catalog" as const }
    : await planAgent(input, previous, before.agentRuns);
  const plan = planned.plan;
  let intent: VoiceIntent = { kind: "clarification", message: "" };
  const run: AgentRun = {
    id: randomUUID(),
    task: input.task,
    at: new Date().toISOString(),
    status: "needs_input",
    reply: "",
    steps: [],
    productIds: [],
    intent,
    mode: planned.mode,
    context: previous,
  };
  let result: Awaited<ReturnType<typeof shop>> | undefined;
  if (plan.tool === "confirm_interpretation") {
    run.reply = `I interpreted your request as a charger for ${plan.model}${plan.budget ? ` within ${formatMoney(plan.budget)}` : ""}. Please confirm that interpretation before I use it. I still need your cable and charging-speed requirements; no facts or purchase constraints have been confirmed by the model.`;
    run.proposedTask = `Find a charger for ${plan.model}${plan.budget ? ` under $${(plan.budget / 100).toFixed(2)}` : ""}`;
    run.steps.push(
      "The model proposed a supported device and budget interpretation.",
      "Requested explicit confirmation; did not save the proposal as a purchase brief or create a quote.",
    );
    intent = { kind: "clarification", message: run.reply };
  } else if (plan.tool === "research_products") {
    const { model, budget, cable, fastCharging, deviceFamily } = plan;
    run.context = { model, budget, cable, fastCharging, deviceFamily };
    run.steps.push(
      "Read your stated device, budget, cable and charging-speed constraints from this private conversation.",
    );
    if (!model || !budget) {
      run.reply = !model
        ? "Is your MacBook Air M2 the 13-inch (2022) or 15-inch (2023) model? The size changes the manufacturer compatibility evidence."
        : "What is your maximum budget in USD? I will include any required cable in the total.";
      intent = { kind: "clarification", message: run.reply };
      run.steps.push(
        "Asked for a missing constraint instead of assuming a device or budget.",
      );
    } else {
      intent = {
        kind: "shopping",
        brief: {
          message: input.task,
          model,
          budget,
          category: "chargers",
          preference: fastCharging ? "fast charging" : "",
          priority: "price",
          realRequirements: { cable, fastCharging },
        },
      };
      result = await shop(intent.brief, actor, "fixture");
      run.research = result.research;
      if (planned.mode === "model" && run.research) {
        try {
          run.recommendation = await compareWithModel(run.research);
          run.steps.push(
            "The model compared the completed research tool results; its choice and evidence IDs passed server validation.",
          );
        } catch {
          run.mode = "unavailable";
          run.steps.push(
            "Model comparison failed validation or was unavailable; retained the verified catalog comparison.",
          );
        }
      }
      run.productIds = result.products.map((p) => p.id);
      run.briefVersion = result.brief?.version;
      run.status =
        result.questions.length || !result.products.length
          ? "needs_input"
          : "ready_for_review";
      const best = result.products[0];
      run.reply = result.questions.length
        ? result.questions.join(" ")
        : best
          ? `For ${model}, my lowest complete eligible offer is ${best.name} at ${formatMoney(best.price)}. ${best.id === "R003" ? "The cable is included." : `This uses your confirmed ${cable === "magsafe3" ? "MagSafe 3" : cable === "usb100" ? "100W+ USB-C" : "60W USB-C"} charging cable.`} ${fastCharging ? "This configuration meets the sourced fast-charging requirement." : "Normal charging is sufficient for your stated need; I have not added a fast-charging premium."} Review the evidence and alternatives below. This is a simulated DALE merchant offer; no purchase has been made.`
          : "No complete verified offer meets all your constraints. The alternatives below show exactly what fails. You can change the budget, cable or charging-speed requirement; I will not relax them silently.";
      run.steps.push(
        "Retrieved the versioned manufacturer evidence for the exact device and real product records.",
        "Checked compatibility, cable completeness, normal/fast charging, total offer price and source freshness.",
        "Compared all alternatives by complete cost; sponsorship does not affect the ordering.",
        "Left the immutable purchase review and payment approval with you.",
      );
    }
  } else if (plan.tool === "scan_message") {
    run.safety =
      planned.mode === "model"
        ? await (await import("./ai")).scamAnalysis(input.task, "live")
        : scanMessage(input.task);
    if (run.safety.mode === "unavailable") run.mode = "unavailable";
    run.reply = `Message safety: ${run.safety.level}. ${run.safety.reasons.join(" ")} ${run.safety.nextStep} I have not changed your payee, budget or payment.`;
    run.status = "ready_for_review";
    run.steps.push(
      "Scanned the supplied message for off-checkout payment, credential theft, urgency and instruction manipulation.",
      "Kept sender instructions separate from your purchase authority.",
    );
    intent = { kind: "clarification", message: run.reply };
  } else if (
    plan.tool === "inspect_orders" ||
    plan.tool === "prepare_support"
  ) {
    run.orders = before.orders.map((order) => ({
      id: order.id,
      product: productById(order.quote.productId).name,
      status: order.status,
      nextStep:
        order.fulfillmentIssue || order.status === "refund_failed"
          ? "Open support to review refund or replacement options. Payment is unresolved until the provider confirms it."
          : order.status === "delivered"
            ? "You can open a return request and provide evidence; no remedy is automatic."
            : order.status === "refunded"
              ? "The recorded refund completed. Review the reference in your order timeline."
              : "Review the order timeline and delivery estimate; open support if something goes wrong.",
    }));
    run.steps.push(
      `Read ${run.orders.length} orders belonging to your shopper session; no other shopper's records were accessed.`,
    );
    if (plan.tool === "inspect_orders") {
      intent = { kind: "navigate", destination: "orders" };
      run.status = "opened_workspace";
      run.reply = run.orders.length
        ? `Opened your ${run.orders.length} order${run.orders.length === 1 ? "" : "s"}. Current status and next steps come from recorded events, not an assumed payment outcome.`
        : "You do not have an order in this workspace yet. Nothing has been purchased. Opened your order workspace.";
    } else {
      intent = {
        kind: "support_draft",
        text: input.task,
        reason: plan.reason,
        request: plan.request,
      };
      run.status = "draft_prepared";
      run.reply =
        "Prepared your support draft from the stated issue and requested remedy. Choose the relevant order, review the issue and remedy, then explicitly submit. No refund or replacement has been authorized.";
      run.steps.push(
        "Prepared a support draft without submitting a case, judging evidence or moving money.",
      );
    }
  } else if (plan.tool === "clarify") {
    const safe = fallbackPlan(input, previous);
    run.reply =
      safe.tool === "clarify"
        ? safe.question
        : "Give the exact device model, maximum budget in USD and the task you want help with. I will not infer missing specifications or authorize a payment.";
    if (
      /\b(?:macbook|iphone|ipad|dell|lenovo|samsung|thinkpad|surface)\b/i.test(
        input.task,
      )
    )
      run.context = undefined;
    intent = { kind: "clarification", message: run.reply };
    run.steps.push(
      "Asked for a verified constraint; did not create a product claim or purchase.",
    );
  } else {
    intent = understandAgent(input);
    if (intent.kind === "shopping") {
      run.context = undefined;
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
          ? `I found ${result.products.length} sample options for ${deviceLabel(intent.brief.model)} within ${formatMoney(intent.brief.budget)}. These are engineering sample records, not manufacturer offers. Choose an option to review; no purchase has been made.`
          : "No sample options meet that device profile and budget. I have not created a purchase.";
      run.steps.push(
        "Filtered the sample catalog by the stated profile, category and budget.",
        "Returned recorded specifications and source identifiers for comparison.",
        "Left purchase approval with the shopper.",
      );
    } else if (intent.kind === "navigate") {
      run.status = "opened_workspace";
      run.reply =
        "Opened the requested shopper workspace without changing any order or payment.";
    } else if (intent.kind === "support_draft") {
      run.status = "draft_prepared";
      run.reply =
        "Prepared your support draft. Choose the relevant order and explicitly submit. No remedy has been authorized.";
    } else {
      run.reply =
        intent.kind === "review_required"
          ? "I cannot approve payments, execute code or authorize a financial remedy from a task message. Use the protected review controls."
          : intent.message;
      run.steps.push(
        "Stopped without changing the shopping brief, orders or payments.",
      );
    }
  }
  run.intent = intent;
  if (result) result.analysis.summary = run.reply;
  if (planned.mode === "unavailable")
    run.steps.unshift(
      "Model planning was unavailable or failed validation; used the disclosed catalog/rules path without changing your constraints.",
    );
  await mutateWorkspace(actor.workspaceId, (state) => {
    if (
      run.briefVersion &&
      state.briefs?.find((b) => b.buyerId === actor.userId)?.version !==
        run.briefVersion
    )
      throw new Error(
        "Your brief changed while the agent was working. Send the current task again.",
      );
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
    if (result?.brief) {
      const turns = state.conversations?.find(
        (item) => item.buyerId === actor.userId,
      )?.turns;
      if (turns?.at(-1)?.role === "assistant") turns.at(-1)!.text = run.reply;
    }
    audit(state, actor, "agent.task", run.id);
  });
  return { run, intent, result, snapshot: await snapshot(actor) };
}
