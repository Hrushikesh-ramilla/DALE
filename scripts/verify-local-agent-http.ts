import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:net";
import { parse } from "dotenv";
import assert from "node:assert/strict";
const prepared = JSON.parse(
  await readFile(".data/self-hosted/candidate.json", "utf8"),
);
const privateKey = (await readFile(".data/self-hosted/api-key", "utf8")).trim();
const release = parse(await readFile(".data/deploy/production.env"));
const socket = createServer();
await new Promise<void>((done) => socket.listen(0, "127.0.0.1", done));
const address = socket.address();
assert.ok(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}`;
await new Promise<void>((done, reject) =>
  socket.close((error) => (error ? reject(error) : done())),
);
const data = resolve(".data/agent-http", `${Date.now()}-${process.pid}`);
await mkdir(data, { recursive: true });
const environment: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  HOSTNAME: "127.0.0.1",
  PORT: String(address.port),
  APP_URL: base,
  SESSION_SECRET: randomBytes(32).toString("hex"),
  LOCAL_DATA_DIR: data,
  DATABASE_URL: "",
  ALLOW_EMBEDDED_DATABASE: "true",
  STORAGE_MODE: "local",
  ALLOW_LOCAL_STORAGE: "true",
  PAYMENT_MODE: "fixture",
  VOICE_MODE: "disabled",
  AI_PROVIDER: "self_hosted",
  AI_MODE: "live",
  AGENT_MODEL_ENABLED: "true",
  AI_MODEL: prepared.alias,
  AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:8081/v1",
  AI_SELF_HOSTED_API_KEY: privateKey,
  AI_SELF_HOSTED_PROFILE: "lfm25vl3-goals",
  LOCAL_OCR_MODE: "tesseract",
  AI_API_KEY: "",
  AI_API_BASE_URL: "",
  DEMO_ACCESS_CODE: release.DEMO_ACCESS_CODE || "",
  OPERATOR_ACCESS_CODE: randomBytes(24).toString("hex"),
  VERIFY_BASE_URL: base,
};
const child = spawn(process.execPath, [resolve(".next/standalone/server.js")], {
  windowsHide: true,
  stdio: "ignore",
  env: environment,
});
let launchFailure = false;
child.on("error", () => {
  launchFailure = true;
});
let failure = "";
let report: Record<string, unknown> = {};
try {
  let ready = false;
  for (
    let attempt = 0;
    attempt < 50 && !launchFailure && child.exitCode === null;
    attempt++
  ) {
    ready = await fetch(base + "/api/health", {
      signal: AbortSignal.timeout(1000),
    })
      .then((response) => response.ok)
      .catch(() => false);
    if (ready) break;
    await new Promise((done) => setTimeout(done, 500));
  }
  assert.ok(ready, "Packaged app did not reach readiness.");
  try {
    const result = await promisify(execFile)(
      process.execPath,
      [
        resolve("node_modules/tsx/dist/cli.mjs"),
        "scripts/verify-live-agent.ts",
      ],
      {
        env: environment,
        windowsHide: true,
        timeout: 600000,
        maxBuffer: 65536,
      },
    );
    console.log(result.stdout);
  } catch {
    failure =
      "Actual packaged agent journey did not complete; see sanitized per-step report.";
    process.exitCode = 1;
  }
  report = JSON.parse(
    await readFile(".data/reports/live-agent-acceptance.json", "utf8"),
  );
} catch {
  failure ||= "Local packaged agent verification did not complete.";
  process.exitCode = 1;
} finally {
  child.kill();
  await mkdir(".data/reports", { recursive: true });
  await writeFile(
    ".data/reports/local-agent-http.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        complete: !failure,
        profile: environment.AI_SELF_HOSTED_PROFILE,
        model: prepared.alias,
        ...report,
        failure,
        limitation:
          "Actual packaged HTTP app and private local model, ordinary buyer and isolated owned database. Simulated payments; no real PayPal approval/capture/refund, held-out accuracy or EC2 acceptance.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(failure || "Actual local agent HTTP journey passed.");
}
