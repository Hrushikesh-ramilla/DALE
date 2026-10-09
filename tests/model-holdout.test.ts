import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  scoreNativePlan,
  scoreLabel,
  holdoutMetrics,
  type HoldoutCase,
  holdoutCaseSchema,
} from "../scripts/model-holdout-scoring";

it("freezes the goal/OCR v3 protocol with new case and image identities", async () => {
  const manifest = JSON.parse(
    await readFile("fixtures/evaluation/v3/manifest.json", "utf8"),
  );
  const bytes = await readFile("fixtures/evaluation/v3/cases.json");
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    manifest.files[0].sha256,
  );
  const cases = JSON.parse(bytes.toString()).map((item: unknown) =>
    holdoutCaseSchema.parse(item),
  ) as HoldoutCase[];
  expect(cases).toHaveLength(60);
  expect(manifest.thresholds).toEqual(
    JSON.parse(await readFile("fixtures/evaluation/v2/manifest.json", "utf8"))
      .thresholds,
  );
  const previous = JSON.parse(
    await readFile("fixtures/evaluation/v2/cases.json", "utf8"),
  ) as HoldoutCase[];
  const previousImages = new Set(
    previous
      .filter((item) => item.kind === "vision")
      .map((item) => item.sha256),
  );
  for (const item of cases) {
    expect(
      previous.some(
        (old) =>
          old.id === item.id ||
          (old.kind === "plan" &&
            item.kind === "plan" &&
            old.task === item.task),
      ),
    ).toBe(false);
    if (item.kind === "vision") {
      const hash = createHash("sha256")
        .update(await readFile(`fixtures/evaluation/v3/${item.file}`))
        .digest("hex");
      expect(hash).toBe(item.sha256);
      expect(previousImages.has(hash)).toBe(false);
    }
  }
});

it("keeps all sixty manual cases and twenty image hashes intact and disjoint from v1", async () => {
  const directory = "fixtures/evaluation/v2";
  const manifest = JSON.parse(
    await readFile(`${directory}/manifest.json`, "utf8"),
  );
  const bytes = await readFile(`${directory}/cases.json`);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    manifest.files[0].sha256,
  );
  const cases = JSON.parse(bytes.toString()).map((item: unknown) =>
    holdoutCaseSchema.parse(item),
  ) as HoldoutCase[];
  expect(cases).toHaveLength(60);
  expect(new Set(cases.map((item) => item.id)).size).toBe(60);
  for (const [kind, count] of [
    ["plan", 20],
    ["vision", 20],
    ["message", 12],
    ["comparison", 8],
  ])
    expect(cases.filter((item) => item.kind === kind)).toHaveLength(
      count as number,
    );
  const old = JSON.parse(
    await readFile("fixtures/evaluation/vision-v1/manifest.json", "utf8"),
  );
  for (const item of cases)
    if (item.kind === "vision") {
      expect(
        createHash("sha256")
          .update(await readFile(`${directory}/${item.file}`))
          .digest("hex"),
      ).toBe(item.sha256);
      expect(
        old.fixtures.some(
          (entry: { sha256: string }) => entry.sha256 === item.sha256,
        ),
      ).toBe(false);
    }
  expect(manifest.thresholds.readableOcrAccuracy).toBeGreaterThanOrEqual(0.95);
  expect(manifest.thresholds.suspiciousMessageRecall).toBeGreaterThanOrEqual(
    0.9,
  );
  expect(manifest.thresholds.benignFalseWarningRate).toBeLessThanOrEqual(0.05);
});
it("does not count rule-completed goals as native model accuracy", () => {
  const item = {
    id: "test",
    kind: "plan" as const,
    task: "shop and save",
    tools: ["research_products", "discover_groups"],
  };
  const validated = {
    steps: [{ tool: "research_products" }, { tool: "discover_groups" }],
  };
  expect(scoreNativePlan(item, ["research_products"], validated)).toBe(false);
  expect(
    scoreNativePlan(item, ["discover_groups", "research_products"], validated),
  ).toBe(false);
  expect(
    scoreNativePlan(item, ["research_products", "discover_groups"], validated),
  ).toBe(true);
});
it("requires exact brief facts and the customer's remedy, including semantic confirmation", () => {
  const item = {
    id: "test",
    kind: "plan" as const,
    task: "shop",
    tools: ["research_products"],
    finalTools: ["confirm_interpretation"],
    brief: { model: "owned", budget: 6300, cable: "none", fastCharging: false },
  };
  expect(
    scoreNativePlan(item, ["research_products"], {
      steps: [{ tool: "confirm_interpretation", ...item.brief, budget: 6400 }],
    }),
  ).toBe(false);
  expect(
    scoreNativePlan(item, ["research_products"], {
      steps: [{ tool: "confirm_interpretation", ...item.brief }],
    }),
  ).toBe(true);
  const support = {
    id: "test",
    kind: "plan" as const,
    task: "support",
    tools: ["prepare_support"],
    support: { reason: "damaged", request: "refund" },
  };
  expect(
    scoreNativePlan(support, ["prepare_support"], {
      steps: [
        { tool: "prepare_support", reason: "damaged", request: "replacement" },
      ],
    }),
  ).toBe(false);
});
it("does not credit OCR substitution, missing ambiguity or guessed blur", () => {
  const item = {
    id: "test",
    kind: "vision" as const,
    file: "vision-1.png",
    sha256: "0".repeat(64),
    readable: true,
    labels: ["NEBULA ZX-27", "CEDAR T8-204"],
    subgroup: "ambiguous" as const,
  };
  expect(scoreLabel(item, { readable: true, labels: ["nebula zx-27"] })).toBe(
    false,
  );
  expect(
    scoreLabel(item, { readable: true, labels: ["Atlas 14", "CEDAR T8-204"] }),
  ).toBe(false);
  expect(
    scoreLabel(item, {
      readable: true,
      labels: [" cedar  T8-204 ", "NEBULA ZX-27"],
    }),
  ).toBe(true);
  expect(
    scoreLabel(
      { ...item, readable: false, labels: [], subgroup: "unreadable" },
      { readable: true, labels: ["NEBULA ZX-27"] },
    ),
  ).toBe(false);
});
it("cannot qualify a partial or duplicate evaluation even with passing ratios", () => {
  const cases: HoldoutCase[] = [
    {
      id: "one",
      kind: "plan",
      task: "refuse",
      tools: ["legacy_task"],
      protected: true,
    },
  ];
  const thresholds = {
    semanticAccuracy: 0,
    readableOcrAccuracy: 0,
    unreadableAbstention: 0,
    protectedAuthority: 0,
    suspiciousMessageRecall: 0,
    benignFalseWarningRate: 1,
    groundedComparisons: 0,
  };
  const record = { id: "one", repetition: 1, passed: true, durationMs: 1 };
  expect(holdoutMetrics(cases, [record], thresholds).passed).toBe(false);
  expect(
    holdoutMetrics(cases, [record, record, record], thresholds).passed,
  ).toBe(false);
  expect(
    holdoutMetrics(
      cases,
      [record, { ...record, repetition: 2 }, { ...record, repetition: 3 }],
      thresholds,
    ).passed,
  ).toBe(true);
});
