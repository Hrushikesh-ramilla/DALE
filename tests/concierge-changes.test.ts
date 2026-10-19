import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import {
  publishConciergeChange,
  waitForConciergeChange,
} from "../src/server/concierge/changes";

it("wakes an owned waiter only for a newer committed revision", async () => {
  const owner = randomUUID();
  const waiting = waitForConciergeChange(
    owner,
    5,
    new AbortController().signal,
  );
  publishConciergeChange(owner, 4);
  publishConciergeChange(owner, 6);
  expect(await waiting).toBe(true);
});
it("does not lose a commit between the database read and subscription", async () => {
  const owner = randomUUID();
  publishConciergeChange(owner, 8);
  expect(
    await waitForConciergeChange(owner, 7, new AbortController().signal, 20),
  ).toBe(true);
});
it("keeps other shoppers isolated and retains a bounded cross-worker polling fallback", async () => {
  const owner = randomUUID();
  const waiting = waitForConciergeChange(
    owner,
    0,
    new AbortController().signal,
    20,
  );
  publishConciergeChange(randomUUID(), 1);
  expect(await waiting).toBe(false);
});
it("removes an aborted waiter and rejects already-aborted subscriptions", async () => {
  const owner = randomUUID();
  const stop = new AbortController();
  const waiting = waitForConciergeChange(owner, 0, stop.signal);
  stop.abort(new Error("test disconnect"));
  await expect(waiting).rejects.toThrow("test disconnect");
  expect(() => waitForConciergeChange(owner, 0, stop.signal)).toThrow(
    "test disconnect",
  );
  publishConciergeChange(owner, 1);
});
