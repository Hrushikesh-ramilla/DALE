import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { parse } from "dotenv";
import { randomBytes } from "node:crypto";
const directory = ".data/deploy";
await mkdir(directory, { recursive: true });
await build({
  entryPoints: ["scripts/worker.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: ".next/standalone/worker.cjs",
  external: ["pg", "@electric-sql/pglite", "@aws-sdk/client-s3"],
});
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
await cp("deploy", ".next/standalone/deploy", { recursive: true });
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
values.BUILD_ID = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (process.env.DEPLOY_AI_MODE) values.AI_MODE = process.env.DEPLOY_AI_MODE;
// Live voice is opt-in only after the owner verifies free quota and disabled billing.
values.VOICE_MODE = "disabled";
values.VOICE_MODEL = "gemini-3.8-live";
values.VOICE_FREE_TIER_CONFIRMED = "false";
values.VOICE_BILLING_DISABLED = "false";
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
// Next standalone copies .env automatically. Explicitly exclude every environment file from the archive.
execFileSync("tar", [
  "-czf",
  `${directory}/release.tar.gz`,
  "--exclude=.env",
  "--exclude=.env.*",
  "--exclude=node_modules/@next/swc-*",
  "--exclude=node_modules/@img",
  "-C",
  ".next/standalone",
  ".",
]);
console.log(
  "Release archive and private deployment configuration prepared in .data/deploy.",
);
