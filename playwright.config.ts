import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
const externalUrl = process.env.E2E_BASE_URL;
const productionPreview = process.env.E2E_SERVER_MODE === "production";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: externalUrl || "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalUrl
    ? undefined
    : {
        command: productionPreview
          ? "node .next/standalone/server.js"
          : "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100",
        url: "http://127.0.0.1:3100",
        timeout: 120000,
        reuseExistingServer: false,
        env: {
          HOSTNAME: "127.0.0.1",
          PORT: "3100",
          APP_URL: "http://127.0.0.1:3100",
          PAYMENT_MODE: "fixture",
          AI_MODE: "fixture",
          DATABASE_URL: "",
          ALLOW_EMBEDDED_DATABASE: productionPreview ? "true" : "false",
          STORAGE_MODE: "local",
          ALLOW_LOCAL_STORAGE: "true",
          LOCAL_DATA_DIR: resolve(
            productionPreview ? ".data/e2e-production" : ".data/e2e",
            `run-${Date.now()}-${process.pid}`,
          ),
          SESSION_SECRET: "e2e-session-secret-only-for-local-test-server",
          OPERATOR_ACCESS_CODE: "e2e-operator",
          DEMO_ACCESS_CODE: "",
        },
      },
});
