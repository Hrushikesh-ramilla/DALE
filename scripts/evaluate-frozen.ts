import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { canonicalModel } from "../src/domain/identification";
import { searchCatalog } from "../src/domain/catalog";
import { comparisonFacts } from "../src/domain/conversation";
import { scanMessage } from "../src/domain/scams";
import { analyzeClaims } from "../src/domain/claims";
const directory = "fixtures/evaluation/v1";
const manifest = JSON.parse(
  await readFile(`${directory}/manifest.json`, "utf8"),
);
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error(
    "No provider/network call is allowed in the frozen rule evaluator.",
  );
};
const results: {
  id: string;
  requirement: string;
  passed: boolean;
  expected: unknown;
  observed: unknown;
}[] = [];
const files: Record<string, unknown> = {};
for (const file of manifest.files) {
  const bytes = await readFile(`${directory}/${file.file}`);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.sha256,
    "Frozen corpus integrity failed.",
  );
  const cases = JSON.parse(bytes.toString("utf8"));
  assert.equal(cases.length, file.count);
  files[file.file] = cases;
}
const shopping = z
  .array(
    z.discriminatedUnion("kind", [
      z.object({
        id: z.string(),
        kind: z.literal("catalog"),
        input: z.object({
          model: z.string(),
          category: z.string(),
          budget: z.number(),
        }),
        expected: z.array(z.string()),
      }),
      z.object({
        id: z.string(),
        kind: z.literal("canonical_label"),
        input: z.object({ text: z.string() }),
        expected: z.string().nullable(),
      }),
    ]),
  )
  .parse(files["shopping.json"]);
let grounded = 0;
for (const item of shopping) {
  let observed: unknown;
  let passed: boolean;
  if (item.kind === "catalog") {
    const products = searchCatalog(item.input);
    observed = products.map((product) => product.id);
    const facts = comparisonFacts(products, item.input.model);
    const grounding = facts.every((row) =>
      products.some(
        (product) =>
          row.productId === product.id &&
          row.source === product.source &&
          row.price === product.price &&
          JSON.stringify(row.specs) === JSON.stringify(product.specs),
      ),
    );
    if (grounding) grounded++;
    passed =
      grounding && JSON.stringify(observed) === JSON.stringify(item.expected);
  } else {
    observed = canonicalModel(item.input.text);
    passed = observed === item.expected;
  }
  results.push({
    id: item.id,
    requirement: item.kind === "catalog" ? "BG04/BG06" : "BG06",
    passed,
    expected: item.expected,
    observed,
  });
}
const messages = z
  .array(
    z.object({
      id: z.string(),
      input: z.string(),
      expectedSuspicious: z.boolean(),
      templateFamily: z.number(),
    }),
  )
  .parse(files["messages.json"]);
const confusion = {
  truePositive: 0,
  falseNegative: 0,
  falsePositive: 0,
  trueNegative: 0,
};
for (const item of messages) {
  const observed = scanMessage(item.input).level !== "low";
  confusion[
    item.expectedSuspicious
      ? observed
        ? "truePositive"
        : "falseNegative"
      : observed
        ? "falsePositive"
        : "trueNegative"
  ]++;
  results.push({
    id: item.id,
    requirement: "BG03",
    passed: observed === item.expectedSuspicious,
    expected: item.expectedSuspicious,
    observed,
  });
}
const evidenceSchema = z.object({
  id: z.string(),
  checkpoint: z.enum([
    "seller_dispatch",
    "buyer_receipt",
    "buyer_return",
    "seller_return",
  ]),
  serial: z.string(),
  note: z.string(),
  hash: z.string(),
  createdAt: z.string(),
});
const claims = z
  .array(
    z.object({
      id: z.string(),
      profile: z.string(),
      input: z.array(evidenceSchema),
      expected: z.enum(["contradicted", "insufficient"]),
    }),
  )
  .parse(files["claims.json"]);
const claimConfusion = {
  contradicted: { contradicted: 0, insufficient: 0, supported: 0 },
  insufficient: { contradicted: 0, insufficient: 0, supported: 0 },
};
let claimGrounding = 0;
for (const item of claims) {
  const result = analyzeClaims(item.input);
  claimConfusion[item.expected][result.outcome]++;
  const grounded =
    result.sources.every((source) =>
      item.input.some((record) => record.id === source),
    ) &&
    result.observations.some((observation) =>
      observation.includes("cannot be established"),
    );
  if (grounded) claimGrounding++;
  results.push({
    id: item.id,
    requirement: "BG05",
    passed:
      result.outcome === item.expected &&
      grounded &&
      result.nextStep.includes("review"),
    expected: item.expected,
    observed: result.outcome,
  });
}
const unique = new Set(results.map((result) => result.id));
assert.equal(unique.size, 300);
assert.equal(results.length, 300);
function wilson(successes: number, total: number) {
  const z = 1.96;
  const proportion = successes / total;
  const denominator = 1 + z ** 2 / total;
  const center = (proportion + z ** 2 / (2 * total)) / denominator;
  const half =
    (z *
      Math.sqrt(
        (proportion * (1 - proportion)) / total + z ** 2 / (4 * total ** 2),
      )) /
    denominator;
  return [Math.max(0, center - half), Math.min(1, center + half)].map((value) =>
    Number(value.toFixed(4)),
  );
}
const passed = results.filter((result) => result.passed).length;
const report = {
  checkedAt: new Date().toISOString(),
  build: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  corpus: manifest.version,
  datasetHashes: manifest.files,
  environment: `Node ${process.version}`,
  mode: "deterministic; network disabled",
  passed,
  total: results.length,
  shopping: {
    passed: results.slice(0, 100).filter((result) => result.passed).length,
    total: 100,
    groundedComparisons: grounded,
    catalogCases: 80,
    canonicalTextCases: 20,
    liveOcrCasesExecuted: 0,
  },
  scams: {
    confusion,
    recall: confusion.truePositive / 50,
    falseWarningRate: confusion.falsePositive / 50,
    descriptiveWilson95: {
      recall: wilson(confusion.truePositive, 50),
      falseWarningRate: wilson(confusion.falsePositive, 50),
    },
  },
  claims: {
    confusion: claimConfusion,
    sourceGrounded: claimGrounding,
    total: 100,
    humanLabels: 0,
    financialActions: 0,
  },
  gates: {
    deterministicCases: passed === 300,
    syntheticScamRecall: confusion.truePositive / 50 >= 0.9,
    syntheticFalseWarnings: confusion.falsePositive / 50 <= 0.05,
    liveModelAccuracy: "not executed: owner no-spend quota gate",
    physicalClaimsAndHumanAgreement:
      "not executed: independent human/physical evidence required",
  },
  limitations: [
    manifest.developmentSeparation,
    "Correlated templates mean these descriptive intervals are not real-world confidence guarantees. No learned-model accuracy, physical truth, fraud detection, human agreement or actual financial integration is established.",
  ],
  failureExamples: results.filter((result) => !result.passed).slice(0, 20),
  results,
};
await mkdir(".data/reports", { recursive: true });
await writeFile(
  ".data/reports/frozen-evaluation.json",
  JSON.stringify(report, null, 2) + "\n",
);
globalThis.fetch = originalFetch;
console.log(
  `${passed}/300 frozen synthetic records passed; scam recall ${confusion.truePositive}/50, false warnings ${confusion.falsePositive}/50. No live model or physical-truth accuracy claimed.`,
);
if (passed !== 300) process.exitCode = 1;
