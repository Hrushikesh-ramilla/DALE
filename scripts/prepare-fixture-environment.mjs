import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

await mkdir(".data/deploy", { recursive: true });
const values = {
  BUYERGUARD_ENV_FILE: ".data/deploy/docker.env",
  APP_URL: "http://127.0.0.1:3000",
  POSTGRES_PASSWORD: randomBytes(24).toString("hex"),
  SESSION_SECRET: randomBytes(32).toString("hex"),
  OPERATOR_ACCESS_CODE: "e2e-operator",
  DEMO_ACCESS_CODE: "",
  PAYMENT_MODE: "fixture",
  AI_MODE: "fixture",
  BUILD_ID: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
};
await writeFile(
  ".data/deploy/docker.env",
  Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
console.log(
  "Private local fixture configuration prepared without provider credentials.",
);
