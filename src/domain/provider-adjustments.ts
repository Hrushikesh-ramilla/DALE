export type ProviderObservation = {
  kind: "dispute" | "refund" | "capture";
  reference: string;
  captureId: string;
  state: "pending" | "verified" | "review";
  eventIds: string[];
  providerStatus?: string;
  providerUpdatedAt?: string;
  amount?: number;
  currency?: "USD";
  // A dispute payout may be funded by PayPal or the merchant; it is not a merchant refund receipt.
  reportedCustomerPayout?: number;
  credited?: boolean;
  explanation: string;
  observedAt: string;
  attempts: number;
  nextCheckAt?: string;
  trigger?: "notification" | "preflight";
};
export function providerMinorUnits(
  value: string,
  currency: string,
  maximum: number,
) {
  if (currency !== "USD" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value))
    throw new Error("Provider adjustment requires a valid USD amount.");
  const [whole, fractional = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > maximum)
    throw new Error("Provider adjustment exceeds the captured amount.");
  return cents;
}
export function assertProviderRemedyReady(order: {
  providerObservations?: ProviderObservation[];
}) {
  if (
    order.providerObservations?.some(
      (observation) => observation.state !== "verified",
    )
  )
    throw new Error(
      "An external PayPal adjustment is pending or needs review. Reconcile it before another refund or replacement; your claim remains open.",
    );
}
export function captureFromProviderLink(
  links: { rel: string; href: string }[],
) {
  const href = links.find((link) => link.rel === "up")?.href;
  try {
    const url = new URL(href || "");
    const match = /^\/v2\/payments\/captures\/([A-Za-z0-9-]+)$/.exec(
      url.pathname,
    );
    return url.protocol === "https:" &&
      url.hostname === "api-m.sandbox.paypal.com" &&
      !url.search &&
      !url.hash
      ? match?.[1]
      : undefined;
  } catch {
    return undefined;
  }
}
