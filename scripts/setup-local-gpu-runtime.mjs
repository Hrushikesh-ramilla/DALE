import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { downloadModelArtifact } from "./download-model-artifact.mjs";

const manifest = JSON.parse(
  await readFile("deploy/local-gpu-runtime.json", "utf8"),
);
if (
  process.platform !== manifest.platform ||
  process.arch !== manifest.architecture
)
  throw new Error("This pinned accelerator package is for Windows x64 only.");
const directory = resolve(".data/self-hosted");
const runtime = resolve(
  directory,
  `runtime-${manifest.version}-${manifest.backend}`,
);
await mkdir(runtime, { recursive: true });
await Promise.all(
  manifest.files.map(async (file) => {
    await downloadModelArtifact(
      `https://github.com/ggml-org/llama.cpp/releases/download/${manifest.version}/${file.name}`,
      resolve(directory, file.name),
      file.sha256,
    );
    console.log(`Verified ${file.name}`);
  }),
);
const marker = manifest.files.map((f) => f.sha256).join("\n");
let installed;
try {
  installed = await readFile(resolve(runtime, ".verified-runtime"), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (installed !== undefined && installed !== marker)
  throw new Error("Existing GPU runtime receipt differs; left untouched.");
if (!installed) {
  for (const file of manifest.files)
    execFileSync("tar", ["-xf", resolve(directory, file.name), "-C", runtime], {
      windowsHide: true,
    });
  await writeFile(resolve(runtime, ".verified-runtime"), marker);
}
console.log(
  `Prepared ${manifest.version} ${manifest.backend}. The current model service was not changed.`,
);
