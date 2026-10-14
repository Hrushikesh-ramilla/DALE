import { catalogSummary } from "@/server/catalog-store";
import { apiError, json } from "@/server/http";
export async function GET() {
  try {
    return json(await catalogSummary());
  } catch (error) {
    return apiError(error);
  }
}
