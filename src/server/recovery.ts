import { getDatabase } from "./database";
import { audit, getWorkspace, mutateWorkspace, type Actor } from "./state";
import { executeRefund } from "./service";
import {
  getPayment,
  paymentMode,
  verifyProviderOrder,
  verifyWebhook,
} from "./payments";
import { paypalAmount } from "../domain/money";
import { quotePaymentMode } from "../domain/guard";
import { enqueueJob, processJobs } from "./jobs";

// Verified webhook events are wake-up signals. Financial status always comes from a provider GET.
export async function acceptWebhook(
  headers: Headers,
  event: { id: string; event_type: string; resource: Record<string, unknown> },
) {
  if (paymentMode() !== "sandbox" || !(await verifyWebhook(headers, event)))
    throw new Error("Webhook signature verification failed.");
  const db = await getDatabase();
  return db.transaction(async (sql) => {
    const receipt = await sql.query(
      "INSERT INTO webhook_receipts(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
      [event.id],
    );
    if (!receipt.rows.length) return { duplicate: true };
    const workspaces = await sql.query<{ id: string }>(
      "SELECT id FROM workspaces WHERE state->'operations' @> '[{\"state\":\"pending\"}]'::jsonb OR state->'operations' @> '[{\"state\":\"unknown\"}]'::jsonb",
    );
    for (const workspace of workspaces.rows)
      await enqueueJob(sql, workspace.id, "reconcile", {
        eventId: event.id,
        type: event.event_type,
      });
    return { duplicate: false };
  });
}

export async function recoverWorkspace(workspaceId: string, now = Date.now()) {
  if ((await getWorkspace(workspaceId)).archivedAt) return { failures: 0 };
  const actor: Actor = {
    workspaceId,
    userId: "background-worker",
    role: "reviewer",
  };
  await mutateWorkspace(workspaceId, (state) => {
    for (const group of state.groups)
      if (
        group.status !== "expired" &&
        Date.parse(group.checkoutExpiresAt || group.expiresAt) <= now
      ) {
        group.status = "expired";
        audit(state, actor, "group.expired", group.id);
      }
    for (const item of state.cases)
      if (
        !item.sellerResponded &&
        Date.parse(item.deadlineAt) <= now &&
        !["resolved", "refund_pending", "refund_failed"].includes(
          item.status,
        ) &&
        !state.audit.some(
          (a) =>
            a.action === "case.deadline_escalated" && a.resource === item.id,
        )
      ) {
        if (item.status !== "appealed") item.status = "review";
        const order = state.orders.find((o) => o.id === item.orderId)!;
        order.events.push({
          at: new Date(now).toISOString(),
          text: "The seller response deadline passed. Your request has been escalated for human review.",
        });
        audit(state, actor, "case.deadline_escalated", item.id);
      }
    for (const order of state.orders)
      if (
        order.status === "checkout_pending" &&
        Date.parse(order.quote.expiresAt) <= now &&
        !state.operations.some(
          (op) => op.orderId === order.id && op.kind === "capture",
        )
      ) {
        order.status = "canceled";
        order.events.push({
          at: new Date(now).toISOString(),
          text: "Unpaid approval expired. Review a fresh quote to continue.",
        });
        audit(state, actor, "checkout.expired", order.id);
      }
  });
  const state = await getWorkspace(workspaceId);
  let failures = 0;
  // Approval and operation preparation are separate durable steps. Recover a crash between them too.
  for (const item of state.cases.filter(
    (item) =>
      item.remedy === "refund" &&
      ["approved", "refund_pending"].includes(item.status),
  )) {
    try {
      await executeRefund(actor, item.orderId);
    } catch {
      failures++;
    }
  }
  for (const op of state.operations.filter((op) =>
    ["pending", "unknown"].includes(op.state),
  )) {
    const order = state.orders.find((o) => o.id === op.orderId)!;
    try {
      if (op.kind !== "capture" || !order.providerOrderId) continue;
      const remote =
        quotePaymentMode(order.quote) === "fixture"
          ? {
              id: order.providerOrderId,
              status: "COMPLETED",
              purchase_units: [
                {
                  custom_id: order.id,
                  payee: { merchant_id: order.quote.payee },
                  amount: {
                    value: paypalAmount(order.quote.amount),
                    currency_code: order.quote.currency,
                  },
                  payments: {
                    captures: [
                      {
                        id: `FIXTURE-CAPTURE-${op.id}`,
                        status: "COMPLETED",
                        amount: {
                          value: paypalAmount(order.quote.amount),
                          currency_code: order.quote.currency,
                        },
                      },
                    ],
                  },
                },
              ],
            }
          : await getPayment(order.providerOrderId);
      verifyProviderOrder(remote, order.quote, order.id);
      const captures = remote.purchase_units?.[0].payments?.captures;
      if (
        remote.status !== "COMPLETED" ||
        captures?.length !== 1 ||
        captures[0].status !== "COMPLETED"
      )
        continue;
      if (
        captures[0].amount.value !== paypalAmount(order.quote.amount) ||
        captures[0].amount.currency_code !== order.quote.currency
      )
        throw new Error("Provider capture differs from approval.");
      await mutateWorkspace(workspaceId, (fresh) => {
        const current = fresh.orders.find((o) => o.id === order.id)!;
        const operation = fresh.operations.find((o) => o.id === op.id)!;
        if (operation.state === "succeeded") return;
        current.captureId = captures[0].id;
        current.status = "paid";
        operation.state = "succeeded";
        operation.resultId = captures[0].id;
        current.events.push({
          at: new Date().toISOString(),
          text:
            quotePaymentMode(order.quote) === "fixture"
              ? "Fixture payment confirmed after reconciliation. No real money moved."
              : "PayPal sandbox payment confirmed after reconciliation.",
        });
        audit(fresh, actor, "payment.reconciled", order.id);
      });
    } catch {
      failures++;
    }
  }
  return { failures };
}

export async function workerTick() {
  const db = await getDatabase();
  let totalFailures = 0;
  const jobs = await processJobs(async (job) => {
    if (job.kind !== "reconcile") throw new Error("Unsupported job kind.");
    if ((await recoverWorkspace(job.workspace_id)).failures)
      throw new Error("Workspace reconciliation needs another attempt.");
  });
  totalFailures += jobs.failures;
  // Workspace row locks serialize mutations; the deployment runs one polling worker.
  let cursor = "";
  while (true) {
    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM workspaces WHERE id>$1 ORDER BY id LIMIT 100",
      [cursor],
    );
    if (!rows.length) break;
    for (const row of rows) {
      try {
        totalFailures += (await recoverWorkspace(row.id)).failures;
      } catch {
        totalFailures++;
      }
    }
    cursor = rows.at(-1)!.id;
  }
  await db.query(
    "INSERT INTO worker_heartbeats(id,seen_at,failures) VALUES('recovery',now(),$1) ON CONFLICT(id) DO UPDATE SET seen_at=excluded.seen_at,failures=excluded.failures",
    [totalFailures],
  );
  await db.query("DELETE FROM sessions WHERE expires_at<now()");
  return { failures: totalFailures, jobsCompleted: jobs.completed };
}
