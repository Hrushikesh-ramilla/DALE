import { mkdir, readFile, writeFile, unlink, rmdir } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";
import { nextPreviewRecovery } from "./preview-recovery.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const directory = resolve(".data/local-preview");
const statePath = resolve(directory, "state.json");
const stopPath = resolve(directory, "stop.json");
const lockPath = resolve(directory, "lock");
const url = "http://localhost:3000";
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
async function savedState() {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch {
    return null;
  }
}
async function health() {
  try {
    const response = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(2500),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

const mode = process.argv[2] || "status";
if (mode === "status") {
  const state = await savedState();
  const result = await health();
  console.log(
    JSON.stringify(
      {
        url: url,
        supervisorRunning: Boolean(state?.pid && alive(state.pid)),
        state: state?.status || "not started",
        restarts: state?.restarts || 0,
        lastExit: state?.lastExit,
        health: result,
      },
      null,
      2,
    ),
  );
} else if (mode === "stop") {
  const state = await savedState();
  if (!state?.pid || !alive(state.pid)) {
    console.log(
      "Preview supervisor is not running. No process was terminated.",
    );
  } else {
    await writeFile(stopPath, JSON.stringify({ token: state.token }), {
      mode: 0o600,
    });
    const deadline = Date.now() + 15_000;
    while (alive(state.pid) && Date.now() < deadline)
      await new Promise((done) => setTimeout(done, 250));
    if (alive(state.pid))
      throw new Error("Preview stop timed out; inspect local logs.");
    console.log(
      "Owned preview stopped; its database and sessions were retained.",
    );
  }
} else if (mode === "supervise") {
  await mkdir(directory, { recursive: true });
  try {
    await mkdir(lockPath);
  } catch {
    const previous = await savedState();
    if (!previous?.pid || alive(previous.pid))
      throw new Error("Preview already running or its lock needs inspection.");
    // Remove only the known empty lock after its recorded owner has exited.
    await rmdir(lockPath);
    await mkdir(lockPath);
  }
  let child;
  let stopping = false;
  let poll;
  const state = {
    pid: process.pid,
    token: randomUUID(),
    status: "starting",
    restarts: 0,
  };
  const save = () =>
    writeFile(statePath, JSON.stringify(state, null, 2), { mode: 0o600 });
  const stop = () => {
    stopping = true;
    child?.kill();
  };
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
  try {
    if (await health())
      throw new Error(
        "Port 3000 is already serving an app; leaving it untouched.",
      );
    await readFile(".next/standalone/server.js");
    const build = JSON.parse(
      await readFile(".next/preview-build.json", "utf8"),
    );
    const dataPath = resolve(".data/local-final");
    await mkdir(dataPath, { recursive: true });
    let sessionSecret;
    try {
      sessionSecret = await readFile(
        resolve(dataPath, "session-secret"),
        "utf8",
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      sessionSecret = randomBytes(32).toString("hex");
      await writeFile(resolve(dataPath, "session-secret"), sessionSecret, {
        flag: "wx",
        mode: 0o600,
      });
    }
    let source = {};
    try {
      source = parse(await readFile(".env"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    let previous = {};
    try {
      previous = parse(await readFile(".data/deploy/production.env"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    let operatorCode =
      source.OPERATOR_ACCESS_CODE || previous.OPERATOR_ACCESS_CODE;
    if (!operatorCode) {
      const operatorPath = resolve(dataPath, "operator-access-code");
      try {
        operatorCode = (await readFile(operatorPath, "utf8")).trim();
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        operatorCode = randomBytes(24).toString("hex");
        await writeFile(operatorPath, operatorCode, {
          flag: "wx",
          mode: 0o600,
        });
      }
    }
    const env = {
      ...process.env,
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: "3000",
      APP_URL: url,
      BUILD_ID: build.commit,
      SESSION_SECRET: sessionSecret.trim(),
      LOCAL_DATA_DIR: dataPath,
      DATABASE_URL: "",
      ALLOW_EMBEDDED_DATABASE: "true",
      STORAGE_MODE: "local",
      ALLOW_LOCAL_STORAGE: "true",
      PAYMENT_MODE: source.PAYMENT_MODE || "fixture",
      AI_MODE: source.AI_MODE || "fixture",
      AGENT_MODEL_ENABLED: "false",
      AI_API_KEY: source.AI_API_KEY || "",
      AI_MODEL: source.AI_MODEL || "",
      AI_BILLING_DISABLED: "false",
      AI_FREE_QUOTA_CONFIRMED: "false",
      VOICE_MODE: "disabled",
      VOICE_BILLING_DISABLED: "false",
      VOICE_FREE_TIER_CONFIRMED: "false",
      REAL_RESEARCH_REFRESH_ENABLED: "false",
      DEMO_ACCESS_CODE: source.DEMO_ACCESS_CODE || previous.DEMO_ACCESS_CODE || "",
      OPERATOR_ACCESS_CODE: operatorCode,
    };
    await unlink(stopPath).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    await save();
    poll = setInterval(async () => {
      try {
        const request = JSON.parse(await readFile(stopPath, "utf8"));
        if (request.token === state.token) stop();
      } catch {
        /* A missing stop request is normal. */
      }
    }, 250);
    let failures = [];
    while (!stopping) {
      child = spawn(process.execPath, [".next/standalone/server.js"], {
        cwd: root,
        env,
        stdio: "inherit",
        windowsHide: true,
      });
      const ended = new Promise((done) => {
        child.once("exit", (code, signal) => done({ code, signal }));
        child.once("error", () => done({ code: "spawn-error", signal: null }));
      });
      state.childPid = child.pid;
      state.status = "running";
      await save();
      const exit = await ended;
      state.lastExit = { ...exit, at: new Date().toISOString() };
      state.childPid = null;
      if (stopping) break;
      const retry = nextPreviewRecovery(failures, Date.now());
      failures = retry.failures;
      if (retry.exhausted)
        throw new Error(
          "Repeated preview failure; inspect .data/local-preview logs before starting again.",
        );
      state.status = "restarting";
      state.restarts += 1;
      await save();
      console.log(
        `Preview exited unexpectedly; restart ${state.restarts} in ${retry.delay}ms.`,
      );
      await new Promise((done) => setTimeout(done, retry.delay));
    }
    state.status = "stopped";
  } catch (error) {
    state.status = "failed";
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    clearInterval(poll);
    child?.kill();
    state.childPid = null;
    await save();
    await rmdir(lockPath);
  }
} else {
  throw new Error("Use status, stop or supervise.");
}
