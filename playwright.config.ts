import { defineConfig, devices } from "@playwright/test";
const externalUrl = process.env.E2E_BASE_URL;
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
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: "http://127.0.0.1:3100",
        timeout: 120000,
        reuseExistingServer: false,
        env: {
          APP_URL: "http://127.0.0.1:3100",
          PAYMENT_MODE: "fixture",
          AI_MODE: "fixture",
          DATABASE_URL: "",
          LOCAL_DATA_DIR: ".data/e2e",
          SESSION_SECRET: "e2e-session-secret-only-for-local-test-server",
          OPERATOR_ACCESS_CODE: "e2e-operator",
          DEMO_ACCESS_CODE: "",
        },
      },
});
