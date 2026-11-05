import { getPublishedProduct } from "@/server/catalog-store";
import { withVerifiedProductMedia } from "@/domain/product-media-presentation";
import { apiError, json } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await getPublishedProduct(id);
    return json({ product: withVerifiedProductMedia(product) });
  } catch (error) {
    return apiError(error);
  }
}
