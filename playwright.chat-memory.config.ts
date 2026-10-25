import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
const directory =
  process.env.CHAT_MEMORY_BROWSER_DIR ||
  resolve(`.data/chat-memory-browser-${Date.now()}`);
process.env.CHAT_MEMORY_BROWSER_DIR = directory;
export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "chat-memory.spec.ts",
    "website-actions.spec.ts",
    "website-evidence.spec.ts",
    "website-customer-flows.spec.ts",
  ],
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3130",
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx tsx scripts/chat-memory-browser-server.ts",
    url: "http://127.0.0.1:3130/api/health",
    timeout: 180000,
    reuseExistingServer: false,
    env: {
      HOSTNAME: "127.0.0.1",
      PORT: "3130",
      APP_URL: "http://127.0.0.1:3130",
      DATABASE_URL: "",
      ALLOW_EMBEDDED_DATABASE: "true",
      ALLOW_LOCAL_STORAGE: "true",
      STORAGE_MODE: "local",
      LOCAL_DATA_DIR: directory,
      SESSION_SECRET: "chat-memory-browser-contract-secret-32-characters",
      PAYMENT_MODE: "fixture",
      AI_MODE: "fixture",
      CONCIERGE_PROVIDER: "self_hosted",
      CONCIERGE_MODEL: "session-memory-browser-contract",
      CONCIERGE_INPUT_TOKEN_LIMIT: "100000",
      CONCIERGE_SELF_HOSTED_BASE_URL: "http://127.0.0.1:3182/v1",
      AI_SELF_HOSTED_API_KEY: "",
      CONCIERGE_EMBEDDING_MODEL: "",
      CONCIERGE_ALLOW_CLOUD: "false",
      DEMO_ACCESS_CODE: "",
    },
  },
});
