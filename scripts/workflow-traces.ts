import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import {
  makeQuote,
  checkout,
  capture,
  openReturn,
  addEvidence,
  resolveCase,
  appealCase,
  joinGroup,
  leaveGroup,
  updateBrief,
} from "../src/server/service";
import {
  authorizeReturn,
  returnShippingEvent,
} from "../src/server/return-shipping";
import { cancelFulfillment, chooseRemedy } from "../src/server/order-options";
import { recoverWorkspace } from "../src/server/recovery";
import { closeDatabase } from "../src/server/database";
// This runner is deliberately in-memory and denies every external network request.
delete process.env.DATABASE_URL;
process.env.LOCAL_DATA_DIR = ":memory:";
process.env.PAYMENT_MODE = "fixture";
process.env.AI_MODE = "fixture";
globalThis.fetch = async () => {
  throw new Error("Workflow traces must never contact a provider.");
};
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const reports: {
  seed: number;
  profile: string;
  actions: string[];
  passed: boolean;
  failure?: string;
}[] = [];
const count = 200;
for (let index = 0; index < count; index++) {
  const seed = Number(process.env.TRACE_SEED || 730100) + index;
  const rng = random(seed);
  const actions: string[] = [];
  // Stratify fault coverage; each trace randomizes independent action choices from its replay seed.
  const profile = [
    "normal",
    "prepaid",
    "timeout",
    "failed",
    "replacement",
    "canceled",
    "late",
    "group",
  ][index % 8];
  for (let warmup = 0; warmup < 16; warmup++) rng();
  try {
    const workspace = await createWorkspace({ fixture: true });
    const buyer: Actor = {
      workspaceId: workspace.id,
      userId: randomUUID(),
      role: "buyer",
    };
    const second: Actor = { ...buyer, userId: randomUUID() };
    const seller: Actor = { ...buyer, userId: "seller", role: "seller" };
    const reviewer: Actor = { ...buyer, userId: "reviewer", role: "reviewer" };
    const brief = {
      message: "Seeded trace",
      model: "Atlas 14",
      category: "chargers" as const,
      budget: 6000,
      preference: "",
      priority: "price" as const,
    };
    await updateBrief(buyer, brief);
    if (rng() < 0.5) {
      const stale = await makeQuote(buyer, "P001", "Atlas 14");
      await updateBrief(buyer, { ...brief, budget: 5900 });
      await assert.rejects(checkout(buyer, stale.id, stale.fingerprint));
      actions.push("changed brief rejects stale approval");
    }
    let groupId: string | undefined;
    if (profile === "group") {
      groupId = await joinGroup(buyer, "P001", "Atlas 14");
      if (rng() < 0.5) {
        await leaveGroup(buyer, groupId);
        groupId = await joinGroup(buyer, "P001", "Atlas 14");
        actions.push("leave before finalization");
      }
      await Promise.all([
        joinGroup(second, "P001", "Atlas 14"),
        joinGroup(second, "P001", "Atlas 14"),
      ]);
      actions.push("concurrent repeated join; locked discount");
    }
    const quote = await makeQuote(buyer, "P001", "Atlas 14", groupId);
    await assert.rejects(checkout(second, quote.id, quote.fingerprint));
    await assert.rejects(checkout(buyer, quote.id, "0".repeat(64)));
    const attempts = await Promise.all([
      checkout(buyer, quote.id, quote.fingerprint),
      checkout(buyer, quote.id, quote.fingerprint),
    ]);
    assert.equal(attempts[0].id, attempts[1].id);
    const order = attempts[0];
    await assert.rejects(capture(second, order.id));
    await Promise.all([capture(buyer, order.id), capture(buyer, order.id)]);
    actions.push("private explicit approval; duplicate checkout/capture");
    if (profile === "canceled") {
      await cancelFulfillment(seller, order.id, "Seeded inventory loss.");
      actions.push("seller cancellation preserves captured record");
    }
    if (profile === "late") {
      await recoverWorkspace(workspace.id, Date.parse(quote.deliveryBy!) + 1);
      actions.push("virtual clock passes delivery promise");
    }
    const item = await openReturn(
      buyer,
      order.id,
      profile === "canceled" ? "canceled" : "damaged",
      profile === "replacement" ? "replacement" : "refund",
    );
    await addEvidence(buyer, item.id, {
      checkpoint: "buyer_receipt",
      serial: rng() < 0.5 ? "" : "TRACE-100",
      note: "Synthetic customer record.",
    });
    await assert.rejects(
      addEvidence(buyer, item.id, {
        checkpoint: "seller_return",
        serial: "",
        note: "Unauthorized side.",
      }),
    );
    if (profile === "prepaid") {
      await authorizeReturn(
        reviewer,
        item.id,
        "prepaid",
        "Merchant covers shipping.",
        `LABEL-${seed}`,
      );
      await assert.rejects(
        resolveCase(reviewer, item.id, "refund", "Too early."),
      );
      await returnShippingEvent(buyer, item.id, "in_transit", `TRACK-${seed}`);
      await assert.rejects(
        returnShippingEvent(seller, item.id, "received", "wrong"),
      );
      await returnShippingEvent(seller, item.id, "received", `TRACK-${seed}`);
      actions.push("prepaid matching handoff/receipt gates money");
    }
    if (profile === "timeout" || profile === "failed")
      await mutateWorkspace(workspace.id, (state) => {
        state.fixtureFaults = {
          refund: profile === "timeout" ? "timeout_once" : "failed",
        };
      });
    if (rng() < 0.2 && profile !== "replacement") {
      await chooseRemedy(buyer, item.id, "replacement");
      await chooseRemedy(buyer, item.id, "refund");
      actions.push("customer changes unexecuted remedy");
    }
    if (profile === "timeout")
      await assert.rejects(
        resolveCase(
          reviewer,
          item.id,
          "refund",
          "Authorized before interruption.",
        ),
      );
    else
      await resolveCase(
        reviewer,
        item.id,
        profile === "replacement" ? "replacement" : "refund",
        "Seeded customer policy approval; no additional purchase.",
      );
    await recoverWorkspace(workspace.id);
    await recoverWorkspace(workspace.id);
    if (profile === "failed")
      await assert.rejects(
        resolveCase(reviewer, item.id, "refund", "Repeat failed operation."),
      );
    else
      await resolveCase(
        reviewer,
        item.id,
        profile === "replacement" ? "replacement" : "refund",
        "Duplicate approval.",
      );
    if (rng() < 0.4) {
      await appealCase(buyer, item.id, "Please review the outcome.");
      actions.push("appeal retains financial allocation");
      if (profile !== "failed") {
        await resolveCase(
          reviewer,
          item.id,
          profile === "replacement" ? "replacement" : "refund",
          "Reviewer reaffirms the existing remedy after appeal.",
        );
        assert.equal(
          (await getWorkspace(workspace.id)).cases[0].status,
          "resolved",
        );
      }
    }
    const state = await getWorkspace(workspace.id);
    const actual = state.orders.find((o) => o.id === order.id)!;
    assert.ok(
      actual.refundedAmount >= 0 && actual.refundedAmount <= quote.amount,
    );
    assert.equal(
      state.operations.filter((o) => o.kind === "capture").length,
      1,
    );
    assert.ok(state.operations.filter((o) => o.kind === "refund").length <= 1);
    assert.equal(
      state.orders.filter((o) => o.replacementOf === order.id).length,
      profile === "replacement" ? 1 : 0,
    );
    assert.equal(
      actual.refundedAmount,
      profile === "replacement" || profile === "failed" ? 0 : quote.amount,
    );
    assert.equal(state.orders.filter((o) => !o.replacementOf).length, 1);
    assert.equal(quote.amount, profile === "group" ? 2610 : 2900);
    reports.push({ seed, profile, actions, passed: true });
  } catch (error) {
    reports.push({
      seed,
      profile,
      actions,
      passed: false,
      failure:
        error instanceof assert.AssertionError
          ? error.message
          : "Workflow command failed; replay this seed locally.",
    });
  }
}
await mkdir(".data/reports", { recursive: true });
const build = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
await writeFile(
  ".data/reports/workflow-traces.json",
  JSON.stringify(
    {
      requirementIds: ["BG01", "BG02", "BG05", "BG07"],
      build,
      checkedAt: new Date().toISOString(),
      environment: "in-memory embedded PostgreSQL",
      modes: { payments: "fixture", ai: "fixture" },
      expected:
        "No unauthorized access, duplicate capture/refund, over-refund, duplicate replacement, or extra purchase in 200 seeded traces.",
      observed: {
        passed: reports.filter((r) => r.passed).length,
        total: count,
        profiles: Object.fromEntries(
          [...new Set(reports.map((r) => r.profile))].map((p) => [
            p,
            reports.filter((r) => r.profile === p).length,
          ]),
        ),
      },
      reports,
      limitations:
        "Seeded synthetic workflows establish these invariants in this executed corpus, not live provider completion or physical truth.",
    },
    null,
    2,
  ),
);
console.log(
  `${reports.filter((r) => r.passed).length}/${count} seeded workflow traces passed. No provider calls permitted.`,
);
if (reports.some((r) => !r.passed)) process.exitCode = 1;
await closeDatabase();
