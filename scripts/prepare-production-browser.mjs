import { cp, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// Serve the optimized application and the same browser assets used by a release.
// Provider configuration and credentials are not needed for fixture acceptance.
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
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
