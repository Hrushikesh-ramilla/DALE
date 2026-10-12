import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import type { ScenarioKind } from "../src/server/scenarios";
const config = JSON.parse(
  await readFile(".data/self-hosted/speech/config.json", "utf8"),
);
const socket = createServer();
await new Promise<void>((done) => socket.listen(0, "127.0.0.1", done));
const address = socket.address();
assert.ok(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}`;
await new Promise<void>((done, reject) =>
  socket.close((error) => (error ? reject(error) : done())),
);
const data = resolve(".data/speech-http", `${Date.now()}-${process.pid}`);
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
    AI_MODE: "fixture",
    AGENT_MODEL_ENABLED: "false",
    AI_MODEL: "",
    PAYMENT_MODE: "fixture",
    VOICE_MODE: "local",
    LOCAL_SPEECH_EXECUTABLE: config.executable,
    LOCAL_SPEECH_MODEL: config.model,
    DEMO_ACCESS_CODE: "",
    OPERATOR_ACCESS_CODE: randomBytes(24).toString("hex"),
  },
});
let launchFailure = false;
child.on("error", () => {
  launchFailure = true;
});
const checks: { scenario: string; passed: boolean }[] = [];
let cookie = "",
  failure = "";
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
  if (response.headers.get("set-cookie"))
    cookie = response.headers.get("set-cookie")!.split(";")[0];
  return response;
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
  check("Isolated packaged app/database ready", ready);
  const audio = await readFile("fixtures/voice-v1/orders.wav");
  const unauthenticated = await fetch(base + "/api/voice/transcribe", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "audio/wav" },
    body: audio,
  });
  check("Anonymous audio rejected", unauthenticated.status === 401);
  check(
    "Ordinary shopper session created",
    (await api("/api/session", { role: "buyer" })).ok,
  );
  const before = await (await api("/api/session")).json();
  check(
    "Private CPU recognizer available",
    (await (await api("/api/voice/session")).json()).mode === "local",
  );
  const wrongOrigin = await fetch(base + "/api/voice/transcribe", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      Cookie: cookie,
      "Content-Type": "audio/wav",
    },
    body: audio,
  });
  check("Cross-origin audio rejected", wrongOrigin.status === 403);
  const recognized = await fetch(base + "/api/voice/transcribe", {
    method: "POST",
    headers: { Origin: base, Cookie: cookie, "Content-Type": "audio/wav" },
    body: audio,
    signal: AbortSignal.timeout(70000),
  });
  const transcript = await recognized.json();
  check(
    "Actual HTTP-to-Whisper recognition returns owned transcript",
    recognized.ok &&
      transcript.mode === "local" &&
      transcript.transcript === "Show my orders.",
  );
  const after = await (await api("/api/session")).json();
  check(
    "Recognition alone does not create agent runs/orders/cases",
    JSON.stringify([before.orders, before.cases, before.agentRuns]) ===
      JSON.stringify([after.orders, after.cases, after.agentRuns]),
  );
  check(
    "Guided workspace launched",
    (
      await api("/api/demo", {
        action: "launch",
        kind: "fresh" satisfies ScenarioKind,
      })
    ).ok,
  );
  check(
    "Guided workspace keeps synthetic recognition",
    (await (await api("/api/voice/session")).json()).mode === "fixture",
  );
  const fixtureAudio = await fetch(base + "/api/voice/transcribe", {
    method: "POST",
    headers: { Origin: base, Cookie: cookie, "Content-Type": "audio/wav" },
    body: audio,
  });
  check(
    "Guided workspace cannot invoke the actual recognizer",
    !fixtureAudio.ok,
  );
} catch {
  failure = "An HTTP/auth/recognition check failed; private details withheld.";
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
      "Actual local packaged HTTP app and CPU recognizer with owned synthesized audio. Browser microphone transport is separately mocked; not human speech or EC2 acceptance.",
  };
  await writeFile(
    ".data/reports/local-speech-http.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
