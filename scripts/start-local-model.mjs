import { readFile, writeFile, readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve, basename } from "node:path";
import { totalmem } from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { createConnection } from "node:net";
const directory = resolve(".data/self-hosted");
let localProfile = {};
try {
  localProfile = JSON.parse(
    await readFile(resolve(directory, "local-runtime.json"), "utf8"),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const localThreads = Number(
  process.env.LOCAL_MODEL_THREADS || localProfile.cpuThreads || "2",
);
const speculation =
  process.env.LOCAL_MODEL_SPECULATION || localProfile.speculation || "none";
if (!["none", "ngram-simple"].includes(speculation))
  throw new Error("LOCAL_MODEL_SPECULATION must be none or ngram-simple.");
if (!Number.isInteger(localThreads) || localThreads < 1 || localThreads > 16)
  throw new Error("Invalid local CPU thread count.");
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
  localProfile.candidate &&
  (localProfile.candidate !== prepared.id ||
    localProfile.runtime !== manifest.runtime.version)
)
  throw new Error(
    "The local acceleration profile belongs to another model/runtime; requalify it before use.",
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
const requestedBackend =
  process.env.LOCAL_MODEL_BACKEND || localProfile.backend || "auto";
if (!["auto", "cpu", "cuda12_4"].includes(requestedBackend))
  throw new Error("LOCAL_MODEL_BACKEND must be auto, cpu or cuda12_4.");
let backend = "cpu";
if (requestedBackend !== "cpu" && process.platform === "win32") {
  try {
    const gpu = JSON.parse(
      await readFile("deploy/local-gpu-runtime.json", "utf8"),
    );
    if (gpu.version !== manifest.runtime.version)
      throw new Error("GPU and model runtime pins differ.");
    const receipt = await readFile(
      resolve(
        directory,
        `runtime-${gpu.version}-${gpu.backend}`,
        ".verified-runtime",
      ),
      "utf8",
    );
    if (receipt !== gpu.files.map((f) => f.sha256).join("\n"))
      throw new Error("GPU runtime verification receipt differs.");
    const freeMiB = Number(
      execFileSync(
        "nvidia-smi",
        ["--id=0", "--query-gpu=memory.free", "--format=csv,noheader,nounits"],
        {
          encoding: "utf8",
          windowsHide: true,
          timeout: 10000,
          stdio: ["ignore", "pipe", "pipe"],
        },
      ).trim(),
    );
    if (!Number.isFinite(freeMiB) || freeMiB < 2800)
      throw new Error(
        "The local GPU needs at least 2800 MiB free for this profile.",
      );
    backend = gpu.backend;
  } catch (error) {
    if (requestedBackend !== "auto" || error.code !== "ENOENT") throw error;
  }
} else if (requestedBackend === "cuda12_4") {
  throw new Error("This CUDA runtime is prepared for Windows x64 only.");
}
const runtimePath = resolve(
  directory,
  `runtime-${manifest.runtime.version}${backend === "cpu" ? "" : `-${backend}`}`,
);
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
    process.env.LOCAL_MODEL_CONTEXT_TOKENS || "8192",
    "-b",
    "128",
    "-ub",
    "128",
    "-np",
    "1",
    "-t",
    String(localThreads),
    "-tb",
    String(localThreads),
    "-ngl",
    backend === "cpu" ? "0" : "99",
    "--no-mmproj-offload",
    ...(process.env.LOCAL_MODEL_REPACK === "true" ? [] : ["--no-repack"]),
    "--checkpoint-min-step",
    "256",
    "--ctx-checkpoints",
    "8",
    "--cache-ram",
    "128",
    ...(speculation === "ngram-simple"
      ? [
          "--spec-type",
          "ngram-simple",
          "--spec-ngram-simple-size-n",
          "6",
          "--spec-ngram-simple-size-m",
          "24",
        ]
      : []),
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
  `Candidate inference: ${candidate.name}, ${backend}, speculation=${speculation}, loopback only, ${localThreads} CPU threads, one slot. Credentials are not printed. This terminal-owned selection server is not the deployment service.`,
);
