import { randomUUID } from "node:crypto";
import { models, productById, searchCatalog } from "../domain/catalog";
import {
  allowedRefund,
  checkPurchase,
  quoteFingerprint,
  quotePaymentMode,
} from "../domain/guard";
import {
  audit,
  getWorkspace,
  mutateWorkspace,
  ownedCase,
  ownedOrder,
  type Actor,
  type Evidence,
  type Operation,
  type Order,
  type Workspace,
} from "./state";
import {
  capturePayment,
  createPayment,
  getRefund,
  paymentMode,
  refundPayment,
} from "./payments";
import { aiMode, evidenceAnalysis, scamAnalysis, shoppingSummary } from "./ai";
import { evidenceHash, getAsset, putAsset } from "./storage";
import { getDatabase } from "./database";
import { selectVisionEvidence } from "./vision";
import { briefSchema, type ShoppingBrief } from "../domain/brief";
import { enqueueJob, recoveryStatus } from "./jobs";
import { evidenceTarget, submissionProvenance } from "./provenance";
import { returnEligibility } from "../domain/return-policy";
import { assertReturnReady } from "./return-shipping";

function buyer(actor: Actor) {
  if (actor.role !== "buyer")
    throw new Error("Only the customer can approve a purchase.");
}
function reviewer(actor: Actor) {
  if (actor.role !== "reviewer")
    throw new Error("Reviewer authorization is required.");
}
function workspaceAiMode(state: Workspace) {
  return state.adapterModes?.ai === "fixture" ? "fixture" : aiMode();
}
function event(order: Order, text: string) {
  order.events.push({ at: new Date().toISOString(), text });
}
function activeStock(
  state: Workspace,
  productId: string,
  replacingGroup?: string,
  replacingBuyer?: string,
) {
  const orders = state.orders.filter(
    (order) =>
      order.quote.productId === productId &&
      !["refunded", "canceled"].includes(order.status),
  );
  const reservations = state.groups
    .filter(
      (group) =>
        group.productId === productId &&
        group.status === "ready" &&
        Date.parse(group.checkoutExpiresAt || group.expiresAt) > Date.now(),
    )
    .reduce(
      (count, group) =>
        count +
        group.members.filter(
          (member) =>
            !(group.id === replacingGroup && member === replacingBuyer) &&
            !orders.some(
              (order) =>
                order.quote.groupId === group.id && order.buyerId === member,
            ),
        ).length,
      0,
    );
  return orders.length + reservations;
}
export async function snapshot(actor: Actor) {
  const state = await getWorkspace(actor.workspaceId);
  return {
    actor,
    brief: state.briefs?.find((brief) => brief.buyerId === actor.userId),
    fixtureWorkspace: !!state.fixtureWorkspace,
    archivedAt: state.archivedAt,
    invite: actor.role === "buyer" ? state.invite : undefined,
    orders: state.orders.filter(
      (o) => actor.role !== "buyer" || o.buyerId === actor.userId,
    ),
    cases: state.cases.filter(
      (c) => actor.role !== "buyer" || c.buyerId === actor.userId,
    ),
    groups: state.groups.map((g) => ({
      ...g,
      members: undefined,
      memberCount: g.members.length,
      joined: g.members.includes(actor.userId),
    })),
    modes: {
      payments: state.adapterModes?.payments || paymentMode(),
      ai: workspaceAiMode(state),
      shipping: "simulated",
      database: process.env.DATABASE_URL ? "postgres" : "embedded-postgres",
    },
    paypalClientId:
      (state.adapterModes?.payments || paymentMode()) === "sandbox"
        ? process.env.PAYPAL_CLIENT_ID
        : undefined,
    recovery:
      actor.role === "buyer"
        ? undefined
        : await recoveryStatus(actor.workspaceId),
  };
}
export async function updateBrief(actor: Actor, input: ShoppingBrief) {
  buyer(actor);
  const normalized = briefSchema.parse(input);
  return mutateWorkspace(actor.workspaceId, (state) => {
    state.briefs ??= [];
    const previous = state.briefs.find(
      (brief) => brief.buyerId === actor.userId,
    );
    if (
      previous &&
      Object.entries(normalized).every(
        ([key, value]) => previous.input[key as keyof ShoppingBrief] === value,
      )
    )
      return previous;
    // Never revoke an already-sent capture: it retains its original approval and is reconciled.
    const now = new Date().toISOString();
    const brief = {
      buyerId: actor.userId,
      version: (previous?.version ?? 0) + 1,
      input: normalized,
      updatedAt: now,
    };
    state.briefs = state.briefs.filter((item) => item.buyerId !== actor.userId);
    state.briefs.push(brief);
    for (const quote of state.quotes.filter(
      (q) => q.buyerId === actor.userId,
    )) {
      const order = state.orders.find((item) => item.quote.id === quote.id);
      if (
        order?.captureId ||
        (order &&
          state.operations.some(
            (op) => op.orderId === order.id && op.kind === "capture",
          ))
      )
        continue;
      quote.invalidatedAt ??= now;
      if (order) {
        order.quote.invalidatedAt ??= now;
        order.status = "canceled";
        event(
          order,
          "Your shopping brief changed. Review a fresh quote before payment.",
        );
      }
    }
    audit(state, actor, "brief.updated", String(brief.version));
    return brief;
  });
}
function assertCurrentQuote(
  state: Workspace,
  quote: import("./state").StoredQuote,
) {
  if (quote.invalidatedAt)
    throw new Error(
      "Your shopping brief changed. Review a fresh quote before payment.",
    );
  const brief = state.briefs?.find((item) => item.buyerId === quote.buyerId);
  if (brief && quote.briefVersion !== brief.version)
    throw new Error(
      "Your shopping brief changed. Review a fresh quote before payment.",
    );
}
export async function shop(input: ShoppingBrief, actor?: Actor) {
  const brief = actor ? await updateBrief(actor, input) : undefined;
  const mode = actor
    ? workspaceAiMode(await getWorkspace(actor.workspaceId))
    : aiMode();
  const products = searchCatalog(input);
  try {
    return {
      products,
      brief,
      analysis: await shoppingSummary(
        input.message,
        products,
        input.model,
        mode,
      ),
    };
  } catch {
    return {
      products,
      brief,
      analysis: {
        summary:
          "Assisted analysis is temporarily unavailable. These catalog options meet your selected model and budget.",
        sources: products.map((p) => p.source),
        mode: "unavailable",
      },
    };
  }
}
export async function checkMessage(message: string, actor?: Actor) {
  const mode = actor
    ? workspaceAiMode(await getWorkspace(actor.workspaceId))
    : aiMode();
  return scamAnalysis(message, mode);
}
export async function makeQuote(
  actor: Actor,
  productId: string,
  model: string,
  groupId?: string,
) {
  buyer(actor);
  const product = productById(productId);
  if (!models.includes(model) || !product.compatibleModels.includes(model))
    throw new Error(
      "This product is not confirmed compatible with your device.",
    );
  return mutateWorkspace(actor.workspaceId, (state) => {
    const mode = state.adapterModes?.payments || paymentMode();
    const brief = state.briefs?.find((item) => item.buyerId === actor.userId);
    if (
      brief &&
      (brief.input.model !== model ||
        (brief.input.category && brief.input.category !== product.category))
    )
      throw new Error(
        "This item differs from your shopping brief. Update the brief first.",
      );
    if (activeStock(state, productId, groupId, actor.userId) >= product.stock)
      throw new Error(
        "This item is currently reserved. Please choose another option.",
      );
    let amount = product.price;
    let expiry = Date.now() + 10 * 60000;
    if (groupId) {
      const group = state.groups.find(
        (g) => g.id === groupId && g.members.includes(actor.userId),
      );
      if (
        !group ||
        group.status !== "ready" ||
        group.productId !== productId ||
        group.model !== model ||
        !group.checkoutExpiresAt ||
        new Date(group.checkoutExpiresAt).getTime() <= Date.now()
      )
        throw new Error("The group offer is not available for this purchase.");
      if (
        state.orders.some(
          (order) =>
            order.quote.groupId === groupId &&
            order.buyerId === actor.userId &&
            order.status !== "canceled",
        )
      )
        throw new Error(
          "Your group purchase already exists. Continue it from your orders.",
        );
      amount = group.amount!;
      expiry = Math.min(expiry, new Date(group.checkoutExpiresAt).getTime());
    }
    if (brief && amount > brief.input.budget)
      throw new Error(
        "This item exceeds your approved budget. Update the brief first.",
      );
    const quote = {
      id: randomUUID(),
      buyerId: actor.userId,
      productId,
      model,
      payee:
        mode === "sandbox"
          ? process.env.PAYPAL_MERCHANT_ID || ""
          : "fixture-store",
      amount,
      currency: "USD" as const,
      expiresAt: new Date(expiry).toISOString(),
      version: 1,
      groupId,
      fingerprint: "",
      provider: mode,
      briefVersion: brief?.version,
    };
    if (!quote.payee)
      throw new Error("PayPal merchant configuration is missing.");
    quote.fingerprint = quoteFingerprint(quote);
    state.quotes.push(quote);
    audit(state, actor, "quote.created", quote.id);
    return quote;
  });
}
export async function joinGroup(
  actor: Actor,
  productId: string,
  model: string,
) {
  buyer(actor);
  const product = productById(productId);
  if (!product.compatibleModels.includes(model))
    throw new Error("The group product must fit your device.");
  return mutateWorkspace(actor.workspaceId, (state) => {
    const previous = state.groups.find(
      (g) =>
        g.productId === productId &&
        g.model === model &&
        g.members.includes(actor.userId) &&
        g.status !== "expired" &&
        new Date(g.checkoutExpiresAt || g.expiresAt).getTime() > Date.now(),
    );
    if (previous) return previous.id;
    let group = state.groups.find(
      (g) =>
        g.productId === productId &&
        g.model === model &&
        g.status === "forming" &&
        new Date(g.expiresAt).getTime() > Date.now(),
    );
    if (!group) {
      group = {
        id: randomUUID(),
        productId,
        model,
        members: [],
        status: "forming",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      state.groups.push(group);
    }
    group.members.push(actor.userId);
    if (group.members.length >= 2) {
      if (activeStock(state, productId) + group.members.length > product.stock)
        throw new Error("There is not enough stock for this group.");
      group.status = "ready";
      group.amount = Math.round(product.price * 0.9);
      group.checkoutExpiresAt = new Date(Date.now() + 30 * 60000).toISOString();
    }
    audit(state, actor, "group.joined", group.id);
    return group.id;
  });
}
export async function leaveGroup(actor: Actor, groupId: string) {
  buyer(actor);
  return mutateWorkspace(actor.workspaceId, (state) => {
    const group = state.groups.find(
      (g) => g.id === groupId && g.members.includes(actor.userId),
    );
    if (!group || group.status !== "forming")
      throw new Error(
        "This group is finalized. You can decline checkout without being charged.",
      );
    group.members = group.members.filter((id) => id !== actor.userId);
    audit(state, actor, "group.left", group.id);
  });
}
export async function checkout(
  actor: Actor,
  quoteId: string,
  fingerprint: string,
) {
  buyer(actor);
  const prepared = await mutateWorkspace(actor.workspaceId, (state) => {
    const quote = state.quotes.find(
      (q) => q.id === quoteId && q.buyerId === actor.userId,
    );
    if (!quote) throw new Error("Quote not found");
    assertCurrentQuote(state, quote);
    checkPurchase(quote, fingerprint, quote);
    const existing = state.orders.find((o) => o.quote.id === quoteId);
    if (existing)
      return {
        order: existing,
        operation: state.operations.find(
          (op) => op.kind === "create" && op.orderId === existing.id,
        )!,
      };
    if (
      quote.groupId &&
      state.orders.some(
        (order) =>
          order.quote.groupId === quote.groupId &&
          order.buyerId === actor.userId &&
          order.status !== "canceled",
      )
    )
      throw new Error(
        "Your group purchase already exists. Continue it from your orders.",
      );
    if (
      activeStock(state, quote.productId, quote.groupId, actor.userId) >=
      productById(quote.productId).stock
    )
      throw new Error(
        "The last item was reserved. Please review another option.",
      );
    const order: Order = {
      id: randomUUID(),
      buyerId: actor.userId,
      quote,
      status: "checkout_pending",
      createdAt: new Date().toISOString(),
      refundedAmount: 0,
      dispatchEvidence: [],
      events: [],
    };
    const operation: Operation = {
      id: randomUUID(),
      orderId: order.id,
      kind: "create",
      state: "pending",
      amount: quote.amount,
      createdAt: new Date().toISOString(),
    };
    state.orders.push(order);
    state.operations.push(operation);
    event(order, "Purchase approved. Checkout is awaiting payment.");
    audit(state, actor, "checkout.approved", order.id);
    return { order, operation };
  });
  if (prepared.order.providerOrderId) return prepared.order;
  try {
    const result = await createPayment(
      prepared.order.quote,
      prepared.operation.id,
      prepared.order.id,
      quotePaymentMode(prepared.order.quote),
    );
    return await mutateWorkspace(actor.workspaceId, (state) => {
      const order = ownedOrder(state, actor, prepared.order.id);
      const operation = state.operations.find(
        (op) => op.id === prepared.operation.id,
      )!;
      order.providerOrderId = result.id;
      operation.state = "succeeded";
      operation.resultId = result.id;
      return order;
    });
  } catch (error) {
    await markUnknown(actor, prepared.operation.id);
    throw error;
  }
}
async function markUnknown(actor: Actor, id: string) {
  await mutateWorkspace(actor.workspaceId, (state) => {
    const op = state.operations.find((o) => o.id === id);
    if (op && !["succeeded", "failed"].includes(op.state)) {
      op.state = "unknown";
      if (op.kind === "refund") {
        const order = state.orders.find((item) => item.id === op.orderId)!;
        order.refund = {
          status: "unknown",
          reference: op.resultId,
          nextStep:
            "We are checking the provider outcome. Your request remains open; do not create a second refund.",
          updatedAt: new Date().toISOString(),
        };
      }
    }
  });
}
export async function capture(actor: Actor, orderId: string) {
  buyer(actor);
  const prepared = await mutateWorkspace(
    actor.workspaceId,
    async (state, sql) => {
      const order = ownedOrder(state, actor, orderId);
      if (order.captureId) return { order, operation: undefined };
      if (order.status !== "checkout_pending" || !order.providerOrderId)
        throw new Error("Checkout is not ready for payment.");
      const existingOperation = state.operations.find(
        (op) => op.orderId === orderId && op.kind === "capture",
      );
      if (!existingOperation) assertCurrentQuote(state, order.quote);
      checkPurchase(order.quote, order.quote.fingerprint, order.quote);
      let operation = state.operations.find(
        (op) => op.kind === "capture" && op.orderId === order.id,
      );
      if (!operation) {
        operation = {
          id: randomUUID(),
          orderId,
          kind: "capture",
          state: "pending",
          amount: order.quote.amount,
          createdAt: new Date().toISOString(),
        };
        state.operations.push(operation);
        await enqueueJob(
          sql,
          actor.workspaceId,
          "reconcile",
          { operationId: operation.id },
          `capture:${operation.id}`,
        );
      }
      return { order, operation };
    },
  );
  if (!prepared.operation) return prepared.order;
  try {
    const result = await capturePayment(
      prepared.order.providerOrderId!,
      prepared.operation.id,
      prepared.order.quote,
      prepared.order.id,
      quotePaymentMode(prepared.order.quote),
    );
    return await mutateWorkspace(actor.workspaceId, (state) => {
      const order = ownedOrder(state, actor, orderId);
      if (order.captureId) return order;
      order.captureId = result.id;
      order.status = "paid";
      const op = state.operations.find((o) => o.id === prepared.operation!.id)!;
      op.state = "succeeded";
      op.resultId = result.id;
      event(
        order,
        quotePaymentMode(order.quote) === "fixture"
          ? "Fixture payment recorded. No real money moved."
          : "PayPal sandbox payment confirmed.",
      );
      audit(state, actor, "payment.captured", orderId);
      return order;
    });
  } catch (error) {
    await markUnknown(actor, prepared.operation.id);
    throw error;
  }
}
export async function openReturn(
  actor: Actor,
  orderId: string,
  reason: "damaged" | "wrong_item" | "not_delivered" | "canceled",
  request: "refund" | "replacement",
) {
  buyer(actor);
  return mutateWorkspace(actor.workspaceId, (state) => {
    const order = ownedOrder(state, actor, orderId);
    if (!order.captureId || ["refunded", "canceled"].includes(order.status))
      throw new Error(
        "There is no eligible captured payment for this request.",
      );
    if (order.returnId) return ownedCase(state, actor, order.returnId);
    const item = {
      id: randomUUID(),
      orderId,
      buyerId: actor.userId,
      reason,
      request,
      status: "open" as const,
      createdAt: new Date().toISOString(),
      deadlineAt: new Date(Date.now() + 86400000).toISOString(),
      sellerResponded: false,
      evidence: [...order.dispatchEvidence],
      eligibility: returnEligibility(reason, order.deliveredAt),
    };
    state.cases.push(item);
    order.returnId = item.id;
    event(
      order,
      "Your support request is open. The seller has a response deadline.",
    );
    audit(state, actor, "return.opened", item.id);
    return item;
  });
}
export async function addEvidence(
  actor: Actor,
  caseId: string,
  input: {
    checkpoint: Evidence["checkpoint"];
    serial: string;
    note: string;
    captureSessionId?: string;
  },
  file?: { bytes: Buffer; mime: string },
) {
  const id = randomUUID();
  const hash = evidenceHash(file?.bytes || Buffer.from(JSON.stringify(input)));
  const key = file ? `${actor.workspaceId}/${caseId}/${id}` : undefined;
  return mutateWorkspace(actor.workspaceId, async (fresh, sql) => {
    const entries = evidenceTarget(fresh, actor, { caseId }, input.checkpoint);
    const provenance = submissionProvenance(
      fresh,
      actor,
      caseId,
      input.checkpoint,
      hash,
      entries,
      Boolean(file),
      input.captureSessionId,
    );
    if (file && key) await putAsset(key, file.bytes, file.mime);
    const item = ownedCase(fresh, actor, caseId);
    const entry: Evidence = {
      id,
      checkpoint: input.checkpoint,
      serial: input.serial,
      note: input.note,
      provenance,
      hash,
      assetKey: key,
      mime: file?.mime,
      createdAt: new Date().toISOString(),
    };
    item.evidence.push(entry);
    item.analysis = undefined;
    if (actor.role === "seller") item.sellerResponded = true;
    if (file && key)
      await sql.query(
        "INSERT INTO assets(id,workspace_id,case_id,owner_id,checkpoint,mime,hash,storage_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id,
          actor.workspaceId,
          caseId,
          actor.userId,
          input.checkpoint,
          file.mime,
          hash,
          key,
        ],
      );
    audit(fresh, actor, "evidence.submitted", id);
    return entry;
  });
}
export async function analyzeCase(actor: Actor, caseId: string) {
  const state = await getWorkspace(actor.workspaceId);
  const item = ownedCase(state, actor, caseId);
  const images = await Promise.all(
    selectVisionEvidence(item.evidence).map(async (e) => ({
      evidenceId: e.id,
      mime: e.mime!,
      bytes: await getAsset(e.assetKey!, e.hash),
    })),
  );
  const analysis = await evidenceAnalysis(
    item.evidence,
    images,
    workspaceAiMode(state),
  );
  analysis.versions = {
    policy: "merchant-policy-v1",
    prompt: "claims-v1",
    model:
      analysis.mode === "live"
        ? process.env.AI_MODEL || "unconfigured"
        : "deterministic-fixture-v1",
    analyzedAt: new Date().toISOString(),
  };
  if (item.evidence.filter((entry) => entry.assetKey).length > images.length)
    analysis.observations.push(
      "Model image review is limited to four checkpoint samples. All original images remain available for human review.",
    );
  return mutateWorkspace(actor.workspaceId, (fresh) => {
    const current = ownedCase(fresh, actor, caseId);
    if (
      current.evidence.map((e) => e.id).join() !==
      item.evidence.map((e) => e.id).join()
    )
      throw new Error(
        "New evidence arrived. Please analyze the updated records.",
      );
    current.analysis = analysis;
    if (
      !["resolved", "refund_pending", "refund_failed", "approved"].includes(
        current.status,
      )
    )
      current.status = "review";
    audit(fresh, actor, "evidence.analyzed", caseId);
    return analysis;
  });
}
export async function resolveCase(
  actor: Actor,
  caseId: string,
  remedy: "refund" | "replacement",
  note: string,
) {
  reviewer(actor);
  const item = await mutateWorkspace(actor.workspaceId, async (state, sql) => {
    const item = ownedCase(state, actor, caseId);
    const order = ownedOrder(state, actor, item.orderId);
    if (
      state.operations.some(
        (op) =>
          op.orderId === order.id &&
          op.kind === "refund" &&
          op.state === "failed",
      )
    )
      throw new Error(
        "The provider rejected this refund. A reviewer must reconcile it before any new operation.",
      );
    if (["resolved", "refund_pending", "refund_failed"].includes(item.status))
      return item;
    if (!note.trim())
      throw new Error("Record the customer policy and reason for the remedy.");
    if (remedy !== item.request)
      throw new Error(
        "The remedy must match the customer's choice. Ask them before changing it.",
      );
    if (!order.captureId)
      throw new Error("A payment must be confirmed before a financial remedy.");
    assertReturnReady(item);
    // An explicit reviewer approval with a policy reason preserves the original no-return remedy contract.
    item.returnShipment ??= {
      status: "not_required",
      customerCost: 0,
      reason: note,
      authorizedAt: new Date().toISOString(),
      remedyDueAt: new Date(Date.now() + 86400000).toISOString(),
      carrier: "simulated",
    };
    item.remedy = remedy;
    item.resolutionNote = note;
    item.status = "approved";
    if (remedy === "refund")
      await enqueueJob(
        sql,
        actor.workspaceId,
        "reconcile",
        { caseId },
        `refund-case:${caseId}`,
      );
    audit(state, actor, "remedy.approved", caseId);
    if (remedy === "replacement") {
      if (
        order.refundedAmount ||
        state.operations.some(
          (op) => op.kind === "refund" && op.orderId === order.id,
        )
      )
        throw new Error(
          "Refund work exists. Reconcile it before choosing a replacement.",
        );
      const product = productById(order.quote.productId);
      if (activeStock(state, product.id) >= product.stock)
        throw new Error(
          "Replacement stock is unavailable. Ask the customer to choose a refund.",
        );
      if (!state.orders.some((o) => o.replacementOf === order.id)) {
        const replacement: Order = {
          ...order,
          id: randomUUID(),
          status: "replacement",
          createdAt: new Date().toISOString(),
          captureId: undefined,
          providerOrderId: undefined,
          returnId: undefined,
          replacementOf: order.id,
          deliveredAt: undefined,
          dispatchEvidence: [],
          events: [
            {
              at: new Date().toISOString(),
              text: "Merchant-funded replacement. No additional customer charge.",
            },
          ],
        };
        state.orders.push(replacement);
      }
      item.status = "resolved";
      event(order, "A replacement was approved at no additional charge.");
    }
    return item;
  });
  if (item.remedy === "refund" && item.status !== "resolved")
    await executeRefund(actor, item.orderId);
  return (await getWorkspace(actor.workspaceId)).cases.find(
    (c) => c.id === caseId,
  )!;
}
export async function executeRefund(actor: Actor, orderId: string) {
  reviewer(actor);
  const prepared = await mutateWorkspace(actor.workspaceId, (state) => {
    const order = ownedOrder(state, actor, orderId);
    const item = state.cases.find((c) => c.orderId === orderId);
    if (
      !item ||
      item.remedy !== "refund" ||
      !["approved", "refund_pending", "resolved"].includes(item.status)
    )
      throw new Error("The customer's refund has not been authorized.");
    assertReturnReady(item);
    if (order.status === "refunded") return { order, operation: undefined };
    if (state.orders.some((o) => o.replacementOf === orderId))
      throw new Error(
        "A replacement already exists. Review the remedy before refunding.",
      );
    let operation = state.operations.find(
      (o) => o.kind === "refund" && o.orderId === orderId,
    );
    if (!operation) {
      const amount = order.quote.amount - order.refundedAmount;
      allowedRefund(order.quote.amount, order.refundedAmount, 0, amount);
      operation = {
        id: randomUUID(),
        orderId,
        kind: "refund",
        state: "pending",
        amount,
        createdAt: new Date().toISOString(),
      };
      state.operations.push(operation);
    }
    if (operation.state === "failed") return { order, operation };
    order.status = "refund_pending";
    item.status = "refund_pending";
    order.refund = {
      status: "processing",
      reference: operation.resultId,
      nextStep:
        "We are checking the provider's refund status. Settlement timing comes from PayPal.",
      updatedAt: new Date().toISOString(),
    };
    return { order, operation };
  });
  if (!prepared.operation) return prepared.order;
  if (prepared.operation.state === "failed")
    throw new Error(
      "The provider rejected this refund. A reviewer must reconcile it before any new operation.",
    );
  if (
    quotePaymentMode(prepared.order.quote) === "sandbox" &&
    !prepared.operation.resultId &&
    (!prepared.operation.createdAt ||
      Date.now() - Date.parse(prepared.operation.createdAt) > 5 * 3600000)
  )
    throw new Error(
      "The refund outcome needs provider reconciliation. Do not create another refund.",
    );
  try {
    const fixtureState = await getWorkspace(actor.workspaceId);
    const fault =
      fixtureState.fixtureWorkspace &&
      quotePaymentMode(prepared.order.quote) === "fixture"
        ? fixtureState.fixtureFaults?.refund
        : undefined;
    if (fault === "timeout_once") {
      await mutateWorkspace(actor.workspaceId, (state) => {
        delete state.fixtureFaults?.refund;
      });
      throw new Error(
        "Simulated provider timeout. The authorized refund will reconcile with its original operation.",
      );
    }
    const result =
      fault === "failed"
        ? { id: `FIXTURE-REFUND-${prepared.operation.id}`, status: "FAILED" }
        : prepared.operation.resultId &&
            quotePaymentMode(prepared.order.quote) === "sandbox"
          ? await getRefund(prepared.operation.resultId, {
              captureId: prepared.order.captureId!,
              amount: prepared.operation.amount,
            })
          : await refundPayment(
              prepared.order.captureId!,
              prepared.operation.id,
              prepared.operation.amount,
              quotePaymentMode(prepared.order.quote),
            );
    await mutateWorkspace(actor.workspaceId, (state) => {
      const op = state.operations.find((o) => o.id === prepared.operation!.id)!;
      op.resultId = result.id;
      if (["FAILED", "CANCELLED", "DENIED"].includes(result.status)) {
        op.state = "failed";
        const order = ownedOrder(state, actor, orderId);
        order.status = "refund_failed";
        order.refund = {
          status: "failed",
          reference: result.id,
          nextStep:
            "A person must reconcile the failed refund with PayPal. Your request remains open. You can add evidence or request another review.",
          updatedAt: new Date().toISOString(),
        };
        state.cases.find((item) => item.orderId === orderId)!.status =
          "refund_failed";
        event(
          order,
          "Provider refund failed. Your request remains open for a person to resolve.",
        );
        return;
      }
      if (result.status !== "COMPLETED") {
        op.state = "pending";
        const order = ownedOrder(state, actor, orderId);
        order.refund = {
          status: "processing",
          reference: result.id,
          nextStep:
            "PayPal reports that the refund is processing. We will check again automatically.",
          updatedAt: new Date().toISOString(),
        };
        return;
      }
      if (op.state === "succeeded") return;
      const order = ownedOrder(state, actor, orderId);
      allowedRefund(order.quote.amount, order.refundedAmount, 0, op.amount);
      order.refundedAmount += op.amount;
      order.status = "refunded";
      order.refund = {
        status: "completed",
        reference: result.id,
        nextStep:
          quotePaymentMode(order.quote) === "fixture"
            ? "Simulated refund completed; no real money moved."
            : "PayPal confirmed this sandbox refund. Check PayPal for settlement details.",
        updatedAt: new Date().toISOString(),
      };
      op.state = "succeeded";
      const item = state.cases.find((c) => c.orderId === orderId)!;
      item.status = "resolved";
      event(
        order,
        quotePaymentMode(order.quote) === "fixture"
          ? "Fixture refund completed. No real money moved."
          : "PayPal sandbox refund completed.",
      );
      audit(state, actor, "refund.completed", orderId);
    });
    return ownedOrder(await getWorkspace(actor.workspaceId), actor, orderId);
  } catch (error) {
    await markUnknown(actor, prepared.operation.id);
    throw error;
  }
}
export async function appealCase(actor: Actor, caseId: string, note: string) {
  buyer(actor);
  return mutateWorkspace(actor.workspaceId, (state) => {
    const item = ownedCase(state, actor, caseId);
    if (!note.trim())
      throw new Error("Please describe what you want reviewed.");
    item.appeal = note;
    item.status = "appealed";
    audit(state, actor, "case.appealed", caseId);
    return item;
  });
}
export async function shippingEvent(
  actor: Actor,
  orderId: string,
  status: "shipped" | "delivered",
) {
  if (actor.role !== "seller")
    throw new Error(
      "Seller authorization is required for shipping simulation.",
    );
  return mutateWorkspace(actor.workspaceId, (state) => {
    const order = ownedOrder(state, actor, orderId);
    const allowed =
      status === "shipped" ? ["paid", "replacement"] : ["shipped"];
    if (!allowed.includes(order.status))
      throw new Error("This shipment event is not valid in the current state.");
    order.status = status;
    if (status === "delivered") order.deliveredAt = new Date().toISOString();
    event(order, `Simulated carrier event: ${status}.`);
    audit(state, actor, "shipment.simulated", orderId);
    return order;
  });
}
export async function evidenceBytes(actor: Actor, id: string) {
  const { rows } = await (
    await getDatabase()
  ).query<{ case_id: string; storage_key: string; hash: string; mime: string }>(
    "SELECT case_id,storage_key,hash,mime FROM assets WHERE id=$1 AND workspace_id=$2",
    [id, actor.workspaceId],
  );
  if (!rows[0]) throw new Error("Evidence not found");
  const state = await getWorkspace(actor.workspaceId);
  if (rows[0].case_id.startsWith("order:"))
    ownedOrder(state, actor, rows[0].case_id.slice(6));
  else ownedCase(state, actor, rows[0].case_id);
  return {
    bytes: await getAsset(rows[0].storage_key, rows[0].hash),
    mime: rows[0].mime,
  };
}
export async function addDispatchEvidence(
  actor: Actor,
  orderId: string,
  input: { serial: string; note: string; captureSessionId?: string },
  file?: { bytes: Buffer; mime: string },
) {
  const id = randomUUID();
  const key = file ? `${actor.workspaceId}/${orderId}/${id}` : undefined;
  const hash = evidenceHash(file?.bytes || Buffer.from(JSON.stringify(input)));
  return mutateWorkspace(actor.workspaceId, async (state, sql) => {
    const entries = evidenceTarget(
      state,
      actor,
      { orderId },
      "seller_dispatch",
    );
    const provenance = submissionProvenance(
      state,
      actor,
      orderId,
      "seller_dispatch",
      hash,
      entries,
      Boolean(file),
      input.captureSessionId,
    );
    if (file && key) await putAsset(key, file.bytes, file.mime);
    const current = ownedOrder(state, actor, orderId);
    const entry: Evidence = {
      id,
      serial: input.serial,
      note: input.note,
      provenance,
      checkpoint: "seller_dispatch",
      hash,
      assetKey: key,
      mime: file?.mime,
      createdAt: new Date().toISOString(),
    };
    current.dispatchEvidence.push(entry);
    if (file && key)
      await sql.query(
        "INSERT INTO assets(id,workspace_id,case_id,owner_id,checkpoint,mime,hash,storage_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id,
          actor.workspaceId,
          `order:${orderId}`,
          actor.userId,
          entry.checkpoint,
          file.mime,
          hash,
          key,
        ],
      );
    audit(state, actor, "dispatch.recorded", orderId);
    return entry;
  });
}
