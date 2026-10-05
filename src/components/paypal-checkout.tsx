"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import type { Order, StoredQuote } from "@/server/state";
type Buttons = { render: (selector: string) => Promise<void>; close: () => Promise<void> };
declare global { interface Window { paypal?: { Buttons: (options: { createOrder: () => Promise<string>; onApprove: () => Promise<void>; onError: () => void; style: { layout: string; color: string; label: string } }) => Buttons } } }
export function PayPalCheckout({ clientId, quote, action, onDone, onError }: { clientId: string; quote: StoredQuote; action: (body: unknown) => Promise<unknown>; onDone: () => void; onError: (message: string) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready || !window.paypal) return;
    let orderId = "";
    const buttons = window.paypal.Buttons({ style: { layout: "vertical", color: "gold", label: "pay" }, createOrder: async () => { const order = await action({ action: "checkout", quoteId: quote.id, fingerprint: quote.fingerprint }) as Order; orderId = order.id; return order.providerOrderId!; }, onApprove: async () => { try { await action({ action: "capture", orderId }); onDone(); } catch (error) { onError(error instanceof Error ? error.message : "Payment needs checking."); } }, onError: () => onError("PayPal checkout did not finish. Check your order for confirmed payment status.") });
    void buttons.render("#paypal-checkout").catch(() => onError("PayPal checkout is unavailable."));
    return () => { void buttons.close().catch(() => {}); };
  }, [ready, clientId, quote, action, onDone, onError]);
  return <><Script src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`} onReady={() => setReady(true)} onError={() => onError("PayPal could not load.")} /><div id="paypal-checkout" />{!ready && <p className="muted">Loading secure PayPal checkout…</p>}</>;
}
