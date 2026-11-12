import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  discoveryInput,
  type ShoppingDecision,
  type DecisionOffer,
  type DecisionView,
} from "@/domain/shopping-decision";
import { searchConstraints } from "@/domain/concierge";
import type { Product } from "@/domain/catalog";
import { defaultGroupPolicy, groupTerms } from "@/domain/group-policy";
import {
  getWorkspace,
  mutateWorkspace,
  audit,
  type Actor,
  type Workspace,
  type StoredQuote,
} from "../state";
import type { Sql } from "../database";
import { getDatabase } from "../database";
import { assertBuyer, operationId, readConcierge, ownerKey } from "./store";
import { hybridSearch } from "./retrieval";
import { agentProgress } from "./latency";
import { recordedAttributes } from "@/domain/catalog-derived";

const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const productDigest = (p: Product) =>
  digest({
    id: p.id,
    name: p.name,
    price: p.price,
    variant: p.skuVariant,
    revision: p.revisionId,
    attributes: p.attributes,
    specs: p.specs,
    source: p.source,
    evidence: p.evidence,
    compatibility: p.compatibleModels,
    comparisonOnly: p.comparisonOnly || false,
  });
const policyDigest = (state: Workspace) =>
  digest(state.groupPolicy || defaultGroupPolicy);
