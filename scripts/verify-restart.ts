import { readFile, writeFile } from "node:fs/promises";
const saved = JSON.parse(
  await readFile(".data/deploy/restart-check.json", "utf8"),
);
const response = await fetch(`${saved.baseURL}/api/session`, {
  headers: { Cookie: saved.cookie },
  signal: AbortSignal.timeout(15000),
});
const data = await response.json();
const passed =
  response.ok &&
  data.actor.workspaceId === saved.workspaceId &&
  data.orders.some((order: { id: string }) => order.id === saved.orderId);
await writeFile(
  ".data/reports/restart-persistence.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      passed,
      checked: [
        "Authenticated session",
        "Customer workspace",
        "Unapproved sandbox order",
      ],
      limitation:
        "This check requires the service to be restarted between verify-hosted and this command. It does not test a database restore.",
    },
    null,
    2,
  ),
);
console.log(
  `${passed ? "PASS" : "FAIL"}: Hosted session and order persisted across the service restart.`,
);
if (!passed) process.exitCode = 1;
