import { z } from "zod";
import {
  captureFromProviderLink,
  providerMinorUnits,
  type ProviderObservation,
} from "../domain/provider-adjustments";
import { quotePaymentMode } from "../domain/guard";
import {
  audit,
  getWorkspace,
  mutateWorkspace,
  type Actor,
  type Workspace,
} from "./state";
import {
  getProviderCapture,
  getProviderDispute,
  getProviderRefund,
  getProviderDisputesForCapture,
} from "./payments";

type ProviderEvent = {
  id: string;
  event_type: string;
  resource: Record<string, unknown>;
};
export async function preflightProviderOrder(
  workspaceId: string,
  orderId: string,
  force = false,
  now = Date.now(),
) {
  const before = await getWorkspace(workspaceId);
  const order = before.orders.find((entry) => entry.id === orderId);
  if (
    !order?.captureId ||
    before.fixtureWorkspace ||
    quotePaymentMode(order.quote) !== "sandbox"
  )
    return { failures: 0 };
  if (
    !force &&
    order.providerScan &&
    Date.parse(order.providerScan.nextCheckAt) > now
  )
    return { failures: 0 };
  await mutateWorkspace(workspaceId, (state) => {
    const current = state.orders.find((entry) => entry.id === orderId)!;
    current.providerScan = {
      status: "checking",
      nextCheckAt: new Date(now + 600000).toISOString(),
    };
    current.providerObservations ??= [];
    let capture = current.providerObservations.find(
      (entry) =>
        entry.kind === "capture" && entry.reference === order.captureId,
    );
    if (!capture) {
      capture = {
        kind: "capture",
        reference: order.captureId!,
        captureId: order.captureId!,
        trigger: "preflight",
        state: "pending",
        eventIds: [],
        attempts: 0,
        observedAt: new Date(now).toISOString(),
        explanation:
          "Checking current capture and dispute facts before another remedy.",
      };
      current.providerObservations.push(capture);
    }
    capture.state = "pending";
    capture.nextCheckAt = undefined;
    for (const operation of state.operations.filter(
      (entry) =>
        entry.orderId === orderId && entry.kind === "refund" && entry.resultId,
    )) {
      if (
        current.providerObservations.some(
          (entry) =>
            entry.kind === "refund" && entry.reference === operation.resultId,
        )
      )
        continue;
      current.providerObservations.push({
        kind: "refund",
        reference: operation.resultId!,
        captureId: order.captureId!,
        trigger: "preflight",
        state: "pending",
        eventIds: [],
        attempts: 0,
        observedAt: new Date(now).toISOString(),
        explanation:
          "Rechecking the known refund reference before a further remedy.",
      });
    }
  });
  try {
    const disputes = await getProviderDisputesForCapture(order.captureId);
    await mutateWorkspace(workspaceId, (state) => {
      const current = state.orders.find((entry) => entry.id === orderId)!;
      for (const dispute of disputes) {
        let observation = current.providerObservations!.find(
          (entry) =>
            entry.kind === "dispute" && entry.reference === dispute.dispute_id,
        );
        if (!observation) {
          observation = {
            kind: "dispute",
            reference: dispute.dispute_id,
            captureId: order.captureId!,
            trigger: "preflight",
            state: "pending",
            eventIds: [],
            attempts: 0,
            observedAt: new Date(now).toISOString(),
            explanation:
              "A provider read discovered this dispute. Verify its full capture-linked facts before another remedy.",
          };
          current.providerObservations!.push(observation);
        }
        observation.state = "pending";
        observation.nextCheckAt = undefined;
      }
      current.providerScan = {
        status: "complete",
        checkedAt: new Date(now).toISOString(),
        nextCheckAt: new Date(now + 600000).toISOString(),
      };
    });
    return { failures: 0 };
  } catch {
    await mutateWorkspace(workspaceId, (state) => {
      const current = state.orders.find((entry) => entry.id === orderId)!;
      current.providerScan = {
        status: "review",
        nextCheckAt: new Date(now + 600000).toISOString(),
      };
      const observation = current.providerObservations!.find(
        (entry) =>
          entry.kind === "capture" && entry.reference === order.captureId,
      )!;
      observation.state = "review";
      observation.nextCheckAt = new Date(now + 600000).toISOString();
      observation.explanation =
        "Capture/dispute discovery is unavailable or incomplete. Further remedies are paused pending reconciliation; your claim remains open.";
    });
    return { failures: 1 };
  }
}
export function recordProviderWakeup(state: Workspace, event: ProviderEvent) {
  const resource = event.resource;
  const reference = z
    .string()
    .min(1)
    .max(255)
    .safeParse(resource.dispute_id || resource.id);
  if (!reference.success) return false;
  let kind: ProviderObservation["kind"];
  let captures: string[] = [];
  if (
    /^CUSTOMER\.DISPUTE\.(CREATED|UPDATED|RESOLVED)$/.test(event.event_type)
  ) {
    kind = "dispute";
    const transactions = z
      .array(z.object({ seller_transaction_id: z.string().min(1).max(255) }))
      .max(10)
      .safeParse(resource.disputed_transactions);
    if (transactions.success)
      captures = transactions.data.map(
        (transaction) => transaction.seller_transaction_id,
      );
  } else if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    const links = z
      .array(z.object({ rel: z.string(), href: z.string() }))
      .max(20)
      .safeParse(resource.links);
    const captureId = links.success
      ? captureFromProviderLink(links.data)
      : undefined;
    kind = captureId ? "refund" : "capture";
    captures = [captureId || reference.data];
  } else if (event.event_type === "PAYMENT.CAPTURE.REVERSED") {
    kind = "capture";
    captures = [reference.data];
  } else return false;
  let matched = false;
  for (const order of state.orders) {
    if (!order.captureId || quotePaymentMode(order.quote) !== "sandbox")
      continue;
    const existing = order.providerObservations?.find(
      (observation) =>
        observation.kind === kind && observation.reference === reference.data,
    );
    if (
      !captures.includes(order.captureId) &&
      !(kind === "dispute" && existing)
    )
      continue;
    matched = true;
    order.providerObservations ??= [];
    const observation = existing || {
      kind,
      reference: reference.data,
      captureId: order.captureId,
      state: "pending" as const,
      eventIds: [],
      attempts: 0,
      observedAt: new Date().toISOString(),
      explanation:
        "Verified provider notification received. Financial facts require a provider read before another remedy.",
    };
    observation.state = "pending";
    observation.trigger = "notification";
    observation.nextCheckAt = undefined;
    observation.eventIds = [
      ...new Set([...observation.eventIds, event.id]),
    ].slice(-20);
    if (!existing) order.providerObservations.push(observation);
  }
  return matched;
}

