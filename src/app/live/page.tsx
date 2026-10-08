import { LiveLauncher } from "@/components/live-launcher";
import { liveStatus } from "@/server/live-status";
export const dynamic = "force-dynamic";
export const metadata = { title: "DALE | Live Gemini and PayPal testing" };
export default function Page() {
  return <LiveLauncher status={liveStatus()} />;
}
