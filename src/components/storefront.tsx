"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  HeartHandshake,
  LoaderCircle,
  MessageSquare,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  catalog,
  models,
  productById,
  searchCatalog,
  type Product,
} from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import type { ScamResult } from "@/domain/scams";
import type { Order, ReturnCase, StoredQuote } from "@/server/state";
import type { snapshot } from "@/server/service";
import { ProductArt } from "./product-art";
import { PayPalCheckout } from "./paypal-checkout";
import { Dialog } from "./dialog";
type Session = Awaited<ReturnType<typeof snapshot>>;
type Tab = "discover" | "groups" | "orders" | "support";
type Modal =
  | { kind: "login" }
  | { kind: "quote"; quote: StoredQuote }
  | { kind: "return"; order: Order }
  | { kind: "evidence"; item?: ReturnCase; order?: Order }
  | { kind: "scam" }
  | { kind: "resolve"; item: ReturnCase }
  | null;
async function api<T>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined && method === "POST" ? "GET" : method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export default function Storefront() {
  const [session, setSession] = useState<Session | null>(null),
    [tab, setTab] = useState<Tab>("discover"),
    [modal, setModal] = useState<Modal>(null);
  const [products, setProducts] = useState<Product[]>(
    catalog.filter(
      (p) =>
        p.category === "chargers" &&
        p.compatibleModels.includes("Atlas 14") &&
        p.price <= 8000,
    ),
  );
  const [model, setModel] = useState("Atlas 14"),
    [category, setCategory] = useState("chargers"),
    [budget, setBudget] = useState("80"),
    [message, setMessage] = useState(""),
    [preference, setPreference] = useState(""),
    [priority, setPriority] = useState<"price" | "features">("price"),
    [briefDirty, setBriefDirty] = useState(false);
  const [summary, setSummary] = useState(
    "Tell us what you need. We'll keep compatibility, your budget, and your choices at the center.",
  );
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [scam, setScam] = useState<ScamResult | null>(null);
  const [role, setRole] = useState("buyer"),
    [accessCode, setAccessCode] = useState(""),
    [workspaceId, setWorkspaceId] = useState(""),
    [invite, setInvite] = useState("");
  const restoreSession = useCallback((data: Session) => {
    setSession(data);
    if (data.brief) {
      const input = data.brief.input;
      setModel(input.model);
      setCategory(input.category);
      setBudget(String(input.budget / 100));
      setMessage(input.message);
      setPreference(input.preference);
      setPriority(input.priority);
      setProducts(searchCatalog(input));
      setBriefDirty(false);
    }
  }, []);
  const refresh = useCallback(async () => {
    try {
      setSession(await api<Session>("/api/session"));
    } catch {
      setSession(null);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void api<Session>("/api/session")
      .then((data) => {
        if (active) restoreSession(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [restoreSession]);
  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);
  const action = useCallback(async (body: unknown) => {
    const response = await api<{ result: unknown; snapshot: Session }>(
      "/api/actions",
      body,
    );
    setSession(response.snapshot);
    return response.result;
  }, []);
  const finishCheckout = useCallback(() => {
    setModal(null);
    setTab("orders");
    setNotice("Your purchase is confirmed. Follow its progress here.");
  }, []);
  const showPaymentError = useCallback(
    (message: string) => setError(message),
    [],
  );
  const startShopping = () => {
    setRole("buyer");
    setModal({ kind: "login" });
  };
  const isBuyer = !session || session.actor.role === "buyer";
  async function findProducts() {
    if (!session) {
      startShopping();
      return;
    }
    await run(async () => {
      const result = await api<{
        products: Product[];
        analysis: { summary: string };
      }>("/api/shopping", {
        message,
        model,
        category,
        budget: Math.round(Number(budget) * 100),
        preference,
        priority,
      });
      setProducts(result.products);
      setSummary(result.analysis.summary);
      setBriefDirty(false);
      setNotice(
        "Your brief is saved. Older unpaid approvals require a fresh quote.",
      );
      await refresh();
    });
  }
  async function choose(product: Product, groupId?: string) {
    if (!session) {
      startShopping();
      return;
    }
    if (briefDirty) {
      setError(
        "Save your updated brief with Find my match before reviewing a purchase.",
      );
      return;
    }
    await run(async () => {
      const quote = (await action({
        action: "quote",
        productId: product.id,
        model: groupId
          ? session.groups.find((g) => g.id === groupId)!.model
          : model,
        groupId,
      })) as StoredQuote;
      setModal({ kind: "quote", quote });
    });
  }
  async function upload(
    form: FormData,
    target: { caseId?: string; orderId?: string },
  ) {
    const file = form.get("image") as File;
    const input = {
      ...target,
      checkpoint: String(form.get("checkpoint")),
      serial: String(form.get("serial")),
      note: String(form.get("note")),
    };
    if (file?.size) {
      const params = new URLSearchParams(
        Object.entries(input).filter(([, v]) => v !== undefined) as [
          string,
          string,
        ][],
      );
      const response = await fetch(`/api/evidence?${params}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
    } else
      await action({
        action: target.orderId ? "dispatch" : "evidence",
        ...input,
      });
  }
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="BuyerGuard home">
          <span className="brand-mark">
            <ShieldCheck size={23} />
          </span>
          BuyerGuard<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          {(["discover", "groups", "orders", "support"] as Tab[]).map(
            (item) => (
              <button
                key={item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {
                  {
                    discover: "Discover",
                    groups: "Group deals",
                    orders: isBuyer ? "My orders" : "Orders",
                    support: "Support",
                  }[item]
                }
              </button>
            ),
          )}
        </nav>
        {session ? (
          <button
            className="account"
            onClick={() =>
              void run(async () => {
                await api("/api/session", undefined, "DELETE");
                setSession(null);
                setTab("discover");
              })
            }
          >
            <span className="avatar">
              {isBuyer ? "S" : session.actor.role[0].toUpperCase()}
            </span>
            {isBuyer ? "Shopper" : session.actor.role} · Sign out
          </button>
        ) : (
          <button className="button primary small" onClick={startShopping}>
            Start shopping <ArrowRight size={15} />
          </button>
        )}
      </header>
      <main className="main-content">
        <div className="mode-strip">
          <span className="status-dot" /> Test storefront ·{" "}
          {session?.modes.payments === "sandbox"
            ? "PayPal sandbox"
            : "Simulated payments"}{" "}
          ·{" "}
          {session?.modes.ai === "live"
            ? "Live assisted analysis"
            : "Deterministic analysis fixtures"}{" "}
          · Simulated shipping
        </div>
        {error && (
          <div role="alert" className="feedback error">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="feedback success">
            {notice}
          </div>
        )}
        {tab === "discover" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <ShieldCheck size={15} /> BUILT AROUND YOU
                </div>
                <h1>
                  Good choices.
                  <br />
                  <span>Greater peace of mind.</span>
                </h1>
                <p>
                  A shopping companion that finds the right fit, looks out for
                  your budget, and stays with you after checkout.
                </p>
                <div className="hero-pills">
                  <span>
                    <Check size={14} /> Compatibility checked
                  </span>
                  <span>
                    <Check size={14} /> Your approval, always
                  </span>
                  <span>
                    <Check size={14} /> Support that stays
                  </span>
                </div>
              </div>
              <div className="hero-visual">
                <div className="floating-label">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>The right fit comes first</strong>
                    <small>Your device. Your budget. Your choice.</small>
                  </div>
                </div>
                <ProductArt product={catalog[0]} />
                <div className="visual-note">
                  <span className="status-dot" /> Looking out for you, every
                  step.
                </div>
              </div>
            </section>
            <section className="shopping-area">
              <aside className="brief-panel">
                <div className="panel-title">
                  <Sparkles size={19} />
                  <h2>Your shopping brief</h2>
                </div>
                <p className="muted">A few details make a better match.</p>
                <label>
                  Your device
                  <select
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setBriefDirty(true);
                    }}
                  >
                    {models.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Looking for
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setBriefDirty(true);
                    }}
                  >
                    {Object.entries({
                      chargers: "Chargers",
                      docks: "Docks & hubs",
                      storage: "Storage",
                      audio: "Headphones",
                      accessories: "Accessories",
                      "": "Everything",
                    }).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Maximum budget, USD
                  <div className="money-input">
                    <span>$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={budget}
                      onChange={(e) => {
                        setBudget(e.target.value);
                        setBriefDirty(true);
                      }}
                    />
                  </div>
                </label>
                <label>
                  Anything else?
                  <textarea
                    placeholder="A lighter charger for my commute…"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setBriefDirty(true);
                    }}
                    rows={3}
                  />
                </label>
                <label>
                  Feature to prioritize
                  <input
                    value={preference}
                    maxLength={80}
                    placeholder="65W, Ethernet, braided cable…"
                    onChange={(e) => {
                      setPreference(e.target.value);
                      setBriefDirty(true);
                    }}
                  />
                </label>
                <label>
                  Rank by
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value as "price" | "features");
                      setBriefDirty(true);
                    }}
                  >
                    <option value="price">
                      Lowest price, then matching features
                    </option>
                    <option value="features">
                      Matching features, then lowest price
                    </option>
                  </select>
                </label>
                {briefDirty && (
                  <p className="muted" role="status">
                    Brief changed. Find my match saves it and replaces older
                    unpaid approvals.
                  </p>
                )}
                <button
                  className="button primary full"
                  disabled={busy}
                  onClick={() => void findProducts()}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Search size={17} />
                  )}{" "}
                  Find my match
                </button>
                <div className="brief-foot">
                  <ShieldCheck size={16} />
                  <span>Paid placement never improves organic ranking.</span>
                </div>
              </aside>
              <div className="results">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">CURATED FOR YOUR NEEDS</div>
                    <h2>Your next good find</h2>
                  </div>
                  <span className="muted">
                    {products.length} compatible options
                  </span>
                </div>
                <div className="assistant-note">
                  <span className="assistant-icon">
                    <Sparkles size={17} />
                  </span>
                  <p>{summary}</p>
                </div>
                <div className="product-grid">
                  {products.map((product, index) => (
                    <article className="product-card" key={product.id}>
                      <div className="card-visual">
                        <ProductArt product={product} />
                        {index === 0 && (
                          <span className="card-badge">
                            {priority === "features"
                              ? "Top match for your brief"
                              : "Best price for your brief"}
                          </span>
                        )}
                      </div>
                      <div className="card-details">
                        <div className="product-topline">
                          <span className="fit-label">
                            <Check size={12} />{" "}
                            {briefDirty
                              ? "Update your brief to confirm fit"
                              : `Fits ${model}`}
                          </span>
                          {product.sponsored && (
                            <span className="sponsored">Sponsored</span>
                          )}
                        </div>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <div className="spec-tags">
                          {product.specs.slice(0, 2).map((spec) => (
                            <span key={spec}>{spec}</span>
                          ))}
                        </div>
                        <small className="muted">
                          Source: {product.source}.{" "}
                          {priority === "features" &&
                          preference &&
                          product.specs
                            .join(" ")
                            .toLowerCase()
                            .includes(preference.toLowerCase())
                            ? `Matches “${preference}” in listed specifications.`
                            : "Ranked by listed price."}
                        </small>
                        <div className="price-row">
                          <strong>{formatMoney(product.price)}</strong>
                          <small>Full price · shipping included</small>
                        </div>
                        <div className="card-actions">
                          <button
                            className="button primary"
                            disabled={busy || !isBuyer}
                            onClick={() => void choose(product)}
                          >
                            Review purchase <ArrowRight size={14} />
                          </button>
                          <button
                            className="group-button"
                            aria-label={`Join group deal for ${product.name}`}
                            disabled={busy || !isBuyer}
                            onClick={() => {
                              if (!session) {
                                startShopping();
                                return;
                              }
                              void run(async () => {
                                await action({
                                  action: "join_group",
                                  productId: product.id,
                                  model,
                                });
                                setTab("groups");
                              });
                            }}
                          >
                            <Users size={18} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {!products.length && (
                  <Empty
                    title="Let's refine your search"
                    detail="We won't guess compatibility. Try a known model or a larger budget."
                  />
                )}
              </div>
            </section>
            <section className="trust-row">
              <div>
                <ShieldCheck />
                <h3>You stay in control</h3>
                <p>See the full amount and approve every purchase.</p>
              </div>
              <div>
                <Users />
                <h3>Better together</h3>
                <p>Unlock a shared discount. Keep your own checkout.</p>
              </div>
              <div>
                <HeartHandshake />
                <h3>Help after checkout</h3>
                <p>Clear return options and a person to review your case.</p>
              </div>
              <button
                className="message-card"
                onClick={() => {
                  setScam(null);
                  setModal({ kind: "scam" });
                }}
              >
                <MessageSquare size={24} />
                <strong>Something feel off?</strong>
                <span>
                  Check a seller message <ChevronRight size={14} />
                </span>
              </button>
            </section>
          </>
        )}
        {tab === "groups" && (
          <>
            <PageHeading
              eyebrow="GOOD DEALS, TOGETHER"
              title="A little buying power."
              detail="Two commitments unlock 10% off. Each shopper pays independently. Your locked price stays yours."
            />
            {session?.invite && (
              <div className="invite-panel">
                <div>
                  <strong>Invite someone to your group</strong>
                  <p className="muted">
                    Use a separate browser session. Your order and payment
                    remain private.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(session.invite!);
                      setNotice(
                        "Invitation copied. Enter it in another shopper's Start shopping dialog.",
                      );
                    })
                  }
                >
                  <Copy size={16} /> Copy invitation
                </button>
              </div>
            )}
            {session?.groups.length ? (
              <div className="group-grid">
                {session.groups.map((group) => {
                  const product = productById(group.productId);
                  return (
                    <article className="group-card" key={group.id}>
                      <ProductArt product={product} compact />
                      <div>
                        <span className="eyebrow">
                          {group.status === "ready"
                            ? "DISCOUNT UNLOCKED"
                            : "BUILDING A GROUP"}
                        </span>
                        <h3>{product.name}</h3>
                        <p>
                          {group.model} · {group.memberCount} of 2 commitments
                        </p>
                        <div className="progress">
                          <span
                            style={{
                              width: `${Math.min(100, group.memberCount * 50)}%`,
                            }}
                          />
                        </div>
                        <p className="muted">
                          {group.status === "ready"
                            ? `Your price: ${formatMoney(group.amount!)}. Valid until ${new Date(group.checkoutExpiresAt!).toLocaleTimeString()}.`
                            : "No payment is taken until you approve checkout."}
                        </p>
                        {group.joined && group.status === "ready" ? (
                          <button
                            className="button primary"
                            onClick={() => void choose(product, group.id)}
                            disabled={busy}
                          >
                            Review group purchase <ArrowRight size={15} />
                          </button>
                        ) : group.joined ? (
                          <button
                            className="button secondary"
                            onClick={() =>
                              void run(async () => {
                                await action({
                                  action: "leave_group",
                                  groupId: group.id,
                                });
                              })
                            }
                            disabled={busy}
                          >
                            Leave commitment
                          </button>
                        ) : (
                          <button
                            className="button secondary"
                            onClick={() =>
                              void run(async () => {
                                await action({
                                  action: "join_group",
                                  productId: group.productId,
                                  model: group.model,
                                });
                              })
                            }
                            disabled={busy || !isBuyer}
                          >
                            Join this group
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Empty
                title="Your first group starts with you"
                detail="Choose the people icon on a product to create a group deal."
              />
            )}
          </>
        )}
        {tab === "orders" && (
          <>
            <PageHeading
              eyebrow={
                isBuyer ? "YOUR SHOPPING JOURNEY" : "FULFILLMENT WORKSPACE"
              }
              title={
                isBuyer ? "Every order. Looked after." : "Orders and dispatch."
              }
              detail={
                isBuyer
                  ? "Follow delivery, review payment, or tell us what needs putting right."
                  : "Record dispatch evidence before shipping. Carrier events are simulated."
              }
            />
            {session?.orders.length ? (
              <div className="order-list">
                {session.orders.map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-heading">
                      <ProductArt
                        product={productById(order.quote.productId)}
                        compact
                      />
                      <div>
                        <span className="eyebrow">
                          ORDER {order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <h3>{productById(order.quote.productId).name}</h3>
                        <p>
                          {order.quote.model} ·{" "}
                          {order.replacementOf
                            ? "No additional charge"
                            : formatMoney(order.quote.amount)}
                        </p>
                      </div>
                      <span className="status-chip">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="timeline">
                      {order.events.map((entry, i) => (
                        <div key={i}>
                          <span className="timeline-dot" />
                          <p>{entry.text}</p>
                          <small>{new Date(entry.at).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <small className="muted">
                        {order.captureId
                          ? `Payment reference: ${order.captureId}`
                          : "No captured payment"}
                      </small>
                      <div className="inline-actions">
                        {isBuyer && order.status === "checkout_pending" && (
                          <button
                            className="button secondary small"
                            onClick={() =>
                              setModal({ kind: "quote", quote: order.quote })
                            }
                          >
                            Continue checkout
                          </button>
                        )}
                        {isBuyer &&
                          order.captureId &&
                          !["refunded", "canceled"].includes(order.status) && (
                            <button
                              className="button secondary small"
                              onClick={() => {
                                if (order.returnId) setTab("support");
                                else setModal({ kind: "return", order });
                              }}
                            >
                              Get help / return
                            </button>
                          )}
                        {session?.actor.role === "seller" &&
                          ["paid", "replacement"].includes(order.status) && (
                            <>
                              <button
                                className="button secondary small"
                                onClick={() =>
                                  setModal({ kind: "evidence", order })
                                }
                              >
                                Record dispatch
                              </button>
                              <button
                                className="button primary small"
                                onClick={() =>
                                  void run(async () => {
                                    await action({
                                      action: "ship",
                                      orderId: order.id,
                                      status: "shipped",
                                    });
                                  })
                                }
                              >
                                Simulate shipment
                              </button>
                            </>
                          )}
                        {session?.actor.role === "seller" &&
                          order.status === "shipped" && (
                            <button
                              className="button primary small"
                              onClick={() =>
                                void run(async () => {
                                  await action({
                                    action: "ship",
                                    orderId: order.id,
                                    status: "delivered",
                                  });
                                })
                              }
                            >
                              Simulate delivery
                            </button>
                          )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="A good find is waiting"
                detail="Your purchases will appear here, with payment status and support in one place."
              />
            )}
          </>
        )}
        {tab === "support" && (
          <>
            <PageHeading
              eyebrow="WE STAY WITH YOU"
              title="Let's put it right."
              detail="Your request stays open while we review it. Missing evidence never means an automatic accusation or denial."
            />
            {session?.cases.length ? (
              <div className="case-list">
                {session.cases.map((item) => (
                  <article className="case-card" key={item.id}>
                    <div className="case-heading">
                      <div>
                        <span className="eyebrow">
                          CASE {item.id.slice(0, 8).toUpperCase()}
                        </span>
                        <h3>
                          {item.reason.replaceAll("_", " ")} · {item.request}{" "}
                          requested
                        </h3>
                        <p className="muted">
                          Seller response due{" "}
                          {new Date(item.deadlineAt).toLocaleString()} ·{" "}
                          {item.sellerResponded
                            ? "Seller responded"
                            : "Awaiting seller"}
                        </p>
                      </div>
                      <span className="status-chip">
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="evidence-grid">
                      {item.evidence.map((entry) => (
                        <div className="evidence-card" key={entry.id}>
                          <strong>
                            {entry.checkpoint.replaceAll("_", " ")}
                          </strong>
                          <p>{entry.note}</p>
                          <small>
                            Recorded identifier:{" "}
                            {entry.serial || "Not provided"}
                          </small>
                          {entry.assetKey && (
                            <a
                              href={`/api/evidence?id=${entry.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View original image <ChevronRight size={12} />
                            </a>
                          )}
                          <small>
                            Integrity hash: {entry.hash.slice(0, 16)}…
                          </small>
                        </div>
                      ))}
                    </div>
                    {item.analysis && (
                      <div className="analysis-panel">
                        <h4>
                          <ShieldCheck size={17} /> Evidence review ·{" "}
                          {item.analysis.outcome}
                        </h4>
                        {item.analysis.observations.map((observation, i) => (
                          <p key={i}>{observation}</p>
                        ))}
                        <strong>{item.analysis.nextStep}</strong>
                      </div>
                    )}
                    {item.resolutionNote && (
                      <p className="resolution-note">
                        Reviewer: {item.resolutionNote}
                      </p>
                    )}
                    {item.appeal && <p>Appeal: {item.appeal}</p>}
                    <div className="inline-actions">
                      {item.status !== "resolved" &&
                        session.actor.role !== "reviewer" && (
                          <button
                            className="button secondary small"
                            onClick={() => setModal({ kind: "evidence", item })}
                          >
                            Add your evidence
                          </button>
                        )}
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await action({
                              action: "analyze",
                              caseId: item.id,
                            });
                          })
                        }
                      >
                        Review evidence
                      </button>
                      {session.actor.role === "reviewer" &&
                        item.status !== "resolved" && (
                          <button
                            className="button primary small"
                            disabled={busy}
                            onClick={() => setModal({ kind: "resolve", item })}
                          >
                            Approve requested {item.request}
                          </button>
                        )}
                      {isBuyer && item.status === "resolved" && (
                        <button
                          className="button secondary small"
                          onClick={() => {
                            const note = window.prompt(
                              "What would you like a person to review?",
                            );
                            if (note)
                              void run(async () => {
                                await action({
                                  action: "appeal",
                                  caseId: item.id,
                                  note,
                                });
                              });
                          }}
                        >
                          Request another review
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="We're here when you need us"
                detail="Open a request from your order. Choose a refund or replacement and share your side."
              />
            )}
          </>
        )}
        <footer className="site-footer">
          <div className="brand">
            <ShieldCheck size={18} /> BuyerGuard
            <span className="brand-dot">.</span>
          </div>
          <span>
            Built around your needs. From first search to final resolution.
          </span>
          <button
            onClick={() => {
              setRole("seller");
              setWorkspaceId(session?.actor.workspaceId || "");
              setModal({ kind: "login" });
            }}
          >
            Operator workspace
          </button>
        </footer>
        {session && (
          <details className="engineering-details">
            <summary>Environment details</summary>
            <p>
              Workspace: <code>{session.actor.workspaceId}</code>
            </p>
            <p>
              Database: {session.modes.database} · Payments:{" "}
              {session.modes.payments} · Analysis: {session.modes.ai}
            </p>
            <p>
              Catalog models, inventory, and carrier events are synthetic. File
              integrity does not prove physical truth. Use separate profiles for
              customer and operator roles.
            </p>
          </details>
        )}
      </main>
      {modal && (
        <div className="modal-backdrop">
          <Dialog onClose={() => setModal(null)}>
            <button
              className="close-modal"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={21} />
            </button>
            {modal.kind === "login" && (
              <>
                <div className="modal-icon">
                  <ShoppingBag />
                </div>
                <h2 id="modal-title">
                  {role === "buyer"
                    ? "Your shopping space."
                    : "Operator access."}
                </h2>
                <p className="muted">
                  {role === "buyer"
                    ? "Start an isolated test session, or join with a group invitation."
                    : "Use a separate browser profile. Operator roles require the configured access code."}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      restoreSession(
                        await api<Session>("/api/session", {
                          role,
                          accessCode,
                          ...(role === "buyer" && invite
                            ? { invite: invite.trim() }
                            : {}),
                          ...(role !== "buyer" && workspaceId
                            ? { workspaceId: workspaceId.trim() }
                            : {}),
                        }),
                      );
                      setModal(null);
                      setAccessCode("");
                      setTab(role === "buyer" ? "discover" : "orders");
                    });
                  }}
                >
                  <label>
                    Role
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="buyer">Shopper</option>
                      <option value="seller">Seller</option>
                      <option value="reviewer">Reviewer</option>
                    </select>
                  </label>
                  <label>
                    {role === "buyer"
                      ? "Demo access code (if configured)"
                      : "Operator access code"}
                    <input
                      type="password"
                      autoComplete="off"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                    />
                  </label>
                  {role === "buyer" ? (
                    <label>
                      Group invitation (optional)
                      <input
                        value={invite}
                        onChange={(e) => setInvite(e.target.value)}
                      />
                    </label>
                  ) : (
                    <label>
                      Customer workspace ID
                      <input
                        required
                        value={workspaceId}
                        onChange={(e) => setWorkspaceId(e.target.value)}
                      />
                    </label>
                  )}
                  <button className="button primary full" disabled={busy}>
                    Enter workspace <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
            {modal.kind === "quote" && (
              <>
                <div className="modal-icon">
                  <ShieldCheck />
                </div>
                <h2 id="modal-title">Your choice. Fully reviewed.</h2>
                <p className="muted">
                  Confirm the exact purchase before payment. Changes require
                  approval again.
                </p>
                <div className="quote-product">
                  <ProductArt
                    product={productById(modal.quote.productId)}
                    compact
                  />
                  <div>
                    <strong>{productById(modal.quote.productId).name}</strong>
                    <p>Confirmed fit: {modal.quote.model}</p>
                  </div>
                </div>
                <dl className="quote-summary">
                  <div>
                    <dt>Merchant</dt>
                    <dd>BuyerGuard demo store</dd>
                  </div>
                  <div>
                    <dt>Item</dt>
                    <dd>{formatMoney(modal.quote.amount)}</dd>
                  </div>
                  <div>
                    <dt>Shipping & taxes</dt>
                    <dd>Included in this demo quote</dd>
                  </div>
                  <div>
                    <dt>Return window</dt>
                    <dd>30 days under demo policy</dd>
                  </div>
                  <div className="total">
                    <dt>Total approved</dt>
                    <dd>{formatMoney(modal.quote.amount)}</dd>
                  </div>
                </dl>
                <p className="muted">
                  Valid until{" "}
                  {new Date(modal.quote.expiresAt).toLocaleTimeString()}.
                  Recipient: {modal.quote.payee}.
                </p>
                {session?.modes.payments === "sandbox" &&
                session.paypalClientId ? (
                  <PayPalCheckout
                    clientId={session.paypalClientId}
                    quote={modal.quote}
                    action={action}
                    onDone={finishCheckout}
                    onError={showPaymentError}
                  />
                ) : (
                  <>
                    <div className="fixture-note">
                      Simulated payment test. No money is charged.
                    </div>
                    <button
                      className="button primary full"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const order = (await action({
                            action: "checkout",
                            quoteId: modal.quote.id,
                            fingerprint: modal.quote.fingerprint,
                          })) as Order;
                          await action({
                            action: "capture",
                            orderId: order.id,
                          });
                          finishCheckout();
                        })
                      }
                    >
                      <CreditCard size={17} /> Approve simulated purchase
                    </button>
                  </>
                )}
              </>
            )}
            {modal.kind === "resolve" && (
              <>
                <h2 id="modal-title">Approve the customer’s choice.</h2>
                <p className="muted">
                  Review the original records and payment before authorizing the
                  requested {modal.item.request}. Conflicting or missing
                  evidence does not automatically deny the request.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    void run(async () => {
                      await action({
                        action: "resolve",
                        caseId: modal.item.id,
                        remedy: modal.item.request,
                        note: String(form.get("note")),
                      });
                      setModal(null);
                      setNotice(
                        "Remedy processed. Check its financial status before considering it complete.",
                      );
                    });
                  }}
                >
                  <label>
                    Reason and customer policy
                    <textarea
                      name="note"
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={4}
                    />
                  </label>
                  <button className="button primary full" disabled={busy}>
                    Authorize {modal.item.request}
                  </button>
                </form>
              </>
            )}
            {modal.kind === "return" && (
              <>
                <div className="modal-icon">
                  <HeartHandshake />
                </div>
                <h2 id="modal-title">How can we put it right?</h2>
                <p className="muted">
                  Tell us what happened and choose your preferred remedy.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    void run(async () => {
                      await action({
                        action: "return",
                        orderId: modal.order.id,
                        reason: form.get("reason"),
                        request: form.get("request"),
                      });
                      setModal(null);
                      setTab("support");
                    });
                  }}
                >
                  <label>
                    What happened?
                    <select name="reason">
                      <option value="damaged">
                        The product arrived damaged
                      </option>
                      <option value="wrong_item">
                        I received the wrong product
                      </option>
                      <option value="not_delivered">
                        My order has not arrived
                      </option>
                      <option value="canceled">
                        The order needs canceling
                      </option>
                    </select>
                  </label>
                  <label>
                    Your preferred resolution
                    <select name="request">
                      <option value="refund">Refund</option>
                      <option value="replacement">
                        Replacement at no extra charge
                      </option>
                    </select>
                  </label>
                  <div className="policy-note">
                    Automated analysis alone cannot deny your request. You can
                    ask for a person to review it.
                  </div>
                  <button className="button primary full" disabled={busy}>
                    Open my request <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
            {modal.kind === "evidence" && (
              <>
                <h2 id="modal-title">Share your side.</h2>
                <p className="muted">
                  A clear description is welcome. Photos are optional; video is
                  never required.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    void run(async () => {
                      await upload(
                        form,
                        modal.order
                          ? { orderId: modal.order.id }
                          : { caseId: modal.item!.id },
                      );
                      setModal(null);
                      setNotice(
                        "Evidence recorded. Integrity checks do not establish physical truth.",
                      );
                    });
                  }}
                >
                  <label>
                    Checkpoint
                    <select name="checkpoint">
                      {modal.order ? (
                        <option value="seller_dispatch">Seller dispatch</option>
                      ) : session?.actor.role === "buyer" ? (
                        <>
                          <option value="buyer_receipt">
                            Customer receipt
                          </option>
                          <option value="buyer_return">
                            Customer return dispatch
                          </option>
                        </>
                      ) : (
                        <>
                          <option value="seller_dispatch">
                            Seller dispatch record
                          </option>
                          <option value="seller_return">
                            Seller return receipt
                          </option>
                        </>
                      )}
                    </select>
                  </label>
                  <label>
                    Item serial / identifier (optional)
                    <input name="serial" maxLength={100} />
                  </label>
                  <label>
                    What does this record show?
                    <textarea required name="note" rows={4} maxLength={2000} />
                  </label>
                  <label>
                    Photo (optional, up to 4 MB)
                    <input
                      type="file"
                      name="image"
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </label>
                  <button className="button primary full" disabled={busy}>
                    Record evidence <Check size={16} />
                  </button>
                </form>
              </>
            )}
            {modal.kind === "scam" && (
              <>
                <div className="modal-icon">
                  <MessageSquare />
                </div>
                <h2 id="modal-title">A second look before you pay.</h2>
                <p className="muted">
                  Share a message you're unsure about. Remove passwords and
                  private codes first.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    if (!session) {
                      setError("Start a shopper session first.");
                      return;
                    }
                    void run(async () => {
                      setScam(
                        (await action({
                          action: "scam",
                          message: String(form.get("message")),
                        })) as ScamResult,
                      );
                    });
                  }}
                >
                  <label>
                    Seller message
                    <textarea
                      required
                      name="message"
                      rows={5}
                      maxLength={6000}
                      placeholder="Paste the message here…"
                    />
                  </label>
                  <button className="button primary full" disabled={busy}>
                    Check this message <ShieldCheck size={16} />
                  </button>
                </form>
                {scam && (
                  <div className={`scam-result ${scam.level}`}>
                    <strong>
                      {scam.level === "low"
                        ? "No listed warning signals found"
                        : "Pause and verify"}
                    </strong>
                    {scam.reasons.map((reason, i) => (
                      <p key={i}>{reason}</p>
                    ))}
                    <p>{scam.nextStep}</p>
                  </div>
                )}
              </>
            )}
            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
          </Dialog>
        </div>
      )}
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{detail}</p>
    </div>
  );
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <Package size={35} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
