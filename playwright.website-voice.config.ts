import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import base from "./playwright.chat-memory.config";

// Optional hardware-backed suite: uses the configured local speech assets,
// actual browser microphone transport and an owned synthetic speech recording.
const speech = JSON.parse(
  readFileSync(".data/self-hosted/speech/config.json", "utf8"),
);
export default defineConfig({
  ...base,
  testMatch: "website-voice.spec.ts",
  timeout: 120000,
  use: {
    ...base.use,
    permissions: ["microphone"],
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        `--use-file-for-fake-audio-capture=${resolve("fixtures/voice-v1/orders.wav")}`,
      ],
    },
  },
  webServer: {
    ...(base.webServer as object),
    command: "npx tsx scripts/chat-memory-browser-server.ts",
    url: "http://127.0.0.1:3130/api/health",
    env: {
      ...(base.webServer as { env: Record<string, string> }).env,
      VOICE_BROWSER_ACCEPTANCE: "true",
      VOICE_MODE: "local",
      LOCAL_SPEECH_EXECUTABLE: speech.executable,
      LOCAL_SPEECH_MODEL: speech.model,
    },
  },
});
