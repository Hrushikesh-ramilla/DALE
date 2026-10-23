import { readFile, readdir } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { spawn } from "node:child_process";
const candidate = JSON.parse(
  await readFile("deploy/concierge-text-candidate.json", "utf8"),
);
const runtime = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
).runtime;
const directory = resolve(`.data/self-hosted/runtime-${runtime.version}`);
const executable = (await readdir(directory, { recursive: true })).find(
  (p) =>
    basename(p) ===
    (process.platform === "win32" ? "llama-server.exe" : "llama-server"),
);
if (!executable)
  throw new Error("Prepare the pinned local inference runtime first.");
const child = spawn(
  resolve(directory, executable),
  [
    "-m",
    resolve(".data/self-hosted", candidate.local),
    "--host",
    "127.0.0.1",
    "--port",
    "8083",
    "-c",
    "8192",
    "-b",
    "256",
    "-ub",
    "256",
    "-np",
    "1",
    "-t",
    "2",
    "-tb",
    "2",
    "-ngl",
    "0",
    "--alias",
    candidate.alias,
    "--jinja",
    "--chat-template-kwargs",
    '{"enable_thinking":false}',
    "--checkpoint-min-step",
    "256",
    "--ctx-checkpoints",
    "8",
    "--cache-ram",
    "128",
    "--api-key-file",
    resolve(".data/self-hosted/api-key"),
  ],
  { stdio: "inherit", windowsHide: true },
);
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
console.log(
  "Starting private two-thread text candidate on loopback 8083; active app selection remains unchanged.",
);
