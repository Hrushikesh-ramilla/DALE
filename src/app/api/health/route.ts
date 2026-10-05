import { getDatabase } from "@/server/database";
import { randomUUID } from "node:crypto";
const instance = randomUUID();
export async function GET() {
  try {
    await (await getDatabase()).query("SELECT 1");
    return Response.json({
      status: "ready",
      service: "buyerguard",
      build: process.env.BUILD_ID || "development",
      instance,
    });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
