import { takeRequestBudget } from "@/server/budgets";
import { takeDemoBudget } from "@/server/demo";
import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, limitedBody, requireSameOrigin } from "@/server/http";
import {
  addDispatchEvidence,
  addEvidence,
  evidenceBytes,
} from "@/server/service";
const inputSchema = z.object({
  caseId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  checkpoint: z.enum([
    "seller_dispatch",
    "buyer_receipt",
    "buyer_return",
    "seller_return",
  ]),
  serial: z.string().max(100),
  note: z.string().min(1).max(2000),
  captureSessionId: z.string().uuid().optional(),
});
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await actorFromRequest();
    await takeRequestBudget(actor, "uploads", 20);
    await takeDemoBudget(actor, "uploads", 8);
    const contentType = request.headers.get("content-type") || "";
    let fields: Record<string, unknown>;
    let file: { bytes: Buffer; mime: string };
    if (contentType.startsWith("multipart/form-data")) {
      const bytes = await limitedBody(request, 4 * 1024 * 1024 + 65536);
      const form = await new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: new Uint8Array(bytes),
      }).formData();
      fields = Object.fromEntries(form);
      const image = form.get("image");
      if (!(image instanceof File))
        throw new Error("An image file is required.");
      file = {
        bytes: Buffer.from(await image.arrayBuffer()),
        mime: image.type,
      };
    } else {
      // Compatibility for the original engineering client. New UI submissions keep notes out of URLs.
      fields = Object.fromEntries(new URL(request.url).searchParams);
      file = {
        bytes: await limitedBody(request, 4 * 1024 * 1024),
        mime: contentType,
      };
    }
    const input = inputSchema.parse(fields);
    if (Boolean(input.orderId) === Boolean(input.caseId))
      throw new Error("Exactly one case or order is required.");
    const result = input.orderId
      ? await addDispatchEvidence(actor, input.orderId, input, file)
      : input.caseId
        ? await addEvidence(actor, input.caseId, input, file)
        : (() => {
            throw new Error("A case or order is required.");
          })();
    return json({ result });
  } catch (error) {
    return apiError(error);
  }
}
export async function GET(request: Request) {
  try {
    const actor = await actorFromRequest();
    const id = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get("id"));
    const { bytes, mime } = await evidenceBytes(actor, id);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
