"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
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
  knownModels as models,
  deviceLabel,
  deviceText,
  productById,
  searchCatalog,
  type Product,
} from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { clarifyBrief, comparisonFacts } from "@/domain/conversation";
import type { ScamResult } from "@/domain/scams";
import type { Order, ReturnCase, StoredQuote } from "@/server/state";
import type { snapshot } from "@/server/service";
import { ProductArt } from "./product-art";
import { PayPalCheckout } from "./paypal-checkout";
import { Dialog } from "./dialog";
import { BrandWordmark } from "./brand-wordmark";
import { EditorialHero } from "./editorial-hero";
import { DemoToolbar } from "./demo-toolbar";
import { VoiceCompanion, type VoiceResult } from "./voice-companion";
import { AgentWorkspace, type AgentResult } from "./agent-workspace";
import type { ScenarioKind } from "@/server/scenarios";
import { GroupPolicySettings } from "./group-policy-settings";
import { ProviderReconciliation } from "./provider-reconciliation";
import { CinematicIntro } from "./cinematic-intro";
import { ShoppingBriefMenu } from "./shopping-brief-menu";
import { DaleMorphCard } from "./dale-morph-card";
type Session = Awaited<ReturnType<typeof snapshot>>;
type Tab = "discover" | "groups" | "orders" | "support";
type Modal =
  | { kind: "login" }
  | { kind: "product"; product: Product }
  | { kind: "quote"; quote: StoredQuote }
  | { kind: "return"; order: Order }
  | {
      kind: "evidence";
      item?: ReturnCase;
      order?: Order;
      capture?: { id: string; code: string; expiresAt: string };
    }
  | {
      kind: "return_shipping";
      item: ReturnCase;
      status: "in_transit" | "received";
    }
  | { kind: "cancel"; order: Order }
  | {
      kind: "identify";
      result?: {
        proposedModel: string | null;
        candidates: string[];
        needsConfirmation: boolean;
        mode: string;
        message: string;
      };
    }
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
function AgentSurface({
  orderPage,
  inspection,
  children,
}: {
  orderPage: boolean;
  inspection: boolean;
  children: ReactNode;
}) {
  if (!orderPage) return <>{children}</>;
  return (
    <details className="order-agent" open={inspection}>
      <summary>
        Ask DALE about your orders <span>Tracking, returns and voice</span>
      </summary>
      {children}
    </details>
  );
}
export default function Storefront() {
  const pathname = usePathname();
  const router = useRouter();
  const tab: Tab =
    pathname === "/groups"
      ? "groups"
      : pathname === "/orders"
        ? "orders"
        : pathname === "/support"
          ? "support"
          : "discover";
  const setTab = useCallback(
    (next: Tab) => {
      const target = next === "discover" ? "/shop" : `/${next}`;
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", target);
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      router.push(target, {
        scroll: false,
      });
    },
    [router],
  );
  const [session, setSession] = useState<Session | null>(null),
    [modal, setModal] = useState<Modal>(null);
  const [restoring, setRestoring] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [logoSettled, setLogoSettled] = useState(false);
  const [products, setProducts] = useState<Product[]>(
    searchCatalog({ model: "Atlas 14", budget: 8000 }),
  );
  const [model, setModel] = useState("Atlas 14"),
    [category, setCategory] = useState(""),
    [budget, setBudget] = useState("80"),
    [message, setMessage] = useState(""),
    [preference, setPreference] = useState(""),
    [priority, setPriority] = useState<"price" | "features">("price"),
    [weights, setWeights] = useState<
      { price: number; features: number } | undefined
    >(),
    [briefDirty, setBriefDirty] = useState(false);
  const [heroPrompt, setHeroPrompt] = useState("");
  const [sidebarTask, setSidebarTask] = useState("");
  const heroAnchorRef = useRef<HTMLDivElement>(null);
  const sidebarAnchorRef = useRef<HTMLElement>(null);

  const handleHeroSubmit = useCallback((customText?: string) => {
    const query = (customText || heroPrompt).trim();
    if (!query) return;
    setSidebarTask(query);
    setHeroPrompt("");
    const shopEl = document.getElementById("shop");
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: "smooth" });
    }
  }, [heroPrompt]);
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
  const [questions, setQuestions] = useState<string[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(12);
  const visibleProducts = products.filter((product) =>
    [product.name, product.description, ...product.specs]
      .join(" ")
      .toLowerCase()
      .includes(catalogQuery.trim().toLowerCase()),
  );
  const [scenario, setScenario] = useState<ScenarioKind>("fresh");
  const [supportDraft, setSupportDraft] = useState<Extract<
    VoiceResult["intent"],
    { kind: "support_draft" }
  > | null>(null);
  const restoreSession = useCallback((data: Session) => {
    setSession(data);
    setVisibleLimit(12);
    if (data.brief) {
      const input = data.brief.input;
      setModel(input.model);
      setCategory(input.category);
      setBudget(String(input.budget / 100));
      setMessage(input.message);
      setPreference(input.preference);
      setPriority(input.priority);
      setWeights(input.weights);
      setProducts(data.brief.clarificationRequired ? [] : searchCatalog(input));
      setQuestions(clarifyBrief(input));
      if (data.conversation.length) setSummary(data.conversation.at(-1)!.text);
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
      .catch(() => {})
      .finally(() => {
        if (active) setRestoring(false);
      });
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
  }, [setTab]);
  const showPaymentError = useCallback(
    (message: string) => setError(message),
    [],
  );
  const startShopping = () => {
    setRole("buyer");
    setModal({ kind: "login" });
  };
  const applyVoice = useCallback(
    (data: VoiceResult) => {
      if (data.snapshot) restoreSession(data.snapshot);
      if (data.intent.kind === "shopping" && data.result && data.snapshot) {
        restoreSession(data.snapshot);
        setProducts(data.result.products);
        setQuestions(data.result.questions);
        setSummary(data.result.analysis.summary);
        setTab("discover");
        setNotice(
          "Voice brief saved. Review device fit and cost before choosing a product.",
        );
        requestAnimationFrame(() =>
          document
            .getElementById("shop")
            ?.scrollIntoView({ behavior: "instant" }),
        );
      } else if (data.intent.kind === "navigate")
        setTab(data.intent.destination);
      else if (data.intent.kind === "support_draft") {
        setSupportDraft(data.intent);
        setTab("support");
        setNotice(
          `Your support draft: ${data.intent.text} Choose the relevant order and review its request.`,
        );
      } else if (
        data.intent.kind === "clarification" ||
        data.intent.kind === "review_required"
      )
        setNotice(data.intent.message);
    },
    [restoreSession, setTab, setSupportDraft],
  );
  const isBuyer = !session || session.actor.role === "buyer";
  const applyAgent = useCallback(
    (data: AgentResult) => {
      restoreSession(data.snapshot);
      if (data.intent.kind === "shopping" && data.result) {
        setProducts(data.result.products);
        setQuestions(data.result.questions);
        setSummary(data.result.analysis.summary);
        setCatalogQuery("");
        if (tab !== "discover") setTab("discover");
      } else if (
        data.intent.kind === "navigate" ||
        data.intent.kind === "support_draft"
      )
        applyVoice(data);
    },
    [restoreSession, applyVoice, setTab, tab],
  );
  async function findProducts(confirmConstraints = false) {
    if (!session) {
      startShopping();
      return;
    }
    await run(async () => {
      const result = await api<{
        products: Product[];
        analysis: { summary: string };
        questions: string[];
      }>("/api/shopping", {
        message,
        model,
        category,
        budget: Math.round(Number(budget) * 100),
        preference,
        priority,
        weights,
        confirmConstraints,
      });
      setProducts(result.products);
      setVisibleLimit(12);
      setCatalogQuery("");
      setSummary(result.analysis.summary);
      setQuestions(result.questions);
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
  function browseCollection(nextCategory: string) {
    setVisibleLimit(12);
    setCategory(nextCategory);
    setBriefDirty(true);
    setCatalogQuery("");
    setProducts(
      questions.length
        ? []
        : searchCatalog({
            model,
            category: nextCategory,
            budget: Math.round(Number(budget) * 100),
            preference,
            priority,
            weights,
          }),
    );
    setSummary(
      "Collection preview. Save your device, budget and preferences with Find my match before reviewing a purchase.",
    );
    document.getElementById("shop")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  async function upload(
    form: FormData,
    target: { caseId?: string; orderId?: string },
  ) {
    const photo = form.get("image") as File;
    const video = form.get("video") as File;
    if (photo?.size && video?.size)
      throw new Error("Submit one photo or video per evidence record.");
    const file = video?.size ? video : photo;
    const input = {
      ...target,
      checkpoint: String(form.get("checkpoint")),
      serial: String(form.get("serial")),
      note: String(form.get("note")),
    };
    if (file?.size) {
      const body = new FormData();
      for (const [key, value] of Object.entries(input))
        if (value !== undefined) body.set(key, value);
      const captureSessionId = form.get("captureSessionId");
      if (captureSessionId) body.set("captureSessionId", captureSessionId);
      body.set(video?.size ? "video" : "image", file);
      const response = await fetch("/api/evidence", { method: "POST", body });
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
    <>
      {showIntro && (
        <CinematicIntro
          targetSelector="[data-brand-logo]"
          onSettled={() => setLogoSettled(true)}
          onComplete={() => setShowIntro(false)}
        />
      )}
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="announcement">
          <span>Considered essentials. Customer-first shopping.</span>
          <span>Your approval, always.</span>
        </div>
        <header className="site-header" inert={!!modal}>
          <a
            className="brand"
            href="/"
            aria-label="DALE home"
            data-brand-logo="true"
            style={{
              opacity: logoSettled ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            <BrandWordmark />
          </a>
        <nav aria-label="Main navigation">
          {(["discover", "groups", "orders", "support"] as Tab[]).map(
            (item) => (
              <button
                key={item}
                className={tab === item ? "active" : ""}
                aria-current={tab === item ? "page" : undefined}
                onClick={() => setTab(item)}
                disabled={restoring}
              >
                {
                  {
                    discover: "Discover",
                    groups: "Group deals",
                    orders: isBuyer ? "My orders" : "Orders",
                    support: "Support",
                  }[item]
                }
                {tab === item && (
                  <motion.span
                    className="nav-indicator"
                    layoutId="navigation"
                    aria-hidden="true"
                  />
                )}
              </button>
            ),
          )}
        </nav>
        <div className="header-actions">
          <ShoppingBriefMenu
            model={model}
            models={models}
            setModel={setModel}
            deviceLabel={deviceLabel}
            category={category}
            setCategory={setCategory}
            budget={budget}
            setBudget={setBudget}
            message={message}
            setMessage={setMessage}
            preference={preference}
            setPreference={setPreference}
            priority={priority}
            setPriority={setPriority}
            weights={weights}
            setWeights={setWeights}
            briefDirty={briefDirty}
            setBriefDirty={setBriefDirty}
            busy={busy}
            restoring={restoring}
            findProducts={findProducts}
            onIdentify={() => setModal({ kind: "identify" })}
            compatibleCount={visibleProducts.length}
          />
          {session ? (
            <button
              className="account"
              onClick={() =>
                void run(async () => {
                  await api("/api/session", undefined, "DELETE");
                  setSession(null);
                  setSupportDraft(null);
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
            <button
              className="button primary small"
              onClick={startShopping}
              disabled={restoring}
            >
              Start shopping <ArrowRight size={15} />
            </button>
          )}
        </div>
      </header>
      <main id="main" className="main-content" inert={!!modal} tabIndex={-1}>
        {session?.demo && <DemoToolbar session={session} />}
        <div className="mode-strip">
          <span className="status-dot" /> Test storefront ·{" "}
          {!session
            ? "Sign in to see active adapters"
            : session.modes.payments === "sandbox"
              ? "PayPal sandbox"
              : "Simulated payments"}{" "}
          ·{" "}
          {!session
            ? "Analysis mode awaiting session"
            : session.modes.ai === "live"
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
        {isBuyer &&
          (pathname === "/" || tab === "support" || tab === "orders") && (
            <AgentSurface
              orderPage={tab === "orders"}
              inspection={session?.agentRuns.at(-1)?.orders !== undefined}
            >
              <AgentWorkspace
                key={`${session?.actor.workspaceId || "visitor"}:${session?.actor.userId || "visitor"}`}
                session={session}
                restoring={restoring || busy}
                model={model}
                budget={Math.max(
                  1,
                  Math.min(100000, Math.round(Number(budget) * 100) || 8000),
                )}
                briefDirty={briefDirty}
                onResult={applyAgent}
                onGroupCommit={(offer) => {
                  void run(async () => {
                    if (briefDirty)
                      throw new Error(
                        "Save your current needs before committing to a group.",
                      );
                    await action({
                      action: "agent_group_commit",
                      productId: offer.productId,
                      briefVersion: offer.briefVersion,
                      policyVersion: offer.policyVersion,
                    });
                    setNotice(
                      "Group commitment recorded without payment. Another shopper is required before your discounted checkout.",
                    );
                  });
                }}
                onReview={(product, groupId) => {
                  const latest = session?.agentRuns.at(-1);
                  if (
                    !latest?.briefVersion ||
                    latest.briefVersion !== session?.brief?.version ||
                    briefDirty
                  ) {
                    setError(
                      "Your brief changed. Send a new agent task before reviewing this option.",
                    );
                    return;
                  }
                  void choose(product, groupId);
                }}
                voice={
                  <VoiceCompanion
                    pending={restoring || busy}
                    key={`${pathname}:${session?.actor.userId || "visitor"}`}
                    model={model}
                    budget={Math.max(
                      1,
                      Math.min(
                        100000,
                        Math.round(Number(budget) * 100) || 8000,
                      ),
                    )}
                    actorId={session?.actor.userId}
                    onResult={applyVoice}
                  />
                }
              />
            </AgentSurface>
          )}
        {tab === "discover" && (
          <>
            <EditorialHero
              onView={(product) => setModal({ kind: "product", product })}
            />
            {pathname !== "/" && (
              <>
                <div
                  ref={heroAnchorRef}
                  className="hero-dale-anchor"
                  id="hero-dale"
                />
                <DaleMorphCard
                  heroPrompt={heroPrompt}
                  setHeroPrompt={setHeroPrompt}
                  onHeroSubmit={handleHeroSubmit}
                  heroAnchorRef={heroAnchorRef}
                  sidebarAnchorRef={sidebarAnchorRef}
                  session={session}
                  sidebarTask={sidebarTask}
                  restoring={restoring}
                  busy={busy}
                  model={model}
                  budget={Math.max(
                    1,
                    Math.min(100000, Math.round(Number(budget) * 100) || 8000),
                  )}
                  briefDirty={briefDirty}
                  applyAgent={applyAgent}
                  onGroupCommit={(offer) => {
                    void run(async () => {
                      if (briefDirty)
                        throw new Error(
                          "Save your current needs before committing to a group.",
                        );
                      await action({
                        action: "agent_group_commit",
                        productId: offer.productId,
                        briefVersion: offer.briefVersion,
                        policyVersion: offer.policyVersion,
                      });
                      setNotice(
                        "Group commitment recorded without payment. Another shopper is required before your discounted checkout.",
                      );
                    });
                  }}
                  onReview={(product, groupId) => {
                    const latest = session?.agentRuns.at(-1);
                    if (
                      !latest?.briefVersion ||
                      latest.briefVersion !== session?.brief?.version ||
                      briefDirty
                    ) {
                      setError(
                        "Your brief changed. Send a new agent task before reviewing this option.",
                      );
                      return;
                    }
                    void choose(product, groupId);
                  }}
                  voice={
                    <VoiceCompanion
                      pending={restoring || busy}
                      key={`sidebar:${pathname}:${session?.actor.userId || "visitor"}`}
                      model={model}
                      budget={Math.max(
                        1,
                        Math.min(
                          100000,
                          Math.round(Number(budget) * 100) || 8000,
                        ),
                      )}
                      actorId={session?.actor.userId}
                      onResult={applyVoice}
                    />
                  }
                />
              </>
            )}
            <section
              className="collection-section"
              id="collections"
              aria-labelledby="collection-title"
            >
              <div className="collection-heading">
                <h2 id="collection-title">Objects for everyday life.</h2>
                <p>Power. Connection. Sound. Storage. Everyday essentials.</p>
              </div>
              <div className="collection-grid">
                {[
                  {
                    id: "chargers",
                    title: "Power & charging",
                    product: catalog[0],
                  },
                  {
                    id: "docks",
                    title: "Desk & connection",
                    product: catalog[3],
                  },
                  { id: "audio", title: "Sound & focus", product: catalog[5] },
                  {
                    id: "storage",
                    title: "Storage & carry",
                    product: catalog[4],
                  },
                  {
                    id: "accessories",
                    title: "Everyday essentials",
                    product: catalog[6],
                  },
                ].map((collection) => (
                  <button
                    key={collection.id}
                    className="collection-tile"
                    aria-pressed={category === collection.id}
                    onClick={() => browseCollection(collection.id)}
                  >
                    <ProductArt product={collection.product} />
                    <span className="collection-caption">
                      <span>
                        {collection.title}
                        <small>
                          {
                            catalog.filter(
                              (item) => item.category === collection.id,
                            ).length
                          }{" "}
                          products
                        </small>
                      </span>
                      <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section
              className="shopping-area"
              id="shop"
              aria-label="Personal shopping"
            >
              <aside
                ref={sidebarAnchorRef}
                className="dale-companion-slot"
                id="dale-companion-slot"
                aria-hidden="true"
              />
              <div className="results">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">CURATED FOR YOUR NEEDS</div>
                    <h2>Selected for you.</h2>
                  </div>
                  <div className="catalog-heading-controls">
                    <ShoppingBriefMenu
                      model={model}
                      models={models}
                      setModel={setModel}
                      deviceLabel={deviceLabel}
                      category={category}
                      setCategory={setCategory}
                      budget={budget}
                      setBudget={setBudget}
                      message={message}
                      setMessage={setMessage}
                      preference={preference}
                      setPreference={setPreference}
                      priority={priority}
                      setPriority={setPriority}
                      weights={weights}
                      setWeights={setWeights}
                      briefDirty={briefDirty}
                      setBriefDirty={setBriefDirty}
                      busy={busy}
                      restoring={restoring}
                      findProducts={findProducts}
                      onIdentify={() => setModal({ kind: "identify" })}
                      compatibleCount={visibleProducts.length}
                    />
                    <span className="muted">
                      {visibleProducts.length}{" "}
                      {briefDirty ? "preview options" : "compatible options"}
                    </span>
                  </div>
                </div>
                <div
                  className="catalog-brief-strip"
                  role="search"
                  aria-label="Catalog filters and device brief"
                >
                  <div className="brief-strip-grid">
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
                          <option key={m} value={m}>
                            {deviceLabel(m)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Looking for
                      <select
                        aria-label="Looking for"
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
                          aria-label="Maximum budget, USD"
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
                      Feature to prioritize
                      <input
                        aria-label="Feature to prioritize"
                        value={preference}
                        maxLength={80}
                        placeholder="65W, Ethernet, braided cable…"
                        onChange={(e) => {
                          setPreference(e.target.value);
                          setBriefDirty(true);
                        }}
                      />
                    </label>
                    <div className="brief-strip-actions">
                      <label className="brief-strip-weights">
                        <input
                          type="checkbox"
                          aria-label="Use explicit preference weights"
                          checked={!!weights}
                          onChange={(event) => {
                            setWeights(
                              event.target.checked
                                ? { price: 50, features: 50 }
                                : undefined,
                            );
                            setBriefDirty(true);
                          }}
                        />
                        <span>Use explicit preference weights</span>
                      </label>
                      {weights && (
                        <label className="brief-strip-slider">
                          <span>Price weight, {weights.price}%</span>
                          <input
                            aria-label="Price preference weight"
                            type="range"
                            min="0"
                            max="100"
                            value={weights.price}
                            onChange={(event) => {
                              const price = Number(event.target.value);
                              setWeights({ price, features: 100 - price });
                              setBriefDirty(true);
                            }}
                          />
                        </label>
                      )}
                      <button
                        className="button primary small"
                        disabled={busy}
                        onClick={() => void findProducts()}
                      >
                        {busy ? (
                          <LoaderCircle className="spin" size={15} />
                        ) : (
                          <Search size={15} />
                        )}{" "}
                        Find my match
                      </button>
                    </div>
                  </div>
                  {weights && (
                    <p className="muted">
                      Matching feature weight: {weights.features}%. Device fit
                      and budget remain required before ranking.
                    </p>
                  )}
                  {briefDirty && (
                    <p className="muted" role="status">
                      Brief changed. Find my match saves it and replaces older
                      unpaid approvals.
                    </p>
                  )}
                </div>
                <div
                  className="category-index"
                  aria-label="Filter product category"
                >
                  {[
                    ["", "All objects"],
                    ["chargers", "Chargers"],
                    ["docks", "Docks & hubs"],
                    ["audio", "Headphones"],
                    ["storage", "Storage"],
                    ["accessories", "Accessories"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={category === id}
                      onClick={() => browseCollection(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="assistant-note">
                  <span className="assistant-icon">
                    <Sparkles size={17} />
                  </span>
                  <p>{deviceText(summary)}</p>
                </div>
                {!!questions.length && (
                  <div className="analysis-panel">
                    <h3>Let's confirm the details.</h3>
                    {questions.map((question) => (
                      <p key={question}>{deviceText(question)}</p>
                    ))}
                    <button
                      className="button secondary small"
                      disabled={busy || !models.includes(model)}
                      onClick={() => void findProducts(true)}
                    >
                      Use selected device and budget
                    </button>
                  </div>
                )}
                {!!session?.conversation.length && (
                  <details className="conversation-history">
                    <summary>Your shopping conversation</summary>
                    {session.conversation.slice(-6).map((turn, i) => (
                      <p key={`${turn.at}-${i}`}>
                        <strong>
                          {turn.role === "user" ? "You" : "DALE"}:
                        </strong>{" "}
                        {turn.role === "assistant"
                          ? deviceText(turn.text)
                          : turn.text}
                      </p>
                    ))}
                  </details>
                )}
                {products.length > 1 && (
                  <details className="catalog-comparison">
                    <summary>Compare catalog facts</summary>
                    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Recorded specifications</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonFacts(products, model).map((row) => (
                            <tr key={row.productId}>
                              <th>{row.name}</th>
                              <td>{formatMoney(row.price)}</td>
                              <td>
                                {row.specs.length
                                  ? row.specs.join(" · ")
                                  : "Not supplied; ask before buying"}
                              </td>
                              <td>{row.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="muted">
                      Catalog facts support this comparison. Paid placement does
                      not change organic rank.
                    </p>
                  </details>
                )}
                <label className="catalog-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    aria-label="Search matched products"
                    placeholder="Search your selection by name or specification"
                    value={catalogQuery}
                    onChange={(e) => {
                      setCatalogQuery(e.target.value);
                      setVisibleLimit(12);
                    }}
                  />
                </label>
                <div className="product-grid">
                  {visibleProducts
                    .slice(0, visibleLimit)
                    .map((product, index) => (
                      <article
                        className="product-card"
                        key={product.id}
                      >
                        <div className="card-visual">
                          <ProductArt product={product} />
                          <button
                            className="product-view"
                            aria-label={`View details for ${product.name}`}
                            onClick={() =>
                              setModal({ kind: "product", product })
                            }
                          >
                            <ArrowRight size={17} />
                          </button>
                          {index === 0 && (
                            <span className="card-badge">
                              {weights
                                ? "Top weighted match for your brief"
                                : priority === "features"
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
                                : `Fits ${deviceLabel(model)}`}
                            </span>
                            {product.sponsored && (
                              <span className="sponsored">Sponsored</span>
                            )}
                          </div>
                          <h3>
                            <button
                              className="product-title"
                              onClick={() =>
                                setModal({ kind: "product", product })
                              }
                            >
                              {product.name}
                            </button>
                          </h3>
                          <p>{product.description}</p>
                          <div className="spec-tags">
                            {product.specs.slice(0, 2).map((spec) => (
                              <span key={spec}>{spec}</span>
                            ))}
                          </div>
                          <small className="muted">
                            Source: {product.source}.{" "}
                            {weights
                              ? `Ranked with price weight ${weights.price} and feature weight ${weights.features}; feature match uses the listed specifications.`
                              : priority === "features" &&
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
                {visibleProducts.length > visibleLimit && (
                  <div className="catalog-pagination">
                    <p>
                      Showing {Math.min(visibleLimit, visibleProducts.length)}{" "}
                      of {visibleProducts.length} matching products
                    </p>
                    <button
                      className="editorial-link"
                      onClick={() => setVisibleLimit((limit) => limit + 12)}
                    >
                      Show more products <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                {!visibleProducts.length && (
                  <Empty
                    title={
                      catalogQuery
                        ? "Nothing in this selection"
                        : "Let's refine your search"
                    }
                    detail={
                      catalogQuery
                        ? "Try another name or specification, or clear the search to see your matches."
                        : "We won't guess compatibility. Try a known model or a larger budget."
                    }
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
        {tab === "discover" && (
          <>
            <motion.section
              className="advocacy-section"
              initial={{ opacity: 0.6 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div>
                <span className="eyebrow">THE DALE STANDARD</span>
                <h2>
                  Good shopping
                  <br />
                  doesn’t end
                  <br />
                  <em>at checkout.</em>
                </h2>
                <p>
                  Every recommendation begins with your needs. Every purchase
                  needs your approval. Every problem deserves a fair hearing.
                </p>
                <button
                  className="text-link"
                  onClick={() => setTab("support")}
                  style={{ marginTop: 20 }}
                >
                  Explore customer support <ArrowRight size={15} />
                </button>
              </div>
              <div className="advocacy-steps">
                <div className="advocacy-step">
                  <span>01</span>
                  <div>
                    <h3>Find what actually fits.</h3>
                    <p>
                      Device compatibility and your budget come first. Paid
                      placement never improves organic ranking.
                    </p>
                  </div>
                </div>
                <div className="advocacy-step">
                  <span>02</span>
                  <div>
                    <h3>The final word is yours.</h3>
                    <p>
                      Review the item, merchant, full price and delivery terms
                      before you approve. Group commitments never charge you.
                    </p>
                  </div>
                </div>
                <div className="advocacy-step">
                  <span>03</span>
                  <div>
                    <h3>Your side deserves to be heard.</h3>
                    <p>
                      Choose a refund or replacement. Share evidence, request a
                      person and follow every step of your case.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
            <section className="service-faq" aria-labelledby="service-title">
              <div>
                <span className="eyebrow">A LITTLE CLARITY</span>
                <h2 id="service-title">Before you decide.</h2>
              </div>
              <div>
                <details>
                  <summary>How are recommendations selected?</summary>
                  <p>
                    We filter the curated catalog by your device and budget,
                    then rank by your chosen price or feature preference.
                    Conflicting instructions require your confirmation.
                    Specifications are linked to catalog records.
                  </p>
                </details>
                <details>
                  <summary>What happens if I need to return something?</summary>
                  <p>
                    Open a request from My orders and choose a refund or
                    replacement. A reviewer can arrange a merchant-paid return
                    or approve a no-return exception. The demo window is 30 days
                    from recorded delivery; late or incomplete records receive
                    human review.
                  </p>
                </details>
                <details>
                  <summary>Can a photo decide my claim?</summary>
                  <p>
                    Photos and identifiers are submitted evidence, not proof of
                    physical truth. Automated analysis cannot deny your request.
                    Both sides can submit records and you can ask for another
                    review.
                  </p>
                </details>
                <details>
                  <summary>How does a group purchase work?</summary>
                  <p>
                    The merchant publishes a minimum shopper count, discount and
                    checkout window for each group. Each participant checks out
                    independently. Another participant declining does not
                    reprice your locked purchase.
                  </p>
                </details>
              </div>
            </section>
            {pathname !== "/" && (
              <div className="mobile-dale-dock" aria-label="Mobile DALE Chat Dock">
                <button
                  type="button"
                  className="mobile-dale-dock-btn"
                  onClick={() => {
                    const el = document.getElementById("dale-chat");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                      const input = el.querySelector("textarea");
                      input?.focus();
                    }
                  }}
                >
                  <span className="live-status-pulse" />
                  <span className="mobile-dale-text">
                    <strong>Chat with DALE</strong> · Live advice beside products
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
        {tab === "groups" && (
          <>
            <PageHeading
              eyebrow="GOOD DEALS, TOGETHER"
              title="A little buying power."
              detail="Each group shows its approved shopper threshold, discount and deadline. Each shopper pays independently. Your locked price stays yours."
            />
            {session?.demo && (
              <div className="invite-panel">
                <p>
                  For this private demo, switch Demo persona to Second shopper
                  to join the same deal. Each shopper keeps a separate order and
                  approval.
                </p>
              </div>
            )}
            {session?.invite && !session.demo && (
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
                          {deviceLabel(group.model)} · {group.memberCount} of{" "}
                          {group.terms.minimumMembers}
                          commitments
                        </p>
                        <div className="progress">
                          <span
                            style={{
                              width: `${Math.min(100, (group.memberCount / group.terms.minimumMembers) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="muted">
                          {group.status === "ready"
                            ? `Your price: ${formatMoney(group.amount!)}. Valid until ${new Date(group.checkoutExpiresAt!).toLocaleTimeString()}.`
                            : `${group.terms.discountPercent}% off if the threshold is met. No payment is taken until you approve checkout.`}
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
            {session && (
              <div className="workspace-overview" aria-label="Order overview">
                <div>
                  <strong>{session.orders.length}</strong>
                  <span>Recorded orders</span>
                </div>
                <div>
                  <strong>
                    {
                      session.orders.filter((order) => !!order.deliveredAt)
                        .length
                    }
                  </strong>
                  <span>Delivered</span>
                </div>
                <div>
                  <strong>{session.cases.length}</strong>
                  <span>Support requests</span>
                </div>
              </div>
            )}
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
                          {deviceLabel(order.quote.model)} ·{" "}
                          {order.replacementOf
                            ? "No additional charge"
                            : formatMoney(order.quote.amount)}
                        </p>
                      </div>
                      <span className="status-chip">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    {order.quote.deliveryBy && (
                      <p className="muted">
                        Recorded delivery promise:{" "}
                        {new Date(order.quote.deliveryBy).toLocaleDateString()}
                      </p>
                    )}
                    {order.fulfillmentIssue && (
                      <div className="analysis-panel">
                        <h4>Fulfillment {order.fulfillmentIssue.kind}</h4>
                        <p>{order.fulfillmentIssue.reason}</p>
                        <p>
                          Your payment status is shown separately. Choose your
                          preferred remedy through support.
                        </p>
                      </div>
                    )}
                    <div className="timeline">
                      {order.events.map((entry, i) => (
                        <div key={i}>
                          <span className="timeline-dot" />
                          <p>{entry.text}</p>
                          <small>{new Date(entry.at).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                    <ProviderReconciliation
                      order={order}
                      reviewer={session.actor.role === "reviewer"}
                      busy={busy}
                      refresh={async (refundReferences) => {
                        await run(async () => {
                          await action({
                            action: "provider_reconcile",
                            orderId: order.id,
                            refundReferences,
                          });
                          setNotice(
                            "Provider facts refreshed. Pending or ambiguous adjustments still require reconciliation; no new money action was performed.",
                          );
                        });
                      }}
                    />
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
                          ["checkout_pending", "paid", "shipped"].includes(
                            order.status,
                          ) &&
                          !order.fulfillmentIssue && (
                            <button
                              className="button secondary small"
                              onClick={() =>
                                setModal({ kind: "cancel", order })
                              }
                            >
                              Cancel fulfillment
                            </button>
                          )}
                        {session?.actor.role === "seller" &&
                          order.fulfillmentIssue?.kind !== "canceled" &&
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
                          order.status === "shipped" &&
                          order.fulfillmentIssue?.kind !== "canceled" && (
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
            {session && (
              <div className="workspace-overview" aria-label="Support overview">
                <div>
                  <strong>
                    {
                      session.cases.filter((item) => item.status !== "resolved")
                        .length
                    }
                  </strong>
                  <span>Open requests</span>
                </div>
                <div>
                  <strong>
                    {
                      session.cases.filter((item) => item.status === "resolved")
                        .length
                    }
                  </strong>
                  <span>Resolved requests</span>
                </div>
                <div>
                  <strong>Human</strong>
                  <span>Review available</span>
                </div>
              </div>
            )}
            {isBuyer && supportDraft && (
              <div className="analysis-panel" aria-label="Voice support draft">
                <strong>Your support draft</strong>
                <p>{supportDraft.text}</p>
                <p className="muted">
                  Choose an order, then correct and review the issue and
                  preferred resolution before submitting.
                </p>
                <button
                  className="button secondary"
                  onClick={() => setTab("orders")}
                >
                  Choose an order for this draft
                </button>
                <button
                  className="button secondary"
                  onClick={() => setSupportDraft(null)}
                >
                  Discard draft
                </button>
              </div>
            )}
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
                    {isBuyer &&
                      !item.remedy &&
                      ![
                        "resolved",
                        "approved",
                        "refund_pending",
                        "refund_failed",
                      ].includes(item.status) && (
                        <button
                          className="button secondary small"
                          onClick={() =>
                            void run(async () => {
                              await action({
                                action: "choose_remedy",
                                caseId: item.id,
                                request:
                                  item.request === "refund"
                                    ? "replacement"
                                    : "refund",
                              });
                              setNotice(
                                "Your remedy choice is updated. A reviewer will follow your preference before execution.",
                              );
                            })
                          }
                        >
                          Choose{" "}
                          {item.request === "refund" ? "replacement" : "refund"}{" "}
                          instead
                        </button>
                      )}
                    {item.eligibility && (
                      <p className="muted">{item.eligibility.explanation}</p>
                    )}
                    {item.returnShipment && (
                      <div className="analysis-panel">
                        <h4>
                          Return arrangement ·{" "}
                          {item.returnShipment.status.replaceAll("_", " ")}
                        </h4>
                        <p>{item.returnShipment.reason}</p>
                        <p>
                          Customer return shipping cost: $0.00. Carrier records
                          are simulated in this demo.
                        </p>
                        {item.returnShipment.labelReference && (
                          <p>
                            Prepaid label reference:{" "}
                            {item.returnShipment.labelReference}
                          </p>
                        )}
                        {item.returnShipment.trackingReference && (
                          <p>
                            Return tracking reference:{" "}
                            {item.returnShipment.trackingReference}
                          </p>
                        )}
                        {item.returnShipment.remedyDueAt && (
                          <p>
                            Merchant remedy target:{" "}
                            {new Date(
                              item.returnShipment.remedyDueAt,
                            ).toLocaleString()}
                            . Provider settlement timing is separate.
                          </p>
                        )}
                        {session.actor.role === "buyer" &&
                          item.returnShipment.status === "authorized" && (
                            <button
                              className="button secondary small"
                              onClick={() =>
                                setModal({
                                  kind: "return_shipping",
                                  item,
                                  status: "in_transit",
                                })
                              }
                            >
                              Record return handoff
                            </button>
                          )}
                        {session.actor.role === "seller" &&
                          item.returnShipment.status === "in_transit" && (
                            <button
                              className="button secondary small"
                              onClick={() =>
                                setModal({
                                  kind: "return_shipping",
                                  item,
                                  status: "received",
                                })
                              }
                            >
                              Record return receipt
                            </button>
                          )}
                      </div>
                    )}
                    <a href={`/api/case-report?id=${item.id}`} download>
                      Download private case report
                    </a>
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
                              View original{" "}
                              {entry.mime?.startsWith("video/")
                                ? "video"
                                : "image"}{" "}
                              <ChevronRight size={12} />
                            </a>
                          )}
                          <small>
                            Integrity hash: {entry.hash.slice(0, 16)}…
                          </small>
                          <small>
                            {entry.provenance?.challenge
                              ? `Capture code linked: ${entry.provenance.challenge.code}`
                              : entry.assetKey
                                ? "Uploaded file; capture origin unverified"
                                : "Submitted description"}
                          </small>
                          {!!entry.provenance?.repeatedEvidenceIds.length && (
                            <small>
                              Identical bytes appeared earlier in this case. A
                              reviewer can check the context.
                            </small>
                          )}
                          {entry.mime?.startsWith("video/") && (
                            <small>
                              Video retained for human review; image analysis
                              does not inspect video.
                            </small>
                          )}
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
                        {item.analysis.propositions?.map((claim) => (
                          <details key={claim.id} className="claim-proposition">
                            <summary>
                              {claim.statement} · {claim.outcome}
                            </summary>
                            {claim.observations.map((observation, i) => (
                              <p key={i}>
                                {observation.text} (
                                {observation.basis.replaceAll("_", " ")})
                              </p>
                            ))}
                            {claim.sourceIds.map((id) => {
                              const source = item.evidence.find(
                                (entry) => entry.id === id,
                              );
                              return (
                                source && (
                                  <p key={id}>
                                    Source:{" "}
                                    {source.checkpoint.replaceAll("_", " ")} ·{" "}
                                    {source.id.slice(0, 8)}{" "}
                                    {source.assetKey && (
                                      <a
                                        href={`/api/evidence?id=${id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        View original{" "}
                                        {source.mime?.startsWith("video/")
                                          ? "video"
                                          : "image"}
                                      </a>
                                    )}
                                  </p>
                                )
                              );
                            })}
                            {claim.missingFacts.map((fact) => (
                              <p key={fact}>Missing: {fact}</p>
                            ))}
                            {claim.uncertainty.map((limitation) => (
                              <p key={limitation}>{limitation}</p>
                            ))}
                            <p>{claim.nextAction}</p>
                          </details>
                        ))}
                        <strong>{item.analysis.nextStep}</strong>
                      </div>
                    )}
                    {session.orders.find((order) => order.id === item.orderId)
                      ?.refund && (
                      <div className="analysis-panel">
                        <h4>
                          Refund{" "}
                          {
                            session.orders.find(
                              (order) => order.id === item.orderId,
                            )!.refund!.status
                          }
                        </h4>
                        <p>
                          {
                            session.orders.find(
                              (order) => order.id === item.orderId,
                            )!.refund!.nextStep
                          }
                        </p>
                        <small>
                          Provider reference:{" "}
                          {session.orders.find(
                            (order) => order.id === item.orderId,
                          )!.refund!.reference || "Not confirmed yet"}
                        </small>
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
                        ![
                          "resolved",
                          "refund_pending",
                          "refund_failed",
                        ].includes(item.status) && (
                          <button
                            className="button primary small"
                            disabled={busy}
                            onClick={() => setModal({ kind: "resolve", item })}
                          >
                            Approve requested {item.request}
                          </button>
                        )}
                      {isBuyer &&
                        ["resolved", "refund_failed"].includes(item.status) && (
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
            {session.recovery && (
              <p>
                Recovery worker:{" "}
                {session.recovery.healthy
                  ? "recent heartbeat"
                  : "heartbeat overdue or unavailable"}{" "}
                · Last seen: {session.recovery.lastSeenAt || "Not recorded"} ·
                Pending jobs: {session.recovery.queue.pending || 0} · Running:{" "}
                {session.recovery.queue.running || 0} · Needs operator review:{" "}
                {session.recovery.queue.dead || 0}
              </p>
            )}
            {session.archivedAt && (
              <p>
                This fixture workspace is archived. Its financial and evidence
                audit records are preserved.
              </p>
            )}
            {session.actor.role === "reviewer" && (
              <GroupPolicySettings
                key={session.groupPolicy.version}
                policy={session.groupPolicy}
                busy={busy}
                onSave={(policy, expectedVersion) =>
                  run(async () => {
                    await action({
                      action: "group_policy",
                      policy,
                      expectedVersion,
                    });
                    setNotice(
                      "Group policy approved. Existing groups keep their frozen terms.",
                    );
                  })
                }
              />
            )}
            {session.actor.role === "reviewer" && !session.demo && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    const result = await api<{ snapshot: Session }>(
                      "/api/scenarios",
                      { action: "create", kind: scenario },
                    );
                    restoreSession(result.snapshot);
                    setTab(
                      result.snapshot.orders.length ? "orders" : "discover",
                    );
                    setNotice(
                      "An isolated fixture scenario is open as the shopper. All payments, analysis, and shipping here are synthetic. Use its workspace ID in a separate operator profile.",
                    );
                  });
                }}
              >
                <label>
                  Engineering scenario
                  <select
                    value={scenario}
                    onChange={(event) =>
                      setScenario(event.target.value as ScenarioKind)
                    }
                  >
                    <option value="fresh">Fresh shopper workspace</option>
                    <option value="delivered">
                      Delivered item ready for a return
                    </option>
                    <option value="identifier_conflict">
                      Conflicting return identifiers
                    </option>
                    <option value="seller_silence">
                      Missed seller response deadline
                    </option>
                    <option value="refund_failure">Rejected refund</option>
                    <option value="refund_timeout">Interrupted refund</option>
                    <option value="canceled_order">
                      Seller cancellation with payment recorded
                    </option>
                    <option value="late_order">
                      Late delivery with customer remedy choices
                    </option>
                    <option value="group_partial">Partial group payment</option>
                  </select>
                </label>
                <button className="button secondary small" disabled={busy}>
                  Open new fixture scenario as shopper
                </button>
                {session.fixtureWorkspace && (
                  <button
                    type="button"
                    className="button secondary small"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const result = await api<{ snapshot: Session }>(
                          "/api/scenarios",
                          { action: "reset", kind: scenario },
                        );
                        restoreSession(result.snapshot);
                        setTab("orders");
                        setNotice(
                          "Previous fixture archived with audit history preserved. A new isolated fixture workspace is open.",
                        );
                      })
                    }
                  >
                    Archive fixture and start fresh
                  </button>
                )}
              </form>
            )}
          </details>
        )}
      </main>
      <footer className="site-footer-wrap" inert={!!modal}>
        <div className="site-footer-inner">
          <div className="site-footer">
            <div className="footer-brand">
              <div className="brand">
                <BrandWordmark />
                <span className="sr-only">DALE</span>
              </div>
              <p>
                Considered choices. Customer-first commerce. From your first
                search to a fair resolution.
              </p>
            </div>
            <div className="footer-links">
              <strong>The collection</strong>
              <button
                onClick={() => {
                  setTab("discover");
                  window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                  });
                }}
              >
                Discover essentials
              </button>
              <button onClick={() => setTab("groups")}>Buy together</button>
              <button onClick={() => setTab("orders")}>Track an order</button>
            </div>
            <div className="footer-links">
              <strong>At your service</strong>
              <button onClick={() => setTab("support")}>Returns & support</button>
              <button
                onClick={() => {
                  setScam(null);
                  setModal({ kind: "scam" });
                }}
              >
                Check a message
              </button>
              <button
                onClick={() => {
                  setRole("seller");
                  setWorkspaceId(session?.actor.workspaceId || "");
                  setModal({ kind: "login" });
                }}
              >
                Operator workspace
              </button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>DALE / The considered collection</span>
            <span>
              Test storefront · Sourced products + sample catalog · Simulated
              shipping · USD
            </span>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {modal && (
          <motion.div
            className="modal-backdrop"
            key="dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Dialog
              key={modal.kind}
              onClose={() => setModal(null)}
              className={modal.kind === "product" ? "product-modal" : undefined}
            >
              <button
                className="close-modal"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={21} />
              </button>
              {modal.kind === "product" && (
                <div className="product-detail">
                  <ProductArt product={modal.product} />
                  <div className="product-detail-copy">
                    <span className="eyebrow">
                      THE COLLECTION / {modal.product.id}
                    </span>
                    <h2 id="modal-title">{modal.product.name}</h2>
                    <p>{modal.product.description}</p>
                    <div className="price-row">
                      <strong>{formatMoney(modal.product.price)}</strong>
                      <small>USD · Shipping included</small>
                    </div>
                    <ul className="product-facts">
                      {modal.product.specs.map((spec) => (
                        <li key={spec}>
                          <Check size={14} />
                          {spec}
                        </li>
                      ))}
                    </ul>
                    <p>
                      Compatible with:{" "}
                      {modal.product.compatibleModels
                        .map(deviceLabel)
                        .join(", ")}
                    </p>
                    <p className="muted">
                      Source: {modal.product.source} ·{" "}
                      {modal.product.sponsored
                        ? "Sponsored listing. Organic ranking is independent of sponsorship."
                        : "Curated catalog listing."}{" "}
                      Product visual is a catalog illustration.
                    </p>
                    <div className="policy-note">
                      You review the full amount and merchant before approving.
                      Returns and replacements remain available through your
                      order.
                    </div>
                    {!briefDirty &&
                    modal.product.compatibleModels.includes(model) &&
                    modal.product.price <= Number(budget) * 100 &&
                    (!category || category === modal.product.category) ? (
                      <button
                        className="button primary full"
                        disabled={busy || !isBuyer}
                        onClick={() => void choose(modal.product)}
                      >
                        Review purchase <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        className="button primary full"
                        onClick={() => {
                          const nextCategory = modal.product.category;
                          setModal(null);
                          setTab("discover");
                          browseCollection(nextCategory);
                        }}
                      >
                        Match this collection to my device{" "}
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                      <p>Confirmed fit: {deviceLabel(modal.quote.model)}</p>
                    </div>
                  </div>
                  {modal.quote.productId.startsWith("R") && (
                    <p className="fixture-note">
                      Real manufacturer product identity; simulated DALE
                      merchant offer. This does not order from Apple or promise
                      physical fulfillment.{" "}
                      {modal.quote.productId === "R003"
                        ? "Adapter and 60W charging cable included."
                        : "Adapter only; uses the charging cable confirmed in your brief."}
                    </p>
                  )}
                  {modal.quote.deliveryBy && (
                    <p>
                      Delivery promise:{" "}
                      {new Date(modal.quote.deliveryBy).toLocaleDateString()}
                    </p>
                  )}
                  <p>
                    Merchant policy: request returns within 30 days of recorded
                    delivery. Merchant-paid return shipping for qualifying
                    claims; uncertain or late requests receive review. Provider
                    disputes remain a separate process.
                  </p>
                  <dl className="quote-summary">
                    <div>
                      <dt>Merchant</dt>
                      <dd>DALE demo store</dd>
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
                    Review the original records and payment before authorizing
                    the requested {modal.item.request}. Conflicting or missing
                    evidence does not automatically deny the request.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void run(async () => {
                        const decision = String(
                          form.get("returnDecision") || "waive",
                        );
                        if (modal.item.returnShipment?.status !== "received") {
                          await action({
                            action: "authorize_return",
                            caseId: modal.item.id,
                            decision,
                            reason: String(form.get("note")),
                            labelReference: String(
                              form.get("labelReference") || "",
                            ),
                          });
                        }
                        if (decision === "prepaid") {
                          setModal(null);
                          setNotice(
                            "Prepaid return arranged. The customer pays no return shipping cost. Record handoff and receipt before approving the remedy.",
                          );
                          return;
                        }
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
                    {modal.item.returnShipment?.status !== "received" && (
                      <>
                        <label>
                          Return arrangement
                          <select
                            name="returnDecision"
                            aria-label="Return arrangement"
                          >
                            <option value="waive">
                              Approve a no-return remedy
                            </option>
                            <option value="prepaid">
                              Arrange a merchant-paid return first
                            </option>
                          </select>
                        </label>
                        <label>
                          Prepaid label reference (required for a return)
                          <input
                            name="labelReference"
                            maxLength={100}
                            placeholder="Demo carrier reference"
                          />
                        </label>
                      </>
                    )}
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
              {modal.kind === "return_shipping" && (
                <>
                  <h2 id="modal-title">
                    {modal.status === "in_transit"
                      ? "Record your return handoff."
                      : "Record the returned parcel."}
                  </h2>
                  <p className="muted">
                    This demo records simulated carrier events. A tracking
                    reference does not prove parcel contents; both parties can
                    submit evidence separately.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void run(async () => {
                        await action({
                          action: "return_shipping",
                          caseId: modal.item.id,
                          status: modal.status,
                          trackingReference: String(
                            form.get("trackingReference"),
                          ),
                        });
                        setModal(null);
                        setNotice(
                          "Return checkpoint recorded. Your request remains open until the remedy is processed.",
                        );
                      });
                    }}
                  >
                    <label>
                      Return tracking reference
                      <input
                        required
                        name="trackingReference"
                        maxLength={100}
                        defaultValue={
                          modal.item.returnShipment?.trackingReference || ""
                        }
                      />
                    </label>
                    <button className="button primary full" disabled={busy}>
                      Save return checkpoint
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
                        setSupportDraft(null);
                      });
                    }}
                  >
                    <label>
                      What happened?
                      <select
                        name="reason"
                        defaultValue={supportDraft?.reason || "damaged"}
                      >
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
                      <select
                        name="request"
                        defaultValue={supportDraft?.request || "refund"}
                      >
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
                    A clear description is welcome. Photos are optional; video
                    is never required.
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
                      <select
                        name="checkpoint"
                        onChange={() =>
                          setModal({ ...modal, capture: undefined })
                        }
                      >
                        {modal.order ? (
                          <option value="seller_dispatch">
                            Seller dispatch
                          </option>
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
                      <textarea
                        required
                        name="note"
                        rows={4}
                        maxLength={2000}
                      />
                    </label>
                    <label>
                      Photo (optional, up to 4 MB)
                      <input
                        type="file"
                        name="image"
                        accept="image/png,image/jpeg,image/webp"
                        capture="environment"
                      />
                    </label>
                    <label>
                      Video (optional, MP4 or WebM, up to 8 MB)
                      <input
                        type="file"
                        name="video"
                        accept="video/mp4,video/webm"
                      />
                    </label>
                    <p className="muted">
                      Choose one photo or video per record, or submit your
                      description alone. Videos are private records for human
                      review; image analysis does not inspect video.
                    </p>
                    <input
                      type="hidden"
                      name="captureSessionId"
                      value={modal.capture?.id || ""}
                    />
                    <button
                      type="button"
                      className="button secondary full"
                      disabled={busy}
                      onClick={(e) => {
                        const checkpoint = String(
                          new FormData(e.currentTarget.form!).get("checkpoint"),
                        );
                        void run(async () => {
                          const capture = (await action({
                            action: "capture_session",
                            checkpoint,
                            ...(modal.order
                              ? { orderId: modal.order.id }
                              : { caseId: modal.item!.id }),
                          })) as {
                            id: string;
                            code: string;
                            expiresAt: string;
                          };
                          setModal({ ...modal, capture });
                        });
                      }}
                    >
                      Get capture code (optional)
                    </button>
                    {modal.capture && (
                      <p role="status">
                        Capture code: <strong>{modal.capture.code}</strong>.
                        Include it with the item identifier and condition in
                        your photo. Expires{" "}
                        {new Date(modal.capture.expiresAt).toLocaleTimeString()}
                        . This records a link to your upload; it does not verify
                        capture timing or physical truth.
                      </p>
                    )}
                    <button className="button primary full" disabled={busy}>
                      Record evidence <Check size={16} />
                    </button>
                  </form>
                </>
              )}
              {modal.kind === "cancel" && (
                <>
                  <h2 id="modal-title">Record a fulfillment cancellation.</h2>
                  <p className="muted">
                    Captured payments remain recorded. The shopper chooses
                    refund or replacement; cancellation alone does not execute a
                    financial remedy.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void run(async () => {
                        await action({
                          action: "cancel_fulfillment",
                          orderId: modal.order.id,
                          reason: String(form.get("reason")),
                        });
                        setModal(null);
                        setNotice(
                          "Cancellation recorded; the customer can choose a remedy through support.",
                        );
                      });
                    }}
                  >
                    <label>
                      Cancellation reason
                      <textarea
                        required
                        name="reason"
                        maxLength={2000}
                        rows={3}
                      />
                    </label>
                    <button className="button primary full" disabled={busy}>
                      Record cancellation
                    </button>
                  </form>
                </>
              )}
              {modal.kind === "identify" && (
                <>
                  <h2 id="modal-title">Check your device label.</h2>
                  <p className="muted">
                    Use a clear photo of the model label. Identification is a
                    suggestion: confirm the model before compatibility checks or
                    purchase. Unknown or conflicting labels receive
                    clarification.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      form.set("selectedModel", model);
                      void run(async () => {
                        const response = await fetch("/api/identify", {
                          method: "POST",
                          body: form,
                        });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.error);
                        setModal({ kind: "identify", result });
                      });
                    }}
                  >
                    <label>
                      Device label photo
                      <input
                        required
                        name="image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        capture="environment"
                      />
                    </label>
                    <button className="button primary full" disabled={busy}>
                      Read model label
                    </button>
                  </form>
                  {modal.result && (
                    <div className="analysis-panel">
                      <p>{deviceText(modal.result.message)}</p>
                      <small>
                        {modal.result.mode === "fixture"
                          ? "Synthetic label fixture adapter; arbitrary images are not recognized in fixture mode."
                          : "Provider-extracted label; confirmation required."}
                      </small>
                      {modal.result.proposedModel && (
                        <button
                          className="button secondary full"
                          onClick={() => {
                            setModel(modal.result!.proposedModel!);
                            setBriefDirty(true);
                            setModal(null);
                            setNotice(
                              "Device selection updated. Find my match saves it and renews older unpaid approvals.",
                            );
                          }}
                        >
                          Use {deviceLabel(modal.result.proposedModel)}
                        </button>
                      )}
                    </div>
                  )}
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
                        placeholder="Paste a message or the conversation you choose to share…"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
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
    <motion.div
      className="page-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{detail}</p>
    </motion.div>
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
