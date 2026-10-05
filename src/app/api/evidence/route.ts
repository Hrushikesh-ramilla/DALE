import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, limitedBody, requireSameOrigin } from "@/server/http";
import { addDispatchEvidence, addEvidence, evidenceBytes } from "@/server/service";
const inputSchema = z.object({ caseId: z.string().uuid().optional(), orderId: z.string().uuid().optional(), checkpoint: z.enum(["seller_dispatch", "buyer_receipt", "buyer_return", "seller_return"]), serial: z.string().max(100), note: z.string().min(1).max(2000) });
export async function POST(request: Request) {
  try { requireSameOrigin(request); const actor = await actorFromRequest(); const input = inputSchema.parse(Object.fromEntries(new URL(request.url).searchParams)); const file = { bytes: await limitedBody(request, 4 * 1024 * 1024), mime: request.headers.get("content-type") || "" }; const result = input.orderId ? await addDispatchEvidence(actor, input.orderId, input, file) : input.caseId ? await addEvidence(actor, input.caseId, input, file) : (() => { throw new Error("A case or order is required."); })(); return json({ result }); } catch (error) { return apiError(error); }
}
export async function GET(request: Request) {
  try { const actor = await actorFromRequest(); const id = z.string().uuid().parse(new URL(request.url).searchParams.get("id")); const { bytes, mime } = await evidenceBytes(actor, id); return new Response(new Uint8Array(bytes), { headers: { "Content-Type": mime, "Cache-Control": "private, no-store", "Content-Disposition": "inline" } }); } catch (error) { return apiError(error); }
}
