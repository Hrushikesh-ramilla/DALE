import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { parse } from "dotenv";
const source = parse(await readFile(".env"));
if (
  source.AI_BILLING_DISABLED !== "true" ||
  source.AI_FREE_QUOTA_CONFIRMED !== "true"
)
  throw new Error(
    "Confirm disabled billing and usable free quota in .env before starting live Gemini. No provider request sent.",
  );
if (!source.AI_API_KEY || !source.AI_MODEL)
  throw new Error("Configured Gemini key and model are required.");
const directory = resolve(".data/live-local");
await mkdir(directory, { recursive: true });
let sessionSecret;
try {
  sessionSecret = await readFile(resolve(directory, "session-secret"), "utf8");
} catch {
  sessionSecret = randomBytes(32).toString("hex");
  await writeFile(resolve(directory, "session-secret"), sessionSecret, {
    mode: 0o600,
  });
}
const port = "3001";
const child = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ...source,
    HOSTNAME: "127.0.0.1",
    PORT: port,
    APP_URL: `http://localhost:${port}`,
    SESSION_SECRET: sessionSecret.trim(),
    LOCAL_DATA_DIR: directory,
    DATABASE_URL: "",
    ALLOW_EMBEDDED_DATABASE: "true",
    STORAGE_MODE: "local",
    ALLOW_LOCAL_STORAGE: "true",
    PAYMENT_MODE: "sandbox",
    AI_MODE: "live",
    AGENT_MODEL_ENABLED: "true",
    OPERATOR_ACCESS_CODE:
      source.OPERATOR_ACCESS_CODE || randomBytes(24).toString("hex"),
    DEMO_ACCESS_CODE: source.DEMO_ACCESS_CODE || "",
  },
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
console.log(
  `Live integration preview: http://localhost:${port}/live. Provider configuration was loaded privately; no secrets are printed.`,
);
