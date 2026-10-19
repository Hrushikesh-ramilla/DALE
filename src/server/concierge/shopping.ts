import { randomUUID } from "node:crypto";
import { z } from "zod";
import { changeConcierge, readConcierge, assertBuyer } from "./store";
import { productDetails } from "./retrieval";
import {
  getWorkspace,
  mutateWorkspace,
  ownedOrder,
  audit,
  type Actor,
} from "../state";
import {
  makeQuote,
  checkout,
  openReturn,
  joinGroup,
  leaveGroup,
  appealCase,
  updateBrief,
} from "../service";
import { chooseRemedy } from "../order-options";
import { lifestyleProfile } from "@/domain/departments";
import type { Confirmation } from "@/domain/concierge";
import { briefSchema } from "@/domain/brief";

export const basketInput = z
  .object({
    collection: z.enum(["cart", "wishlist"]),
    action: z.enum([
      "get",
      "add",
      "set",
      "remove",
      "clear",
      "select_group",
      "move",
    ]),
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(150),
            quantity: z.number().int().min(1).max(99).default(1),
            groupId: z.string().uuid().nullable().optional(),
          })
          .strict(),
      )
      .max(50)
      .default([]),
    expected_revision: z
      .number()
      .int()
      .min(0)
      .describe(
        "Optional basket revision from the latest collection result; never use a conversation/document revision or invent a value.",
      )
      .optional(),
  })
  .strict();

