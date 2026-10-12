import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
// One authenticated connection carries the private configuration, archive and installation.
// SSM remains the durable replacement for an unstable inbound SSH allowlist.
const release = process.argv[2];
if (!release || !/^[a-zA-Z0-9._-]+$/.test(release))
  throw new Error("Supply a unique release identifier.");
const instanceHost = "ec2-3-7-253-85.ap-south-1.compute.amazonaws.com";
const connection = process.argv.slice(3);
if (
  connection.length &&
  (connection.length !== 2 ||
    connection[0] !== "--ssm-port" ||
    !/^\d{4,5}$/.test(connection[1]) ||
    Number(connection[1]) < 1024 ||
    Number(connection[1]) > 65535)
)
  throw new Error(
    "Use --ssm-port <1024-65535> with the authorized local SSM tunnel.",
  );
// The tunnel changes transport only. Keep the same instance identity, private
// key and checksum/backup installer rather than trusting localhost as a host.
const transport = connection.length
  ? ["-p", connection[1], "-o", `HostKeyAlias=${instanceHost}`]
  : [];
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
    ...transport,
    `ubuntu@${connection.length ? "127.0.0.1" : instanceHost}`,
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
