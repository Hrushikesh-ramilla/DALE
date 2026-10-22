import { hybridSearch } from "@/server/concierge/retrieval";
import { apiError, json } from "@/server/http";
import { takeRequestBudget } from "@/server/budgets";
let active = 0;
export async function GET(request: Request) {
  if (active >= 2)
    return Response.json(
      { error: "Catalog search is busy. Please retry." },
      { status: 503, headers: { "Retry-After": "2" } },
    );
  active++;
  try {
    await takeRequestBudget(
      { workspaceId: "catalog-public", userId: "global", role: "buyer" },
      "hybrid-search",
      90,
    );
    const url = new URL(request.url);
    const raw = JSON.parse(url.searchParams.get("filters") || "{}");
    return json(await hybridSearch(raw, request.signal));
  } catch (e) {
    return apiError(e);
  } finally {
    active--;
  }
}