async function currentProduct(sql: Sql, id: string) {
  const rows = await sql.query<{ record: Product }>(
    "SELECT record || jsonb_build_object('price',price) AS record FROM catalog_products WHERE id=$1 AND publication='published' FOR SHARE",
    [id],
  );
  return rows.rows[0]?.record;
}
function ownedDecision(state: Workspace, actor: Actor, id: string) {
  const decision = state.shoppingDecisions?.find(
    (d) => d.id === id && d.buyerId === actor.userId,
  );
  if (!decision) throw new Error("Shopping decision not found.");
  return decision;
}
async function pendingRequest(
  sql: Sql,
  actor: Actor,
  decision: ShoppingDecision,
) {
  const rows = await sql.query<{
    turn: { status: string } | null;
    transcript: { id: string; sender: string; timestamp: number }[];
  }>(
    "SELECT state->'turn' AS turn,state->'transcript' AS transcript FROM concierge_documents WHERE owner=$1",
    [ownerKey(actor)],
  );
  const row = rows.rows[0];
  const message = row?.transcript?.findLast((m) => m.sender === "user");
  return row?.turn?.status !== "completed" &&
    message &&
    message.id !== decision.requestMessageId
    ? "Your newer request has not finished review. Retry or resume it before approving this decision."
    : null;
}
function staleReasons(
  state: Workspace,
  decision: ShoppingDecision,
  products: (Product | undefined)[],
) {
  const reasons: string[] = [];
  if (
    (state.briefs?.find((b) => b.buyerId === decision.buyerId)?.version ||
      null) !== decision.purchaseBriefVersion
  )
    reasons.push(
      "Your saved purchase requirements changed. Review a fresh decision.",
    );
  if (
    state.discoveryBriefs?.find((b) => b.buyerId === decision.buyerId)
      ?.version !== decision.version
  )
    reasons.push("Your requirements changed. Ask DALE to find fresh matches.");
  decision.offers.forEach((offer, index) => {
    const product = products[index];
    if (
      !product ||
      product.stock < 1 ||
      product.comparisonOnly ||
      productDigest(product) !== offer.productDigest
    )
      reasons.push(
        "The product, variant, availability or recorded offer changed. Review a fresh decision.",
      );
    if (offer.group && policyDigest(state) !== offer.policyDigest)
      reasons.push("The merchant's group terms changed. Review fresh terms.");
  });
  return [...new Set(reasons)];
}
export async function shoppingDecision(
  actor: Actor,
  id?: string,
): Promise<DecisionView | null> {
  assertBuyer(actor);
  const state = await getWorkspace(actor.workspaceId);
  const decision = id
    ? ownedDecision(state, actor, id)
    : state.shoppingDecisions?.findLast((d) => d.buyerId === actor.userId);
  if (!decision) return null;
  const db = await getDatabase();
  const products = [];
  for (const offer of decision.offers)
    products.push(await currentProduct(db, offer.product.id));
  const reasons = staleReasons(state, decision, products);
  const pending = await pendingRequest(db, actor, decision);
  if (pending) reasons.push(pending);
  return {
    ...decision,
    status: reasons.length ? "stale" : "current",
    staleReasons: reasons,
  };
}
export async function prepareShoppingDecision(
  actor: Actor,
  raw: unknown,
  signal?: AbortSignal,
) {
  assertBuyer(actor);
  signal?.throwIfAborted();
  const conversation = await readConcierge(actor);
  const { expected_version, ...input } = discoveryInput.parse(raw);
  const userMessage = conversation.transcript.findLast(
    (message) => message.sender === "user",
  );
  if (userMessage && input.constraints.max_price !== null) {
    const span = input.budget_quote;
    const amount = span?.match(
      /^(?:USD\s*|\$\s*)?(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(USD|dollars?|cents)?$/i,
    );
    const cents = amount
      ? Math.round(
          Number(amount[1].replaceAll(",", "")) *
            (amount[2]?.toLowerCase() === "cents" ? 1 : 100),
        )
      : null;
    if (
      !span ||
      !userMessage.text.includes(span) ||
      !/USD|dollars?|cents|\$/i.test(span) ||
      cents !== input.constraints.max_price
    )
      throw new Error(
        "Quote the customer's exact stated budget phrase in budget_quote and keep max_price equal to that amount in USD cents. Do not invent or raise a budget. If no numeric USD budget was stated, ask the customer to clarify it.",
      );
  }
  const requestId = operationId();
  const saved = (await getWorkspace(actor.workspaceId)).shoppingDecisions?.find(
    (d) => d.id === requestId && d.buyerId === actor.userId,
  );
  if (saved) return shoppingDecision(actor, saved.id);
  const constraints = searchConstraints.parse({
    ...input.constraints,
    in_stock: true,
    offset: 0,
    limit: 6,
    sort: "price_asc",
  });
  const questions = [...input.unknown_requirements];
  if (constraints.max_price === null)
    questions.push("What is your maximum budget in USD?");
  if (!constraints.query.trim() && !constraints.categories.length)
    questions.push("Which product or category should I find?");
  if (constraints.match_mode === "semantic" && !constraints.categories.length)
    questions.push(
      "Which product category should I search for these requirements?",
    );
  const brief = await mutateWorkspace(actor.workspaceId, (state) => {
    state.discoveryBriefs ??= [];
    const previous = state.discoveryBriefs.find(
      (b) => b.buyerId === actor.userId,
    );
    const messageId = conversation.transcript.findLast(
      (message) => message.sender === "user",
    )?.id;
    const previousAnchor = previous?.budgetAnchor;
    const anchor =
      messageId && previousAnchor?.messageId === messageId
        ? previousAnchor
        : undefined;
    if (anchor && input.constraints.max_price !== anchor.maxPrice)
      throw new Error(
        `The customer budget is locked at ${anchor.maxPrice} USD cents for this request. Do not raise or remove it. Return the saved no-match result or ask the customer to change their budget in a new message.`,
      );
    if (
      previous?.requestId === requestId &&
      isDeepStrictEqual(previous.input, input)
    )
      return previous;
    if ((previous?.version || 0) !== expected_version)
      throw new Error(
        `Discovery requirements changed. Read get_shopping_decision and retry with expected_version=${previous?.version || 0}.`,
      );
    if (previous && isDeepStrictEqual(previous.input, input)) return previous;
    const next = {
      buyerId: actor.userId,
      requestId,
      budgetAnchor:
        messageId && input.constraints.max_price !== null
          ? { messageId, maxPrice: input.constraints.max_price }
          : anchor,
      version: (previous?.version || 0) + 1,
      input,
      updatedAt: new Date().toISOString(),
    };
    state.discoveryBriefs = state.discoveryBriefs.filter(
      (b) => b.buyerId !== actor.userId,
    );
    state.discoveryBriefs.push(next);
    audit(state, actor, "discovery.brief_saved", String(next.version));
    return next;
  });
  signal?.throwIfAborted();
  agentProgress({
    type: "discovery.progress",
    text: "Finding recorded products that meet your requirements…",
  });
  const searches = questions.length
    ? []
    : [await hybridSearch(constraints, signal)];
  const budgetLimit =
    constraints.max_price === null
      ? null
      : constraints.max_price - (constraints.max_exclusive ? 1 : 0);
  if (!questions.length && input.group_savings && budgetLimit !== null)
    searches.push(
      await hybridSearch(
        {
          ...constraints,
          min_price: Math.max(constraints.min_price || 0, budgetLimit + 1),
          max_price: null,
          limit: 24,
        },
        signal,
      ),
    );
  signal?.throwIfAborted();
  agentProgress({
    type: "discovery.progress",
    text: "Checking exact variants, prices and approved group terms…",
  });
  return mutateWorkspace(actor.workspaceId, async (state, sql) => {
    signal?.throwIfAborted();
    const existing = state.shoppingDecisions?.find(
      (d) => d.id === requestId && d.buyerId === actor.userId,
    );
    if (existing)
      return { ...existing, status: "current" as const, staleReasons: [] };
    if (
      state.discoveryBriefs?.find((b) => b.buyerId === actor.userId)
        ?.version !== brief.version
    )
      throw new Error(
        "Your requirements changed during retrieval. Find fresh matches.",
      );
    const offers: DecisionOffer[] = [];
    for (const found of searches.flatMap((s) => s.products)) {
      const product = await currentProduct(sql, found.id);
      if (
        !product ||
        product.stock < 1 ||
        product.comparisonOnly ||
        productDigest(product) !== productDigest(found)
      )
        continue;
      const terms = input.group_savings
        ? groupTerms(state.groupPolicy, product)
        : null;
      const budget = budgetLimit!;
      const conditional = product.price > budget;
      if (
        conditional &&
        (!terms ||
          terms.amount > budget ||
          terms.amount < (constraints.min_price || 0) ||
          (constraints.min_exclusive && terms.amount === constraints.min_price))
      )
        continue;
      if (offers.some((o) => o.product.id === product.id)) continue;
      offers.push({
        product,
        productDigest: productDigest(product),
        policyDigest: policyDigest(state),
        kind: conditional ? "conditional_group" : "solo",
        soloAmount: product.price,
        group: terms,
        reasons: [
          conditional
            ? "The solo offer exceeds your budget; only the conditional group amount fits."
            : "The current solo offer fits your maximum budget.",
          ...Object.entries(constraints.attributes).map(
            ([key]) =>
              `Recorded ${key}: ${String(recordedAttributes(product)[key])}`,
          ),
          ...product.specs.slice(0, 3),
        ],
        unknowns: [
          ...(product.evidence?.missing || []),
          "Suitability beyond the recorded requirements is not verified.",
        ],
        constraints,
      });
      if (offers.length === 3) break;
    }
    const decision: ShoppingDecision = {
      id: requestId,
      buyerId: actor.userId,
      version: brief.version,
      brief: input,
      createdAt: new Date().toISOString(),
      outcome: questions.length
        ? "clarification"
        : offers.length
          ? "matches"
          : "no_match",
      offers,
      questions,
      retrieval: searches.map((s) => ({
        mode: s.mode,
        total: s.total,
        degradation: s.degradation,
      })),
      inference: {
        provider: process.env.CONCIERGE_PROVIDER || "self_hosted",
        model: process.env.CONCIERGE_MODEL || process.env.AI_MODEL || null,
      },
      quoteIds: [],
      purchaseBriefVersion:
        state.briefs?.find((b) => b.buyerId === actor.userId)?.version || null,
      requestMessageId:
        conversation.transcript.findLast((message) => message.sender === "user")
          ?.id || null,
    };
    state.shoppingDecisions ??= [];
    state.shoppingDecisions.push(decision);
    audit(state, actor, "discovery.decision_saved", decision.id);
    return { ...decision, status: "current" as const, staleReasons: [] };
  });
}
export async function bindDecisionQuote(
  state: Workspace,
  actor: Actor,
  quote: StoredQuote,
  decisionId: string,
  sql: Sql,
) {
  const decision = ownedDecision(state, actor, decisionId);
  const products = [];
  for (const offer of decision.offers)
    products.push(await currentProduct(sql, offer.product.id));
  const stale = staleReasons(state, decision, products);
  const pending = await pendingRequest(sql, actor, decision);
  if (pending) stale.push(pending);
  if (stale.length) throw new Error(stale.join(" "));
  const offer = decision.offers.find((o) => o.product.id === quote.productId);
  if (!offer || (offer.kind === "conditional_group" && !quote.groupId))
    throw new Error(
      "This decision requires an eligible ready group before checkout. No discount is unlocked yet.",
    );
  const amount = quote.groupId ? offer.group?.amount : offer.soloAmount;
  if (
    amount !== quote.amount ||
    quote.amount >
      decision.brief.constraints.max_price! -
        (decision.brief.constraints.max_exclusive ? 1 : 0)
  )
    throw new Error(
      "The reviewed decision amount changed. Review fresh terms.",
    );
  quote.discovery = {
    decisionId,
    version: decision.version,
    productDigest: offer.productDigest,
    policyDigest: offer.policyDigest,
  };
  if (!decision.quoteIds.includes(quote.id)) decision.quoteIds.push(quote.id);
}
export async function assertDecisionQuote(
  state: Workspace,
  actor: Actor,
  quote: StoredQuote,
  sql: Sql,
) {
  if (!quote.discovery) return;
  const binding = { ...quote.discovery };
  await bindDecisionQuote(state, actor, quote, binding.decisionId, sql);
  if (!isDeepStrictEqual(binding, quote.discovery))
    throw new Error("The decision changed. Approve a fresh quote.");
}
