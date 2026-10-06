import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { request } from "@playwright/test";
async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const baseURL = process.env.HOSTED_TEST_URL || config.APP_URL;
  const transport = baseURL.startsWith("https://")
    ? "public-https"
    : "private-ssh-tunnel";
  const results: { scenario: string; passed: boolean }[] = [];
  async function client(
    role: "buyer" | "seller" | "reviewer",
    workspaceId?: string,
    invite?: string,
  ) {
    const context = await request.newContext({
      timeout: 120000,
      baseURL,
      extraHTTPHeaders: { Origin: config.APP_URL },
    });
    const response = await context.post("/api/session", {
      data: {
        role,
        workspaceId,
        invite,
        accessCode:
          role === "buyer"
            ? config.DEMO_ACCESS_CODE
            : config.OPERATOR_ACCESS_CODE,
      },
    });
    if (!response.ok())
      throw new Error(`Hosted session returned HTTP ${response.status()}.`);
    const cookie = response.headers()["set-cookie"]?.split(";")[0];
    if (!cookie) throw new Error("Hosted session did not set a cookie.");
    // The SSH tunnel transports a protected production endpoint over loopback HTTP only.
    const authorized = await request.newContext({
      timeout: 120000,
      baseURL,
      extraHTTPHeaders: { Origin: config.APP_URL, Cookie: cookie },
    });
    results.push({
      scenario: "HTTP-only secure session",
      passed:
        /httponly/i.test(response.headers()["set-cookie"]) &&
        /secure/i.test(response.headers()["set-cookie"]),
    });
    const session = await response.json();
    await context.dispose();
    return { context: authorized, session, cookie };
  }
  const anonymous = await request.newContext({ baseURL, timeout: 120000 });
  const health = await anonymous.get("/api/health");
  const healthData = await health.json();
  const build = healthData.build;
  results.push({
    scenario: "Production database health",
    passed: health.ok(),
  });
  results.push({
    scenario: "Anonymous actions rejected",
    passed:
      (
        await anonymous.post("/api/actions", {
          headers: { Origin: config.APP_URL },
          data: { action: "quote", productId: "P001", model: "Atlas 14" },
        })
      ).status() === 401,
  });
  const first = await client("buyer");
  results.push({
    scenario: "Production PostgreSQL and declared adapter modes",
    passed:
      first.session.modes.database === "postgres" &&
      first.session.modes.ai === config.AI_MODE &&
      first.session.modes.payments === "sandbox",
  });
  results.push({
    scenario: "Cross-origin mutation rejected",
    passed:
      (
        await first.context.post("/api/actions", {
          headers: { Origin: "https://untrusted.example" },
          data: { action: "quote", productId: "P001", model: "Atlas 14" },
        })
      ).status() === 403,
  });
  const shopping = await first.context.post("/api/shopping", {
    data: {
      message: "A compact charger",
      model: "Atlas 14",
      category: "chargers",
      budget: 4000,
    },
  });
  const matches = await shopping.json();
  results.push({
    scenario:
      config.AI_MODE === "live"
        ? "Hosted grounded Gemini summary"
        : "Hosted grounded shopping fixture",
    passed:
      shopping.ok() &&
      matches.analysis.mode === config.AI_MODE &&
      matches.products.every(
        (p: { price: number; compatibleModels: string[] }) =>
          p.price <= 4000 && p.compatibleModels.includes("Atlas 14"),
      ),
  });
  const second = await client("buyer", undefined, first.session.invite);
  const oldQuote = (
    await (
      await first.context.post("/api/actions", {
        data: { action: "quote", productId: "P001", model: "Atlas 14" },
      })
    ).json()
  ).result;
  const changed = await first.context.post("/api/brief", {
    data: {
      message: "A compact charger",
      model: "Atlas 14",
      category: "chargers",
      budget: 3900,
      preference: "65W",
      priority: "features",
    },
  });
  const invalid = await first.context.post("/api/actions", {
    data: {
      action: "checkout",
      quoteId: oldQuote.id,
      fingerprint: oldQuote.fingerprint,
    },
  });
  results.push({
    scenario: "Changed brief invalidates unpaid approval",
    passed:
      changed.ok() &&
      invalid.status() === 400 &&
      (await invalid.json()).error.includes("brief changed"),
  });
  const privateOrders = await second.context.get("/api/session");
  results.push({
    scenario: "Independent customer identity in invited workspace",
    passed:
      (await privateOrders.json()).actor.userId !== first.session.actor.userId,
  });
  await first.context.post("/api/actions", {
    data: { action: "join_group", productId: "P001", model: "Atlas 14" },
  });
  const groupResponse = await second.context.post("/api/actions", {
    data: { action: "join_group", productId: "P001", model: "Atlas 14" },
  });
  const group = (await groupResponse.json()).snapshot.groups[0];
  results.push({
    scenario: "Hosted transactional group pricing",
    passed:
      group.status === "ready" &&
      group.amount === 2610 &&
      group.memberCount === 2 &&
      !group.members,
  });
  const quote = (
    await (
      await first.context.post("/api/actions", {
        data: {
          action: "quote",
          productId: "P001",
          model: "Atlas 14",
          groupId: group.id,
        },
      })
    ).json()
  ).result;
  const orderResponse = await first.context.post("/api/actions", {
    data: {
      action: "checkout",
      quoteId: quote.id,
      fingerprint: quote.fingerprint,
    },
  });
  const order = (await orderResponse.json()).result;
  results.push({
    scenario: "Hosted PayPal sandbox order creation",
    passed:
      orderResponse.ok() &&
      order.providerOrderId &&
      order.status === "checkout_pending" &&
      order.quote.amount === 2610,
  });
  const secondOrders = (await (await second.context.get("/api/session")).json())
    .orders;
  results.push({
    scenario: "Private order isolation",
    passed: secondOrders.length === 0,
  });
  await writeFile(
    ".data/deploy/restart-check.json",
    JSON.stringify({
      timeout: 120000,
      baseURL,
      cookie: first.cookie,
      workspaceId: first.session.actor.workspaceId,
      orderId: order.id,
      instance: healthData.instance,
    }),
    { mode: 0o600 },
  );
  await mkdir(".data/reports", { recursive: true });
  await writeFile(
    ".data/reports/hosted-integration.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        build,
        transport,
        results,
        limitation:
          "Order is unapproved. No capture/refund or actual webhook delivery verified by this script.",
      },
      null,
      2,
    ),
  );
  for (const result of results)
    console.log(`${result.passed ? "PASS" : "FAIL"}: ${result.scenario}`);
  await first.context.dispose();
  await second.context.dispose();
  await anonymous.dispose();
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}
void main().catch(() => {
  console.error(
    "Verification failed; no request headers or account credentials are logged.",
  );
  process.exit(1);
});
