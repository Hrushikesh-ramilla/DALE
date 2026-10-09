import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { LocalInferenceError } from "../src/server/self-hosted-ai";
export type LiveCheck = { scenario: string; check: () => Promise<boolean> };
// Raw provider exceptions can contain request credentials.
export async function recordLiveChecks(
  path: string,
  checks: LiveCheck[],
  configuration?: Record<string, string>,
) {
  const results: {
    scenario: string;
    status: "passed" | "failed" | "not_run";
    passed: boolean;
    error?: string;
  }[] = [];
  let stopped = false;
  for (const item of checks) {
    if (stopped) {
      results.push({
        scenario: item.scenario,
        status: "not_run",
        passed: false,
      });
      continue;
    }
    try {
      const passed = await item.check();
      results.push({
        scenario: item.scenario,
        status: passed ? "passed" : "failed",
        passed,
      });
      stopped = !passed;
    } catch (error) {
      const status =
        error instanceof Error
          ? error.message.match(/HTTP (\d{3})/)?.[1]
          : undefined;
      const stage =
        error instanceof LocalInferenceError
          ? error.code
          : error instanceof Error
            ? error.message.match(
                /^Local model gate failed at (inference|workflow_validation) \[(transport|http|envelope|incomplete|json|schema|validation)\]$/,
              )?.[0]
            : undefined;
      results.push({
        scenario: item.scenario,
        status: "failed",
        passed: false,
        error: status
          ? `Provider returned HTTP ${status}.`
          : stage
            ? `Local inference diagnostic: ${stage}.`
            : "Live check did not complete.",
      });
      stopped = true;
    }
  }
  const report = {
    checkedAt: new Date().toISOString(),
    mode: "live",
    ...(configuration ? { configuration } : {}),
    complete: results.every((item) => item.passed),
    results,
    limitation:
      "Smoke checks do not establish held-out accuracy or real-world fraud detection. Unexecuted checks are not passes.",
  };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(report, null, 2));
  return report;
}
