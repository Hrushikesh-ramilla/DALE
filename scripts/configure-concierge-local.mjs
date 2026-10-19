import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "dotenv";
const source = parse(await readFile(".env", "utf8"));
const candidate = JSON.parse(
  await readFile(".data/self-hosted/candidate.json", "utf8"),
);
const key = (await readFile(".data/self-hosted/api-key", "utf8")).trim();
const directory = resolve(
  source.LOCAL_DATA_DIR || ".data/local-final",
).replaceAll("\\", "/");
const environment = {
  ...source,
  LOCAL_DATA_DIR: directory,
  DATABASE_URL: "",
  ALLOW_EMBEDDED_DATABASE: "true",
  AI_PROVIDER: "self_hosted",
  AI_MODEL: candidate.alias,
  AI_MODE: "live",
  AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:8081/v1",
  AI_SELF_HOSTED_API_KEY: key,
  CONCIERGE_PROVIDER: "self_hosted",
  CONCIERGE_MODEL: candidate.alias,
  CONCIERGE_ALLOW_CLOUD: "false",
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
    provider: "self_hosted",
    model: candidate.alias,
    embeddings: "dale-bge-small-en-v1.5",
    paymentMode: source.PAYMENT_MODE || "fixture",
    originalEnvPreserved: true,
  }),
);
