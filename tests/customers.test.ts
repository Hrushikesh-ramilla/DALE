import { beforeAll, expect, it } from "vitest";
import { customerSession } from "../src/server/customers";
import { actorFromToken } from "../src/server/auth";
import { getDatabase } from "../src/server/database";
import {
  joinGroup,
  makeQuote,
  checkout,
  capture,
  snapshot,
} from "../src/server/service";
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "customer-test-secret-at-least-32-characters";
});
it("independent guests discover one group and cannot read each other's orders", async () => {
  const first = await customerSession({ action: "guest" });
  const second = await customerSession({ action: "guest" });
  expect(first.actor.userId).not.toBe(second.actor.userId);
  expect(first.actor.workspaceId).toBe(second.actor.workspaceId);
  expect(await actorFromToken(first.token)).toEqual(first.actor);
  const group = await joinGroup(first.actor, "P001", "Atlas 14");
  expect(
    (await snapshot(second.actor)).groups.find((g) => g.id === group),
  ).toMatchObject({ memberCount: 1, joined: false });
  expect(await joinGroup(second.actor, "P001", "Atlas 14")).toBe(group);
  const firstView = await snapshot(first.actor);
  expect(firstView.groups.find((g) => g.id === group)).toMatchObject({
    memberCount: 2,
    status: "ready",
    joined: true,
  });
  expect(JSON.stringify(firstView.groups)).not.toContain(second.actor.userId);
  const quote = await makeQuote(first.actor, "P001", "Atlas 14", group);
  const order = await checkout(first.actor, quote.id, quote.fingerprint);
  await capture(first.actor, order.id);
  expect((await snapshot(first.actor)).orders).toHaveLength(1);
  expect((await snapshot(second.actor)).orders).toHaveLength(0);
  await expect(capture(second.actor, order.id)).rejects.toThrow();
});
it("guest conversion and a new-device login retain identity and commitments", async () => {
  const guest = await customerSession({ action: "guest" });
  const group = await joinGroup(guest.actor, "P003", "Atlas 14 Pro");
  const registered = await customerSession(
    {
      action: "register",
      name: "Shopper",
      email: "customer@example.test",
      password: "correct-passphrase-42",
    },
    guest.actor,
  );
  expect(registered.actor).toEqual(guest.actor);
  const loggedIn = await customerSession({
    action: "login",
    email: "CUSTOMER@example.test",
    password: "correct-passphrase-42",
  });
  expect(loggedIn.actor).toEqual(guest.actor);
  expect(
    (await snapshot(loggedIn.actor)).groups.find((g) => g.id === group)?.joined,
  ).toBe(true);
  const db = await getDatabase();
  const stored = await db.query<{ password_hash: string }>(
    "SELECT password_hash FROM customer_accounts WHERE id=$1",
    [guest.actor.userId],
  );
  expect(stored.rows[0].password_hash).not.toContain("correct-passphrase");
  await expect(
    customerSession({
      action: "login",
      email: "customer@example.test",
      password: "wrong",
    }),
  ).rejects.toThrow("Invalid email or password");
  await expect(
    customerSession({
      action: "login",
      email: "missing@example.test",
      password: "wrong",
    }),
  ).rejects.toThrow("Invalid email or password");
  await expect(
    customerSession({
      action: "register",
      name: "Other",
      email: "customer@example.test",
      password: "correct-passphrase-42",
    }),
  ).rejects.toThrow(/could not/);
});
