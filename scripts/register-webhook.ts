import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { paypalRequest } from "../src/server/payments";
const file = ".data/deploy/production.env";
const config = parse(await readFile(file));
const url = `${config.APP_URL}/api/paypal/webhook`;
const existing = (await paypalRequest("/v1/notifications/webhooks")) as {
  webhooks?: { id: string; url: string }[];
};
let webhook = existing.webhooks?.find((entry) => entry.url === url);
if (!webhook)
  webhook = (await paypalRequest("/v1/notifications/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url,
      event_types: [
        { name: "PAYMENT.CAPTURE.COMPLETED" },
        { name: "PAYMENT.CAPTURE.REFUNDED" },
        { name: "PAYMENT.CAPTURE.PENDING" },
        { name: "PAYMENT.CAPTURE.DENIED" },
      ],
    }),
  })) as { id: string; url: string };
config.PAYPAL_WEBHOOK_ID = webhook.id;
await writeFile(
  file,
  Object.entries(config)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
const environment = await readFile(".env", "utf8");
await writeFile(
  ".env",
  `${environment.replace(/^PAYPAL_WEBHOOK_ID=.*\r?\n?/m, "").trimEnd()}\nPAYPAL_WEBHOOK_ID=${webhook.id}\n`,
  { mode: 0o600 },
);
console.log(
  "Sandbox webhook registered and ID saved in ignored configuration. Actual delivery remains to be tested.",
);
