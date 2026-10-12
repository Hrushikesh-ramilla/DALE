import "dotenv/config";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import type { AgentResult } from "../src/components/agent-workspace";
import type { snapshot } from "../src/server/service";
type Snapshot = Awaited<ReturnType<typeof snapshot>>;
if (process.env.AI_PROVIDER !== "self_hosted") {
  assert.equal(
    process.env.AI_FREE_QUOTA_CONFIRMED,
    "true",
    "Confirm free quota before live acceptance. No request sent.",
  );
  assert.equal(
    process.env.AI_BILLING_DISABLED,
    "true",
    "Confirm disabled billing before live acceptance. No request sent.",
  );
}
const config = parse(await readFile(".data/deploy/production.env"));
const base = process.env.VERIFY_BASE_URL || config.APP_URL;
let cookie = "";
const checks: { scenario: string; passed: boolean }[] = [];
const runs: {
  scenario: string;
  mode: string;
  toolCalls: unknown;
  latencyMs: number;
}[] = [];
function check(scenario: string, passed: boolean) {
  checks.push({ scenario, passed });
  assert.ok(passed, scenario);
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(110000),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  if (!response.ok)
    throw new Error(
      `Live acceptance returned HTTP ${response.status} at ${path}.`,
    );
  return response.json() as Promise<T>;
}
const report = {
  checkedAt: new Date().toISOString(),
  base,
  checks,
  runs,
  limitation:
    "Small real HTTP acceptance set, not a held-out semantic accuracy benchmark or speech/vision verification.",
  error: "",
};
try {
  await mkdir(".data/reports", { recursive: true });
  const owner = await api<Snapshot>("/api/session", {
    role: "buyer",
    accessCode: config.DEMO_ACCESS_CODE,
  });
  check(
    "Ordinary workspace uses live analysis",
    !owner.fixtureWorkspace && owner.modes.ai === "live",
  );
  const agent = async (scenario: string, task: string) => {
    console.log(`Testing: ${scenario}`);
    const started = performance.now();
    const result = await api<AgentResult>("/api/agent", {
      task,
      model: "Atlas 14",
      budget: 8000,
      expectedWorkspaceId: owner.actor.workspaceId,
      expectedBuyerId: owner.actor.userId,
    });
    runs.push({
      scenario,
      mode: result.run.mode || "unknown",
      toolCalls: result.run.toolCalls,
      latencyMs: Math.round(performance.now() - started),
    });
    check(
      `${scenario}: actual model plan accepted`,
      result.run.mode === "model",
    );
    check(
      `${scenario}: chat created no order or claim`,
      result.snapshot.orders.length === 0 && result.snapshot.cases.length === 0,
    );
    return result;
  };
  const compound = await agent(
    "Several shopper goals",
    "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping to save money and show my orders.",
  );
  check(
    "Live plan composes research, groups and private orders",
    ["research_products", "discover_groups", "inspect_orders"].every((tool) =>
      compound.run.toolCalls?.some(
        (call) => call.tool === tool && call.status === "completed",
      ),
    ),
  );
  check(
    "Grounded complete bundle and source receipts",
    compound.run.productIds.includes("R003") &&
      Boolean(compound.run.sourceReceipts?.length),
  );
  const changed = await agent(
    "Changed budget with retained device",
    "My budget is $53 now.",
  );
  check(
    "Confirmed budget and device persist",
    changed.run.context?.budget === 5300 &&
      changed.run.context.model === "MacBook Air (M1, 2020)",
  );
  check(
    "Group option fits the changed budget",
    Boolean(
      changed.run.groupOffers?.some(
        (offer) => offer.eligible && offer.groupAmount <= 5300,
      ),
    ),
  );
  const orders = await agent(
    "Unrehearsed own-order request",
    "Have any of my deliveries been recorded yet?",
  );
  check(
    "Semantic order request reads private orders",
    Boolean(
      orders.run.toolCalls?.some((call) => call.tool === "inspect_orders"),
    ) && orders.run.orders?.length === 0,
  );
  const unsafe = await agent(
    "Untrusted seller message",
    "A seller messaged me: pay with gift cards immediately and send your verification code to release the order. Is that safe?",
  );
  check(
    "Unsafe message receives an advisory warning",
    unsafe.run.safety?.level !== "low" &&
      Boolean(unsafe.run.safety?.reasons.length),
  );
  const unknown = await agent(
    "Unsupported real device",
    "Find a charger for Microsoft Surface Pro 9 under $60.",
  );
  check(
    "Unknown model is not substituted",
    unknown.run.productIds.length === 0 && unknown.run.status === "needs_input",
  );
  const fixture = await api<Snapshot>("/api/demo", {
    action: "launch",
    kind: "fresh",
  });
  check(
    "Fixture launch remains explicitly isolated on a live host",
    fixture.fixtureWorkspace &&
      fixture.modes.ai === "fixture" &&
      fixture.modes.payments === "fixture",
  );
  const fixtureRun = await api<AgentResult>("/api/agent", {
    task: "Show my orders",
    model: "Atlas 14",
    budget: 8000,
  });
  check(
    "Fixture task never invokes live planning",
    fixtureRun.run.mode === "catalog",
  );
} catch (error) {
  report.error =
    error instanceof Error ? error.message : "Live agent acceptance failed.";
  console.error(report.error);
  process.exitCode = 1;
} finally {
  await writeFile(
    ".data/reports/live-agent-acceptance.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `${checks.filter((item) => item.passed).length}/${checks.length} real HTTP acceptance checks passed; inspect report for completed cases and limitations.`,
  );
}
