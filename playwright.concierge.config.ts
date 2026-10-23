import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "concierge.spec.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 20000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3120",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command:
      process.env.E2E_CONCIERGE_PRODUCTION === "true"
        ? "node .next/standalone/server.js"
        : "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3120",
    url: "http://127.0.0.1:3120/api/health",
    timeout: 180000,
    reuseExistingServer: false,
    env: {
      HOSTNAME: "127.0.0.1",
      PORT: "3120",
      APP_URL: "http://127.0.0.1:3120",
      DATABASE_URL: "",
      ALLOW_EMBEDDED_DATABASE: "true",
      ALLOW_LOCAL_STORAGE: "true",
      LOCAL_DATA_DIR: resolve(`.data/concierge-e2e-${Date.now()}`),
      SESSION_SECRET: "concierge-browser-contract-test-secret-32-characters",
      PAYMENT_MODE: "fixture",
      AI_MODE: "fixture",
      CONCIERGE_PROVIDER: "self_hosted",
      CONCIERGE_MODEL: "browser-contract-fixture",
      AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:3181/v1",
      AI_SELF_HOSTED_API_KEY: "",
      CONCIERGE_EMBEDDING_MODEL: "",
      CONCIERGE_ALLOW_CLOUD: "false",
      DEMO_ACCESS_CODE: "",
    },
  },
});
