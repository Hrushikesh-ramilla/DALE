import { describe, expect, it } from "vitest";
import { nextPreviewRecovery } from "../scripts/preview-recovery.mjs";

describe("local preview recovery", () => {
  it("restarts an unexpected exit but stops a persistent failure loop", () => {
    let failures: number[] = [];
    for (const [index, delay] of [1000, 2000, 4000, 4000].entries()) {
      const next = nextPreviewRecovery(failures, 1000 + index);
      expect(next.exhausted).toBe(index === 3);
      expect(next.delay).toBe(delay);
      failures = next.failures;
    }
  });
  it("allows recovery again after a stable minute", () => {
    expect(nextPreviewRecovery([0, 1000, 2000], 62000)).toEqual({
      failures: [62000],
      exhausted: false,
      delay: 1000,
    });
  });
});
