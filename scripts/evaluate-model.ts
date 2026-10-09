import "dotenv/config";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { searchCatalog } from "../src/domain/catalog";
import { canonicalModel } from "../src/domain/identification";
import {
  shoppingSummary,
  scamAnalysis,
  evidenceAnalysis,
  modelLabelExtraction,
} from "../src/server/ai";
import type { Evidence } from "../src/domain/claims";
if (process.argv.includes("--prepared")) {
  const prepared = JSON.parse(
    await readFile(".data/self-hosted/candidate.json", "utf8"),
  );
  const candidates = JSON.parse(
    await readFile("deploy/model-candidates.json", "utf8"),
  );
  const candidate = candidates.candidates[prepared.id];
  assert.ok(
    candidate &&
      prepared.alias === candidate.alias &&
      prepared.runtime === candidates.runtime.version,
    "Prepare the pinned candidate first.",
  );
  process.env.AI_PROVIDER = "self_hosted";
  process.env.AI_MODEL = candidate.alias;
  process.env.AI_SELF_HOSTED_PROFILE = candidate.profile || "structured";
  process.env.AI_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
  process.env.AI_SELF_HOSTED_API_KEY = (
    await readFile(".data/self-hosted/api-key", "utf8")
  ).trim();
  process.env.EVAL_PROVIDER_MODE = "live";
}
const live = process.env.EVAL_PROVIDER_MODE === "live";
if (
  live &&
  process.env.AI_PROVIDER !== "self_hosted" &&
  (process.env.AI_FREE_QUOTA_CONFIRMED !== "true" ||
    process.env.AI_BILLING_DISABLED !== "true")
)
  throw new Error(
    "Live evaluation disabled: owner must confirm available no-spend quota first. No request was sent.",
  );
