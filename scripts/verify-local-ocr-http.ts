import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";

const socket = createServer();
await new Promise<void>((done) => socket.listen(0, "127.0.0.1", done));
const address = socket.address();
assert.ok(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}`;
await new Promise<void>((done, reject) =>
  socket.close((error) => (error ? reject(error) : done())),
);
const data = resolve(".data/ocr-http", `${Date.now()}-${process.pid}`);
await mkdir(data, { recursive: true });
const child = spawn(process.execPath, [".next/standalone/server.js"], {
  windowsHide: true,
  stdio: "ignore",
  env: {
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
    AI_PROVIDER: "self_hosted",
    AI_MODE: "live",
    AGENT_MODEL_ENABLED: "false",
    AI_MODEL: "",
    AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:1/v1",
    AI_SELF_HOSTED_API_KEY: "",
    LOCAL_OCR_MODE: "tesseract",
    PAYMENT_MODE: "fixture",
    VOICE_MODE: "disabled",
    DEMO_ACCESS_CODE: "",
    OPERATOR_ACCESS_CODE: randomBytes(24).toString("hex"),
  },
});
let launchFailure = false;
child.on("error", () => (launchFailure = true));
const checks: { scenario: string; passed: boolean }[] = [];
let cookie = "";
let failure = "";
function check(scenario: string, passed: boolean) {
  checks.push({ scenario, passed });
  assert.ok(passed, scenario);
}
async function api(path: string, body?: unknown) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: base,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const received = response.headers.get("set-cookie");
  if (received) cookie = received.split(";")[0];
  return response;
}
async function identify(
  bytes: Buffer,
  mime: string,
  origin = base,
  session = cookie,
) {
  const form = new FormData();
  form.set("image", new Blob([new Uint8Array(bytes)], { type: mime }), "label");
  form.set("selectedModel", "Atlas 14 Pro");
  return fetch(base + "/api/identify", {
    method: "POST",
    headers: { Origin: origin, Cookie: session },
    body: form,
    signal: AbortSignal.timeout(30000),
  });
}
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
  check("Isolated packaged app ready", ready);
  const clear = await readFile("fixtures/evaluation/vision-v1/label-1.png");
  check(
    "Anonymous image rejected",
    (await identify(clear, "image/png", base, "")).status === 401,
  );
  check(
    "Ordinary buyer session created",
    (await api("/api/session", { role: "buyer" })).ok,
  );
  const before = await (await api("/api/session")).json();
  check(
    "Cross-origin image rejected",
    (await identify(clear, "image/png", "https://untrusted.example")).status ===
      403,
  );
  const response = await identify(clear, "image/png");
  const result = await response.json();
  check(
    "Packaged HTTP uses actual local OCR without an LLM endpoint",
    response.ok &&
      result.mode === "live" &&
      result.proposedModel === "Atlas 14",
  );
  check(
    "Conflicting existing device remains a proposal requiring confirmation",
    result.needsConfirmation === true &&
      result.message.includes("Atlas 14 Pro"),
  );
  const unreadable = await (
    await identify(
      await readFile("fixtures/evaluation/vision-v1/label-12.png"),
      "image/png",
    )
  ).json();
  check(
    "Blurred image abstains without model guessing",
    unreadable.mode === "live" &&
      unreadable.proposedModel === null &&
      unreadable.needsConfirmation === true,
  );
  check(
    "Forged image rejected",
    !(await identify(Buffer.from("not an image"), "image/png")).ok,
  );
  const after = await (await api("/api/session")).json();
  check(
    "Recognition does not mutate device brief, orders, claims or agent runs",
    JSON.stringify([
      before.brief,
      before.orders,
      before.cases,
      before.agentRuns,
    ]) ===
      JSON.stringify([after.brief, after.orders, after.cases, after.agentRuns]),
  );
  check(
    "Guided workspace launches",
    (await api("/api/demo", { action: "launch", kind: "fresh" })).ok,
  );
  const fixture = await (await identify(clear, "image/png")).json();
  check(
    "Guided workspace keeps explicit fixture analysis",
    fixture.mode === "fixture",
  );
} catch {
  failure =
    "Packaged HTTP label recognition or authority check failed; private details withheld.";
  process.exitCode = 1;
} finally {
  child.kill();
  await mkdir(".data/reports", { recursive: true });
  const report = {
    checkedAt: new Date().toISOString(),
    complete: !failure,
    checks,
    failure,
    limitation:
      "Actual packaged app, local trained OCR and owned synthetic images; not independent physical labels, arbitrary-device compatibility or EC2 acceptance.",
  };
  await writeFile(
    ".data/reports/local-ocr-http.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
}
