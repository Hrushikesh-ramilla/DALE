import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, limitedBody, requireSameOrigin } from "@/server/http";
import { identifyDevice } from "@/server/identification";
import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "analysis", 10);
    await takeDemoBudget(actor, "analysis", 50);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data"))
      throw new Error("Use a multipart label image.");
    const bytes = await limitedBody(request, 4 * 1024 * 1024 + 65536);
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: new Uint8Array(bytes),
    }).formData();
    const file = form.get("image");
    if (!(file instanceof File)) throw new Error("A label image is required.");
    const selected = z
      .string()
      .max(80)
      .parse(form.get("selectedModel") || "");
    return json(
      await identifyDevice(
        actor,
        { bytes: Buffer.from(await file.arrayBuffer()), mime: file.type },
        selected,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