const originalFetch = globalThis.fetch;
let mockPayload: unknown;
let requestCount = 0;
if (!live) {
  process.env.AI_PROVIDER = "cloud";
  process.env.AI_API_KEY = "mock-evaluation-only";
  process.env.AI_MODEL = "gemini-contract-fixture";
  delete process.env.AI_API_BASE_URL;
  globalThis.fetch = async (url, init) => {
    assert.equal(
      new URL(String(url)).hostname,
      "generativelanguage.googleapis.com",
    );
    const body = JSON.parse(String(init?.body));
    assert.ok(body.contents[0].parts.length >= 1);
    assert.ok(body.systemInstruction.parts[0].text.includes("untrusted"));
    requestCount++;
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(mockPayload) }] },
        },
      ],
    });
  };
}
const manifest = JSON.parse(
  await readFile("fixtures/evaluation/v1/manifest.json", "utf8"),
);
const items: {
  id: string;
  kind?: string;
  input: unknown;
  expected?: unknown;
  expectedSuspicious?: boolean;
}[] = [];
for (const file of manifest.files) {
  const bytes = await readFile(`fixtures/evaluation/v1/${file.file}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
  items.push(...JSON.parse(bytes.toString("utf8")));
}
const vision = JSON.parse(
  await readFile("fixtures/evaluation/vision-v1/manifest.json", "utf8"),
);
const results: {
  id: string;
  repetition: number;
  passed: boolean;
  durationMs: number;
  failure?: string;
}[] = [];
await mkdir(".data/reports", { recursive: true });
const source = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const signature = createHash("sha256")
  .update(
    JSON.stringify({
      source,
      model: process.env.AI_MODEL,
      profile: process.env.AI_SELF_HOSTED_PROFILE,
      live,
      manifest,
      vision,
    }),
  )
  .digest("hex");
const progressPath = `.data/reports/${live ? "live" : "mock"}-model-evaluation-progress.json`;
if (process.argv.includes("--resume")) {
  const checkpoint = JSON.parse(await readFile(progressPath, "utf8"));
  assert.equal(
    checkpoint.signature,
    signature,
    "Checkpoint configuration/source/corpus changed; preserve it and start a new evaluation.",
  );
  const keys = new Set<string>();
  for (const record of checkpoint.results) {
    assert.ok(
      manifest.liveSubset.caseIds.includes(record.id) &&
        [1, 2, 3].includes(record.repetition) &&
        typeof record.passed === "boolean" &&
        Number.isFinite(record.durationMs) &&
        record.durationMs >= 0,
      "Invalid checkpoint record.",
    );
    const key = `${record.repetition}:${record.id}`;
    assert.ok(!keys.has(key), "Duplicate checkpoint record.");
    keys.add(key);
    results.push(record);
  }
  assert.ok(
    results.length <= 180,
    "Checkpoint exceeds the frozen evaluation size.",
  );
}
const resumedCount = results.length;
for (let repetition = 1; repetition <= 3; repetition++)
  for (const id of manifest.liveSubset.caseIds) {
    if (
      results.some(
        (record) => record.id === id && record.repetition === repetition,
      )
    )
      continue;
    const item = items.find((item) => item.id === id);
    assert.ok(item);
    const started = performance.now();
    let passed = false;
    try {
      if (item.kind === "catalog") {
        const input = item.input as {
          model: string;
          category: string;
          budget: number;
        };
        const products = searchCatalog(input);
        mockPayload = {
          summary: "A deliberately untrusted provider summary",
          sources: products.slice(0, 3).map((p) => p.source),
        };
        const result = await shoppingSummary(
          "Use the selected budget and model",
          products,
          input.model,
          "live",
        );
        passed =
          result.mode === "live" &&
          result.sources.every((source) =>
            products.some((product) => source === product.source),
          ) &&
          !result.summary.includes("deliberately untrusted");
      } else if (item.kind === "canonical_label") {
        const fixture = vision.fixtures.find(
          (fixture: { caseId: string }) => fixture.caseId === item.id,
        );
        assert.ok(fixture);
        const bytes = await readFile(
          `fixtures/evaluation/vision-v1/${fixture.file}`,
        );
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          fixture.sha256,
        );
        mockPayload = {
          readable: fixture.readable,
          labels: fixture.readable
            ? [(item.input as { text: string }).text]
            : [],
        };
        const result = await modelLabelExtraction({ bytes, mime: "image/png" });
        const resolved = [...new Set(result.labels.map(canonicalModel))];
        const proposed =
          result.readable && resolved.length === 1 && resolved[0]
            ? resolved[0]
            : null;
        passed = proposed === item.expected;
      } else if (typeof item.input === "string") {
        mockPayload = {
          signals: item.expectedSuspicious ? ["outside_checkout"] : [],
        };
        const result = await scamAnalysis(item.input, "live");
        passed =
          result.mode === "live" &&
          (result.level !== "low") === item.expectedSuspicious;
      } else {
        const records = item.input as Evidence[];
        mockPayload = { observations: [] };
        const result = await evidenceAnalysis(records, [], "live");
        passed =
          result.mode === "live" &&
          result.outcome === item.expected &&
          result.sources.every((source) =>
            records.some((record) => record.id === source),
          ) &&
          result.observations.some((observation) =>
            observation.includes("cannot be established"),
          );
      }
      results.push({
        id,
        repetition,
        passed,
        durationMs: Number((performance.now() - started).toFixed(2)),
      });
    } catch {
      results.push({
        id,
        repetition,
        passed: false,
        durationMs: Number((performance.now() - started).toFixed(2)),
        failure:
          "Provider/schema/grounding failure; sensitive response withheld",
      });
    }
    await writeFile(
      progressPath,
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          signature,
          source,
          model: process.env.AI_MODEL,
          mode: live ? "live" : "mock",
          completed: results.length,
          total: 180,
          passed: results.filter((record) => record.passed).length,
          complete: false,
          results,
        },
        null,
        2,
      ),
    );
    console.log(
      `Evaluation ${results.length}/180: ${results.filter((record) => record.passed).length} passed.`,
    );
  }
// The subset stays fixed across all repetitions; this is not a search for a favorable seed.
assert.equal(manifest.liveSubset.caseIds.length, 60);
assert.equal(results.length, 180);
if (!live) assert.equal(requestCount, 180 - resumedCount);
const passed = results.filter((result) => result.passed).length;
const variability = manifest.liveSubset.caseIds.filter(
  (id: string) =>
    new Set(
      results
        .filter((result) => result.id === id)
        .map((result) => result.passed),
    ).size > 1,
);
await mkdir(".data/reports", { recursive: true });
await writeFile(
  `.data/reports/${live ? "live" : "mock"}-model-evaluation.json`,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      build: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      corpus: manifest.version,
      visionCorpus: vision.version,
      mode: live
        ? "live provider"
        : "mock native Gemini transport; no network/spend",
      model: process.env.AI_MODEL,
      provider: process.env.AI_PROVIDER,
      evaluationRole:
        "Frozen regression, not an untouched holdout: vision-v1 development images informed OCR changes. A new disjoint holdout is required for final accuracy acceptance.",
      prompts: {
        shopping: "catalog-facts-v2",
        scams: "advisory-categories-v2",
        claims: "claims-v2",
        labels: "ocr-identifier-v2",
      },
      repetitions: 3,
      passed,
      total: 180,
      casesWithPassVariability: variability,
      results,
      limitation: live
        ? "Bounded synthetic protocol agreement; claim results measure recorded comparisons, not physical truth or independent human agreement. Three repeats do not establish generalization."
        : "Mock outputs are scripted contract fixtures. This verifies runner/request/schema/grounding behavior, not model accuracy, vision accuracy or output variability.",
    },
    null,
    2,
  ) + "\n",
);
globalThis.fetch = originalFetch;
console.log(
  `${passed}/180 preregistered ${live ? "live" : "mock native-adapter"} evaluation checks passed across three repetitions.`,
);
if (passed !== 180) process.exitCode = 1;
