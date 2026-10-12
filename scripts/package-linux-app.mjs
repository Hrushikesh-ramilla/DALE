import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
if (process.platform !== "linux" || process.arch !== "x64")
  throw new Error("Deployment artifacts must be built and tested on Linux x64.");
const directory = ".data/linux-artifact";
await mkdir(directory, { recursive: true });
await build({ entryPoints: ["scripts/worker.ts"], bundle: true, platform: "node", format: "cjs", outfile: ".next/standalone/worker.cjs", external: ["pg", "@electric-sql/pglite", "@aws-sdk/client-s3"] });
await cp("deploy", ".next/standalone/deploy", { recursive: true });
await mkdir(".next/standalone/scripts", { recursive: true });
await cp("scripts/download-model-artifact.mjs", ".next/standalone/scripts/download-model-artifact.mjs");
const source = process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const identity = { source, platform: "linux", architecture: "x64", nodeMajor: Number(process.versions.node.split(".")[0]) };
await writeFile(".next/standalone/deploy/app-artifact.json", JSON.stringify(identity));
execFileSync(process.execPath, [".next/standalone/deploy/verify-app-artifact.mjs"], { stdio: "inherit" });
execFileSync("tar", ["-czf", `${directory}/release.tar.gz`, "--exclude=.env", "--exclude=.env.*", "--exclude=node_modules/@next/swc-*", "-C", ".next/standalone", "."]);
const inventory = execFileSync("tar", ["-tzf", `${directory}/release.tar.gz`], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
if (inventory.split("\n").some((name) => /(?:^|\/)(?:\.env(?:\.[^/]*)?|\.data)(?:\/|$)|\.(?:pem|key)$/i.test(name)))
  throw new Error("Private material must not be included in an app artifact.");
const bytes = await readFile(`${directory}/release.tar.gz`);
await writeFile(`${directory}/artifact.json`, JSON.stringify({ ...identity, sha256: createHash("sha256").update(bytes).digest("hex"), size: bytes.length }, null, 2) + "\n");
console.log("Verified Linux app artifact prepared without provider credentials.");
