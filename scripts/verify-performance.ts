import { readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { request } from "@playwright/test";
async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const contexts = await Promise.all(
    Array.from({ length: 10 }, () =>
      request.newContext({
        baseURL: config.APP_URL,
        timeout: 15000,
        extraHTTPHeaders: { Origin: config.APP_URL },
      }),
    ),
  );
  for (const client of contexts) {
    const response = await client.post("/api/session", {
      data: { role: "buyer", accessCode: config.DEMO_ACCESS_CODE },
    });
    if (!response.ok()) throw new Error("Performance session creation failed.");
  }
  const samples: { wallMs: number; appMs: number; passed: boolean }[] = [];
  for (let wave = 0; wave < 10; wave++) {
    const results = await Promise.all(
      contexts.map(async (client) => {
        const start = performance.now();
        const response = await client.get("/api/session");
        const wallMs = performance.now() - start;
        const appMs = Number(
          response.headers()["server-timing"]?.match(/app;dur=([\d.]+)/)?.[1] ||
            NaN,
        );
        const data = await response.json();
        return {
          wallMs,
          appMs,
          passed:
            response.ok() &&
            !!data.actor &&
            !!response.headers()["x-request-id"] &&
            Number.isFinite(appMs),
        };
      }),
    );
    samples.push(...results);
  }
  const percentile = (values: number[], fraction: number) =>
    values.slice().sort((a, b) => a - b)[
      Math.ceil(values.length * fraction) - 1
    ];
  const appP95 = percentile(
    samples.map((s) => s.appMs),
    0.95,
  );
  const wallP95 = percentile(
    samples.map((s) => s.wallMs),
    0.95,
  );
  const health = await (await contexts[0].get("/api/health")).json();
  const passed = samples.every((s) => s.passed) && appP95 < 1000;
  await writeFile(
    ".data/reports/performance.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        build: health.build,
        requirement:
          "10 concurrent sessions; non-AI API work p95 under one second",
        endpoint: "GET /api/session",
        environment: "Public HTTPS, existing EC2 t3.micro, PostgreSQL",
        concurrentSessions: 10,
        totalRequests: samples.length,
        passed,
        appP95Ms: appP95,
        networkInclusiveP95Ms: wallP95,
        samples,
        limitations:
          "Measures authenticated non-AI session reads across ten waves, including serialization in app timing. Provider latency, large media, and sustained production load are not established.",
      },
      null,
      2,
    ),
  );
  await Promise.all(contexts.map((c) => c.dispose()));
  console.log(
    `${passed ? "PASS" : "FAIL"}: 10-session API test, application p95 ${appP95.toFixed(2)} ms; network-inclusive p95 ${wallP95.toFixed(2)} ms.`,
  );
  if (!passed) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Performance check failed; secret-bearing request details withheld.",
  );
  process.exitCode = 1;
});
