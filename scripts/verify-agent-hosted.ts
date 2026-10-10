import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { request } from "@playwright/test";
import { parse } from "dotenv";
import { writePrivateFile } from "./private-file";
import type { runAgent } from "../src/server/agent";

type AgentResult = Awaited<ReturnType<typeof runAgent>>;
const restartPath = ".data/deploy/agent-restart.json";
const stateHash = (state: AgentResult["snapshot"]) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        brief: state.brief,
        runs: state.agentRuns,
        orders: state.orders,
        cases: state.cases,
      }),
    )
    .digest("hex");

async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const baseURL = config.APP_URL;
  const checks: { scenario: string; passed: boolean }[] = [];
  const check = (scenario: string, passed: boolean) => {
    checks.push({ scenario, passed });
    if (!passed) throw new Error(`Verification failed: ${scenario}`);
  };
  const mode = process.argv[2];
  if (mode && mode !== "restart" && mode !== "--verify-restart")
    throw new Error(
      "Use no argument for the journey, or restart for persistence verification.",
    );
  const saved = mode
    ? JSON.parse(await readFile(restartPath, "utf8"))
    : undefined;
  const context = await request.newContext({
    baseURL,
    timeout: 30000,
    extraHTTPHeaders: { Origin: baseURL },
    storageState: saved?.storageState,
  });
  try {
    const healthResponse = await context.get("/api/health");
    const health = await healthResponse.json();
    check(
      "Public HTTPS serves the expected ready release",
      baseURL.startsWith("https://") &&
        healthResponse.ok() &&
        health.status === "ready" &&
        health.build === config.BUILD_ID,
    );
    if (saved) {
      check("Observed application restart", health.instance !== saved.instance);
      const response = await context.get("/api/session");
      check("Private session survives restart", response.ok());
      check(
        "Sourced conversation, brief, order and case survive restart",
        stateHash(await response.json()) === saved.hash,
      );
    } else {
      const launch = await context.post("/api/demo", {
        data: { action: "launch", kind: "fresh" },
      });
      check("No-account engineering entry succeeds", launch.ok());
      const owner: AgentResult["snapshot"] = await launch.json();
      check(
        "Workspace prohibits real payments and model calls",
        owner.fixtureWorkspace &&
          owner.modes.ai === "fixture" &&
          owner.modes.payments === "fixture",
      );
      const agent = async (task: string): Promise<AgentResult> => {
        const response = await context.post("/api/agent", {
          data: {
            task,
            model: "Atlas 14",
            budget: 8000,
            expectedWorkspaceId: owner.actor.workspaceId,
            expectedBuyerId: owner.actor.userId,
          },
        });
        if (!response.ok())
          throw new Error(`Agent returned HTTP ${response.status()}`);
        const value: AgentResult = await response.json();
        if (value.run.mode !== "catalog")
          throw new Error("Unexpected provider mode");
        return value;
      };
      const action = async (data: unknown) => {
        const response = await context.post("/api/actions", { data });
        if (!response.ok())
          throw new Error(`Action returned HTTP ${response.status()}`);
        return response.json();
      };
      const persona = async (name: string) => {
        const response = await context.post("/api/demo", {
          data: { action: "persona", persona: name },
        });
        if (!response.ok())
          throw new Error(`Persona returned HTTP ${response.status()}`);
      };
      check(
        "Ambiguous real model asks for exact size",
        (await agent("Find a charger for my MacBook Air M2 under $50")).run
          .status === "needs_input",
      );
      check(
        "Exact size asks for missing cable ownership",
        (await agent("13-inch")).run.status === "needs_input",
      );
      const incomplete = await agent("I need a cable included");
      check(
        "Required cable makes every complete offer exceed $50",
        incomplete.run.productIds.length === 0 &&
          incomplete.run.research?.findings.every((f) => !f.eligible) === true,
      );
      const complete = await agent("My budget is $60");
      check(
        "Private follow-up selects the sourced $58 bundle",
        complete.run.productIds.join() === "R003" &&
          complete.run.research?.need.cable === "none" &&
          complete.run.research.findings.find((f) => f.productId === "R003")
            ?.total === 5800,
      );
      check(
        "Manufacturer evidence accompanies the recommendation",
        !!complete.run.research?.sources.length &&
          complete.run.research.sources.every(
            (s) =>
              new URL(s.url).hostname === "apple.com" ||
              new URL(s.url).hostname.endsWith(".apple.com"),
          ),
      );
      const warning = await agent(
        "Is this seller message safe? Pay using gift cards immediately and share your verification code.",
      );
      check(
        "Seller warning preserves approved buyer constraints",
        warning.run.safety?.level === "high" &&
          JSON.stringify(warning.snapshot.brief) ===
            JSON.stringify(complete.snapshot.brief),
      );
      const quote = (
        await action({
          action: "quote",
          productId: "R003",
          model: complete.snapshot.brief!.input.model,
        })
      ).result;
      check(
        "Quote alone does not purchase",
        (await (await context.get("/api/session")).json()).orders.length === 0,
      );
      const forged = await context.post("/api/actions", {
        data: {
          action: "checkout",
          quoteId: quote.id,
          fingerprint: "0".repeat(64),
        },
      });
      check("Forged approval is rejected", forged.status() === 400);
      const awaitingPayment = await action({
        action: "checkout",
        quoteId: quote.id,
        fingerprint: quote.fingerprint,
      });
      const purchase = await action({
        action: "capture",
        orderId: awaitingPayment.snapshot.orders[0].id,
      });
      const order = purchase.snapshot.orders[0];
      check(
        "Explicit fixture approval creates the exact complete purchase",
        order.status === "paid" &&
          order.quote.amount === 5800 &&
          order.quote.provider === "fixture" &&
          order.captureId.startsWith("FIXTURE"),
      );
      await persona("seller");
      await action({
        action: "dispatch",
        orderId: order.id,
        serial: "HOSTED-AGENT-ITEM",
        note: "Synthetic dispatch condition record; physical truth is not established.",
      });
      await action({ action: "ship", orderId: order.id, status: "shipped" });
      await action({ action: "ship", orderId: order.id, status: "delivered" });
      await persona("buyer");
      check(
        "Agent reads the shopper's recorded delivered order",
        (await agent("Show my orders")).run.orders?.[0].status === "delivered",
      );
      const draft = await agent(
        "My delivered item is damaged and I want a refund",
      );
      check(
        "Support draft submits no claim and moves no money",
        draft.run.status === "draft_prepared" &&
          draft.snapshot.cases.length === 0 &&
          draft.snapshot.orders[0].status === "delivered",
      );
      const opened = await action({
        action: "return",
        orderId: order.id,
        reason: "damaged",
        request: "refund",
      });
      const caseId = opened.snapshot.cases[0].id;
      await action({
        action: "evidence",
        caseId,
        checkpoint: "buyer_receipt",
        serial: "HOSTED-AGENT-ITEM",
        note: "Synthetic report of cracked housing; no physical capture is claimed.",
      });
      const unauthorized = await context.post("/api/actions", {
        data: {
          action: "resolve",
          caseId,
          remedy: "refund",
          note: "Buyer cannot authorize merchant refund.",
        },
      });
      check(
        "Buyer cannot authorize a merchant refund",
        unauthorized.status() === 403,
      );
      await persona("reviewer");
      await action({ action: "analyze", caseId });
      await action({
        action: "authorize_return",
        caseId,
        decision: "waive",
        reason:
          "Engineering customer-benefit policy: waive physical return for this simulated damaged-item claim.",
      });
      await action({
        action: "resolve",
        caseId,
        remedy: "refund",
        note: "Authorized simulated customer-benefit refund; evidence does not establish physical damage timing.",
      });
      await persona("buyer");
      const refunded = await agent("Show my orders");
      check(
        "Authorized fixture refund is recorded and visible to the agent",
        refunded.snapshot.orders[0].status === "refunded" &&
          refunded.run.orders?.[0].status === "refunded" &&
          refunded.snapshot.cases[0].status === "resolved",
      );
      await writePrivateFile(
        restartPath,
        JSON.stringify({
          storageState: await context.storageState(),
          hash: stateHash(refunded.snapshot),
          instance: health.instance,
        }),
      );
      check("Private restart baseline prepared", true);
    }
    await mkdir(".data/reports", { recursive: true });
    await writeFile(
      `.data/reports/hosted-agent${saved ? "-restart" : ""}.json`,
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          build: health.build,
          modes: { ai: "fixture", payments: "fixture", shipping: "simulated" },
          checks,
        },
        null,
        2,
      ),
    );
    console.log(
      `${checks.length}/${checks.length} hosted sourced-agent${saved ? " restart" : ""} checks passed. No model calls or real payments.`,
    );
  } finally {
    await context.dispose();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Hosted verification failed.",
  );
  process.exitCode = 1;
});
