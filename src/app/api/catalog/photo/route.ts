import { actorFromRequest } from "@/server/auth";
import { apiError, json, limitedBody, requireSameOrigin } from "@/server/http";
import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
import { discoverPhoto } from "@/server/photo-discovery";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "photo-search", 5);
    await takeDemoBudget(actor, "analysis", 50);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data"))
      throw new Error("Upload a product photo.");
    const body = await limitedBody(request, 4 * 1024 * 1024 + 65536);
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: new Uint8Array(body),
    }).formData();
    const file = form.get("image");
    if (!(file instanceof File))
      throw new Error("Choose a product photo first.");
    return json(
      await discoverPhoto(actor, {
        bytes: Buffer.from(await file.arrayBuffer()),
        mime: file.type,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
