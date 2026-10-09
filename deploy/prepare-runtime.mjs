import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  chmod,
  chown,
  symlink,
  rename,
  readlink,
} from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { arch, totalmem } from "node:os";
import { resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { downloadModelArtifact } from "../scripts/download-model-artifact.mjs";
import { parseRuntimeEnvironment, runtimePlan } from "./runtime-policy.mjs";

if (process.platform !== "linux" || arch() !== "x64" || process.getuid() !== 0)
  throw new Error(
    "Runtime installation requires root on the existing Linux x64 host.",
  );
const deployment = dirname(fileURLToPath(import.meta.url));
const envPath = "/etc/buyerguard.env";
const settings = parseRuntimeEnvironment(await readFile(envPath, "utf8"));
const manifest = JSON.parse(
  await readFile(resolve(deployment, "model-candidates.json"), "utf8"),
);
const plan = runtimePlan(settings, manifest, totalmem());
const group = Number(
  execFileSync("getent", ["group", "buyerguard"], { encoding: "utf8" }).split(
    ":",
  )[2],
);
if (!Number.isInteger(group))
  throw new Error("Deployment service group is missing.");
const base = "/opt/buyerguard/inference";
async function directory(path) {
  await mkdir(path, { recursive: true, mode: 0o750 });
  await chown(path, 0, group);
  await chmod(path, 0o750);
}
async function privateFile(path, text) {
  // Atomic replacement retains the previous complete configuration on write failure.
  const staged = `${path}.pending`;
  await writeFile(staged, text, { mode: 0o600 });
  await chown(staged, 0, group);
  await chmod(staged, 0o640);
  await rename(staged, path);
}
async function unpack(runtime, path, archiveName) {
  await directory(path);
  const archive = resolve(base, archiveName);
  await downloadModelArtifact(runtime.url, archive, runtime.sha256);
  execFileSync("tar", ["-xf", archive, "-C", path]);
  execFileSync("chown", ["-R", `root:${group}`, path]);
  execFileSync("chmod", ["-R", "u=rwX,g=rX,o=", path]);
}
async function executableUnder(path, name) {
  const relative = (await readdir(path, { recursive: true })).find(
    (entry) => basename(entry) === name,
  );
  if (!relative)
    throw new Error("Verified runtime archive has no required executable.");
  return resolve(path, relative);
}
// Finish all potentially failing downloads before changing running services.
let binary;
if (plan.modelEnabled) {
  await directory("/opt/buyerguard");
  await directory(base);
  const runtimePath = resolve(base, `llama-${manifest.runtime.version}`);
  await unpack(
    manifest.runtime.linux,
    runtimePath,
    `llama-${manifest.runtime.version}.tar.gz`,
  );
  binary = await executableUnder(runtimePath, "llama-server");
  for (const file of plan.selected.files)
    await downloadModelArtifact(
      `https://huggingface.co/${plan.selected.repository}/resolve/${plan.selected.revision}/${file.file}`,
      resolve(base, file.local),
      file.sha256,
    );
}
if (plan.voiceEnabled) {
  await directory("/opt/buyerguard");
  await directory(base);
  const speech = JSON.parse(
    await readFile(resolve(deployment, "speech-runtime.json"), "utf8"),
  );
  const speechPath = resolve(base, `whisper-${speech.version}`);
  await unpack(
    speech.runtime.linux,
    speechPath,
    `whisper-${speech.version}.tar.gz`,
  );
  const model = resolve(base, "whisper-tiny.bin");
  await downloadModelArtifact(speech.model.url, model, speech.model.sha256);
  await chown(model, 0, group);
  await chmod(model, 0o640);
  settings.LOCAL_SPEECH_EXECUTABLE = await executableUnder(
    speechPath,
    "whisper-cli",
  );
  settings.LOCAL_SPEECH_MODEL = model;
}
await directory("/etc/systemd/system/buyerguard.service.d");
await privateFile(
  "/etc/systemd/system/buyerguard.service.d/runtime.conf",
  `[Service]\nMemoryMax=${plan.appMemoryMiB}M\n`,
);
if (plan.modelEnabled) {
  let key;
  try {
    key = (await readFile("/etc/buyerguard-model.key", "utf8")).trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    key = randomBytes(32).toString("hex");
  }
  if (!/^[a-f0-9]{64}$/.test(key))
    throw new Error(
      "Inspect the existing private model key before installation.",
    );
  await privateFile("/etc/buyerguard-model.key", key);
  settings.AI_SELF_HOSTED_API_KEY = key;
  settings.AI_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
  const stagedLink = resolve(base, "current.pending");
  // No recursive removal or replacement of arbitrary directories.
  try {
    await symlink(dirname(binary), stagedLink);
  } catch (error) {
    if (
      error.code !== "EEXIST" ||
      (await readlink(stagedLink)) !== dirname(binary)
    )
      throw error;
  }
  await rename(stagedLink, resolve(base, "current"));
  await privateFile(
    "/etc/buyerguard-model.env",
    `MODEL_PATH=${JSON.stringify(resolve(base, plan.selected.files[0].local))}\nPROJECTOR_PATH=${JSON.stringify(resolve(base, plan.selected.files[1].local))}\nMODEL_ALIAS=${JSON.stringify(plan.selected.alias)}\n`,
  );
  await writeFile(
    "/etc/systemd/system/buyerguard-model.service",
    await readFile(resolve(deployment, "buyerguard-model.service")),
    { mode: 0o644 },
  );
  await directory("/etc/systemd/system/buyerguard-model.service.d");
  await privateFile(
    "/etc/systemd/system/buyerguard-model.service.d/memory.conf",
    `[Service]\nMemoryMax=${plan.modelMemoryMiB}M\n`,
  );
  execFileSync("systemctl", ["daemon-reload"]);
  execFileSync("systemctl", ["enable", "buyerguard-model"]);
  execFileSync("systemctl", ["restart", "buyerguard-model"]);
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:8081/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(2000),
      });
      const result = response.ok ? await response.json() : null;
      if (result?.data?.some((item) => item.id === plan.selected.alias)) {
        ready = true;
        break;
      }
    } catch {
      /* Startup connection refusal is expected while loading weights. */
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  if (!ready)
    throw new Error(
      "Private model service failed authenticated startup. Restore the previous release.",
    );
} else {
  const exists = execFileSync(
    "systemctl",
    ["list-unit-files", "buyerguard-model.service", "--no-legend"],
    { encoding: "utf8" },
  ).includes("buyerguard-model.service");
  if (exists)
    execFileSync("systemctl", ["disable", "--now", "buyerguard-model"]);
}
await privateFile(
  envPath,
  Object.entries(settings)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
);
// Keep the app environment owner-readable only, matching the original installer.
await chown(
  envPath,
  Number(execFileSync("id", ["-u", "buyerguard"], { encoding: "utf8" })),
  group,
);
await chmod(envPath, 0o600);
execFileSync("systemctl", ["daemon-reload"]);
console.log(
  `Runtime installation prepared: private model ${plan.modelEnabled ? "started" : "disabled"}; local speech ${plan.voiceEnabled ? "installed" : "disabled"}. Memory policy checked; joint-load acceptance remains required.`,
);
