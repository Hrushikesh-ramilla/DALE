import { getDatabase } from "./database";
import {
  audit,
  getWorkspace,
  mutateWorkspace,
  type Actor,
  type Workspace,
} from "./state";
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
import {
  recordProviderWakeup,
  reconcileProviderAdjustments,
  preflightProviderOrder,
} from "./provider-adjustments";

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
    const workspaces = await sql.query<{ id: string; state: Workspace }>(
      "SELECT id,state FROM workspaces WHERE jsonb_array_length(state->'orders')>0 OR state->'operations' @> '[{\"state\":\"pending\"}]'::jsonb OR state->'operations' @> '[{\"state\":\"unknown\"}]'::jsonb FOR UPDATE",
    );
    for (const workspace of workspaces.rows) {
      if (workspace.state.archivedAt) continue;
      const changed = recordProviderWakeup(workspace.state, event);
      if (changed)
        await sql.query("UPDATE workspaces SET state=$2::jsonb WHERE id=$1", [
          workspace.id,
          JSON.stringify(workspace.state),
        ]);
      if (
        !changed &&
        !workspace.state.operations.some((operation) =>
          ["pending", "unknown"].includes(operation.state),
        )
      )
        continue;
      await enqueueJob(sql, workspace.id, "reconcile", {
        eventId: event.id,
        type: event.event_type,
      });
    }
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
    for (const order of state.orders) {
      if (
        order.captureId &&
        ["paid", "shipped"].includes(order.status) &&
        order.quote.deliveryBy &&
        Date.parse(order.quote.deliveryBy) <= now &&
        !order.fulfillmentIssue
      ) {
        order.fulfillmentIssue = {
          kind: "late",
          reason:
            "The recorded delivery promise passed without a recorded delivery.",
          at: new Date(now).toISOString(),
        };
        order.events.push({
          at: new Date(now).toISOString(),
          text: "Delivery is late against the recorded promise. Choose support, refund, or replacement; no new purchase is made automatically.",
        });
        audit(state, actor, "fulfillment.late", order.id);
      }
    }
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
        if (!["appealed", "approved"].includes(item.status))
          item.status = "review";
        const order = state.orders.find((o) => o.id === item.orderId)!;
        order.events.push({
          at: new Date(now).toISOString(),
          text: "The seller response deadline passed. Your request has been escalated for human review.",
        });
        audit(state, actor, "case.deadline_escalated", item.id);
      }
    for (const item of state.cases) {
      if (
        item.status === "resolved" ||
        !item.returnShipment?.remedyDueAt ||
        Date.parse(item.returnShipment.remedyDueAt) > now ||
        state.audit.some(
          (a) =>
            a.action === "case.remedy_target_escalated" &&
            a.resource === item.id,
        )
      )
        continue;
      const order = state.orders.find((o) => o.id === item.orderId)!;
      order.events.push({
        at: new Date(now).toISOString(),
        text: "The merchant's 24-hour remedy target passed. Your case is escalated for human follow-up; provider settlement timing remains separate.",
      });
      audit(state, actor, "case.remedy_target_escalated", item.id);
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
  const beforeProviderScan = await getWorkspace(workspaceId);
  let failures = 0;
  for (const order of beforeProviderScan.orders
    .filter(
      (entry) =>
        entry.captureId &&
        quotePaymentMode(entry.quote) === "sandbox" &&
        (!entry.providerScan ||
          Date.parse(entry.providerScan.nextCheckAt) <= now),
    )
    .slice(0, 2))
    failures += (
      await preflightProviderOrder(workspaceId, order.id, false, now)
    ).failures;
  failures += (await reconcileProviderAdjustments(workspaceId, now)).failures;
  const state = await getWorkspace(workspaceId);
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
  await db.query(
    "DELETE FROM request_budgets WHERE window_at<now()-interval '1 hour'",
  );
  return { failures: totalFailures, jobsCompleted: jobs.completed };
}
