import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    // Fresh catalog setup now imports thousands of reviewed records. Keep a
    // bounded setup budget consistent with the existing integration-test budget.
    hookTimeout: 30000,
    testTimeout: 30000,
  },
  resolve: { alias: { "@": new URL("./src/", import.meta.url).pathname } },
});
