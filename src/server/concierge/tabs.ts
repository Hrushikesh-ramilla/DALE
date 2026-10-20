import { uiContext } from "@/domain/concierge";
import { registeredPath } from "@/domain/site-routes";
import type { Actor } from "../state";
import { changeConcierge, readConcierge } from "./store";

export async function registerTab(actor: Actor, raw: unknown) {
  const context = uiContext.parse(raw);
  if (!context.tab_id || !registeredPath(context.current_url))
    throw new Error("Invalid DALE tab registration.");
  if (context.current_url.startsWith("/product/")) {
    const id = new URL(
      context.current_url,
      "https://dale.invalid",
    ).pathname.slice(9);
    if (context.currently_viewed_product_id !== decodeURIComponent(id))
      throw new Error("Product page is not ready.");
  }
  await changeConcierge(actor, (s) => {
    s.tabs ||= {};
    const prior = s.tabs[context.tab_id!];
    const action = s.actions.find(
      (a) =>
        a.turnId === s.turn?.id &&
        a.targets?.some(
          (t) => t.tabId === context.tab_id && t.path === context.current_url,
        ),
    );
    s.tabs[context.tab_id!] = {
      context,
      seenAt: Date.now(),
      createdByAction: prior?.createdByAction || action?.id,
    };
    for (const [id, tab] of Object.entries(s.tabs))
      if (Date.now() - tab.seenAt > 120000) delete s.tabs[id];
  });
  return { ok: true };
}
export async function tabState(actor: Actor) {
  const s = await readConcierge(actor);
  return Object.entries(s.tabs || {})
    .filter(([, t]) => Date.now() - t.seenAt < 45000)
    .map(([id, tab]) => ({ id, ...tab }));
}
