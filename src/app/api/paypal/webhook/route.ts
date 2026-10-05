import { z } from "zod";
import { apiError, json, jsonBody } from "@/server/http";
import { acceptWebhook } from "@/server/recovery";
export const runtime = "nodejs";
const schema = z.object({ id: z.string().min(1).max(200), event_type: z.string().max(200), resource: z.record(z.string(), z.unknown()) }).passthrough();
export async function POST(request: Request) {
  try { return json(await acceptWebhook(request.headers, schema.parse(await jsonBody(request)))); }
  catch (error) { return apiError(error); }
}
