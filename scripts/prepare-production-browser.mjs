import { cp, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve, dirname, sep } from "node:path";

// Serve the optimized application and the same browser assets used by a release.
// Provider configuration and credentials are not needed for fixture acceptance.
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
await mkdir(".next/standalone/deploy", { recursive: true });
await cp("deploy/local-ocr.mjs", ".next/standalone/deploy/local-ocr.mjs");
// The OCR helper is a separate executable, outside the route import graph.
// Trace its Node worker explicitly so production never borrows development deps.
const require = createRequire(import.meta.url);
const { nodeFileTrace } = require("next/dist/compiled/@vercel/nft");
const trace = await nodeFileTrace(
  [
    "deploy/local-ocr.mjs",
    "node_modules/tesseract.js/src/worker-script/node/index.js",
  ],
  { base: process.cwd() },
);
for (const relative of trace.fileList) {
  const normalized = relative.split(sep).join("/");
  if (
    !normalized.startsWith("node_modules/") &&
    normalized !== "deploy/local-ocr.mjs"
  )
    throw new Error("Unexpected file in private OCR runtime trace.");
  const source = resolve(relative);
  const target = resolve(".next/standalone", relative);
  if (
    !source.startsWith(process.cwd() + sep) ||
    !target.startsWith(resolve(".next/standalone") + sep)
  )
    throw new Error("OCR trace escaped artifact roots.");
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}
let commit = process.env.BUILD_ID || process.env.GITHUB_SHA;
if (!commit) {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // Docker intentionally excludes Git; runtime deployment supplies BUILD_ID.
    commit = "unversioned";
  }
}
await writeFile(
  ".next/preview-build.json",
  JSON.stringify({
    commit,
    preparedAt: new Date().toISOString(),
  }),
);
