import { writeFile, chmod } from "node:fs/promises";
import { execFileSync } from "node:child_process";
export async function writePrivateFile(
  path: string,
  contents: string | Buffer,
) {
  await writeFile(path, contents, { mode: 0o600 });
  if (process.platform === "win32") {
    const user = execFileSync("whoami", ["/user", "/fo", "csv", "/nh"], {
      encoding: "utf8",
      windowsHide: true,
    }).match(/S-1-\d+(?:-\d+)+/)?.[0];
    if (!user)
      throw new Error(
        "Cannot resolve the current account for private-file permissions.",
      );
    execFileSync(
      "icacls",
      [path, "/inheritance:r", "/grant:r", `*${user}:(F)`],
      { stdio: "ignore", windowsHide: true },
    );
  } else await chmod(path, 0o600);
}
