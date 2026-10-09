import { readFile, writeFile, readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve, basename } from "node:path";
import { totalmem } from "node:os";
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
const directory = resolve(".data/self-hosted");
const prepared = JSON.parse(
  await readFile(resolve(directory, "candidate.json"), "utf8"),
);
const manifest = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
);
const candidate = manifest.candidates[prepared.id];
if (!candidate || prepared.runtime !== manifest.runtime.version)
  throw new Error(
    "Prepare a pinned candidate with setup-local-model.mjs first.",
  );
if (
  totalmem() <
  (candidate.minimumHostGiB === 4 ? 3.5 : candidate.minimumHostGiB) * 1024 ** 3
)
  throw new Error("Insufficient host memory; no model launched.");
const occupied = await new Promise((done) => {
  const socket = createConnection({ host: "127.0.0.1", port: 8081 });
  socket.once("connect", () => {
    socket.destroy();
    done(true);
  });
  socket.once("error", () => {
    socket.destroy();
    done(false);
  });
});
if (occupied)
  throw new Error(
    "Port 8081 is occupied. The existing process was left untouched.",
  );
const runtimePath = resolve(directory, `runtime-${manifest.runtime.version}`);
const executable = (await readdir(runtimePath, { recursive: true })).find(
  (path) =>
    basename(path) ===
    (process.platform === "win32" ? "llama-server.exe" : "llama-server"),
);
if (!executable) throw new Error("Prepared runtime has no server binary.");
const keyPath = resolve(directory, "api-key");
try {
  await readFile(keyPath);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeFile(keyPath, randomBytes(32).toString("hex"), {
    mode: 0o600,
    flag: "wx",
  });
}
const child = spawn(
  resolve(runtimePath, executable),
  [
    "-m",
    resolve(directory, candidate.files[0].local),
    "--mmproj",
    resolve(directory, candidate.files[1].local),
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
    "--alias",
    candidate.alias,
    "--api-key-file",
    keyPath,
  ],
  { stdio: "inherit", windowsHide: true },
);
child.on("error", () => {
  console.error("Private model process could not start.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
console.log(
  `Candidate inference: ${candidate.name}, loopback only, two CPU threads, one slot. Credentials are not printed. This terminal-owned selection server is not the deployment service.`,
);
