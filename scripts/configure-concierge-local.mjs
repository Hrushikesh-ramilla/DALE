import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { randomBytes } from "node:crypto";
const source = parse(await readFile(".env", "utf8"));
let previous = {};
try {
  previous = parse(await readFile(".data/concierge.env", "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const provider =
  process.argv.find((arg) => arg.startsWith("--provider="))?.split("=")[1] ||
  source.CONCIERGE_PROVIDER ||
  source.AI_PROVIDER ||
  "self_hosted";
if (!["gemini", "self_hosted"].includes(provider))
  throw new Error("Select gemini or self_hosted with --provider=...");
const candidate =
  provider === "self_hosted"
    ? JSON.parse(await readFile(".data/self-hosted/candidate.json", "utf8"))
    : null;
const configuredModel = source.CONCIERGE_MODEL || source.AI_MODEL;
const modelOverride = process.argv
  .find((arg) => arg.startsWith("--model="))
  ?.split("=")[1];
const remembered =
  previous.CONCIERGE_PROVIDER === provider &&
  previous.CONCIERGE_SOURCE_AI_MODEL === configuredModel;
const model =
  provider === "gemini"
    ? modelOverride ||
      (remembered ? previous.CONCIERGE_MODEL : undefined) ||
      configuredModel
    : candidate.alias;
const reasoning =
  process.argv.find((arg) => arg.startsWith("--reasoning="))?.split("=")[1] ||
  source.CONCIERGE_REASONING_EFFORT ||
  (remembered ? previous.CONCIERGE_REASONING_EFFORT : undefined) ||
  "low";
if (!["none", "minimal", "low", "medium", "high"].includes(reasoning))
  throw new Error("Invalid Gemini reasoning setting.");
if (
  !model ||
  (provider === "gemini" &&
    (!source.AI_API_KEY || !model.startsWith("gemini-")))
)
  throw new Error("Configure the Gemini model and AI_API_KEY in .env first.");
if (
  provider === "gemini" &&
  (source.AI_BILLING_DISABLED !== "true" ||
    source.AI_FREE_QUOTA_CONFIRMED !== "true")
)
  throw new Error(
    "Existing no-spend policy requires confirmed free Gemini quota and disabled billing.",
  );
const key = (await readFile(".data/self-hosted/api-key", "utf8")).trim();
const directory = resolve(
  source.LOCAL_DATA_DIR || ".data/local-final",
).replaceAll("\\", "/");
await mkdir(directory, { recursive: true });
let sessionSecret = source.SESSION_SECRET;
if (!sessionSecret) {
  const secretFile = resolve(directory, "session-secret");
  try {
    sessionSecret = (await readFile(secretFile, "utf8")).trim();
  } catch {
    try {
      await writeFile(secretFile, randomBytes(32).toString("hex"), {
        flag: "wx",
        mode: 0o600,
      });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    sessionSecret = (await readFile(secretFile, "utf8")).trim();
  }
}
if (sessionSecret.length < 32)
  throw new Error("Local session secret must contain at least 32 characters.");
const environment = {
  ...source,
  SESSION_SECRET: sessionSecret,
  LOCAL_DATA_DIR: directory,
  DATABASE_URL: "",
  ALLOW_EMBEDDED_DATABASE: "true",
  AI_PROVIDER: provider,
  AI_MODEL: model,
  AI_MODE: "live",
  AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:8081/v1",
  AI_SELF_HOSTED_API_KEY: key,
  CONCIERGE_PROVIDER: provider,
  CONCIERGE_MODEL: model,
  CONCIERGE_SOURCE_AI_MODEL: configuredModel || "",
  CONCIERGE_REASONING_EFFORT: reasoning,
  CONCIERGE_ALLOW_CLOUD: String(provider === "gemini"),
  CONCIERGE_EMBEDDING_BASE_URL: "http://127.0.0.1:8082/v1",
  CONCIERGE_EMBEDDING_MODEL: "dale-bge-small-en-v1.5",
  CONCIERGE_EMBEDDING_PROFILE: "bge",
  CONCIERGE_EMBEDDING_API_KEY: key,
  APP_URL: "http://localhost:3000",
  STORAGE_MODE: "local",
  ALLOW_LOCAL_STORAGE: "true",
  VOICE_MODE: "disabled",
};
try {
  const speech = resolve(
    ".data/self-hosted/speech/b5454/Release/whisper-cli.exe",
  ).replaceAll("\\", "/");
  const speechModel = resolve(
    ".data/self-hosted/speech/ggml-tiny.bin",
  ).replaceAll("\\", "/");
  await access(speech);
  await access(speechModel);
  Object.assign(environment, {
    VOICE_MODE: "local",
    LOCAL_SPEECH_EXECUTABLE: speech,
    LOCAL_SPEECH_MODEL: speechModel,
  });
} catch {
  /* Absence is reported by the actual transcription endpoint; cloud speech stays disabled. */
}
await mkdir(".data", { recursive: true });
await writeFile(
  ".data/concierge.env",
  Object.entries(environment)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
console.log(
  JSON.stringify({
    configuration: ".data/concierge.env",
    dataDirectory: directory,
    provider,
    model,
    reasoning,
    embeddings: "dale-bge-small-en-v1.5",
    paymentMode: source.PAYMENT_MODE || "fixture",
    originalEnvPreserved: true,
  }),
);
