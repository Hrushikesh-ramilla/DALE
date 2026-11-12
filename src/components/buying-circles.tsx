"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CircleOffer, CircleResponse, CircleView } from "@/domain/circles";
import type { Product } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { ProductArt } from "./product-art";

export function BuyingCircles({
  owner,
  onUpdated,
  choose,
  startShopping,
}: {
  owner: string | null;
  onUpdated: () => Promise<void>;
  choose: (product: Product, groupId?: string) => Promise<void>;
  startShopping: () => void;
}) {
  const params = useSearchParams(),
    router = useRouter();
  const query = new URLSearchParams();
  for (const key of ["circle", "product", "model"])
    if (params.get(key)) query.set(key, params.get(key)!);
  const queryString = query.toString();
  const [data, setData] = useState<CircleResponse | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState<Record<string, boolean>>({});
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch("/api/circles?" + queryString, {
        cache: "no-store",
        signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Circle updates are unavailable.");
      setData(result);
      setError("");
    },
    [queryString],
  );
  useEffect(() => {
    const abort = new AbortController();
    let active = false;
    queueMicrotask(() => {
      if (abort.signal.aborted) return;
      setData(null);
      setConsent({});
      setError("");
    });
    const update = async () => {
      if (active || document.hidden || abort.signal.aborted) return;
      active = true;
      try {
        await load(abort.signal);
      } catch (e) {
        if (!abort.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Circle updates are unavailable.",
          );
      } finally {
        active = false;
      }
    };
    void update();
    const timer = setInterval(() => void update(), 3000);
    return () => {
      abort.abort();
      clearInterval(timer);
    };
  }, [load, owner]);
  async function join(offer: CircleOffer, circleId?: string) {
    if (!owner) {
      startShopping();
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          circleId,
          productId: offer.product.id,
          model: offer.model,
          ...offer.review,
          consent: true,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not commit to this circle.");
      await onUpdated();
      setConsent({});
      const destination = new URLSearchParams({ circle: result.circleId });
      if (params.get("decision"))
        destination.set("decision", params.get("decision")!);
      router.replace("/groups?" + destination.toString(), { scroll: false });
      await load();
      setNotice("Your commitment is saved. No order or payment was created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join this circle.");
    } finally {
      setBusy(false);
    }
  }
  async function leave(circleId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", circleId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not release this commitment.");
      await onUpdated();
      await load();
      setNotice(
        "Your unused reservation was released. Other shoppers keep their locked terms.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not leave this circle.");
    } finally {
      setBusy(false);
    }
  }
  function offerBody(offer: CircleOffer, key: string, circle?: CircleView) {
    return (
      <>
        <ProductArt product={offer.product} compact />
        <div className="circle-copy">
          <span className="eyebrow">
            {circle?.status === "ready"
              ? "DISCOUNT UNLOCKED"
              : circle?.status === "expired"
                ? "CIRCLE EXPIRED"
                : circle?.status === "unavailable"
                  ? "OFFER UNAVAILABLE"
                  : "CONDITIONAL GROUP OFFER"}
          </span>
          <h3>{offer.product.name}</h3>
          <p>
            Exact variant: {offer.product.skuVariant || offer.product.id} ·{" "}
            {offer.model === "not-required"
              ? "No device required"
              : offer.model}
          </p>
          <p>
            Solo reference: {formatMoney(offer.terms.baseAmount)} USD ·{" "}
            {circle?.status === "ready" ? "Locked" : "Conditional"} group price:{" "}
            <strong>{formatMoney(offer.terms.amount)} USD</strong>
          </p>
          <p>
            Save {formatMoney(offer.terms.baseAmount - offer.terms.amount)} USD
            ({offer.terms.discountPercent}%) on this same offer.
          </p>
          <p>
            {circle
              ? `${circle.memberCount} of ${offer.terms.minimumMembers} commitments`
              : `${offer.terms.minimumMembers} distinct shoppers required`}{" "}
            · Commitments, not paid orders
          </p>
          {circle && (
            <div
              className="progress"
              aria-label={`${circle.memberCount} commitments; threshold ${offer.terms.minimumMembers}`}
            >
              <span
                style={{
                  width: `${Math.min(100, (circle.memberCount / offer.terms.minimumMembers) * 100)}%`,
                }}
              />
            </div>
          )}
          {circle?.status === "ready" && (
            <p>
              Originally qualified with {circle.qualifiedMemberCount} shoppers.
              Each remaining shopper retains their locked price if another
              declines.
            </p>
          )}
          <p>
            {offer.terms.codCommitmentsEligible
              ? "Cash-on-delivery commitments qualify under these approved terms."
              : "These terms do not approve cash-on-delivery commitments."}{" "}
            Payment needs separate approval.
          </p>
          <p>
            Policy v{offer.terms.policyVersion} · One unit per shopper ·{" "}
            {offer.terms.checkoutMinutes}-minute checkout window after
            readiness.
          </p>
          {circle && (
            <p>
              {circle.status === "ready"
                ? "Checkout deadline"
                : "Circle deadline"}
              :{" "}
              {new Date(
                circle.checkoutExpiresAt || circle.expiresAt,
              ).toLocaleString()}
            </p>
          )}
          <p>
            {circle?.message ||
              "No unit is reserved until the threshold and stock conditions are met. Joining does not create an order or charge."}
          </p>
          <small>
            DALE sandbox merchant offer · USD · Simulated stock and fulfillment
          </small>
          <div className="circle-actions">
            <Link href={`/product/${encodeURIComponent(offer.product.id)}`}>
              View exact product
            </Link>
            {(!circle || circle.canJoin) && (
              <>
                {owner && (
                  <label className="circle-consent">
                    <input
                      type="checkbox"
                      checked={!!consent[key]}
                      onChange={(e) =>
                        setConsent((previous) => ({
                          ...previous,
                          [key]: e.target.checked,
                        }))
                      }
                    />{" "}
                    I commit to this exact offer and approved group terms. No
                    payment yet.
                  </label>
                )}
                <button
                  className="button primary"
                  disabled={busy || !!error || (!!owner && !consent[key])}
                  onClick={() => void join(offer, circle?.id)}
                >
                  {owner
                    ? circle
                      ? "Join this group"
                      : "Commit to this offer"
                    : "Start shopping to join"}
                </button>
              </>
            )}
            {circle?.canReview && (
              <button
                className="button primary"
                disabled={busy || !!error}
                onClick={() => void choose(offer.product, circle.id)}
              >
                Review group purchase
              </button>
            )}
            {circle?.canLeave && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void leave(circle.id)}
              >
                {circle.status === "ready"
                  ? "Decline checkout and release my unit"
                  : "Leave commitment"}
              </button>
            )}
            {circle && (
              <>
                <Link
                  href={`/groups?circle=${circle.id}`}
                  aria-label="Open shareable circle link"
                >
                  Share this circle
                </Link>
                <button
                  className="button secondary"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(
                        `${location.origin}/groups?circle=${circle.id}`,
                      )
                      .then(
                        () =>
                          setNotice(
                            "Exact circle link copied. Open it in a separate browser or private session.",
                          ),
                        () =>
                          setNotice(
                            "Use the Share this circle link to copy this exact invitation.",
                          ),
                      );
                  }}
                >
                  Copy circle link
                </button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
  return (
    <section className="buying-circles" aria-label="Buying circles">
      <p>
        Invite another shopper with the exact circle link. Use an independent
        browser or private session; multiple private tabs may share one
        identity. No PayPal account is needed to join.
      </p>
      {error && (
        <div role="alert">
          <p>
            {error} Updates are unavailable until a fresh read succeeds. Last
            displayed terms may be out of date.
          </p>
          <button
            className="button secondary"
            onClick={() => void load().catch((e) => setError(e.message))}
          >
            Retry circle updates
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Loading current circle terms…</p>}
      {data?.offer &&
        !data.circles.some(
          (c) => c.status === "forming" && c.model === data.offer?.model,
        ) && (
          <article
            className="group-card"
            data-circle-offer={data.offer.product.id}
          >
            {offerBody(data.offer, "offer")}
          </article>
        )}
      <div className="group-grid">
        {data?.circles.map((circle) => (
          <article
            className="group-card"
            data-circle-id={circle.id}
            key={circle.id}
          >
            {offerBody(circle, circle.id, circle)}
          </article>
        ))}
      </div>
      {data && !data.offer && !data.circles.length && (
        <p>
          No circles are available here yet. Open a product to review its group
          offer.
        </p>
      )}
    </section>
  );
}
