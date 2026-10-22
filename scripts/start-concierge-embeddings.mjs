import { readdir, readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
const base = resolve(".data/self-hosted");
const model = resolve(base, "bge-small-en-v1.5-q8_0.gguf");
if (
  createHash("sha256")
    .update(await readFile(model))
    .digest("hex") !==
  "f046db1dc724cf4f6f0a0c5917e922823b73eb1d27b8f9a9c2797f7866974804"
)
  throw new Error("Run setup-concierge-embeddings.mjs first.");
const manifest = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
);
const runtime = resolve(base, `runtime-${manifest.runtime.version}`);
const binary = (await readdir(runtime, { recursive: true })).find(
  (p) =>
    basename(p) ===
    (process.platform === "win32" ? "llama-server.exe" : "llama-server"),
);
if (!binary) throw new Error("Prepared llama.cpp runtime missing.");
console.log(
  "Starting private BGE embeddings on 127.0.0.1:8082, one slot and two CPU threads. No cloud requests.",
);
const key = (await readFile(resolve(base, "api-key"), "utf8")).trim();
if (!key) throw new Error("Prepared private model API key is missing.");
const child = spawn(
  resolve(runtime, binary),
  [
    "-m",
    model,
    "--host",
    "127.0.0.1",
    "--port",
    "8082",
    "--api-key",
    key,
    "--embedding",
    "--pooling",
    "cls",
    "--alias",
    "dale-bge-small-en-v1.5",
    "-c",
    "512",
    "-b",
    "2048",
    "-ub",
    "2048",
    "-np",
    "1",
    "-t",
    "2",
    "-ngl",
    "0",
    "--no-webui",
  ],
  { stdio: "inherit", windowsHide: true },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
