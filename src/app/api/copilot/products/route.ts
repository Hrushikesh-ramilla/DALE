import { z } from "zod";
import { productDetails } from "@/server/concierge/retrieval";
import { apiError, json } from "@/server/http";
export async function GET(request: Request) {
  try {
    const ids = z
      .array(z.string().min(1).max(150))
      .min(1)
      .max(12)
      .parse((new URL(request.url).searchParams.get("ids") || "").split(","));
    const products = await productDetails(ids);
    return json({
      products,
      missing_ids: ids.filter((id) => !products.some((p) => p.id === id)),
    });
  } catch (e) {
    return apiError(e);
  }
}
