import { getDatabase } from "@/server/database";
export async function GET() {
  try {
    await (await getDatabase()).query("SELECT 1");
    return Response.json({ status: "ready", service: "buyerguard" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
