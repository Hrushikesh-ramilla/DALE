import { z } from "zod";
import { actorFromRequest } from "@/server/auth";
import { apiError } from "@/server/http";
import { caseReport } from "@/server/case-report";
export async function GET(request: Request) {
  try {
    const actor = await actorFromRequest();
    const id = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get("id"));
    return Response.json(await caseReport(actor, id), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="case-${id}.json"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
