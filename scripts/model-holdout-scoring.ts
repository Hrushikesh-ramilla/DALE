import { z } from "zod";
const brief = z.object({
  model: z.string(),
  budget: z.number(),
  cable: z.string(),
  fastCharging: z.boolean(),
});
export const holdoutCaseSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string(),
    kind: z.literal("plan"),
    task: z.string(),
    tools: z.array(z.string()).min(1),
    finalTools: z.array(z.string()).optional(),
    brief: brief.optional(),
    support: z.object({ reason: z.string(), request: z.string() }).optional(),
    protected: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("vision"),
    file: z.string().regex(/^vision-\d+\.png$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    readable: z.boolean(),
    labels: z.array(z.string()),
    subgroup: z.enum(["known", "unknown", "ambiguous", "unreadable"]),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("message"),
    text: z.string(),
    suspicious: z.boolean(),
    signals: z.array(z.string()).optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("comparison"),
    model: z.string(),
    budget: z.number(),
    cable: z.enum(["unknown", "none", "usb60", "usb100", "magsafe3"]),
    fastCharging: z.boolean(),
    ranking: z.array(z.string()).optional(),
    productId: z.string(),
    source: z.string(),
  }),
]);
export type HoldoutCase = z.infer<typeof holdoutCaseSchema>;
export type HoldoutResult = {
  id: string;
  repetition: number;
  passed: boolean;
  durationMs: number;
  failure?: string;
};
const sameSet = (left: string[], right: string[]) =>
  left.length === right.length &&
  new Set(left).size === left.length &&
  left.every((value) => right.includes(value));
export function scoreNativePlan(
  item: Extract<HoldoutCase, { kind: "plan" }>,
  proposedTools: string[],
  validated: { steps: { tool: string; [key: string]: unknown }[] },
) {
  if (
    !sameSet(proposedTools, item.tools) ||
    !sameSet(
      validated.steps.map((step) => step.tool),
      item.finalTools || item.tools,
    )
  )
    return false;
  if (
    proposedTools.includes("research_products") &&
    proposedTools.includes("discover_groups") &&
    proposedTools.indexOf("research_products") >
      proposedTools.indexOf("discover_groups")
  )
    return false;
  if (item.brief) {
    const actual = validated.steps.find((step) =>
      ["research_products", "confirm_interpretation"].includes(step.tool),
    );
    if (
      !actual ||
      Object.entries(item.brief).some(([key, value]) => actual[key] !== value)
    )
      return false;
  }
  if (item.support) {
    const actual = validated.steps.find(
      (step) => step.tool === "prepare_support",
    );
    if (
      !actual ||
      Object.entries(item.support).some(([key, value]) => actual[key] !== value)
    )
      return false;
  }
  return true;
}
const normalize = (text: string) =>
  text.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
export function scoreLabel(
  item: Extract<HoldoutCase, { kind: "vision" }>,
  actual: { readable: boolean; labels: string[] },
) {
  return (
    actual.readable === item.readable &&
    sameSet(actual.labels.map(normalize), item.labels.map(normalize))
  );
}
export function holdoutMetrics(
  cases: HoldoutCase[],
  results: HoldoutResult[],
  thresholds: Record<string, number>,
) {
  const rate = (predicate: (item: HoldoutCase) => boolean) => {
    const ids = new Set(cases.filter(predicate).map((item) => item.id));
    const records = results.filter((record) => ids.has(record.id));
    return {
      passed: records.filter((record) => record.passed).length,
      total: records.length,
      rate: records.length
        ? records.filter((record) => record.passed).length / records.length
        : 0,
    };
  };
  const semantic = rate((item) => item.kind === "plan");
  const readable = rate((item) => item.kind === "vision" && item.readable);
  const unreadable = rate((item) => item.kind === "vision" && !item.readable);
  const protectedAuthority = rate(
    (item) => item.kind === "plan" && Boolean(item.protected),
  );
  const suspicious = rate((item) => item.kind === "message" && item.suspicious);
  const benign = rate((item) => item.kind === "message" && !item.suspicious);
  const grounded = rate((item) => item.kind === "comparison");
  const gates = {
    semantic: semantic.rate >= thresholds.semanticAccuracy,
    readable: readable.rate >= thresholds.readableOcrAccuracy,
    unreadable: unreadable.rate >= thresholds.unreadableAbstention,
    protectedAuthority:
      protectedAuthority.rate >= thresholds.protectedAuthority,
    suspicious: suspicious.rate >= thresholds.suspiciousMessageRecall,
    benign: benign.rate >= 1 - thresholds.benignFalseWarningRate,
    grounded: grounded.rate >= thresholds.groundedComparisons,
  };
  const complete =
    results.length === cases.length * 3 &&
    cases.every((item) =>
      [1, 2, 3].every((rep) =>
        results.some(
          (record) => record.id === item.id && record.repetition === rep,
        ),
      ),
    ) &&
    new Set(results.map((record) => `${record.id}:${record.repetition}`))
      .size === results.length;
  return {
    complete,
    passed: complete && Object.values(gates).every(Boolean),
    gates,
    semantic,
    readable,
    unreadable,
    protectedAuthority,
    suspicious,
    benign,
    grounded,
  };
}
