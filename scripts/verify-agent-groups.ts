import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { request } from "@playwright/test";
import type { runAgent } from "../src/server/agent";

async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const context = await request.newContext({ baseURL: config.APP_URL });
  const checks: { scenario: string; passed: boolean }[] = [];
  const check = (scenario: string, passed: boolean) => {
    checks.push({ scenario, passed });
    if (!passed) throw new Error(`Verification failed: ${scenario}`);
  };
  const post = async (path: string, data: unknown) => {
    const response = await context.post(path, {
      headers: { Origin: config.APP_URL },
      data,
    });
    if (!response.ok())
      throw new Error(
        `Fixture request failed with HTTP ${response.status()}; request/response details withheld.`,
      );
    return response.json();
  };
  try {
    const health = await (await context.get("/api/health")).json();
    check(
      "Public ready release matches packaged source",
      health.status === "ready" && health.build === config.BUILD_ID,
    );
    const initial = await post("/api/demo", {
      action: "launch",
      kind: "fresh",
    });
    check(
      "Private fixture session prohibits model/payment provider calls",
      initial.fixtureWorkspace &&
        initial.modes.ai === "fixture" &&
        initial.modes.payments === "fixture",
    );
    const data: Awaited<ReturnType<typeof runAgent>> = await post(
      "/api/agent",
      {
        task: "Find a charger for my MacBook Air M2 13-inch under $53. I need a cable included. Normal charging. Use grouping to reduce the cost.",
        model: "Atlas 14",
        budget: 8000,
        expectedWorkspaceId: initial.actor.workspaceId,
        expectedBuyerId: initial.actor.userId,
      },
    );
    check(
      "Compound request executes research then group discovery",
      data.run.toolCalls?.map((call) => call.tool).join(",") ===
        "research_products,discover_groups",
    );
    check(
      "Standalone bundle exceeds budget but complete conditional group price fits",
      !data.run.productIds.length &&
        data.run.groupOffers?.some(
          (offer) =>
            offer.productId === "R003" &&
            offer.eligible &&
            offer.groupAmount === 5220,
        ) === true,
    );
    check(
      "Discovery creates no partner, commitment, order or payment",
      !data.snapshot.groups.length &&
        !data.snapshot.orders.length &&
        data.run.groupOffers?.every((offer) => offer.memberCount === 0) ===
          true,
    );
    const stale = await context.post("/api/actions", {
      headers: { Origin: config.APP_URL },
      data: {
        action: "agent_group_commit",
        productId: "R003",
        briefVersion: data.run.briefVersion! + 10,
        policyVersion: data.run.groupOffers?.find(
          (offer) => offer.productId === "R003",
        )?.policyVersion,
      },
    });
    check(
      "Forged stale brief cannot create a commitment",
      stale.status() === 400,
    );
    const committed = await post("/api/actions", {
      action: "agent_group_commit",
      productId: "R003",
      briefVersion: data.run.briefVersion,
      policyVersion: data.run.groupOffers?.find(
        (offer) => offer.productId === "R003",
      )?.policyVersion,
    });
    check(
      "Explicit commitment has one member and no payment",
      committed.snapshot.groups[0].memberCount === 1 &&
        !committed.snapshot.orders.length,
    );
    const early = await context.post("/api/actions", {
      headers: { Origin: config.APP_URL },
      data: {
        action: "quote",
        productId: "R003",
        model: data.snapshot.brief!.input.model,
        groupId: committed.result,
      },
    });
    check(
      "Unfinalized group cannot create a discounted purchase",
      early.status() === 400,
    );
    await post("/api/demo", { action: "persona", persona: "second_buyer" });
    const second = await post("/api/actions", {
      action: "join_group",
      productId: "R003",
      model: data.snapshot.brief!.input.model,
    });
    check(
      "Second actual demo shopper finalizes reserved discounted offer",
      second.snapshot.groups[0].memberCount === 2 &&
        second.snapshot.groups[0].amount === 5220,
    );
    await post("/api/demo", { action: "persona", persona: "buyer" });
    const reread = await post("/api/agent", {
      task: "Use grouping to reduce the cost",
      model: "Atlas 14",
      budget: 8000,
    });
    check(
      "Standalone group request uses retained confirmed brief",
      reread.run.toolCalls.length === 1 &&
        reread.run.groupOffers.some(
          (offer: { status: string; joined: boolean }) =>
            offer.status === "ready" && offer.joined,
        ),
    );
    const quoted = await post("/api/actions", {
      action: "quote",
      productId: "R003",
      model: data.snapshot.brief!.input.model,
      groupId: committed.result,
    });
    check(
      "Ready exact complete discounted quote remains within retained budget",
      quoted.result.amount === 5220 && !quoted.snapshot.orders.length,
    );
    const forged = await context.post("/api/actions", {
      headers: { Origin: config.APP_URL },
      data: {
        action: "checkout",
        quoteId: quoted.result.id,
        fingerprint: "forged",
      },
    });
    check("Forged financial approval rejected", forged.status() === 400);
    const checkout = await post("/api/actions", {
      action: "checkout",
      quoteId: quoted.result.id,
      fingerprint: quoted.result.fingerprint,
    });
    const captured = await post("/api/actions", {
      action: "capture",
      orderId: checkout.result.id,
    });
    check(
      "Explicit fixture approval/capture records exact discounted amount",
      captured.snapshot.orders[0].status === "paid" &&
        captured.snapshot.orders[0].quote.amount === 5220,
    );
    await mkdir(".data/reports", { recursive: true });
    await writeFile(
      ".data/reports/hosted-agent-groups.json",
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          build: health.build,
          modes: { ai: "fixture", payments: "fixture", shipping: "simulated" },
          checks,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      `${checks.length}/${checks.length} public group-agent checks passed; no live model/payment provider calls.`,
    );
  } finally {
    await context.dispose();
  }
}
main().catch(() => {
  console.error(
    "Group-agent hosted verification failed; private request details withheld.",
  );
  process.exitCode = 1;
});
