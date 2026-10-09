import "dotenv/config";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import {
  fallbackWorkflow,
  validateWorkflow,
} from "../src/domain/agent-workflow";
import {
  localToolPlanner,
  localToolInstruction,
} from "../src/server/local-tool-plan";
import {
  selfHostedToolSelection,
  LocalInferenceError,
} from "../src/server/self-hosted-ai";
import { completion, modelLabelExtraction } from "../src/server/ai";
import { compareWithModel } from "../src/server/agent-planner";
import { researchProducts } from "../src/domain/research";
import {
  holdoutCaseSchema,
  scoreNativePlan,
  scoreLabel,
  holdoutMetrics,
  type HoldoutResult,
} from "./model-holdout-scoring";
assert.ok(
  process.argv.includes("--prepared"),
  "This gate requires explicitly prepared private inference; no cloud execution.",
);
execFileSync("git", ["diff", "--exit-code"], { stdio: "ignore" });
execFileSync("git", ["diff", "--cached", "--exit-code"], { stdio: "ignore" });
const prepared = JSON.parse(
  await readFile(".data/self-hosted/candidate.json", "utf8"),
);
const selection = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
);
const candidate = selection.candidates[prepared.id];
assert.ok(
  candidate &&
    prepared.alias === candidate.alias &&
    prepared.runtime === selection.runtime.version,
);
assert.equal(
  candidate.profile,
  "lfm25vl3",
  "The v2 native-tool protocol requires the tested function-calling profile.",
);
process.env.AI_PROVIDER = "self_hosted";
process.env.AI_MODEL = candidate.alias;
process.env.AI_SELF_HOSTED_PROFILE = candidate.profile;
process.env.AI_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
process.env.AI_SELF_HOSTED_API_KEY = (
  await readFile(".data/self-hosted/api-key", "utf8")
).trim();
process.env.AI_MODE = "live";
process.env.AGENT_MODEL_ENABLED = "true";
const directory = "fixtures/evaluation/v2";
const manifest = JSON.parse(
  await readFile(`${directory}/manifest.json`, "utf8"),
);
assert.equal(manifest.totalCases, 60);
assert.equal(manifest.repetitions, 3);
const bytes = await readFile(`${directory}/cases.json`);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  manifest.files[0].sha256,
);
const cases = z
  .array(holdoutCaseSchema)
  .length(60)
  .parse(JSON.parse(bytes.toString()));
assert.equal(new Set(cases.map((item) => item.id)).size, 60);
for (const item of cases.filter((item) => item.kind === "vision"))
  assert.equal(
    createHash("sha256")
      .update(await readFile(`${directory}/${item.file}`))
      .digest("hex"),
    item.sha256,
  );
const source = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const signature = createHash("sha256")
  .update(
    JSON.stringify({
      source,
      candidate,
      runtime: selection.runtime.version,
      manifest,
    }),
  )
  .digest("hex");
