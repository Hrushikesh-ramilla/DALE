import { takeRequestBudget } from "../budgets";
/** Shared counter includes retries and internal summaries. This application cap
 * does not claim to describe the provider's actual project quota. */
export async function admitProviderAttempt() {
  if (process.env.CONCIERGE_PROVIDER !== "gemini") return;
  const configured = Number(process.env.CONCIERGE_GENERATIONS_PER_MINUTE || 10);
  const limit =
    Number.isInteger(configured) && configured > 0 && configured <= 60
      ? configured
      : 10;
  await takeRequestBudget(
    { workspaceId: "concierge-provider", userId: "project", role: "buyer" },
    `generation:${process.env.CONCIERGE_MODEL || process.env.AI_MODEL}`,
    limit,
  );
}
