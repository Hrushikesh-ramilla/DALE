"use client";
import { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/domain/catalog";
import { searchConstraints, type SearchConstraints } from "@/domain/concierge";
import { formatMoney } from "@/domain/money";
import { useCopilot } from "./copilot/copilot-context";
import { ProductArt } from "./product-art";

function Page() {
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const c = useCopilot();
  const [selected, setSelected] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [total, setTotal] = useState(0);
  const raw = params.get("filters") || "{}";
  const ids = params.get("ids") || "";
  const refresh = c.refresh;
  const key = path + raw + ids;
  const ready = loadedKey === key;
  let filters: SearchConstraints;
  try {
    filters = searchConstraints.parse(JSON.parse(raw));
  } catch {
    filters = searchConstraints.parse({});
  }
  useEffect(() => {
    const abort = new AbortController();
    const load = async () => {
      if (path === "/search") {
        const parsed = searchConstraints.parse(JSON.parse(raw));
        const response = await fetch(
          `/api/copilot/search?filters=${encodeURIComponent(JSON.stringify(parsed))}`,
          { signal: abort.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProducts(data.products);
        setTotal(data.total);
        setNotice(data.degradation || "");
      } else if (path === "/compare") {
        const selection = ids.split(",").filter(Boolean);
        if (selection.length < 2 || selection.length > 12)
          throw new Error(
            "Choose between two and twelve published products to compare.",
          );
        const result = await fetch(
          `/api/copilot/products?ids=${encodeURIComponent(selection.join(","))}`,
          { signal: abort.signal },
        );
        const data = await result.json();
        if (!result.ok || data.missing_ids?.length)
          throw new Error(
            "One or more selected products are no longer published.",
          );
        setProducts(data.products);
      } else await refresh();
      if (!abort.signal.aborted) {
        setLoadedKey(key);
        setError("");
      }
    };
    void load().catch((e) => {
      if (!abort.signal.aborted) setError(e.message);
    });
    return () => abort.abort();
  }, [path, raw, ids, refresh, key]);
  const filter = (patch: Partial<SearchConstraints>) =>
    router.push(
      `/search?filters=${encodeURIComponent(JSON.stringify({ ...filters, ...patch, offset: 0 }))}`,
    );
  const isWishlist = path === "/wishlist";
  const collection = isWishlist ? "wishlist" : "cart";
  const entries = isWishlist ? c.state?.basket.wishlist : c.state?.basket.cart;
  const prepare = async () => {
    setError("");
    try {
      const response = await fetch("/api/copilot/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare_checkout" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await c.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare checkout");
    }
  };
  return (
    <section
      className="concierge-page"
      data-concierge-page={path}
      data-ready={ready ? "true" : "false"}
      aria-busy={!ready}
    >
      <nav>
        <Link href="/shop">Collection</Link> ·{" "}
        <Link href="/search">Search</Link> · <Link href="/cart">Cart</Link> ·{" "}
        <Link href="/wishlist">Wishlist</Link> ·{" "}
        <button type="button" onClick={() => c.toggleOpen(true)}>
          Talk to DALE
        </button>
      </nav>
      <h1>
        {path === "/search"
          ? "Explore your matches"
          : path === "/compare"
            ? "Compare the facts"
            : isWishlist
              ? "Your wishlist"
              : "Your cart"}
      </h1>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!ready && !error && <p role="status">Loading current data…</p>}
      {path === "/search" && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              filter({
                query: String(data.get("query") || ""),
                min_price: data.get("min")
                  ? Math.round(Number(data.get("min")) * 100)
                  : null,
                max_price: data.get("max")
                  ? Math.round(Number(data.get("max")) * 100)
                  : null,
                sort: String(data.get("sort")) as SearchConstraints["sort"],
              });
            }}
            key={raw}
          >
            <label>
              Catalog text{" "}
              <input
                data-agent-control="Search text"
                name="query"
                defaultValue={filters.query}
              />
            </label>
            <label>
              Minimum USD{" "}
              <input
                name="min"
                data-agent-control="Minimum search price USD"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  filters.min_price === null ? "" : filters.min_price / 100
                }
              />
            </label>
            <label>
              Maximum USD{" "}
              <input
                name="max"
                data-agent-control="Maximum search price USD"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  filters.max_price === null ? "" : filters.max_price / 100
                }
              />
            </label>
            <label>
              Sort{" "}
              <select
                data-agent-control="Search sorting"
                name="sort"
                defaultValue={filters.sort}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name_asc">Name</option>
                <option value="brand_asc">Brand</option>
              </select>
            </label>
            <button data-agent-control="Apply search form">
              Apply filters
            </button>
            <button
              type="button"
              onClick={() => filter(searchConstraints.parse({}))}
              data-agent-control="Clear search filters"
            >
              Clear filters
            </button>
          </form>
          <p>
            {total} matching recorded offers · USD · Sandbox stock and
            fulfillment
          </p>
          <div className="concierge-grid">
            {products.map((p) => (
              <article key={p.id} data-product-id={p.id}>
                <Link href={`/product/${p.id}`}>
                  <ProductArt product={p} />
                  <h2>{p.name}</h2>
                </Link>
                <p>
                  {p.brand} · {formatMoney(p.price)}
                </p>
                <p>{p.specs.slice(0, 3).join(" · ")}</p>
                <button type="button" onClick={() => c.addToCart(p)}>
                  Add to cart
                </button>{" "}
                <button
                  type="button"
                  onClick={() =>
                    void c
                      .mutateCollection("wishlist", "add", p.id)
                      .catch(() => {})
                  }
                >
                  Save
                </button>
                <p>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected((old) =>
                          e.target.checked
                            ? [...old, p.id].slice(0, 12)
                            : old.filter((id) => id !== p.id),
                        )
                      }
                    />
                    Select for comparison
                  </label>
                </p>
              </article>
            ))}
          </div>
          {ready && products.length === 0 && (
            <p>No products meet these constraints.</p>
          )}
          <button
            type="button"
            disabled={selected.length < 2}
            data-agent-control="Compare selected products"
            onClick={() =>
              router.push(
                `/compare?ids=${encodeURIComponent(selected.join(","))}`,
              )
            }
          >
            Compare {selected.length} selected products
          </button>
          <div>
            <button
              disabled={filters.offset === 0}
              data-agent-control="Previous search page"
              onClick={() =>
                router.push(
                  `/search?filters=${encodeURIComponent(JSON.stringify({ ...filters, offset: Math.max(0, filters.offset - filters.limit) }))}`,
                )
              }
            >
              Previous
            </button>
            <button
              disabled={filters.offset + filters.limit >= total}
              data-agent-control="Next search page"
              onClick={() =>
                router.push(
                  `/search?filters=${encodeURIComponent(JSON.stringify({ ...filters, offset: filters.offset + filters.limit }))}`,
                )
              }
            >
              Next
            </button>
          </div>
        </>
      )}
      {path === "/compare" && products.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Recorded fact</th>
                {products.map((p) => (
                  <th key={p.id} data-product-id={p.id}>
                    <Link href={`/product/${p.id}`}>{p.name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>DALE offer</th>
                {products.map((p) => (
                  <td key={p.id}>{formatMoney(p.price)}</td>
                ))}
              </tr>
              <tr>
                <th>Specifications</th>
                {products.map((p) => (
                  <td key={p.id}>{p.specs.join(" · ")}</td>
                ))}
              </tr>
              {[
                ...new Set(
                  products.flatMap((p) => Object.keys(p.attributes || {})),
                ),
              ]
                .sort()
                .map((key) => (
                  <tr key={key}>
                    <th>{key}</th>
                    {products.map((p) => (
                      <td key={p.id}>
                        {String(p.attributes?.[key] ?? "Not recorded")}
                      </td>
                    ))}
                  </tr>
                ))}
              <tr>
                <th>Evidence</th>
                {products.map((p) => (
                  <td key={p.id}>
                    {/^https:\/\//.test(p.source) ? (
                      <a href={p.source} target="_blank" rel="noreferrer">
                        Recorded source
                      </a>
                    ) : (
                      p.source
                    )}{" "}
                    {p.evidence?.missing?.length
                      ? `Missing: ${p.evidence.missing.join(", ")}`
                      : ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p>
            Missing facts remain unknown. Different product categories may not
            be directly comparable.
          </p>
        </div>
      )}
      {["/cart", "/wishlist"].includes(path) && (
        <>
          {!c.state && (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/copilot/state", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "start" }),
                });
                await c.refresh();
              }}
            >
              Start a shopping session
            </button>
          )}
          {entries?.length === 0 && <p>Your {collection} is empty.</p>}
          {entries?.map((i) => {
            const cartItem = c.state?.basket.cart.find(
              (item) => item.productId === i.productId,
            );
            return (
              <article key={i.productId} data-product-id={i.productId}>
                <h2>
                  {i.product ? (
                    <Link href={`/product/${i.productId}`}>
                      {i.product.name}
                    </Link>
                  ) : (
                    "This product is no longer published"
                  )}
                </h2>
                <p>
                  {i.product ? formatMoney(i.product.price) : "Unavailable"}
                </p>
                {!isWishlist && (
                  <label>
                    Group offer{" "}
                    <select
                      aria-label={`Group offer ${i.productId}`}
                      value={cartItem?.groupId || ""}
                      onChange={(e) =>
                        void c
                          .mutateCollection(
                            "cart",
                            "select_group",
                            i.productId,
                            1,
                            e.target.value || null,
                          )
                          .catch(() => {})
                      }
                    >
                      <option value="">Regular offer</option>
                      {c.state?.basket.availableGroups
                        .filter((g) => g.productId === i.productId)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.status === "ready"
                              ? "Ready"
                              : "Waiting for members"}{" "}
                            ·{" "}
                            {g.amount === undefined
                              ? "Amount unavailable"
                              : formatMoney(g.amount)}{" "}
                            · {g.id.slice(0, 8)}
                          </option>
                        ))}
                      {cartItem?.groupId &&
                        !c.state?.basket.availableGroups.some(
                          (g) => g.id === cartItem.groupId,
                        ) && (
                          <option value={cartItem.groupId}>
                            Unavailable group — choose a fresh offer
                          </option>
                        )}
                    </select>
                    {cartItem?.selectedGroup && (
                      <span>
                        {" "}
                        {cartItem.selectedGroup.ready
                          ? "Locked group price is applied when you review checkout."
                          : "Checkout waits for an eligible ready group."}
                      </span>
                    )}
                  </label>
                )}
                {!isWishlist && (
                  <label>
                    Quantity{" "}
                    <input
                      aria-label={`Quantity ${i.productId}`}
                      type="number"
                      min="1"
                      max="99"
                      value={"quantity" in i ? (i.quantity as number) : 1}
                      onChange={(e) => {
                        const quantity = Number(e.target.value);
                        if (quantity > 0)
                          void c
                            .mutateCollection(
                              "cart",
                              "set",
                              i.productId,
                              quantity,
                            )
                            .catch(() => {});
                      }}
                    />
                  </label>
                )}
                <button
                  onClick={() =>
                    void c
                      .mutateCollection(collection, "remove", i.productId)
                      .catch(() => {})
                  }
                >
                  Remove
                </button>
                {isWishlist && i.product && (
                  <button onClick={() => c.addToCart(i.product!)}>
                    Add to cart
                  </button>
                )}
              </article>
            );
          })}
          {!isWishlist && c.state && (
            <>
              <p>
                Regular-price subtotal: {formatMoney(c.state.basket.subtotal)} ·
                Selected group discounts appear in checkout review. Recorded
                sandbox offers
              </p>
              <button
                type="button"
                disabled={!entries?.length}
                onClick={() => void prepare()}
              >
                Prepare checkout
              </button>
              <p>
                Each item requires a separate PayPal approval. No payment is
                captured by this preparation.
              </p>
            </>
          )}
          {c.state?.confirmations
            .filter(
              (p) => (p.status === "pending" && !p.expired) || p.recoverable,
            )
            .map((p) => (
              <article key={p.id}>
                <h2>Review {p.kind}</h2>
                <p>{p.summary}</p>
                {p.kind === "checkout" &&
                  Array.isArray(p.terms.quotes) &&
                  (
                    p.terms.quotes as {
                      productId: string;
                      amount: number;
                      currency: string;
                      deliveryBy: string;
                      returnPolicy: string;
                      expiresAt: string;
                    }[]
                  ).map((q) => (
                    <div key={q.productId}>
                      <Link href={`/product/${q.productId}`}>
                        {entries?.find((i) => i.productId === q.productId)
                          ?.product?.name || q.productId}
                      </Link>{" "}
                      — {formatMoney(q.amount)} {q.currency}
                      <p>
                        Simulated delivery estimate:{" "}
                        {new Date(q.deliveryBy).toLocaleDateString()}. Return
                        policy: {q.returnPolicy}. Quote expires{" "}
                        {new Date(q.expiresAt).toLocaleTimeString()}.
                      </p>
                    </div>
                  ))}
                <button onClick={() => void c.confirm(p.id)}>
                  Confirm {p.kind}
                </button>
                <button onClick={() => void c.confirm(p.id, true)}>
                  Cancel
                </button>
              </article>
            ))}
          {c.state?.confirmations
            .filter((p) => p.kind === "checkout" && p.status === "completed")
            .slice(-1)
            .map((p) => (
              <article key={p.id}>
                <h2>Checkout preparation recorded</h2>
                <p>
                  Inspect each order and complete its PayPal approval. Order
                  creation does not mean payment succeeded.
                </p>
                <Link href="/orders">Open your orders</Link>
              </article>
            ))}
        </>
      )}
      {c.error && <p role="alert">{c.error}</p>}
    </section>
  );
}
export function ConciergePage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Page />
    </Suspense>
  );
}