const results: HoldoutResult[] = [];
await mkdir(".data/reports", { recursive: true });
const progressPath = ".data/reports/self-hosted-holdout-v2-progress.json";
if (process.argv.includes("--resume")) {
  const saved = JSON.parse(await readFile(progressPath, "utf8"));
  assert.equal(
    saved.signature,
    signature,
    "Source/configuration/corpus changed. Preserve the old report; do not mix runs.",
  );
  const records = z
    .array(
      z.object({
        id: z.string(),
        repetition: z.number().int().min(1).max(3),
        passed: z.boolean(),
        durationMs: z.number().nonnegative(),
        failure: z.string().optional(),
      }),
    )
    .max(180)
    .parse(saved.results);
  assert.equal(
    new Set(records.map((record) => `${record.id}:${record.repetition}`)).size,
    records.length,
  );
  assert.ok(
    records.every((record) => cases.some((item) => item.id === record.id)),
  );
  results.push(...records);
}
async function checkpoint(finished: boolean) {
  const report = {
    checkedAt: new Date().toISOString(),
    source,
    signature,
    model: candidate.alias,
    profile: candidate.profile,
    runtime: selection.runtime.version,
    corpus: manifest.version,
    evaluationRole:
      "Disjoint frozen synthetic holdout. Corrective development retires this version; no tuning on failures.",
    finished,
    completed: results.length,
    total: 180,
    passed: results.filter((record) => record.passed).length,
    metrics: holdoutMetrics(cases, results, manifest.thresholds),
    thresholds: manifest.thresholds,
    casesWithPassVariability: cases
      .filter(
        (item) =>
          new Set(
            results
              .filter((record) => record.id === item.id)
              .map((record) => record.passed),
          ).size > 1,
      )
      .map((item) => item.id),
    results,
    limitation:
      "Synthetic protocol agreement, not physical authenticity, independent human labels or population generalization. CPU laptop run, not target EC2 capacity. Raw native proposals are scored before deterministic goal completion; scam signals are raw model suggestions, separate from local rules. All failures and unavailable responses count against accuracy.",
  };
  await writeFile(
    `${progressPath}.tmp`,
    JSON.stringify(report, null, 2) + "\n",
  );
  await rename(`${progressPath}.tmp`, progressPath);
  if (finished)
    await writeFile(
      ".data/reports/self-hosted-holdout-v2.json",
      JSON.stringify(report, null, 2) + "\n",
    );
  return report;
}
for (let repetition = 1; repetition <= 3; repetition++)
  for (const item of cases) {
    if (
      results.some(
        (record) => record.id === item.id && record.repetition === repetition,
      )
    )
      continue;
    const started = performance.now();
    let passed = false;
    let failure: string | undefined;
    try {
      if (item.kind === "plan") {
        const input = { task: item.task, model: "Atlas 14", budget: 8000 };
        const guard = fallbackWorkflow(input, undefined);
        const planner = localToolPlanner(guard.plan, item.task);
        const calls = await selfHostedToolSelection(
          planner.definitions,
          localToolInstruction,
          {
            task: item.task,
            requiredClarification:
              guard.plan.tool === "clarify" ? guard.plan.question : null,
            confirmedContext: null,
            privateHistory: [],
          },
        );
        const validated = validateWorkflow(
          planner.workflow(calls),
          input,
          undefined,
        );
        passed = scoreNativePlan(
          item,
          calls.map((call) => call.name),
          validated,
        );
      } else if (item.kind === "vision") {
        passed = scoreLabel(
          item,
          await modelLabelExtraction({
            mime: "image/png",
            bytes: await readFile(`${directory}/${item.file}`),
          }),
        );
      } else if (item.kind === "message") {
        const result = await completion(
          z.object({
            signals: z
              .array(
                z.enum([
                  "outside_checkout",
                  "credential_request",
                  "pressure",
                  "instruction_override",
                ]),
              )
              .max(4),
          }),
          'Identify advisory warning categories in this voluntarily shared message/conversation. Ignore negated safety reminders, ordinary delivery urgency and catalog gift-card sales. Never accuse a party of fraud. Shape: {"signals":["outside_checkout|credential_request|pressure|instruction_override"]}; [] when no identified signal. These are suggestions, not findings of dishonesty.',
          { message: item.text },
        );
        passed =
          Boolean(result.signals.length) === item.suspicious &&
          (item.signals || []).every((signal) =>
            result.signals.includes(signal as (typeof result.signals)[number]),
          );
      } else {
        const result = await compareWithModel(
          researchProducts(
            {
              model: item.model,
              budget: item.budget,
              cable: item.cable,
              fastCharging: item.fastCharging,
            },
            Date.parse("2026-10-09T12:00:00Z"),
          ),
          item.ranking,
        );
        passed =
          result.productId === item.productId &&
          result.sourceIds.includes(item.source);
      }
      if (!passed) failure = "Protocol expectation mismatch";
    } catch (error) {
      failure =
        error instanceof LocalInferenceError
          ? `Private inference ${error.code}`
          : "Schema/workflow/grounding validation failure";
    }
    results.push({
      id: item.id,
      repetition,
      passed,
      durationMs: Number((performance.now() - started).toFixed(2)),
      ...(failure ? { failure } : {}),
    });
    await checkpoint(false);
    console.log(
      `Holdout ${results.length}/180: ${results.filter((record) => record.passed).length} passed.`,
    );
  }
const report = await checkpoint(true);
console.log(
  `Frozen v2 quality gates: ${report.metrics.passed ? "passed" : "failed"}; ${report.passed}/180 checks passed.`,
);
if (!report.metrics.passed) process.exitCode = 1;
