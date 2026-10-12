import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { request } from "@playwright/test";
import { knownModels } from "../src/domain/catalog";
import type { runAgent } from "../src/server/agent";
import type { snapshot } from "../src/server/service";
import type { caseReport } from "../src/server/case-report";

async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const context = await request.newContext({
    baseURL: config.APP_URL,
    timeout: 60000,
    extraHTTPHeaders: { Origin: config.APP_URL },
  });
  const anonymous = await request.newContext({ baseURL: config.APP_URL });
  const checks: { scenario: string; passed: boolean }[] = [];
  const check = (scenario: string, passed: boolean) => {
    checks.push({ scenario, passed });
    if (!passed) throw new Error(`Verification failed: ${scenario}`);
  };
  const post = async (path: string, data: unknown) => {
    const response = await context.post(path, { data });
    if (!response.ok())
      throw new Error(
        `Fixture request returned HTTP ${response.status()}; private details withheld.`,
      );
    return response.json();
  };
  const state = async () =>
    (await (await context.get("/api/session")).json()) as Awaited<
      ReturnType<typeof snapshot>
    >;
  try {
    const health = await (await context.get("/api/health")).json();
    check(
      "Ready public release matches packaged source",
      health.status === "ready" && health.build === config.BUILD_ID,
    );
    await post("/api/demo", { action: "launch", kind: "fresh" });
    const task =
      "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping. Show my orders. The old item is damaged; I want a refund.";
    const result = (await post("/api/agent", {
      task,
      model: knownModels[0],
      budget: 6000,
    })) as Awaited<ReturnType<typeof runAgent>>;
    check(
      "Compound task executes all requested bounded tools",
      result.run.toolCalls?.map((call) => call.tool).join(",") ===
        "research_products,discover_groups,inspect_orders,prepare_support",
    );
    check(
      "M1 research records reviewed sources and complete bundle",
      result.run.sourceReceipts?.length === 4 &&
        result.snapshot.brief?.input.model === "MacBook Air (M1, 2020)" &&
        result.run.research?.findings.some(
          (option) => option.total === 5800,
        ) === true,
    );
    check(
      "Chat creates no purchase, membership or submitted claim",
      !result.snapshot.orders.length &&
        !result.snapshot.groups.length &&
        !result.snapshot.cases.length,
    );
    const spoken = (await post("/api/voice/intent", {
      transcript: task,
      model: knownModels[0],
      budget: 6000,
    })) as Awaited<ReturnType<typeof runAgent>>;
    check(
      "Confirmed transcript shares composed agent and memory",
      spoken.run.toolCalls?.length === 4 &&
        spoken.snapshot.agentRuns.length === 2 &&
        !spoken.snapshot.orders.length,
    );
    check(
      "Research receipts persist through session reload",
      (await state()).agentRuns.at(-1)?.sourceReceipts?.length === 4,
    );
    await post("/api/shopping", {
      model: knownModels[0],
      budget: 10000,
      category: "chargers",
      message: "",
      preference: "100W",
      priority: "features",
      weights: { price: 0, features: 100 },
    });
    check(
      "Explicit shopper weights persist",
      (await state()).brief?.input.weights?.features === 100,
    );
    const policy = {
      minimumMembers: 3,
      discountPercent: 20,
      formingMinutes: 1440,
      checkoutMinutes: 45,
      productTiers: [],
    };
    const forbidden = await context.post("/api/actions", {
      data: { action: "group_policy", expectedVersion: 1, policy },
    });
    check(
      "Shopper cannot approve merchant group policy",
      forbidden.status() === 403,
    );
    await post("/api/demo", { action: "persona", persona: "reviewer" });
    await post("/api/actions", {
      action: "group_policy",
      expectedVersion: 1,
      policy,
    });
    check(
      "Reviewer saves versioned merchant terms",
      (await state()).groupPolicy.version === 2,
    );
    await post("/api/demo", { action: "persona", persona: "buyer" });
    await post("/api/actions", {
      action: "join_group",
      productId: "P001",
      model: knownModels[0],
    });
    const formed = (await state()).groups[0];
    check(
      "New group freezes approved threshold and window",
      formed.terms.minimumMembers === 3 &&
        formed.terms.discountPercent === 20 &&
        formed.terms.checkoutMinutes === 45 &&
        formed.status === "forming",
    );
    await post("/api/demo", { action: "persona", persona: "reviewer" });
    await post("/api/actions", {
      action: "group_policy",
      expectedVersion: 2,
      policy: { ...policy, minimumMembers: 2, discountPercent: 10 },
    });
    check(
      "Policy changes do not reprice prior commitments",
      (await state()).groups[0].terms.discountPercent === 20,
    );
    await post("/api/demo", { action: "persona", persona: "buyer" });
    await post("/api/demo", { action: "launch", kind: "identifier_conflict" });
    const claim = (await state()).cases[0];
    const clip = await readFile("fixtures/evidence-media/synthetic.webm");
    const upload = await context.post("/api/evidence", {
      multipart: {
        caseId: claim.id,
        checkpoint: "buyer_receipt",
        serial: "FIXTURE-100",
        note: "Synthetic optional clip for manual review; not physical truth.",
        video: { name: "synthetic.webm", mimeType: "video/webm", buffer: clip },
      },
    });
    check("Optional private video is accepted", upload.ok());
    const evidence = (await upload.json()).result;
    const original = await context.get(`/api/evidence?id=${evidence.id}`);
    check(
      "Original bytes and private MIME headers preserved",
      original.ok() &&
        original.headers()["content-type"] === "video/webm" &&
        original.headers()["cache-control"] === "private, no-store" &&
        createHash("sha256")
          .update(await original.body())
          .digest("hex") === createHash("sha256").update(clip).digest("hex"),
    );
    check(
      "Anonymous access cannot obtain originals",
      (await anonymous.get(`/api/evidence?id=${evidence.id}`)).status() === 401,
    );
    await post("/api/actions", { action: "analyze", caseId: claim.id });
    const exported = (await (
      await context.get(`/api/case-report?id=${claim.id}`)
    ).json()) as Awaited<ReturnType<typeof caseReport>>;
    check(
      "Export separates sourced propositions and physical uncertainty",
      exported.schemaVersion === "case-report-v2" &&
        exported.propositions.some(
          (item) =>
            item.category === "physical_causation" &&
            item.outcome === "insufficient",
        ) &&
        exported.propositions.every(
          (item) =>
            item.uncertainty.length > 0 &&
            item.sourceIds.every((id) =>
              exported.sourceIndex.some((source) => source.id === id),
            ),
        ),
    );
    check(
      "Analysis does not resolve or refund the claim",
      exported.claim.status !== "resolved" &&
        exported.transactionRecords.refundedAmount === 0,
    );
    await mkdir(".data/reports", { recursive: true });
    await writeFile(
      ".data/reports/hosted-current.json",
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          build: health.build,
          modes: { payments: "fixture", ai: "fixture", shipping: "simulated" },
          checks,
        },
        null,
        2,
      ),
    );
    console.log(
      `${checks.length}/${checks.length} hosted current-feature checks passed. No model calls or real payments.`,
    );
  } finally {
    await context.dispose();
    await anonymous.dispose();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Hosted verification failed.",
  );
  process.exitCode = 1;
});