export async function reconcileProviderAdjustments(
  workspaceId: string,
  now = Date.now(),
) {
  const actor: Actor = {
    workspaceId,
    userId: "provider-reconciler",
    role: "reviewer",
  };
  const before = await getWorkspace(workspaceId);
  let failures = 0;
  for (const order of before.orders)
    for (const receipt of [...(order.providerObservations || [])].sort(
      (left, right) =>
        Number(right.kind === "refund") - Number(left.kind === "refund"),
    )) {
      if (
        receipt.state === "verified" ||
        (receipt.nextCheckAt && Date.parse(receipt.nextCheckAt) > now)
      )
        continue;
      // Fixture records cannot trigger real provider calls, including when global mode changes.
      if (
        before.fixtureWorkspace ||
        quotePaymentMode(order.quote) !== "sandbox"
      )
        continue;
      try {
        const read =
          receipt.kind === "refund"
            ? {
                kind: "refund" as const,
                data: await getProviderRefund(receipt.reference),
              }
            : receipt.kind === "dispute"
              ? {
                  kind: "dispute" as const,
                  data: await getProviderDispute(receipt.reference),
                }
              : {
                  kind: "capture" as const,
                  data: await getProviderCapture(receipt.reference),
                };
        await mutateWorkspace(workspaceId, (state) => {
          const current = state.orders.find((entry) => entry.id === order.id)!;
          const observation = current.providerObservations!.find(
            (entry) =>
              entry.kind === receipt.kind &&
              entry.reference === receipt.reference,
          )!;
          if (observation.state === "verified") return;
          if (
            current.captureId !== receipt.captureId ||
            current.quote.currency !== "USD"
          )
            throw new Error(
              "Provider observation no longer matches its captured order.",
            );
          const remote = read.data;
          const updatedAt =
            "update_time" in remote ? remote.update_time : undefined;
          if (updatedAt && !Number.isFinite(Date.parse(updatedAt)))
            throw new Error("Provider update timestamp is invalid.");
          if (
            observation.providerUpdatedAt &&
            (!updatedAt ||
              Date.parse(updatedAt) < Date.parse(observation.providerUpdatedAt))
          )
            throw new Error(
              "Out-of-order provider observation cannot regress established facts.",
            );
          observation.providerUpdatedAt = updatedAt;
          observation.attempts++;
          observation.observedAt = new Date(now).toISOString();
          observation.nextCheckAt = new Date(now + 60000).toISOString();
          if (read.kind === "refund") {
            const remote = read.data;
            const amount = providerMinorUnits(
              remote.amount.value,
              remote.amount.currency_code,
              current.quote.amount,
            );
            if (
              !amount ||
              captureFromProviderLink(remote.links) !== current.captureId ||
              remote.id !== receipt.reference
            )
              throw new Error(
                "Provider refund capture, amount or reference mismatch.",
              );
            observation.providerStatus = remote.status;
            if (observation.credited && observation.amount !== amount)
              throw new Error(
                "A completed refund reference cannot change its accounted amount.",
              );
            observation.amount = amount;
            observation.currency = "USD";
            if (remote.status === "COMPLETED") {
              const operation = state.operations.find(
                (entry) =>
                  entry.kind === "refund" &&
                  entry.orderId === current.id &&
                  entry.resultId === remote.id,
              );
              if (operation && operation.amount !== amount)
                throw new Error(
                  "Provider refund differs from its authorized operation.",
                );
              if (!observation.credited && operation?.state !== "succeeded") {
                if (current.refundedAmount + amount > current.quote.amount)
                  throw new Error(
                    "Provider refunds exceed captured balance; manual reconciliation required.",
                  );
                current.refundedAmount += amount;
              }
              observation.credited = true;
              observation.state = "verified";
              observation.explanation =
                "A completed provider refund was read and matched to this capture. Its reference is accounted once; it did not authorize a new refund.";
              if (operation) operation.state = "succeeded";
              if (current.refundedAmount === current.quote.amount)
                current.status = "refunded";
              if (current.refundedAmount === current.quote.amount) {
                const authorizedCase = state.cases.find(
                  (entry) =>
                    entry.orderId === current.id &&
                    entry.remedy === "refund" &&
                    ["approved", "refund_pending"].includes(entry.status),
                );
                if (authorizedCase) authorizedCase.status = "resolved";
              }
              current.refund = {
                status: "completed",
                reference: remote.id,
                nextStep:
                  current.refundedAmount === current.quote.amount
                    ? "PayPal confirms completed refunds matching the captured total."
                    : "PayPal completed a partial refund. A reviewer must check the remaining customer remedy.",
                updatedAt: new Date(now).toISOString(),
              };
            } else if (
              ["FAILED", "CANCELLED", "DENIED"].includes(remote.status)
            ) {
              if (observation.credited)
                throw new Error(
                  "A completed refund cannot regress to an unpaid status.",
                );
              observation.state = "verified";
              observation.explanation =
                "The referenced provider refund did not complete. No amount was credited; existing operation authority still applies.";
            } else {
              observation.state = "pending";
              observation.explanation =
                "The external refund is pending or unknown. Further automatic remedies are paused while the customer claim remains open.";
            }
          } else if (read.kind === "dispute") {
            const remote = read.data;
            if (
              remote.disputed_transactions.length !== 1 ||
              remote.disputed_transactions[0].seller_transaction_id !==
                current.captureId
            )
              throw new Error(
                "Dispute is not exclusively linked to this capture.",
              );
            observation.amount = providerMinorUnits(
              remote.dispute_amount.value,
              remote.dispute_amount.currency_code,
              current.quote.amount,
            );
            observation.currency = "USD";
            observation.providerStatus = remote.status;
            observation.reportedCustomerPayout = remote.dispute_outcome
              ?.amount_refunded
              ? providerMinorUnits(
                  remote.dispute_outcome.amount_refunded.value,
                  remote.dispute_outcome.amount_refunded.currency_code,
                  current.quote.amount,
                )
              : undefined;
            const noPayout =
              observation.reportedCustomerPayout === undefined ||
              observation.reportedCustomerPayout === 0;
            const cleared =
              remote.status === "RESOLVED" &&
              noPayout &&
              ["RESOLVED_SELLER_FAVOUR", "CANCELED_BY_BUYER"].includes(
                remote.dispute_outcome?.outcome_code || "",
              );
            observation.state = cleared ? "verified" : "review";
            observation.explanation = cleared
              ? "Provider dispute closed without a reported customer payout. Normal customer-policy review remains available."
              : "The provider dispute is active, ambiguous or reports a customer payout. That payout may come from PayPal or the merchant and is not a verified merchant refund; human reconciliation is required before another remedy.";
          } else if (read.kind === "capture") {
            const remote = read.data;
            if (
              remote.id !== current.captureId ||
              providerMinorUnits(
                remote.amount.value,
                remote.amount.currency_code,
                current.quote.amount,
              ) !== current.quote.amount
            )
              throw new Error(
                "External capture adjustment differs from approved capture.",
              );
            observation.providerStatus = remote.status;
            const completedReferences = new Map<string, number>();
            for (const entry of current.providerObservations || [])
              if (entry.kind === "refund" && entry.credited)
                completedReferences.set(entry.reference, entry.amount || 0);
            for (const operation of state.operations)
              if (
                operation.kind === "refund" &&
                operation.orderId === current.id &&
                operation.state === "succeeded" &&
                operation.resultId
              )
                completedReferences.set(operation.resultId, operation.amount);
            const referencedTotal = [...completedReferences.values()].reduce(
              (total, amount) => total + amount,
              0,
            );
            const fullyReferencedRefund =
              current.refundedAmount === current.quote.amount &&
              referencedTotal === current.quote.amount;
            const referencedPartialRefund =
              current.refundedAmount > 0 &&
              current.refundedAmount < current.quote.amount &&
              referencedTotal === current.refundedAmount;
            observation.state =
              (remote.status === "COMPLETED" &&
                observation.trigger === "preflight" &&
                current.refundedAmount === 0) ||
              (remote.status === "REFUNDED" && fullyReferencedRefund) ||
              (remote.status === "PARTIALLY_REFUNDED" &&
                referencedPartialRefund)
                ? "verified"
                : "review";
            observation.explanation =
              observation.state === "verified"
                ? "Current capture facts match the recorded amount and completed refund references where applicable. No new money action was executed."
                : "A capture adjustment or reversal notification requires refund references and merchant/customer liability reconciliation. A capture status alone cannot establish a refund or clear the review; no new money action was executed.";
          } else
            throw new Error(
              "Provider response kind does not match the receipt.",
            );
          audit(state, actor, "provider.adjustment_reconciled", current.id);
        });
      } catch {
        failures++;
        await mutateWorkspace(workspaceId, (state) => {
          const current = state.orders.find((entry) => entry.id === order.id);
          const observation = current?.providerObservations?.find(
            (entry) =>
              entry.kind === receipt.kind &&
              entry.reference === receipt.reference,
          );
          if (!observation || observation.state === "verified") return;
          observation.state = "review";
          observation.attempts++;
          observation.nextCheckAt = new Date(
            now +
              Math.min(3600000, 1000 * 2 ** Math.min(observation.attempts, 12)),
          ).toISOString();
          observation.explanation =
            "Provider facts are unavailable, mismatched or out of order. Another remedy is paused; your claim remains open for reconciliation and human review.";
        });
      }
    }
  return { failures };
}
