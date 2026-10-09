// Disposable Linux CI only. Copying artifacts inside the service gives their
// page-cache memory to its cgroup, rather than borrowing the downloader's cache.
import { readFile, cp, readdir } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { spawn } from "node:child_process";
if (process.env.CI !== "true" || process.platform !== "linux")
  throw new Error(
    "Candidate budget runner is restricted to disposable Linux CI.",
  );
const scratch = process.argv[2];
if (!scratch?.startsWith("/tmp/dale-model-budget-"))
  throw new Error("Invalid isolated candidate directory.");
const prepared = JSON.parse(
  await readFile(".data/self-hosted/candidate.json", "utf8"),
);
const manifest = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
);
const candidate = manifest.candidates[prepared.id];
if (!candidate || prepared.runtime !== manifest.runtime.version)
  throw new Error("Pinned candidate preparation is required.");
await cp(
  resolve(".data/self-hosted", `runtime-${manifest.runtime.version}`),
  resolve(scratch, "runtime"),
  { recursive: true },
);
for (const file of candidate.files)
  await cp(
    resolve(".data/self-hosted", file.local),
    resolve(scratch, file.local),
  );
const executable = (
  await readdir(resolve(scratch, "runtime"), { recursive: true })
).find((path) => basename(path) === "llama-server");
if (!executable) throw new Error("Pinned runtime binary is missing.");
const child = spawn(
  resolve(scratch, "runtime", executable),
  [
    "-m",
    resolve(scratch, candidate.files[0].local),
    "--mmproj",
    resolve(scratch, candidate.files[1].local),
    "--alias",
    candidate.alias,
    "--api-key-file",
    resolve(".data/self-hosted/api-key"),
    "--host",
    "127.0.0.1",
    "--port",
    "8081",
    "-c",
    "4096",
    "-b",
    "128",
    "-ub",
    "128",
    "-np",
    "1",
    "-t",
    "2",
    "-tb",
    "2",
    "-ngl",
    "0",
    "--no-mmproj-offload",
    "--no-repack",
  ],
  { stdio: "inherit" },
);
child.on("error", () => {
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