export async function basket(actor: Actor) {
  const state = await readConcierge(actor);
  const workspace = await getWorkspace(actor.workspaceId);
  const products = await productDetails([
    ...new Set([...state.cart.map((i) => i.productId), ...state.wishlist]),
  ]);
  return {
    revision: state.basketRevision ?? state.revision,
    cart: state.cart.map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId) || null,
      selectedGroup: item.groupId
        ? workspace.groups
            .filter(
              (g) => g.id === item.groupId && g.members.includes(actor.userId),
            )
            .map((g) => ({
              id: g.id,
              model: g.model,
              status: g.status,
              amount: g.amount ?? g.terms?.amount,
              expiresAt: g.checkoutExpiresAt || g.expiresAt,
              ready:
                g.status === "ready" &&
                Date.parse(g.checkoutExpiresAt || g.expiresAt) > Date.now(),
            }))[0] || null
        : null,
    })),
    wishlist: state.wishlist.map((id) => ({
      productId: id,
      product: products.find((p) => p.id === id) || null,
    })),
    currency: "USD",
    availableGroups: workspace.groups
      .filter(
        (g) =>
          g.members.includes(actor.userId) &&
          ["forming", "ready"].includes(g.status) &&
          Date.parse(g.checkoutExpiresAt || g.expiresAt) > Date.now(),
      )
      .map((g) => ({
        id: g.id,
        productId: g.productId,
        model: g.model,
        status: g.status,
        amount: g.amount ?? g.terms?.amount,
        expiresAt: g.checkoutExpiresAt || g.expiresAt,
      })),
    subtotal: state.cart.reduce(
      (n, i) =>
        n +
        (products.find((p) => p.id === i.productId)?.price || 0) * i.quantity,
      0,
    ),
  };
}
export async function manageBasket(actor: Actor, raw: unknown) {
  const input = basketInput.parse(raw);
  if (input.action === "get") return basket(actor);
  if (input.action === "move" && !input.items.length)
    throw new Error(
      "Specify the exact items to move from the other collection.",
    );
  if (
    input.action === "select_group" &&
    (input.collection !== "cart" || !input.items.length)
  )
    throw new Error("Select a group for an existing cart item.");
  if (
    input.action !== "select_group" &&
    input.items.some((i) => i.groupId !== undefined)
  )
    throw new Error(
      "Use select_group explicitly to change a cart item's group offer.",
    );
  const workspace =
    input.action === "select_group"
      ? await getWorkspace(actor.workspaceId)
      : undefined;
  await changeConcierge(actor, async (state, sql) => {
    if (
      (input.collection === "cart" || input.action === "move") &&
      state.confirmations.some(
        (c) => c.kind === "checkout" && c.status === "executing",
      )
    )
      throw new Error(
        "Checkout is executing. Inspect its outcome before editing the cart.",
      );
    if (
      input.expected_revision !== undefined &&
      (state.basketRevision ?? state.revision) !== input.expected_revision
    )
      throw new Error("Basket changed. Refresh before editing it.");
    if (input.action === "move") {
      const source =
        input.collection === "cart"
          ? state.wishlist
          : state.cart.map((item) => item.productId);
      if (input.items.some((item) => !source.includes(item.productId)))
        throw new Error(
          "Every moved item must exist in your source collection. Refresh before retrying.",
        );
    }
    if (input.action === "select_group") {
      for (const item of input.items) {
        const existing = state.cart.find((i) => i.productId === item.productId);
        if (!existing)
          throw new Error(
            "Add the exact product to your cart before selecting its group.",
          );
        if (item.groupId === undefined)
          throw new Error(
            "Specify a group ID or null to use the regular offer.",
          );
        if (item.groupId === null) {
          delete existing.groupId;
          continue;
        }
        const group = workspace!.groups.find(
          (g) => g.id === item.groupId && g.members.includes(actor.userId),
        );
        if (
          !group ||
          group.productId !== item.productId ||
          !["forming", "ready"].includes(group.status) ||
          Date.parse(group.checkoutExpiresAt || group.expiresAt) <= Date.now()
        )
          throw new Error(
            "An active membership for this exact product is required.",
          );
        if (existing.quantity !== 1)
          throw new Error(
            "A group offer covers one unit per shopper. Set quantity to one first.",
          );
        existing.groupId = item.groupId;
      }
    } else if (["add", "set", "move"].includes(input.action)) {
      for (const item of input.items) {
        const rows = await sql.query<{ stock: number; comparison: boolean }>(
          `SELECT (record->>'stock')::integer AS stock,coalesce((record->>'comparisonOnly')::boolean,false) AS comparison FROM catalog_products WHERE id=$1 AND publication='published' FOR SHARE`,
          [item.productId],
        );
        if (
          !rows.rows[0] ||
          (input.collection === "cart" && rows.rows[0].comparison)
        )
          throw new Error("Product is unavailable for purchase.");
        const existing = state.cart.find((i) => i.productId === item.productId);
        const quantity =
          input.action === "add" || input.action === "move"
            ? (existing?.quantity || 0) + item.quantity
            : item.quantity;
        if (
          input.collection === "cart" &&
          (quantity > 99 || quantity > rows.rows[0].stock)
        )
          throw new Error("Requested quantity exceeds current catalog stock.");
        if (input.collection === "cart" && existing?.groupId && quantity !== 1)
          throw new Error(
            "A group offer covers one unit per shopper. Clear the group selection before changing quantity.",
          );
        if (input.collection === "wishlist") {
          if (!state.wishlist.includes(item.productId))
            state.wishlist.push(item.productId);
        } else if (existing) existing.quantity = quantity;
        else state.cart.push({ productId: item.productId, quantity });
      }
      if (input.action === "move") {
        const moved = new Set(input.items.map((item) => item.productId));
        if (input.collection === "cart")
          state.wishlist = state.wishlist.filter((id) => !moved.has(id));
        else
          state.cart = state.cart.filter((item) => !moved.has(item.productId));
      }
    } else if (input.collection === "cart")
      state.cart =
        input.action === "clear"
          ? []
          : state.cart.filter(
              (i) => !input.items.some((x) => x.productId === i.productId),
            );
    else
      state.wishlist =
        input.action === "clear"
          ? []
          : state.wishlist.filter(
              (id) => !input.items.some((x) => x.productId === id),
            );
    if (state.cart.length > 100 || state.wishlist.length > 100)
      throw new Error("Collection limit reached.");
    // Any edit invalidates prepared checkout, including price-equivalent substitutions.
    if (input.collection === "cart" || input.action === "move") {
      state.cartVersion = (state.cartVersion || 0) + 1;
      for (const p of state.confirmations)
        if (p.kind === "checkout" && p.status === "pending")
          p.expiresAt = new Date(0).toISOString();
    }
  });
  return basket(actor);
}

