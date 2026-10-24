import { actorFromRequest } from "@/server/auth";
import { takeRequestBudget } from "@/server/budgets";
import { apiError } from "@/server/http";
import { conciergeView } from "@/server/concierge/engine";
import { ownerKey } from "@/server/concierge/store";
import { waitForConciergeChange } from "@/server/concierge/changes";

export const dynamic = "force-dynamic";
const subscribers = new Set<string>();
/** Streams committed state, never speculative tool success or model tokens. */
export async function GET(request: Request) {
  try {
    const actor = await actorFromRequest();
    const owner = ownerKey(actor);
    await takeRequestBudget(actor, "concierge-events", 12);
    if (subscribers.has(owner) || subscribers.size >= 16)
      return new Response("State stream capacity reached", {
        status: 429,
        headers: { "Retry-After": "5" },
      });
    subscribers.add(owner);
    const stop = new AbortController();
    const signal = AbortSignal.any([request.signal, stop.signal]);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let revision = -1;
        const until = Date.now() + 55000;
        try {
          controller.enqueue(encoder.encode("retry: 3000\n\n"));
          while (!signal.aborted && Date.now() < until) {
            if (ownerKey(await actorFromRequest()) !== owner) break;
            const view = await conciergeView(actor);
            if (view.revision !== revision) {
              revision = view.revision;
              controller.enqueue(
                encoder.encode(
                  `event: state\ndata: ${JSON.stringify(view)}\n\n`,
                ),
              );
            }
            // Local commits wake immediately. The bounded poll still detects
            // other workers' changes and revalidates authentication when idle.
            await waitForConciergeChange(owner, revision, signal);
          }
        } catch {
          // The ordinary request/response path retains the actual error and recovery state.
        } finally {
          subscribers.delete(owner);
          try {
            controller.close();
          } catch {
            /* Client already disconnected. */
          }
        }
      },
      cancel() {
        stop.abort();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
