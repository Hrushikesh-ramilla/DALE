import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { parse } from "dotenv";
const source = parse(await readFile(".data/concierge.env", "utf8"));
const args = process.argv.includes("--index")
  ? ["--import", "tsx", "scripts/index-concierge.ts"]
  : [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3000",
    ];
const child = spawn(process.execPath, args, {
  env: { ...process.env, ...source },
  stdio: "inherit",
  windowsHide: true,
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
