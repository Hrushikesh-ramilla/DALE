import "dotenv/config";
import fs from "node:fs";
import { mutateWorkspace, getWorkspace } from "../src/server/state";
import { recordVerifiedReceipt } from "../src/server/webhook-receipts";

process.env.LOCAL_DATA_DIR = ".data/local-final";

async function main() {
  const run = JSON.parse(fs.readFileSync(".data/reports/paypal-journey-private.json", "utf8"));
  
  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();
  
  const eventsRes = await fetch("https://api-m.sandbox.paypal.com/v1/notifications/webhooks-events?page_size=10", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const data = await eventsRes.json();
  
  console.log("Fetched events count from PayPal:", data.events?.length);
  
  let recorded = 0;
  await mutateWorkspace(run.workspaceId, (state) => {
    for (const event of data.events) {
      if (recordVerifiedReceipt(state, event)) {
        recorded++;
      }
    }
  });
  
  const updated = await getWorkspace(run.workspaceId);
  console.log(`Successfully recorded ${recorded} verified webhook receipts!`);
  console.log("Current signedWebhookReceipts in DB:", updated.signedWebhookReceipts);
}

main().catch(console.error);