export async function prepareConfirmation(
  actor: Actor,
  kind: Confirmation["kind"],
  payload: Record<string, unknown>,
  summary: string,
) {
  const confirmation: Confirmation = {
    id: randomUUID(),
    kind,
    payload,
    summary,
    expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    status: "pending",
  };
  await changeConcierge(actor, (s) => {
    if (
      s.confirmations.filter(
        (c) => c.status === "pending" || c.status === "executing",
      ).length >= 20
    )
      throw new Error(
        "Resolve or cancel existing confirmations before preparing more.",
      );
    s.confirmations.push(confirmation);
  });
  return {
    confirmation_id: confirmation.id,
    status: "requires_customer_confirmation",
    summary,
    expiresAt: confirmation.expiresAt,
  };
}
export async function prepareCheckout(actor: Actor, requestedModel?: string) {
  const workspace = await getWorkspace(actor.workspaceId);
  const brief = workspace.briefs?.find((b) => b.buyerId === actor.userId);
  const model = requestedModel || brief?.input.model || lifestyleProfile;
  const state = await readConcierge(actor);
  if (!state.cart.length) throw new Error("Your cart is empty.");
  const existing = state.confirmations.find(
    (c) =>
      c.kind === "checkout" &&
      c.payload.model === model &&
      c.payload.cartVersion === (state.cartVersion || 0) &&
      (c.status === "executing" ||
        (c.status === "pending" && Date.parse(c.expiresAt) > Date.now())),
  );
  if (existing)
    return {
      confirmation_id: existing.id,
      status:
        existing.status === "executing"
          ? "executing"
          : "requires_customer_confirmation",
      summary: existing.summary,
      expiresAt: existing.expiresAt,
    };
  // Existing gateway contracts are individual-item offers. Preserve those contracts
  // and disclose individual approvals rather than pretending to have a bundled charge.
  if (state.cart.reduce((n, i) => n + i.quantity, 0) > 50)
    throw new Error(
      "A checkout can prepare at most 50 individual unit approvals. Split this cart into smaller purchases.",
    );
  const quotes: (Awaited<ReturnType<typeof makeQuote>> & {
    catalogPrice: number;
  })[] = [];
  for (const item of state.cart) {
    const group = item.groupId
      ? workspace.groups.find(
          (g) => g.id === item.groupId && g.members.includes(actor.userId),
        )
      : undefined;
    const itemModel = group?.model || model;
    if (group && (requestedModel || brief) && itemModel !== model)
      throw new Error(
        "Selected group differs from your confirmed device requirements. Review the requirements first.",
      );
    if (item.groupId && item.quantity !== 1)
      throw new Error("A group offer covers one unit per shopper.");
    const product = (await productDetails([item.productId]))[0];
    if (!product) throw new Error("Product is no longer published.");
    for (let unit = 0; unit < item.quantity; unit++)
      quotes.push({
        ...(await makeQuote(actor, item.productId, itemModel, item.groupId)),
        catalogPrice: product.price,
      });
  }
  return changeConcierge(actor, (current) => {
    const sibling = current.confirmations.find(
      (c) =>
        c.kind === "checkout" &&
        c.payload.model === model &&
        c.payload.cartVersion === (current.cartVersion || 0) &&
        (c.status === "executing" ||
          (c.status === "pending" && Date.parse(c.expiresAt) > Date.now())),
    );
    if (sibling)
      return {
        confirmation_id: sibling.id,
        status: sibling.status,
        summary: sibling.summary,
        expiresAt: sibling.expiresAt,
      };
    if (
      (current.cartVersion || 0) !== (state.cartVersion || 0) ||
      JSON.stringify(current.cart) !== JSON.stringify(state.cart)
    )
      throw new Error(
        "Cart changed while preparing checkout. Review fresh terms.",
      );
    const c: Confirmation = {
      id: randomUUID(),
      kind: "checkout",
      payload: {
        quotes,
        cart: state.cart,
        cartVersion: state.cartVersion || 0,
        model,
      },
      summary: `Review ${quotes.length} individual sandbox offers totaling ${quotes.reduce((s, q) => s + q.amount, 0)} USD cents. ${quotes.filter((q) => q.groupId).length} selected group offers are included at their locked amounts. Each item creates a separate PayPal approval. Shipping follows the recorded simulated merchant policy; no live carrier promise is made.`,
      expiresAt: new Date(
        Math.min(
          Date.now() + 5 * 60000,
          ...quotes.map((q) => Date.parse(q.expiresAt)),
        ),
      ).toISOString(),
      status: "pending",
    };
    current.confirmations.push(c);
    return {
      confirmation_id: c.id,
      status: "requires_customer_confirmation",
      summary: c.summary,
      expiresAt: c.expiresAt,
    };
  });
}
export async function confirmOperation(
  actor: Actor,
  id: string,
  cancel = false,
) {
  assertBuyer(actor);
  const pending = await changeConcierge(actor, (state) => {
    const c = state.confirmations.find((p) => p.id === id);
    if (!c) throw new Error("Confirmation not found.");
    if (c.status === "completed") return { previous: c.result };
    const recovering =
      c.status === "executing" &&
      c.executionLeaseUntil !== undefined &&
      c.executionLeaseUntil < Date.now();
    if (c.status !== "executing" && Date.parse(c.expiresAt) <= Date.now())
      throw new Error("Confirmation expired. Prepare fresh terms.");
    if (c.status !== "pending" && !recovering)
      throw new Error(
        "This confirmation has already been attempted. Inspect its recorded outcome before retrying.",
      );
    if (cancel && c.status === "executing")
      throw new Error(
        "Execution already began. Inspect its orders before canceling.",
      );
    if (cancel) {
      c.status = "failed";
      c.result = { canceled: true };
      return { previous: c.result };
    }
    if (!recovering && Date.parse(c.expiresAt) <= Date.now())
      throw new Error("Confirmation expired. Prepare fresh terms.");
    if (
      c.kind === "checkout" &&
      ((state.cartVersion || 0) !== c.payload.cartVersion ||
        JSON.stringify(state.cart) !== JSON.stringify(c.payload.cart))
    )
      throw new Error("Cart changed. Prepare fresh checkout terms.");
    if (c.kind === "checkout") {
      if (
        state.confirmations.some(
          (other) =>
            other.id !== c.id &&
            other.kind === "checkout" &&
            other.payload.cartVersion === c.payload.cartVersion &&
            ["executing", "completed"].includes(other.status),
        )
      )
        throw new Error(
          "This cart already has an approved checkout. Inspect its orders.",
        );
      for (const other of state.confirmations)
        if (
          other.id !== c.id &&
          other.kind === "checkout" &&
          other.status === "pending"
        )
          other.expiresAt = new Date(0).toISOString();
    }
    c.status = "executing";
    c.executionLeaseUntil = Date.now() + 180000;
    c.attemptId = randomUUID();
    return { confirmation: structuredClone(c) };
  });
  if (!pending.confirmation) return pending.previous;
  const c = pending.confirmation;
  try {
    let result: unknown;
    if (c.kind === "checkout") {
      const quotes = z
        .array(
          z.object({
            id: z.string().uuid(),
            productId: z.string(),
            amount: z.number(),
            catalogPrice: z.number().optional(),
            groupId: z.string().uuid().optional(),
            model: z.string().optional(),
            fingerprint: z.string().length(64),
          }),
        )
        .min(1)
        .max(50)
        .parse(c.payload.quotes);
      const outcomes: {
        quoteId: string;
        order?: Awaited<ReturnType<typeof checkout>>;
        error?: string;
      }[] = [];
      for (const q of quotes) {
        try {
          const recorded = (await getWorkspace(actor.workspaceId)).orders.find(
            (o) => o.buyerId === actor.userId && o.quote.id === q.id,
          );
          if (recorded) {
            outcomes.push({ quoteId: q.id, order: recorded });
            continue;
          }
          const fresh = (await productDetails([q.productId]))[0];
          if (
            !fresh ||
            fresh.comparisonOnly ||
            fresh.price !== (q.catalogPrice ?? q.amount)
          )
            throw new Error(
              "Offer price or visibility changed. Prepare fresh checkout terms.",
            );
          if (q.groupId) {
            const group = (await getWorkspace(actor.workspaceId)).groups.find(
              (g) =>
                g.id === q.groupId &&
                g.members.includes(actor.userId) &&
                g.productId === q.productId &&
                g.model === q.model,
            );
            if (
              !group ||
              group.status !== "ready" ||
              group.amount !== q.amount ||
              !group.checkoutExpiresAt ||
              Date.parse(group.checkoutExpiresAt) <= Date.now()
            )
              throw new Error(
                "Selected group offer is no longer available. No regular-price fallback was applied.",
              );
          }
          outcomes.push({
            quoteId: q.id,
            order: await checkout(actor, q.id, q.fingerprint),
          });
        } catch (e) {
          const recorded = (await getWorkspace(actor.workspaceId)).orders.find(
            (o) => o.buyerId === actor.userId && o.quote.id === q.id,
          );
          outcomes.push({
            quoteId: q.id,
            ...(recorded ? { order: recorded } : {}),
            error: e instanceof Error ? e.message : "Checkout failed",
          });
          break;
        }
        await changeConcierge(actor, (s) => {
          const p = s.confirmations.find((p) => p.id === id)!;
          if (p.attemptId !== c.attemptId)
            throw new Error("Checkout lease was superseded.");
          p.result = {
            outcomes: structuredClone(outcomes),
            status: "executing",
          };
          p.executionLeaseUntil = Date.now() + 180000;
        });
      }
      result = {
        outcomes,
        status:
          outcomes.length === quotes.length &&
          outcomes.every((o) => !o.error && o.order?.providerOrderId)
            ? "payment_approval_required"
            : "partial_or_failed",
        captured: false,
      };
    } else if (c.kind === "update_requirements") {
      const p = z
        .object({
          brief: briefSchema,
          expectedVersion: z.number().int().min(0),
        })
        .parse(c.payload);
      result = await updateBrief(
        actor,
        { ...p.brief, confirmConstraints: true },
        p.expectedVersion,
        c.id,
      );
    } else if (c.kind === "return") {
      const p = z
        .object({
          orderId: z.string().uuid(),
          reason: z.enum([
            "damaged",
            "wrong_item",
            "not_delivered",
            "canceled",
          ]),
          request: z.enum(["refund", "replacement"]),
        })
        .parse(c.payload);
      result = await openReturn(actor, p.orderId, p.reason, p.request);
    } else if (c.kind === "cancel") {
      const p = z.object({ orderId: z.string().uuid() }).parse(c.payload);
      result = await mutateWorkspace(actor.workspaceId, (state) => {
        const order = ownedOrder(state, actor, p.orderId);
        if (order.status === "canceled") return order;
        if (
          order.status !== "checkout_pending" ||
          order.captureId ||
          state.operations.some(
            (op) => op.orderId === order.id && op.kind === "capture",
          )
        )
          throw new Error(
            "This order cannot be canceled before payment safely. Use customer support.",
          );
        order.status = "canceled";
        order.quote.invalidatedAt = new Date().toISOString();
        const quote = state.quotes.find((q) => q.id === order.quote.id);
        if (quote) quote.invalidatedAt = order.quote.invalidatedAt;
        audit(state, actor, "customer.canceled", order.id);
        return order;
      });
    } else if (c.kind === "group_join") {
      const p = z
        .object({
          productId: z.string(),
          model: z.string(),
          policyVersion: z.number().int(),
        })
        .parse(c.payload);
      result = await joinGroup(
        actor,
        p.productId,
        p.model,
        undefined,
        p.policyVersion,
      );
    } else if (c.kind === "group_leave")
      result = await leaveGroup(
        actor,
        z.string().uuid().parse(c.payload.groupId),
      );
    else if (c.kind === "remedy")
      result = await chooseRemedy(
        actor,
        z.string().uuid().parse(c.payload.caseId),
        z.enum(["refund", "replacement"]).parse(c.payload.request),
      );
    else
      result = await appealCase(
        actor,
        z.string().uuid().parse(c.payload.caseId),
        z.string().min(1).max(2000).parse(c.payload.note),
      );
    await changeConcierge(actor, (s) => {
      const p = s.confirmations.find((p) => p.id === id)!;
      if (p.attemptId !== c.attemptId)
        throw new Error("Confirmation execution lease was superseded.");
      p.status = "completed";
      p.result = result;
      if (c.kind === "update_requirements")
        for (const other of s.confirmations)
          if (other.kind === "checkout" && other.status === "pending")
            other.expiresAt = new Date(0).toISOString();
      if (c.kind === "checkout") {
        const completed = z
          .object({
            outcomes: z.array(
              z.object({
                order: z
                  .object({ quote: z.object({ productId: z.string() }) })
                  .optional(),
              }),
            ),
          })
          .parse(result);
        for (const entry of completed.outcomes)
          if (entry.order) {
            const item = s.cart.find(
              (i) => i.productId === entry.order!.quote.productId,
            );
            if (item) item.quantity--;
          }
        s.cart = s.cart.filter((i) => i.quantity > 0);
        s.cartVersion = (s.cartVersion || 0) + 1;
      }
    });
    return result;
  } catch (e) {
    await changeConcierge(actor, (s) => {
      const p = s.confirmations.find((p) => p.id === id)!;
      if (p.attemptId !== c.attemptId) return;
      p.status = "failed";
      p.result = {
        error:
          e instanceof Error
            ? e.message
            : "Operation failed; check status before retrying",
      };
    });
    throw e;
  }
}

export async function customerOrders(actor: Actor, id?: string) {
  const workspace = await getWorkspace(actor.workspaceId);
  const own = workspace.orders.filter((o) => o.buyerId === actor.userId);
  if (id && !own.some((o) => o.id === id)) throw new Error("Order not found.");
  return {
    orders: own
      .filter((o) => !id || o.id === id)
      .map((o) => ({
        id: o.id,
        status: o.status,
        productId: o.quote.productId,
        amount: o.quote.amount,
        currency: o.quote.currency,
        createdAt: o.createdAt,
        deliveryEstimate: o.quote.deliveryBy,
        deliveryEstimateKind: "simulated merchant estimate",
        events: o.events,
        refund: o.refund,
        returnId: o.returnId,
        fulfillmentIssue: o.fulfillmentIssue,
      })),
    cases: workspace.cases
      .filter((c) => c.buyerId === actor.userId && (!id || c.orderId === id))
      .map((c) => ({
        id: c.id,
        orderId: c.orderId,
        status: c.status,
        request: c.request,
        reason: c.reason,
        deadlineAt: c.deadlineAt,
        returnShipment: c.returnShipment,
        eligibility: c.eligibility,
      })),
    shipping: "simulated; no real carrier tracking or ETA integration",
  };
}
