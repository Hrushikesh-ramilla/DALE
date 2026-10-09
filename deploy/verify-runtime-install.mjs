// Executed only on the disposable Linux CI runner. This is real pinned speech
// installation/inference, never qualification of a text/vision candidate.
import assert from "node:assert/strict";
import {
  readFile,
  writeFile,
  mkdir,
  stat,
  cp,
  chown,
  readdir,
  symlink,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, basename, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { parseRuntimeEnvironment } from "./runtime-policy.mjs";
import { downloadModelArtifact } from "../scripts/download-model-artifact.mjs";
if (
  process.env.CI !== "true" ||
  process.platform !== "linux" ||
  process.getuid() !== 0
)
  throw new Error("Run only as root on the disposable Linux CI runner.");
try {
  execFileSync("id", ["buyerguard"], { stdio: "ignore" });
} catch {
  execFileSync("useradd", [
    "--system",
    "--home",
    "/var/lib/buyerguard",
    "--shell",
    "/usr/sbin/nologin",
    "buyerguard",
  ]);
}
// Refuse to overwrite an existing host configuration or operate on its models.
await writeFile(
  "/etc/buyerguard.env",
  'AI_MODE="fixture"\nAI_PROVIDER="self_hosted"\nAI_MODEL=""\nVOICE_MODE="local"\n',
  { mode: 0o600, flag: "wx" },
);
execFileSync(process.execPath, ["deploy/prepare-runtime.mjs"], {
  stdio: "inherit",
});
const settings = parseRuntimeEnvironment(
  await readFile("/etc/buyerguard.env", "utf8"),
);
assert.equal(settings.AI_MODE, "fixture");
assert.equal(settings.AI_MODEL, "");
assert.ok(!settings.AI_SELF_HOSTED_API_KEY);
assert.ok(
  settings.LOCAL_SPEECH_EXECUTABLE.startsWith("/opt/buyerguard/inference/"),
);
assert.equal((await stat(settings.LOCAL_SPEECH_EXECUTABLE)).mode & 0o007, 0);
assert.equal((await stat("/etc/buyerguard.env")).mode & 0o777, 0o600);
assert.match(
  await readFile(
    "/etc/systemd/system/buyerguard.service.d/runtime.conf",
    "utf8",
  ),
  /MemoryMax=768M/,
);
const manifest = JSON.parse(
  await readFile("fixtures/voice-v1/manifest.json", "utf8"),
);
await mkdir(".data/reports", { recursive: true });
const cases = [];
const scratch = "/var/lib/buyerguard/runtime-install-check";
await mkdir("/var/lib/buyerguard", { recursive: true, mode: 0o750 });
const serviceUid = Number(
  execFileSync("id", ["-u", "buyerguard"], { encoding: "utf8" }),
);
const serviceGid = Number(
  execFileSync("id", ["-g", "buyerguard"], { encoding: "utf8" }),
);
await chown("/var/lib/buyerguard", serviceUid, serviceGid);
await mkdir(scratch, { recursive: true, mode: 0o700 });
const uid = Number(
  execFileSync("id", ["-u", "buyerguard"], { encoding: "utf8" }),
);
const gid = Number(
  execFileSync("id", ["-g", "buyerguard"], { encoding: "utf8" }),
);
await chown(scratch, uid, gid);
for (const item of manifest.cases) {
  const input = resolve("fixtures/voice-v1", item.file);
  assert.equal(
    createHash("sha256")
      .update(await readFile(input))
      .digest("hex"),
    item.sha256,
  );
  const copiedInput = resolve(scratch, item.file);
  await cp(input, copiedInput);
  const output = resolve(scratch, item.file.replace(/\.wav$/, ""));
  execFileSync(
    "runuser",
    [
      "-u",
      "buyerguard",
      "--",
      settings.LOCAL_SPEECH_EXECUTABLE,
      "-m",
      settings.LOCAL_SPEECH_MODEL,
      "-f",
      copiedInput,
      "-l",
      "auto",
      "-t",
      "2",
      "-nt",
      "-np",
      "-otxt",
      "-of",
      output,
    ],
    { timeout: 60000, stdio: "ignore" },
  );
  const transcript = (await readFile(output + ".txt", "utf8")).trim();
  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  assert.equal(normalize(transcript), normalize(item.expected));
  cases.push({ file: item.file, passed: true });
}
// A second installation reuses checksummed artifacts and retains the config.
execFileSync(process.execPath, ["deploy/prepare-runtime.mjs"], {
  stdio: "inherit",
});
assert.equal(
  parseRuntimeEnvironment(await readFile("/etc/buyerguard.env", "utf8"))
    .LOCAL_SPEECH_MODEL,
  settings.LOCAL_SPEECH_MODEL,
);
// Load the genuine pinned Linux model executable and validate the service unit.
// No candidate weights, inference requests, or manufactured model outputs.
const modelManifest = JSON.parse(
  await readFile("deploy/model-candidates.json", "utf8"),
);
const archive = resolve(".data/reports/llama-linux.tar.gz");
await downloadModelArtifact(
  modelManifest.runtime.linux.url,
  archive,
  modelManifest.runtime.linux.sha256,
);
const runtimeRoot = "/opt/buyerguard/inference/ci-llama";
await mkdir(runtimeRoot, { recursive: true });
execFileSync("tar", ["-xf", archive, "-C", runtimeRoot]);
const relativeBinary = (await readdir(runtimeRoot, { recursive: true })).find(
  (entry) => basename(entry) === "llama-server",
);
assert.ok(relativeBinary);
const binary = resolve(runtimeRoot, relativeBinary);
execFileSync(binary, ["--version"], { stdio: "ignore" });
await symlink(dirname(binary), "/opt/buyerguard/inference/current");
execFileSync(
  "systemd-analyze",
  ["verify", resolve("deploy/buyerguard-model.service")],
  { stdio: "inherit" },
);
const report = {
  checkedAt: new Date().toISOString(),
  complete: true,
  cases,
  installedAs: "root with restricted service-group permissions",
  inferenceAs: "buyerguard",
  modelGenerationEnabled: false,
  reinstallPassed: true,
  pinnedLinuxModelBinaryLoads: true,
  modelServiceUnitValid: true,
  limitation:
    "Actual Linux speech installation and owned synthesized audio. Not target EC2, human speech, text/vision quality or joint workload acceptance.",
};
await writeFile(
  ".data/reports/linux-runtime-install.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
