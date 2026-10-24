import { EventEmitter } from "node:events";

// Shared across route bundles in this process. Only revision signals are sent;
// every subscriber still reloads its authenticated, owned database view.
type Hub = { events: EventEmitter; revisions: Map<string, number> };
const host = globalThis as typeof globalThis & { __daleConciergeChanges?: Hub };
const hub = (host.__daleConciergeChanges ??= {
  events: new EventEmitter(),
  revisions: new Map<string, number>(),
});

export function publishConciergeChange(owner: string, revision: number) {
  const latest = Math.max(hub.revisions.get(owner) ?? -1, revision);
  hub.revisions.delete(owner);
  hub.revisions.set(owner, latest);
  if (hub.revisions.size > 1024)
    hub.revisions.delete(hub.revisions.keys().next().value!);
  hub.events.emit(owner, latest);
}

export function waitForConciergeChange(
  owner: string,
  revision: number,
  signal: AbortSignal,
  maxWaitMs = 2000,
): Promise<boolean> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      hub.events.off(owner, changed);
      signal.removeEventListener("abort", aborted);
    };
    const changed = (next: number) => {
      if (next <= revision) return;
      cleanup();
      resolve(true);
    };
    const aborted = () => {
      cleanup();
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, maxWaitMs);
    hub.events.on(owner, changed);
    signal.addEventListener("abort", aborted, { once: true });
    // Covers a commit between reading the view and registering this waiter.
    changed(hub.revisions.get(owner) ?? -1);
    if (signal.aborted) aborted();
  });
}
