import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
// One authenticated connection carries the private configuration, archive and installation.
// SSM remains the durable replacement for an unstable inbound SSH allowlist.
const release = process.argv[2];
if (!release || !/^[a-zA-Z0-9._-]+$/.test(release))
  throw new Error("Supply a unique release identifier.");
const directory = resolve(".data/deploy");
const archive = resolve(directory, "release.tar.gz");
await stat(resolve(directory, "ssh-key.pem"));
const checksum = createHash("sha256")
  .update(await readFile(archive))
  .digest("hex");
const command = `umask 077; tar -xzf - -C /home/ubuntu && chmod 600 /home/ubuntu/production.env /home/ubuntu/database.sql && sudo bash -n /home/ubuntu/install.sh && sudo bash -n /home/ubuntu/upgrade.sh && sudo bash /home/ubuntu/upgrade.sh ${release} ${checksum}`;
const child = spawn(
  "ssh",
  [
    "-i",
    resolve(directory, "ssh-key.pem"),
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=10",
    "-o",
    "StrictHostKeyChecking=yes",
    "ubuntu@ec2-16-4-25-181.ap-south-1.compute.amazonaws.com",
    command,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);
child.stdin.on("error", () => {});
const packing = spawn(
  "tar",
  [
    "-czf",
    "-",
    "-C",
    directory,
    "release.tar.gz",
    "production.env",
    "database.sql",
    "-C",
    resolve("deploy"),
    "install.sh",
    "upgrade.sh",
  ],
  { stdio: ["ignore", "pipe", "inherit"] },
);
packing.stdout.pipe(child.stdin);
packing.once("error", (error) => {
  console.error(error.message);
  child.kill();
  process.exitCode = 1;
});
packing.once("close", (code) => {
  if (code) {
    child.kill();
    process.exitCode = 1;
  }
});
child.once("error", (error) => {
  packing.kill();
  console.error(error.message);
  process.exitCode = 1;
});
child.once("close", (code) => {
  packing.stdout.unpipe(child.stdin);
  packing.kill();
  process.exitCode = code === null ? 1 : code;
});
