import "dotenv/config";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "dotenv";
import { paypalRequest } from "../src/server/payments";
const config = parse(await readFile(".data/deploy/production.env"));
const url = new URL("/api/paypal/webhook", config.APP_URL).href;
assert.equal(
  new URL(url).protocol,
  "https:",
  "The public webhook requires HTTPS.",
);
type Hook = { id: string; url: string; event_types: { name: string }[] };
const expected = [
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "CUSTOMER.DISPUTE.CREATED",
  "CUSTOMER.DISPUTE.UPDATED",
  "CUSTOMER.DISPUTE.RESOLVED",
];
const available = (await paypalRequest(
  "/v1/notifications/webhooks-event-types",
)) as { event_types: { name: string }[] };
assert.ok(
  expected.every((name) =>
    available.event_types.some((event) => event.name === name),
  ),
  "The app must support the required notification types before registration.",
);
const listed = (await paypalRequest("/v1/notifications/webhooks")) as {
  webhooks: Hook[];
};
const matching = listed.webhooks.filter((hook) => hook.url === url);
assert.ok(
  matching.length <= 1,
  "Multiple matching listeners need review; no duplicate was created.",
);
let hook = matching[0];
if (!hook) {
  hook = (await paypalRequest("/v1/notifications/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url,
      event_types: expected.map((name) => ({ name })),
    }),
  })) as Hook;
} else if (
  !hook.event_types.some((event) => event.name === "*") &&
  expected.some(
    (name) => !hook.event_types.some((event) => event.name === name),
  )
) {
  const names = [
    ...new Set([...hook.event_types.map((event) => event.name), ...expected]),
  ];
  await paypalRequest(
    `/v1/notifications/webhooks/${encodeURIComponent(hook.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify([
        {
          op: "replace",
          path: "/event_types",
          value: names.map((name) => ({ name })),
        },
      ]),
    },
  );
}
hook = (await paypalRequest(
  `/v1/notifications/webhooks/${encodeURIComponent(hook.id)}`,
)) as Hook;
assert.equal(hook.url, url);
assert.ok(
  hook.event_types.some((event) => event.name === "*") ||
    expected.every((name) =>
      hook.event_types.some((event) => event.name === name),
    ),
  "Registration read-back must confirm required subscriptions.",
);
const environment = await readFile(".env", "utf8");
const lines = environment
  .split(/\r?\n/)
  .filter((line) => !/^PAYPAL_WEBHOOK_ID\s*=/.test(line));
await writeFile(
  ".env",
  lines.join("\n").trimEnd() +
    `\nPAYPAL_WEBHOOK_ID=${JSON.stringify(hook.id)}\n`,
  { mode: 0o600 },
);
await mkdir(".data/reports", { recursive: true });
await writeFile(
  ".data/reports/paypal-webhook-configuration.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      environment: "sandbox",
      url,
      eventTypes: hook.event_types.map((event) => event.name),
      registrationReadBack: "passed",
      webhookIdSavedPrivately: true,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Sandbox listener and required event subscriptions verified; matching webhook ID saved in ignored .env. Package/deploy this configuration before financial acceptance.",
);
