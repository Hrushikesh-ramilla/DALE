import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { request, type APIRequestContext } from "@playwright/test";
import { writePrivateFile } from "./private-file";
const config = parse(await readFile(".data/deploy/production.env"));
const restart = process.argv[2] === "restart";
const privatePath = ".data/deploy/retail-restart.json";
const saved = restart
  ? JSON.parse(await readFile(privatePath, "utf8"))
  : undefined;
const contexts = await Promise.all(
  [0, 1, 2].map((index) =>
    request.newContext({
      baseURL: config.APP_URL,
      timeout: 30000,
      extraHTTPHeaders: { Origin: config.APP_URL },
      storageState: saved?.contexts[index],
    }),
  ),
);
const checks: { scenario: string; passed: boolean }[] = [];
function check(scenario: string, passed: boolean) {
  checks.push({ scenario, passed });
  if (!passed) throw new Error(`Verification failed: ${scenario}`);
}
async function post(context: APIRequestContext, path: string, data: unknown) {
  const response = await context.post(path, { data });
  if (!response.ok())
    throw new Error(
      `Retail verification HTTP ${response.status()}; private response withheld.`,
    );
  return response.json();
}
try {
  const health = await (await contexts[0].get("/api/health")).json();
  check(
    "Public ready build matches release",
    health.status === "ready" && health.build === config.BUILD_ID,
  );
  const catalog = await (await contexts[0].get("/api/catalog")).json();
  check(
    "PostgreSQL catalog has eight departments and 75 sourced records",
    catalog.total === 75 &&
      catalog.departments.length === 8 &&
      catalog.products.length === 48,
  );
  check(
    "Ordinary browsing excludes invented and identity-only inventory",
    catalog.products.every(
      (product: { id: string; comparisonOnly?: boolean }) =>
        !/^[PL]/.test(product.id) && !product.comparisonOnly,
    ),
  );
  const phones = await (
    await contexts[0].get(
      "/api/catalog?category=phones&ramGb=12&storageGb=256&budget=100000",
    )
  ).json();
  check(
    "Manufacturer phone attributes filter without guessed Apple RAM",
    phones.total === 3 &&
      phones.products.every(
        (product: {
          attributes: { ramGb: number; storageGb: number };
          source: string;
        }) =>
          product.attributes.ramGb === 12 &&
          product.attributes.storageGb === 256 &&
          product.source.startsWith("https://"),
      ),
  );
  if (restart) {
    check("Observed actual app restart", health.instance !== saved.instance);
    for (const index of [0, 1]) {
      const state = await (await contexts[index].get("/api/session")).json();
      check(
        `Customer ${index + 1} session and exact-variant group persist`,
        state.actor.userId === saved.users[index] &&
          state.groups.some(
            (group: { id: string; joined: boolean; memberCount: number }) =>
              group.id === saved.group &&
              group.joined &&
              group.memberCount === 2,
          ),
      );
    }
    const fixture = await (await contexts[2].get("/api/session")).json();
    check(
      "Fixture conversation and captured order persist",
      fixture.agentRuns.length === saved.runs &&
        fixture.orders.some(
          (order: { id: string; captureId?: string }) =>
            order.id === saved.order && !!order.captureId,
        ),
    );
  } else {
    const owners = await Promise.all(
      contexts
        .slice(0, 2)
        .map((context) => post(context, "/api/account", { action: "guest" })),
    );
    check(
      "Independent shoppers share a store without sharing identity",
      owners[0].actor.userId !== owners[1].actor.userId &&
        owners[0].actor.workspaceId === owners[1].actor.workspaceId,
    );
    const brief = {
      message: "Givenchy cotton t-shirt size M",
      model: "not-required",
      category: "clothing",
      budget: 60000,
      requirements: {
        brand: "givenchy",
        productType: "t-shirt",
        material: "cotton",
        size: "M",
      },
      preference: "",
      priority: "price",
    };
    for (const context of contexts.slice(0, 2))
      await post(context, "/api/brief", brief);
    const first = await post(contexts[0], "/api/actions", {
      action: "join_group",
      productId: "B23",
      model: "not-required",
    });
    const second = await post(contexts[1], "/api/actions", {
      action: "join_group",
      productId: "B23",
      model: "not-required",
    });
    check(
      "Two genuine sessions finalize the same exact variant",
      first.result === second.result &&
        second.snapshot.groups.some(
          (group: { id: string; memberCount: number; status: string }) =>
            group.id === first.result &&
            group.memberCount === 2 &&
            group.status === "ready",
        ),
    );
    const wrong = await contexts[0].post("/api/actions", {
      data: { action: "quote", productId: "B22", model: "not-required" },
    });
    check("Server refuses a different size", !wrong.ok());
    const fixture = await post(contexts[2], "/api/demo", {
      action: "launch",
      kind: "fresh",
    });
    check(
      "Hosted agent checks isolate AI and payment fixtures",
      fixture.fixtureWorkspace &&
        fixture.modes.ai === "fixture" &&
        fixture.modes.payments === "fixture",
    );
    for (const [task, category] of [
      ["Compare phones with 12GB RAM and 256GB storage under $1000", "phones"],
      ["Find MFK Baccarat Rouge 540 perfume in 70ml under $400", "fragrance"],
      ["Find Gucci leather key pouch under $700", "bags"],
      ["Find a linen shirt size M under $60 and use group buying", "clothing"],
      ["Actually size L instead", "clothing"],
      ["Compare citrus perfumes in 50 ml under $40", "fragrance"],
      ["Find a canvas tote under $30", "bags"],
      ["Find a glass vase under $30", "home"],
      ["Find body lotion in 100 ml under $50", "beauty"],
    ]) {
      const result = await post(contexts[2], "/api/agent", {
        task,
        model: "Atlas 14",
        budget: 8000,
      });
      check(
        `${category}: recorded variants satisfy a hosted fixture task`,
        result.intent.kind === "shopping" &&
          result.intent.brief.category === category &&
          result.run.productIds.length > 0 &&
          result.run.mode === "catalog" &&
          result.snapshot.orders.length === 0,
      );
      if (task === "Actually size L instead")
        check(
          "Follow-up retains material and budget while changing size",
          result.intent.brief.requirements.size === "L" &&
            result.intent.brief.requirements.material === "linen" &&
            result.intent.brief.budget === 6000,
        );
    }
    const quote = await post(contexts[2], "/api/actions", {
      action: "quote",
      productId: "L153",
      model: "not-required",
    });
    const order = await post(contexts[2], "/api/actions", {
      action: "checkout",
      quoteId: quote.result.id,
      fingerprint: quote.result.fingerprint,
    });
    const captured = await post(contexts[2], "/api/actions", {
      action: "capture",
      orderId: order.result.id,
    });
    check(
      "Explicit fixture review captures the approved exact SKU",
      captured.snapshot.orders.some(
        (item: { id: string; captureId?: string }) =>
          item.id === order.result.id && !!item.captureId,
      ),
    );
    check(
      "Other shoppers retain order privacy",
      second.snapshot.orders.length === 0,
    );
    await writePrivateFile(
      privatePath,
      JSON.stringify({
        contexts: await Promise.all(
          contexts.map((context) => context.storageState()),
        ),
        users: owners.map((owner) => owner.actor.userId),
        group: first.result,
        order: order.result.id,
        runs: captured.snapshot.agentRuns.length,
        instance: health.instance,
      }),
    );
  }
  await mkdir("docs/evaluations", { recursive: true });
  const file = `docs/evaluations/retail-${config.BUILD_ID.slice(0, 7)}-${restart ? "restart" : "prepare"}.json`;
  await writeFile(
    file,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        source: config.BUILD_ID,
        url: config.APP_URL,
        mode: "real-postgres/customers; isolated-agent/payment-fixtures",
        checks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${checks.length} hosted retail ${restart ? "restart" : "journey"} checks passed; no model calls or real payment capture.`,
  );
} finally {
  await Promise.all(contexts.map((context) => context.dispose()));
}
