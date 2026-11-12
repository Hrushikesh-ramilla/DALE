import type { CircleResponse, CircleOffer, CircleView } from "@/domain/circles";
import { circleCommand } from "@/domain/circles";
import { groupTerms } from "@/domain/group-policy";
import { lifestyleProfile } from "@/domain/departments";
import { productFits } from "@/domain/catalog";
import { getStoredProduct } from "./catalog-store";
import { getWorkspace, type Actor, type Workspace } from "./state";
import { storeWorkspace } from "./customers";
import { productDigest } from "./concierge/decisions";
import {
  activeStock,
  currentGroupProduct,
  assertMemberRequirements,
} from "./group-lifecycle";
import { joinGroup, leaveGroup } from "./service";

function review(
  state: Workspace,
  actor: Actor | undefined,
  digest: string,
  policyVersion: number,
) {
  return {
    productDigest: digest,
    policyVersion,
    briefVersion: actor
      ? state.briefs?.find((b) => b.buyerId === actor.userId)?.version || null
      : null,
    discoveryVersion: actor
      ? state.discoveryBriefs?.find((b) => b.buyerId === actor.userId)
          ?.version || null
      : null,
  };
}
/** Public storefront scope is fixed by the server, never supplied by an invitation. */
export async function readCircles(
  input: { circleId?: string; productId?: string; model?: string },
  actor?: Actor,
): Promise<CircleResponse> {
  const workspaceId = await storeWorkspace();
  const state = await getWorkspace(workspaceId);
  if (state.archivedAt) throw new Error("Circle not found.");
  const owner =
    actor?.workspaceId === workspaceId && actor.role === "buyer"
      ? actor
      : undefined;
  const groups = state.groups.filter((g) =>
    input.circleId
      ? g.id === input.circleId
      : !input.productId || g.productId === input.productId,
  );
  if (input.circleId && !groups.length) throw new Error("Circle not found.");
  const circles: CircleView[] = [];
  for (const group of groups.slice(-100).reverse()) {
    const product = await currentGroupProduct(group.productId).catch(() =>
      getStoredProduct(group.productId),
    );
    const purchasable = await getStoredProduct(group.productId, undefined, true)
      .then((p) => !p.comparisonOnly)
      .catch(() => false);
    const terms = group.terms || groupTerms(undefined, product);
    const expired =
      group.status === "expired" ||
      Date.parse(group.checkoutExpiresAt || group.expiresAt) <= Date.now();
    const changed =
      group.status === "forming" &&
      !!group.productDigest &&
      group.productDigest !== productDigest(product);
    const memberChanged = (member: string) => {
      try {
        assertMemberRequirements(state, group, member);
        return false;
      } catch {
        return true;
      }
    };
    const unavailable =
      !purchasable ||
      changed ||
      (group.status === "forming" && group.members.some(memberChanged)) ||
      (group.status === "forming" &&
        activeStock(state, product.id) + terms.minimumMembers > product.stock);
    const status = expired
      ? "expired"
      : unavailable
        ? "unavailable"
        : group.status;
    const joined = !!owner && group.members.includes(owner.userId);
    const order =
      owner &&
      state.orders.find(
        (o) =>
          o.buyerId === owner.userId &&
          o.quote.groupId === group.id &&
          o.status !== "canceled",
      );
    const paymentStarted =
      !!order &&
      (!!order.captureId ||
        state.operations.some(
          (op) =>
            op.orderId === order.id &&
            op.kind === "capture" &&
            op.state !== "failed",
        ));
    circles.push({
      id: group.id,
      product,
      model: group.model,
      terms,
      review: review(state, owner, productDigest(product), terms.policyVersion),
      status,
      memberCount: group.members.length,
      qualifiedMemberCount:
        group.qualifiedMemberCount ||
        (group.status === "ready" ? terms.minimumMembers : 0),
      expiresAt: group.expiresAt,
      checkoutExpiresAt: group.checkoutExpiresAt,
      joined,
      canJoin: status === "forming" && !joined,
      canReview:
        status === "ready" && joined && !order && !memberChanged(owner!.userId),
      canLeave: joined && !paymentStarted && status !== "expired",
      message: expired
        ? "This circle deadline passed. No new commitments or payments are accepted."
        : joined && memberChanged(owner!.userId)
          ? "Your saved requirements changed. Leave this commitment and review a fresh offer before checkout."
          : unavailable
            ? "The exact offer, stock or an existing commitment needs fresh review. Leave and review current terms."
            : status === "ready"
              ? "The qualifying threshold was met and one unit per shopper was reserved. Each shopper approves payment separately; remaining locked prices survive another shopper declining."
              : "Commit explicitly to this exact offer. No order or payment is created by joining.",
    });
  }
  let offer: CircleOffer | null = null;
  if (input.productId) {
    const product = await currentGroupProduct(input.productId);
    if (product.comparisonOnly || product.stock < 1)
      throw new Error("This exact offer is unavailable for a circle.");
    const model = input.model || lifestyleProfile;
    if (!productFits(product, model))
      throw new Error(
        "Choose the confirmed compatible model for this group offer.",
      );
    const terms = groupTerms(state.groupPolicy, product);
    offer = {
      product,
      model,
      terms,
      review: review(state, owner, productDigest(product), terms.policyVersion),
    };
  }
  return { circles, offer };
}
export async function commitCircle(actor: Actor, raw: unknown) {
  if (actor.role !== "buyer" || actor.workspaceId !== (await storeWorkspace()))
    throw new Error(
      "Only a customer of this storefront can commit to a circle.",
    );
  const input = circleCommand.parse(raw);
  if (input.action === "leave") return leaveGroup(actor, input.circleId);
  return joinGroup(
    actor,
    input.productId,
    input.model,
    undefined,
    input.policyVersion,
    {
      circleId: input.circleId,
      productDigest: input.productDigest,
      briefVersion: input.briefVersion,
      discoveryVersion: input.discoveryVersion,
    },
  );
}
