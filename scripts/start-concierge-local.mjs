import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { parse } from "dotenv";
const source = parse(await readFile(".data/concierge.env", "utf8"));
if (
  !process.argv.includes("--index") &&
  source.CONCIERGE_PROVIDER === "self_hosted"
) {
  const warmed = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/warm-concierge-model.ts"],
    {
      env: { ...process.env, ...source },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  const code = await new Promise((done, reject) => {
    warmed.on("error", reject);
    warmed.on("exit", done);
  });
  if (code !== 0)
    throw new Error(
      "Private concierge warm-up failed. Check the inference service before starting this preview.",
    );
}
const args = process.argv.includes("--index")
  ? ["--import", "tsx", "scripts/index-concierge.ts"]
  : [".next/standalone/server.js"];

let intentionalExit = false;
let currentChild = null;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    intentionalExit = true;
    if (currentChild) currentChild.kill(signal);
    process.exit(0);
  });
}

function startServer() {
  const child = spawn(process.execPath, args, {
    env: { ...process.env, ...source, HOSTNAME: "127.0.0.1", PORT: "3000" },
    stdio: "inherit",
    windowsHide: true,
  });
  currentChild = child;

  child.on("error", (err) => {
    console.error("Concierge server spawn error:", err);
  });

  child.on("exit", (code, signal) => {
    if (intentionalExit) {
      process.exitCode = code || 0;
      return;
    }
    console.warn(`Concierge server exited (code: ${code}, signal: ${signal}). Re-spawning in 1s...`);
    setTimeout(startServer, 1000);
  });
}

startServer();
