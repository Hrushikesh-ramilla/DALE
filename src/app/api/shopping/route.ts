import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError, json, jsonBody, requireSameOrigin } from "@/server/http";
import { shop } from "@/server/service";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await actorFromRequest();
    const input = z
      .object({
        message: z.string().max(2000),
        model: z.string().max(80),
        category: z.string().max(40),
        budget: z.number().int().min(1).max(100000),
      })
      .parse(await jsonBody(request));
    return json(await shop(input));
  } catch (error) {
    return apiError(error);
  }
}
