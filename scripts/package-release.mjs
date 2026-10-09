import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { parse } from "dotenv";
import { randomBytes } from "node:crypto";
import { releaseProviderConfig } from "./release-provider-config.mjs";
import { validateReleaseRuntime } from "./validate-release-runtime.mjs";
import { validateAppArchive } from "./validate-app-archive.mjs";
const directory = ".data/deploy";
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (process.platform === "linux")
  execFileSync(process.execPath, ["scripts/package-linux-app.mjs"], { stdio: "inherit" });
const artifactDirectory = process.platform === "linux" ? ".data/linux-artifact" : ".data/deploy/linux-app";
let archive, metadata;
try {
  archive = await readFile(`${artifactDirectory}/release.tar.gz`);
  metadata = JSON.parse(await readFile(`${artifactDirectory}/artifact.json`, "utf8"));
} catch {
  throw new Error("Linux CI artifact is missing. Download linux-app-release from the successful current-commit CI run into .data/deploy/linux-app. Private deployment settings have not been changed.");
}
validateAppArchive(metadata, archive, head);
await mkdir(directory, { recursive: true });
const source = parse(await readFile(".env"));
let values;
try {
  values = parse(await readFile(`${directory}/production.env`));
} catch {
  const password = randomBytes(24).toString("hex");
  values = {
    APP_HOST: process.env.DEPLOY_HOST || "16.4.25.181.sslip.io",
    APP_URL: `https://${process.env.DEPLOY_HOST || "16.4.25.181.sslip.io"}`,
    SESSION_SECRET: randomBytes(32).toString("hex"),
    DATABASE_URL: `postgresql://buyerguard:${password}@127.0.0.1:5432/buyerguard`,
    LOCAL_DATA_DIR: "/var/lib/buyerguard",
    STORAGE_MODE: "local",
    ALLOW_LOCAL_STORAGE: "true",
    PAYMENT_MODE: "sandbox",
    AI_MODE: "live",
    DEMO_ACCESS_CODE: randomBytes(8).toString("hex"),
    OPERATOR_ACCESS_CODE: randomBytes(16).toString("hex"),
  };
  await writeFile(
    `${directory}/database.sql`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='buyerguard') THEN CREATE ROLE buyerguard LOGIN PASSWORD '${password}'; END IF; END $$;\n`,
    { mode: 0o600 },
  );
}
for (const key of [
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_MERCHANT_ID",
  "PAYPAL_WEBHOOK_ID",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_API_BASE_URL",
])
  if (source[key]) values[key] = source[key];
values.BUILD_ID = metadata.source;
Object.assign(values, releaseProviderConfig(source, values, process.env));
validateReleaseRuntime(
  values,
  JSON.parse(await readFile("deploy/model-candidates.json", "utf8")),
);
// Reviewed public manufacturer HTTP is independent of model billing. Demo
// workspaces remain snapshot-only; an explicit owner setting is preserved.
values.REAL_RESEARCH_REFRESH_ENABLED =
  source.REAL_RESEARCH_REFRESH_ENABLED ||
  values.REAL_RESEARCH_REFRESH_ENABLED ||
  "true";
await writeFile(
  `${directory}/production.env`,
  Object.entries(values)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
await writeFile(
  `${directory}/access-codes.txt`,
  `Engineer URL: ${values.APP_URL}\nShopper access code: ${values.DEMO_ACCESS_CODE}\nOperator access code: ${values.OPERATOR_ACCESS_CODE}\nOperators must enter the customer's workspace ID from Environment details. Use separate browser profiles.\n`,
  { mode: 0o600 },
);
await cp(`${artifactDirectory}/release.tar.gz`, `${directory}/release.tar.gz`);
await cp(`${artifactDirectory}/artifact.json`, `${directory}/artifact.json`);
console.log(
  "Release archive and private deployment configuration prepared in .data/deploy.",
);
