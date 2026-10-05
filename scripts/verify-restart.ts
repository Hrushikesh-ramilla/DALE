import { readFile, writeFile } from "node:fs/promises";
const saved = JSON.parse(
  await readFile(".data/deploy/restart-check.json", "utf8"),
);
const response = await fetch(`${saved.baseURL}/api/session`, {
  headers: { Cookie: saved.cookie },
  signal: AbortSignal.timeout(15000),
});
const data = await response.json();
const health = await (
  await fetch(`${saved.baseURL}/api/health`, {
    signal: AbortSignal.timeout(15000),
  })
).json();
const restarted =
  !!saved.instance && !!health.instance && saved.instance !== health.instance;
const passed =
  restarted &&
  response.ok &&
  data.actor.workspaceId === saved.workspaceId &&
  data.orders.some((order: { id: string }) => order.id === saved.orderId);
await writeFile(
  ".data/reports/restart-persistence.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      passed,
      restarted,
      build: health.build,
      checked: [
        "Authenticated session",
        "Customer workspace",
        "Unapproved sandbox order",
      ],
      limitation:
        "A changed server instance is required. This does not test a database restore.",
    },
    null,
    2,
  ),
);
console.log(
  `${passed ? "PASS" : "FAIL"}: Hosted session and order persisted across the service restart.`,
);
if (!restarted)
  console.log(
    "Run verify-hosted to record a baseline, restart the app service, then rerun this check.",
  );
if (!passed) process.exitCode = 1;
