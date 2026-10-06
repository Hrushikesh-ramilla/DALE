import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parse } from "dotenv";
import { request, chromium, type APIRequestContext } from "@playwright/test";
import { scenarioKind } from "../src/server/scenarios";
async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const baseURL = config.APP_URL;
  const results: { scenario: string; passed: boolean }[] = [];
  const health = await (await fetch(`${baseURL}/api/health`)).json();
  const client = () =>
    request.newContext({
      baseURL,
      timeout: 30000,
      extraHTTPHeaders: { Origin: baseURL },
    });
  const operator = await client();
  async function login(
    context: APIRequestContext,
    role: string,
    workspaceId?: string,
    invite?: string,
  ) {
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
    if (!response.ok()) throw new Error("Hosted test authentication failed.");
    return response.json();
  }
  const normal = await client();
  const normalSession = await login(normal, "buyer");
  results.push({
    scenario: "Shopper cannot create engineering scenarios",
    passed:
      (
        await normal.post("/api/scenarios", {
          data: { action: "create", kind: "fresh" },
        })
      ).status() === 403,
  });
  await login(operator, "reviewer", normalSession.actor.workspaceId);
  for (const kind of scenarioKind.options) {
    const created = await operator.post("/api/scenarios", {
      data: { action: "create", kind },
    });
    if (!created.ok())
      throw new Error(`Scenario ${kind} failed to initialize.`);
    const { snapshot } = await created.json();
    const isolated =
      snapshot.fixtureWorkspace &&
      snapshot.modes.payments === "fixture" &&
      snapshot.modes.ai === "fixture" &&
      !snapshot.paypalClientId;
    const references = snapshot.orders.every(
      (o: { captureId?: string; providerOrderId?: string }) =>
        [o.captureId, o.providerOrderId].every(
          (id) => !id || id.startsWith("FIXTURE"),
        ),
    );
    let expected = true;
    if (kind === "canceled_order" || kind === "late_order")
      expected =
        snapshot.orders[0].fulfillmentIssue?.kind ===
          (kind === "canceled_order" ? "canceled" : "late") &&
        snapshot.orders[0].status === "paid" &&
        snapshot.orders[0].refundedAmount === 0;
    if (kind === "refund_failure")
      expected =
        snapshot.orders[0].status === "refund_failed" &&
        snapshot.orders[0].refundedAmount === 0;
    if (kind === "identifier_conflict")
      expected =
        snapshot.cases[0].analysis.outcome === "contradicted" &&
        snapshot.cases[0].status === "review";
    if (kind === "seller_silence")
      expected = snapshot.cases[0].status === "review";
    if (kind === "group_partial") {
      expected = snapshot.groups[0].amount === 2610;
      const quoteResponse = await operator.post("/api/actions", {
        data: {
          action: "quote",
          productId: "P001",
          model: "Atlas 14",
          groupId: snapshot.groups[0].id,
        },
      });
      const quote = (await quoteResponse.json()).result;
      const checkoutResponse = await operator.post("/api/actions", {
        data: {
          action: "checkout",
          quoteId: quote.id,
          fingerprint: quote.fingerprint,
        },
      });
      const order = (await checkoutResponse.json()).result;
      const captured = await operator.post("/api/actions", {
        data: { action: "capture", orderId: order.id },
      });
      const paid = (await captured.json()).result;
      expected &&=
        quoteResponse.ok() &&
        checkoutResponse.ok() &&
        captured.ok() &&
        paid.status === "paid" &&
        paid.quote.amount === 2610 &&
        paid.captureId.startsWith("FIXTURE");
    }
    if (kind === "refund_timeout") {
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        const current = await (await operator.get("/api/session")).json();
        if (current.orders[0].status === "refunded") {
          expected = current.orders[0].refundedAmount === 2900;
          break;
        }
        expected = false;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    results.push({
      scenario: `Isolated ${kind} scenario and expected state`,
      passed: Boolean(isolated && references && expected),
    });
    if (kind === "delivered") {
      const response = await operator.post("/api/actions", {
        data: {
          action: "return",
          orderId: snapshot.orders[0].id,
          reason: "damaged",
          request: "refund",
        },
      });
      const item = (await response.json()).result;
      const code = (
        await (
          await operator.post("/api/actions", {
            data: {
              action: "capture_session",
              caseId: item.id,
              checkpoint: "buyer_receipt",
            },
          })
        ).json()
      ).result;
      const bytes = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      );
      const upload = await operator.post("/api/evidence", {
        multipart: {
          caseId: item.id,
          checkpoint: "buyer_receipt",
          serial: "FIXTURE-100",
          note: "Synthetic one-pixel image; not a physical damage test.",
          captureSessionId: code.id,
          image: {
            name: "synthetic.png",
            mimeType: "image/png",
            buffer: bytes,
          },
        },
      });
      const entry = (await upload.json()).result;
      if (!entry?.id) throw new Error("Hosted evidence upload failed.");
      const original = await operator.get(`/api/evidence?id=${entry.id}`);
      const expectedHash = createHash("sha256").update(bytes).digest("hex");
      const report = await (
        await operator.get(`/api/case-report?id=${item.id}`)
      ).json();
      results.push({
        scenario:
          "Hosted multipart challenge upload and private integrity report",
        passed:
          upload.ok() &&
          original.ok() &&
          createHash("sha256")
            .update(await original.body())
            .digest("hex") === expectedHash &&
          report.submittedRecords.some(
            (e: {
              integrity: string;
              provenance: { challenge?: { id: string } };
            }) =>
              e.integrity === "verified_at_export" &&
              e.provenance.challenge?.id === code.id,
          ),
      });
      const other = await client();
      await login(other, "buyer", undefined, snapshot.invite);
      results.push({
        scenario: "Another invited shopper cannot read evidence or report",
        passed:
          (await other.get(`/api/evidence?id=${entry.id}`)).status() === 404 &&
          (await other.get(`/api/case-report?id=${item.id}`)).status() === 404,
      });
      await other.dispose();
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        storageState: await operator.storageState(),
      });
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.getByRole("button", { name: "Support", exact: true }).click();
      await page
        .getByRole("link", { name: "Download private case report" })
        .waitFor();
      results.push({
        scenario:
          "Public HTTPS browser displays capture-linked evidence and private report",
        passed: (await page.locator(".evidence-grid").innerText()).includes(
          code.code,
        ),
      });
      await browser.close();
      const reviewer = await client();
      const seller = await client();
      await login(reviewer, "reviewer", snapshot.actor.workspaceId);
      await login(seller, "seller", snapshot.actor.workspaceId);
      const arranged = await reviewer.post("/api/actions", {
        data: {
          action: "authorize_return",
          caseId: item.id,
          decision: "prepaid",
          reason: "Synthetic merchant damage policy covers return shipping.",
          labelReference: "DEMO-LABEL-HOSTED",
        },
      });
      const early = await reviewer.post("/api/actions", {
        data: {
          action: "resolve",
          caseId: item.id,
          remedy: "refund",
          note: "Receipt still pending.",
        },
      });
      const handoff = await operator.post("/api/actions", {
        data: {
          action: "return_shipping",
          caseId: item.id,
          status: "in_transit",
          trackingReference: "DEMO-TRACK-HOSTED",
        },
      });
      const received = await seller.post("/api/actions", {
        data: {
          action: "return_shipping",
          caseId: item.id,
          status: "received",
          trackingReference: "DEMO-TRACK-HOSTED",
        },
      });
      const resolved = await reviewer.post("/api/actions", {
        data: {
          action: "resolve",
          caseId: item.id,
          remedy: "refund",
          note: "Synthetic return received; customer-selected refund under merchant policy.",
        },
      });
      const final = await resolved.json();
      results.push({
        scenario:
          "Hosted prepaid handoff/receipt gates a single customer-selected fixture refund",
        passed:
          arranged.ok() &&
          !early.ok() &&
          handoff.ok() &&
          received.ok() &&
          resolved.ok() &&
          final.snapshot.orders[0].refundedAmount === 2900 &&
          final.result.returnShipment.customerCost === 0,
      });
      await reviewer.dispose();
      await seller.dispose();
      const cookies = (await operator.storageState()).cookies;
      await writeFile(
        ".data/deploy/restart-check.json",
        JSON.stringify({
          baseURL,
          cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
          workspaceId: snapshot.actor.workspaceId,
          orderId: snapshot.orders[0].id,
          evidenceId: entry.id,
          evidenceHash: expectedHash,
          modes: snapshot.modes,
          instance: health.instance,
        }),
        { mode: 0o600 },
      );
    }
    await login(operator, "reviewer", normalSession.actor.workspaceId);
  }
  await normal.dispose();
  await operator.dispose();
  await mkdir(".data/reports", { recursive: true });
  await writeFile(
    ".data/reports/hosted-scenarios.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        build: health.build,
        baseURL,
        modes: { payments: "fixture", ai: "fixture", database: "postgres" },
        requirementIds: ["BG05", "BG07", "engineer-delivery"],
        results,
        limitation:
          "Synthetic payment and media scenarios. No live AI requests, approved sandbox money movement, or staged physical evidence.",
      },
      null,
      2,
    ),
  );
  for (const result of results)
    console.log(`${result.passed ? "PASS" : "FAIL"}: ${result.scenario}`);
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Hosted scenario verification failed. Secret-bearing request details are withheld.",
  );
  process.exitCode = 1;
});
