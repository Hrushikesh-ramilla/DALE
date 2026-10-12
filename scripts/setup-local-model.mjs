import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { arch, totalmem } from "node:os";
import { execFileSync } from "node:child_process";
import { downloadModelArtifact } from "./download-model-artifact.mjs";
const manifest = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
);
const id = process.argv[process.argv.indexOf("--candidate") + 1];
const candidate =
  process.argv.includes("--candidate") && manifest.candidates[id];
if (!candidate)
  throw new Error(
    `Select a researched candidate explicitly: --candidate ${Object.keys(manifest.candidates).join("|")}. No model is enabled by downloading it.`,
  );
if (arch() !== "x64" || !manifest.runtime[process.platform])
  throw new Error("This pinned CPU runtime supports Windows/Linux x64 only.");
if (
  totalmem() <
  (candidate.minimumHostGiB === 4 ? 3.5 : candidate.minimumHostGiB) * 1024 ** 3
)
  throw new Error(
    `Candidate requires a ${candidate.minimumHostGiB} GiB memory class host (3.5 GiB OS-visible for the 4 GiB class). Joint workload acceptance remains separate. No download or paid change made.`,
  );
const directory = resolve(".data/self-hosted");
await mkdir(directory, { recursive: true });
const runtime = manifest.runtime[process.platform];
const archive = resolve(
  directory,
  process.platform === "win32" ? "llama.zip" : "llama.tar.gz",
);
await downloadModelArtifact(runtime.url, archive, runtime.sha256);
const runtimePath = resolve(directory, `runtime-${manifest.runtime.version}`);
await mkdir(runtimePath, { recursive: true });
try {
  const verified = await readFile(
    resolve(runtimePath, ".verified-runtime"),
    "utf8",
  );
  if (verified !== runtime.sha256)
    throw new Error(
      "Prepared runtime checksum record differs. Inspect before use.",
    );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  execFileSync("tar", ["-xf", archive, "-C", runtimePath]);
  await writeFile(resolve(runtimePath, ".verified-runtime"), runtime.sha256);
}
for (const file of candidate.files) {
  await downloadModelArtifact(
    `https://huggingface.co/${candidate.repository}/resolve/${candidate.revision}/${file.file}`,
    resolve(directory, file.local),
    file.sha256,
  );
  console.log(`Verified ${file.local}`);
}
await writeFile(
  resolve(directory, "candidate.json"),
  JSON.stringify(
    { id, ...candidate, runtime: manifest.runtime.version },
    null,
    2,
  ),
);
console.log(
  `Prepared ${candidate.name}. Selection and product acceptance remain separate from installation.`,
);
