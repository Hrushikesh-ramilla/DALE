import { productById, searchCatalog } from "@/domain/catalog";
import { realModels, researchProducts } from "@/domain/research";
import type { AgentGroupOffer } from "@/domain/agent-workflow";
import { getWorkspace, type Actor, type Workspace } from "./state";
import { joinGroup } from "./service";
import { groupTerms } from "@/domain/group-policy";

function offers(state: Workspace, actor: Actor): AgentGroupOffer[] {
  if (actor.role !== "buyer" || state.archivedAt) return [];
  const brief = state.briefs?.find((item) => item.buyerId === actor.userId);
  if (!brief || brief.clarificationRequired) return [];
  const input = brief.input;
  const products = realModels.includes(input.model)
    ? researchProducts({
        model: input.model,
        budget: 100000,
        cable: input.realRequirements?.cable || "unknown",
        fastCharging: input.realRequirements?.fastCharging || false,
      })
        .findings.filter((f) => f.eligible)
        .map((f) => productById(f.productId))
    : searchCatalog({ ...input, budget: 100000 });
  return products
    .flatMap((product): AgentGroupOffer[] => {
      const existing = state.groups.filter(
        (g) =>
          g.productId === product.id &&
          g.model === input.model &&
          g.status !== "expired" &&
          Date.parse(g.checkoutExpiresAt || g.expiresAt) > Date.now() &&
          !state.orders.some(
            (o) =>
              o.buyerId === actor.userId &&
              o.quote.groupId === g.id &&
              o.status !== "canceled",
          ) &&
          (g.status === "forming" || g.members.includes(actor.userId)),
      );
      return (existing.length ? existing : [undefined]).map(
        (group): AgentGroupOffer => {
          const terms =
            group?.terms ||
            groupTerms(group ? undefined : state.groupPolicy, product);
          const amount =
            group?.status === "ready" ? group.amount! : terms.amount;
          const eligible =
            amount <= input.budget && terms.minimumMembers <= product.stock;
          return {
            productId: product.id,
            model: input.model,
            briefVersion: brief.version,
            policyVersion: terms.policyVersion,
            minimumMembers: terms.minimumMembers,
            discountPercent: terms.discountPercent,
            checkoutMinutes: terms.checkoutMinutes,
            groupId: group?.id,
            memberCount: group?.members.length || 0,
            joined: !!group?.members.includes(actor.userId),
            status:
              group?.status === "ready"
                ? "ready"
                : group
                  ? "forming"
                  : "available",
            baseAmount: terms.baseAmount,
            groupAmount: amount,
            saving: terms.baseAmount - amount,
            deadline: group?.checkoutExpiresAt || group?.expiresAt,
            eligible,
            nextStep:
              terms.minimumMembers > product.stock
                ? "Available stock cannot support the approved shopper threshold."
                : !eligible
                  ? "The complete discounted offer exceeds your budget."
                  : group?.status === "ready"
                    ? "Review your locked quote; payment still needs separate approval."
                    : `${terms.minimumMembers} shoppers are required. Commit explicitly without payment; the ${terms.discountPercent}% discount is conditional until stock is reserved. Checkout lasts ${terms.checkoutMinutes} minutes after finalization.`,
          };
        },
      );
    })
    .sort(
      (a, b) =>
        a.groupAmount - b.groupAmount || a.productId.localeCompare(b.productId),
    )
    .slice(0, 6);
}
export async function discoverAgentGroups(actor: Actor) {
  return offers(await getWorkspace(actor.workspaceId), actor);
}
export async function commitAgentGroup(
  actor: Actor,
  productId: string,
  briefVersion: number,
  policyVersion?: number,
) {
  if (actor.role !== "buyer")
    throw new Error("Only the shopper can commit to a group.");
  const candidate = offers(await getWorkspace(actor.workspaceId), actor).find(
    (offer) => offer.productId === productId && offer.eligible,
  );
  if (
    !candidate ||
    candidate.briefVersion !== briefVersion ||
    (policyVersion !== undefined && candidate.policyVersion !== policyVersion)
  )
    throw new Error(
      "Your brief or group eligibility changed. Ask DALE to refresh the offers.",
    );
  return joinGroup(
    actor,
    productId,
    candidate.model,
    briefVersion,
    candidate.policyVersion,
  );
}
