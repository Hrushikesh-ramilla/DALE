import { expect, it } from "vitest";
import {
  realModels,
  realProducts,
  researchProducts,
} from "../src/domain/research";
import { searchCatalog, productById } from "../src/domain/catalog";
import { mentionedModels } from "../src/domain/identification";
const need = {
  model: realModels[0],
  budget: 5000,
  cable: "magsafe3" as const,
  fastCharging: false,
};
it("retrieves actual manufacturer records without blending sample products", () => {
  expect(searchCatalog(need).map((p) => p.id)).toEqual(["R001"]);
  expect(productById("R001").source).toMatch(/^apple:/);
  expect(mentionedModels("MacBook Air M2 13-inch")).toEqual([realModels[0]]);
  expect(mentionedModels("MacBook Air M2 15-inch")).toEqual([realModels[1]]);
});
it("explains every alternative, cable cost and the normal/fast charging difference", () => {
  const report = researchProducts(need);
  expect(
    report.findings.filter((f) => f.eligible).map((f) => f.productId),
  ).toEqual(["R001"]);
  expect(
    report.findings.find((f) => f.productId === "R002")?.reasons.join(),
  ).toContain("$9.00");
  const missingCable = researchProducts({ ...need, cable: "none" });
  expect(missingCable.findings.every((f) => !f.eligible)).toBe(true);
  expect(missingCable.findings[2].reasons.join()).toContain("$8.00");
  const bundle = researchProducts({ ...need, cable: "none", budget: 6000 });
  expect(
    bundle.findings.filter((f) => f.eligible).map((f) => f.productId),
  ).toEqual(["R003"]);
  expect(
    researchProducts({ ...need, fastCharging: true }).findings.every(
      (f) => !f.eligible,
    ),
  ).toBe(true);
  expect(
    researchProducts({ ...need, budget: 6000, fastCharging: true })
      .findings.filter((f) => f.eligible)
      .map((f) => f.productId),
  ).toEqual(["R002"]);
  expect(
    researchProducts({
      ...need,
      cable: "usb60",
      budget: 6000,
      fastCharging: true,
    }).findings.every((f) => !f.eligible),
  ).toBe(true);
});
it("refuses unsupported models, unresolved cables and expired evidence", () => {
  expect(
    researchProducts({ ...need, model: "MacBook Pro M9" }).findings.every(
      (f) => !f.eligible,
    ),
  ).toBe(true);
  expect(
    researchProducts({ ...need, model: realModels[1] }).findings.every(
      (f) => !f.eligible,
    ),
  ).toBe(true);
  expect(
    researchProducts({ ...need, cable: "unknown" }).questions,
  ).toHaveLength(1);
  const expired = researchProducts(need, Date.parse("2026-11-08"));
  expect(expired.freshness).toBe("expired");
  expect(expired.findings.every((f) => !f.eligible)).toBe(true);
});
it("does not promote sponsored offers or let prices change the compatibility evidence", () => {
  const original = realProducts[1].sponsored;
  realProducts[1].sponsored = true;
  try {
    expect(searchCatalog({ ...need, budget: 10000 }).map((p) => p.id)).toEqual([
      "R001",
      "R003",
      "R002",
    ]);
    const report = researchProducts(need);
    for (const finding of report.findings)
      expect(
        finding.sourceIds.every((id) =>
          report.sources.some(
            (s) => s.id === id && s.url.startsWith("https://"),
          ),
        ),
      ).toBe(true);
  } finally {
    realProducts[1].sponsored = original;
  }
});
