import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { request } from "@playwright/test";
import type { snapshot } from "../src/server/service";
import { knownModels } from "../src/domain/catalog";

// Interrupt only the local fixture child recorded by our preview supervisor.
// The parent stays running, and no database or customer record is deleted.
if (process.argv[2] !== "--interrupt-owned-preview")
  throw new Error(
    "Pass --interrupt-owned-preview to test one actual local process restart.",
  );
const baseURL = "http://localhost:3000";
const context = await request.newContext({
  baseURL,
  extraHTTPHeaders: { Origin: baseURL },
});
const anonymous = await request.newContext({ baseURL });
const checks: { scenario: string; passed: boolean }[] = [];
const check = (scenario: string, passed: boolean) => {
  checks.push({ scenario, passed });
  if (!passed) throw new Error(`Verification failed: ${scenario}`);
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const persistent = (state: Awaited<ReturnType<typeof snapshot>>) => ({
  actor: state.actor,
  brief: state.brief,
  runs: state.agentRuns,
  conversation: state.conversation,
  orders: state.orders,
  cases: state.cases,
});
async function main() {
  try {
    const before = await (await context.get("/api/health")).json();
    check("Production preview is ready", before.status === "ready");
    const launch = await context.post("/api/demo", {
      data: { action: "launch", kind: "identifier_conflict" },
    });
    check("Owned evidence/return scenario launches", launch.ok());
    const state: Awaited<ReturnType<typeof snapshot>> = await launch.json();
    check(
      "Preview exercises only synthetic adapters",
      state.fixtureWorkspace &&
        state.modes.ai === "fixture" &&
        state.modes.payments === "fixture",
    );
    const agent = await context.post("/api/agent", {
      data: {
        task: "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping. Show my orders.",
        model: knownModels[0],
        budget: 6000,
      },
    });
    check("Composed sourced task runs", agent.ok());
    const run = (await agent.json()).run;
    check(
      "Product/group/order tools execute without a purchase",
      run.toolCalls.map((call: { tool: string }) => call.tool).join(",") ===
        "research_products,discover_groups,inspect_orders",
    );
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await context.post("/api/evidence", {
      multipart: {
        caseId: state.cases[0].id,
        checkpoint: "buyer_receipt",
        serial: "PREVIEW-RECOVERY",
        note: "Synthetic image for local persistence verification; not physical evidence.",
        image: {
          name: "preview-recovery.png",
          mimeType: "image/png",
          buffer: image,
        },
      },
    });
    check("Private original is stored", upload.ok());
    const evidenceId = (await upload.json()).result.id;
    const originalURL = `/api/evidence?id=${evidenceId}`;
    check(
      "Anonymous original access is rejected",
      !(await anonymous.get(originalURL)).ok(),
    );
    const saved = await (await context.get("/api/session")).json();
    const controller = JSON.parse(
      await readFile(".data/local-preview/state.json", "utf8"),
    );
    check(
      "Supervisor owns a distinct running application child",
      controller.status === "running" &&
        Number.isInteger(controller.childPid) &&
        controller.pid !== controller.childPid,
    );
    process.kill(controller.childPid);
    let after;
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      try {
        const response = await context.get("/api/health", { timeout: 2500 });
        if (response.ok()) {
          const result = await response.json();
          if (
            result.status === "ready" &&
            result.instance !== before.instance
          ) {
            after = result;
            break;
          }
        }
      } catch {
        /* Expected connection failure while the child restarts. */
      }
      await new Promise((done) => setTimeout(done, 500));
    }
    check(
      "Unexpected exit automatically recovers to a new ready instance",
      Boolean(after),
    );
    const response = await context.get("/api/session");
    check(
      "Authenticated session and complete shopper state survive",
      response.ok() &&
        hash(persistent(await response.json())) === hash(persistent(saved)),
    );
    const original = await context.get(originalURL);
    check(
      "Private original retains identical SHA-256",
      original.ok() &&
        createHash("sha256")
          .update(await original.body())
          .digest("hex") === createHash("sha256").update(image).digest("hex"),
    );
    const recovered = JSON.parse(
      await readFile(".data/local-preview/state.json", "utf8"),
    );
    check(
      "Same supervisor records the restart",
      recovered.pid === controller.pid &&
        recovered.restarts === controller.restarts + 1,
    );
  } finally {
    await mkdir(".data/reports", { recursive: true });
    await writeFile(
      ".data/reports/local-preview-recovery.json",
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          checks,
          limitation:
            "Local fixture process recovery and database persistence; no live provider, physical-evidence, human or restore acceptance.",
        },
        null,
        2,
      ),
    );
    await context.dispose();
    await anonymous.dispose();
  }
  console.log(
    `${checks.length}/${checks.length} local preview recovery checks passed.`,
  );
}
await main();
