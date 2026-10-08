import { expect, it } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recordLiveChecks } from "../scripts/live-check-report";
it("replaces stale success after failure, redacts secrets and stops further calls", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-verification-"));
  try {
    const path = join(directory, "report.json");
    await writeFile(path, JSON.stringify({ complete: true, checkedAt: "old" }));
    let laterCalls = 0;
    const report = await recordLiveChecks(path, [
      { scenario: "Text", check: async () => true },
      {
        scenario: "Vision",
        check: async () => {
          throw new Error("HTTP 503 api-key=secret-value");
        },
      },
      {
        scenario: "Later",
        check: async () => {
          laterCalls++;
          return true;
        },
      },
    ]);
    expect(report.complete).toBe(false);
    expect(report.results.map((item) => item.status)).toEqual([
      "passed",
      "failed",
      "not_run",
    ]);
    expect(laterCalls).toBe(0);
    const saved = await readFile(path, "utf8");
    expect(saved).not.toContain("secret-value");
    expect(JSON.parse(saved).checkedAt).not.toBe("old");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("a fixture fallback cannot satisfy live acceptance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-verification-"));
  try {
    const report = await recordLiveChecks(join(directory, "report.json"), [
      { scenario: "Live result", check: async () => false },
    ]);
    expect(report.complete).toBe(false);
    expect(report.results[0].status).toBe("failed");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
