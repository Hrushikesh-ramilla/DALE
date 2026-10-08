import { readFile, mkdir, writeFile, readdir } from "node:fs/promises";
import { arch } from "node:os";
import { resolve, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { downloadModelArtifact } from "./download-model-artifact.mjs";
const manifest = JSON.parse(
  await readFile("deploy/speech-runtime.json", "utf8"),
);
const runtime = manifest.runtime[process.platform];
if (arch() !== "x64" || !runtime)
  throw new Error("Pinned speech runtime supports Windows/Linux x64.");
const directory = resolve(".data/self-hosted/speech");
await mkdir(directory, { recursive: true });
const archive = resolve(
  directory,
  process.platform === "win32" ? "whisper.zip" : "whisper.tar.gz",
);
await downloadModelArtifact(runtime.url, archive, runtime.sha256);
const runtimePath = resolve(directory, manifest.version);
await mkdir(runtimePath, { recursive: true });
execFileSync("tar", ["-xf", archive, "-C", runtimePath]);
const name = process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli";
const executable = (await readdir(runtimePath, { recursive: true })).find(
  (path) => basename(path) === name,
);
if (!executable)
  throw new Error("Speech executable missing from verified runtime.");
const model = resolve(directory, "ggml-tiny.bin");
await downloadModelArtifact(manifest.model.url, model, manifest.model.sha256);
await writeFile(
  resolve(directory, "config.json"),
  JSON.stringify(
    {
      executable: resolve(runtimePath, executable),
      model,
      version: manifest.version,
    },
    null,
    2,
  ),
);
console.log(
  "Verified CPU speech runtime/model prepared privately. No voice provider was enabled.",
);
