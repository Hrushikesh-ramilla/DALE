import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
if (
  process.env.CI !== "true" ||
  process.platform !== "linux" ||
  process.getuid() !== 0
)
  throw new Error("Run only as root on disposable Linux CI.");
const id = "lfm3";
execFileSync(
  process.execPath,
  ["scripts/setup-local-model.mjs", "--candidate", id],
  { stdio: "inherit" },
);
const key = randomBytes(32).toString("hex");
await writeFile(".data/self-hosted/api-key", key, { flag: "wx", mode: 0o600 });
const scratch = await mkdtemp("/tmp/dale-model-budget-");
const unit = `dale-model-budget-${randomBytes(6).toString("hex")}`;
const checkedAt = new Date().toISOString();
let complete = false;
let peakBytes = null;
let testReport = null;
let goalReport = null;
let failure = "";
let unitStarted = false;
let restartVerified = false;
let unauthenticatedRejected = false;
let restartState = "not_run";
function measurePeak() {
  const value = execFileSync(
    "systemctl",
    ["show", unit, "--property=MemoryPeak", "--value"],
    { encoding: "utf8" },
  ).trim();
  if (/^\d+$/.test(value)) peakBytes = Math.max(peakBytes || 0, Number(value));
}
try {
  execFileSync(
    "systemd-run",
    [
      `--unit=${unit}`,
      "--property=MemoryMax=2147483648",
      "--property=MemorySwapMax=0",
      "--property=CPUQuota=200%",
      "--property=TimeoutStopSec=20",
      "--property=RemainAfterExit=yes",
      `--property=WorkingDirectory=${process.cwd()}`,
      "--setenv=CI=true",
      process.execPath,
      resolve("deploy/run-model-budget-check.mjs"),
      scratch,
    ],
    { stdio: "inherit" },
  );
  unitStarted = true;
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:8081/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(1000),
      });
      ready =
        response.ok &&
        (await response.json()).data?.some(
          (item) => item.id === "dale-lfm25-vl-3b",
        );
      if (ready) break;
    } catch {
      /* Candidate startup is not yet an inference success. */
    }
    if (
      execFileSync(
        "systemctl",
        ["show", unit, "--property=ActiveState", "--value"],
        { encoding: "utf8" },
      ).trim() === "failed"
    )
      break;
    await new Promise((done) => setTimeout(done, 1000));
  }
  if (!ready)
    throw new Error("Candidate did not reach authenticated readiness.");
  const anonymous = await fetch("http://127.0.0.1:8081/v1/models", {
    signal: AbortSignal.timeout(1000),
  });
  unauthenticatedRejected = anonymous.status === 401;
  if (!unauthenticatedRejected)
    throw new Error("Runtime authentication was not enforced.");
  try {
    const result = await promisify(execFile)(
      "npx",
      ["tsx", "scripts/verify-local-model.ts", "--prepared"],
      { timeout: 720000, maxBuffer: 524288 },
    );
    console.log(result.stdout);
    const goal = await promisify(execFile)(
      "npx",
      [
        "tsx",
        "scripts/verify-local-model.ts",
        "--prepared",
        "--goal-interface",
      ],
      { timeout: 300000, maxBuffer: 524288 },
    );
    console.log(goal.stdout);
    const evidence = await promisify(execFile)(
      "npx",
      ["tsx", "scripts/verify-local-evidence.ts", "--prepared"],
      { timeout: 300000, maxBuffer: 524288 },
    );
    console.log(evidence.stdout);
  } catch {
    failure = "Candidate task gate failed; see the sanitized selection report.";
  }
  testReport = JSON.parse(
    await readFile(".data/reports/local-model-selection.json", "utf8"),
  );
  complete = testReport.complete;
  goalReport = JSON.parse(
    await readFile(".data/reports/local-goal-selection.json", "utf8"),
  );
  complete &&= goalReport.complete;
  const evidenceReport = JSON.parse(
    await readFile(".data/reports/local-evidence.json", "utf8"),
  );
  complete &&= evidenceReport.complete;
  measurePeak();
  // Observe an actual restart with the same restricted endpoint and private key.
  execFileSync("systemctl", ["restart", unit]);
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:8081/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        const inference = await fetch(
          "http://127.0.0.1:8081/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "dale-lfm25-vl-3b",
              messages: [
                { role: "user", content: 'Return exactly {"alive":true}.' },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "restart_probe",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: { alive: { const: true } },
                    required: ["alive"],
                    additionalProperties: false,
                  },
                },
              },
              temperature: 0.2,
              top_k: 50,
              repeat_penalty: 1,
              max_tokens: 32,
              stream: false,
            }),
            signal: AbortSignal.timeout(120000),
          },
        );
        const result = await inference.json();
        restartVerified =
          inference.ok &&
          result.choices?.[0]?.finish_reason === "stop" &&
          JSON.parse(result.choices[0].message.content).alive === true;
        break;
      }
    } catch {
      /* Readiness during a restart is not yet inference success. */
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  complete &&= restartVerified;
  if (!restartVerified) failure ||= "Actual inference after restart failed.";
  restartState = execFileSync(
    "systemctl",
    ["show", unit, "--property=ActiveState", "--value"],
    { encoding: "utf8" },
  ).trim();
} catch {
  complete = false;
  failure ||= "Candidate budget/startup verification did not complete.";
} finally {
  if (unitStarted) {
    measurePeak();
    if (peakBytes === null || peakBytes > 2147483648) {
      complete = false;
      failure ||= "The required measured memory cap was not established.";
    }
    execFileSync("systemctl", ["stop", unit]);
  }
  await mkdir(".data/reports", { recursive: true });
  await writeFile(
    ".data/reports/linux-model-budget.json",
    JSON.stringify(
      {
        checkedAt,
        source: process.env.GITHUB_SHA || "unknown",
        candidate: id,
        complete,
        memoryLimitBytes: 2147483648,
        swapLimitBytes: 0,
        cpuQuotaPercent: 200,
        measuredCgroupPeakBytes: peakBytes,
        restartVerified,
        restartState,
        unauthenticatedRejected,
        testReport,
        goalReport,
        failure,
        limitation:
          "Actual Linux candidate inference under a hard 2 GiB/no-swap/two-CPU cap. Weights are copied inside the cgroup to charge their page cache. The goal profile's two OCR child checks run outside that model cgroup, not inside an app memory cap. This is not EC2 joint app/worker/database/voice, a held-out quality evaluation, or production service-account acceptance.",
      },
      null,
      2,
    ),
  );
}
console.log(`Linux candidate budget check: ${complete ? "passed" : "failed"}.`);
if (!complete) process.exitCode = 1;
