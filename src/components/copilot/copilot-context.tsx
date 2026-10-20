"use client";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { recordSpeech } from "@/lib/record-speech";
import type { Product } from "@/domain/catalog";
import type { UIContext, BrowserAction } from "@/domain/concierge";
import { registeredPath } from "@/domain/site-routes";
import type { conciergeView } from "@/server/concierge/engine";
import type { CartItem, CopilotMessage } from "./copilot-types";

type View = Awaited<ReturnType<typeof conciergeView>>;
interface CopilotContextType {
  isOpen: boolean;
  toggleOpen: (v?: boolean) => void;
  isListening: boolean;
  isThinking: boolean;
  messages: CopilotMessage[];
  cart: CartItem[];
  sendMessage: (prompt: string, context?: unknown) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
  resume: () => Promise<void>;
  newChat: () => Promise<void>;
  loadEarlier: () => Promise<void>;
  isLoadingHistory: boolean;
  addToCart: (p: Product, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  openProductInNewTab: (p: Product) => void;
  voiceDraft: string;
  clearVoiceDraft: () => void;
  state: View | null;
  error: string;
  refresh: () => Promise<void>;
  confirm: (id: string, cancel?: boolean) => Promise<void>;
  mutateCollection: (
    collection: "cart" | "wishlist",
    action: "add" | "set" | "remove" | "clear" | "select_group",
    productId?: string,
    quantity?: number,
    groupId?: string | null,
  ) => Promise<void>;
}
const Context = createContext<CopilotContextType | null>(null);
async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}
export function CopilotProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [isListening, setListening] = useState(false);
  const [isThinking, setThinking] = useState(false);
  const [state, setState] = useState<View | null>(null);
  const current = useRef<View | null>(null);
  const [error, setError] = useState("");
  const [isLoadingHistory, setLoadingHistory] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const recognition = useRef<{ abort: () => void; stop: () => void } | null>(
    null,
  );
  const [voiceDraft, setVoiceDraft] = useState("");
  const speechController = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const manual = useRef<{ path: string; filters: Record<string, unknown> }>({
    path: "",
    filters: {},
  });
  const activeRequest = useRef(false);
  const sessionEpoch = useRef(0);
  const apply = useCallback((v: View, epoch = sessionEpoch.current) => {
    if (epoch !== sessionEpoch.current) return;
    if (
      current.current?.owner_id === v.owner_id &&
      current.current.revision > v.revision
    )
      return;
    revision.current = Math.max(
      revision.current,
      ...v.actions.map((action) => action.expectedRevision),
    );
    const previous = current.current;
    const sameConversation =
      previous?.owner_id === v.owner_id &&
      previous?.conversation.id === v.conversation.id;
    const first = v.messages[0]?.sequence ?? Number.MAX_SAFE_INTEGER;
    const older = sameConversation
      ? previous.messages.filter((m) => (m.sequence ?? 0) < first)
      : [];
    const next = older.length
      ? {
          ...v,
          messages: [...older, ...v.messages],
          conversation: {
            ...v.conversation,
            hasEarlier: previous!.conversation.hasEarlier,
            before: previous!.conversation.before,
          },
        }
      : v;
    current.current = next;
    setState(next);
  }, []);
  useEffect(() => {
    if (!isThinking || !state?.owner_id) return;
    const epoch = sessionEpoch.current;
    const events = new EventSource("/api/copilot/events");
    const update = (event: MessageEvent) => {
      try {
        apply(JSON.parse(event.data) as View, epoch);
      } catch {
        /* Request/response remains authoritative if streaming disconnects. */
      }
    };
    events.addEventListener("state", update);
    return () => events.close();
  }, [isThinking, state?.owner_id, apply]);
  const context = useCallback((): UIContext => {
    const url = new URL(window.location.href);
    let filters: Record<string, unknown> =
      manual.current.path === url.pathname
        ? { ...manual.current.filters }
        : Object.fromEntries(url.searchParams);
    try {
      if (url.searchParams.has("filters"))
        filters = JSON.parse(url.searchParams.get("filters")!);
    } catch {
      /* Report actual raw URL when manual JSON is invalid. */
    }
    const path = url.pathname.split("/");
    return {
      current_url: url.pathname + url.search,
      current_page_type: path[1] || "home",
      active_filters: filters,
      currently_viewed_product_id:
        path[1] === "product" ? decodeURIComponent(path[2] || "") : null,
      visible_product_ids: [
        ...new Set(
          Array.from(
            document.querySelectorAll<HTMLElement>("[data-product-id]"),
          )
            .filter((el) => {
              const rect = el.getBoundingClientRect();
              return (
                rect.height > 0 &&
                rect.width > 0 &&
                rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth
              );
            })
            .map((el) => el.dataset.productId!)
            .filter(Boolean),
        ),
      ].slice(0, 100),
      cart_summary:
        current.current?.basket.cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })) || [],
      revision: ++revision.current,
      capabilities: ["navigation", "tabs", "filters", "comparison"],
    };
  }, []);
  const refresh = useCallback(async () => {
    const epoch = sessionEpoch.current;
    try {
      apply(await api<View>("/api/copilot/state"), epoch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session unavailable");
    }
  }, [apply]);
  useEffect(() => {
    const restore = () => {
      const epoch = sessionEpoch.current;
      void fetch("/api/copilot/state", { cache: "no-store" })
        .then(async (r) => {
          if (r.ok) apply(await r.json(), epoch);
          else if (epoch === sessionEpoch.current) {
            current.current = null;
            setState(null);
          }
        })
        .catch(() => {});
    };
    const sessionChanged = () => {
      sessionEpoch.current++;
      controller.current?.abort();
      speechController.current?.abort();
      recognition.current?.abort();
      current.current = null;
      manual.current = { path: "", filters: {} };
      setState(null);
      setVoiceDraft("");
      setError("");
      setThinking(false);
      setListening(false);
      activeRequest.current = false;
      restore();
    };
    restore();
    const sync = (e: Event) => {
      manual.current = {
        path: window.location.pathname,
        filters: (e as CustomEvent<Record<string, unknown>>).detail || {},
      };
    };
    window.addEventListener("dale:ui-state", sync);
    window.addEventListener("dale:session-changed", sessionChanged);
    return () => {
      window.removeEventListener("dale:ui-state", sync);
      window.removeEventListener("dale:session-changed", sessionChanged);
      controller.current?.abort();
      speechController.current?.abort();
      recognition.current?.abort();
    };
  }, [apply]);
  const ensure = useCallback(async () => {
    const epoch = sessionEpoch.current;
    const view = await api<View>("/api/copilot/state", { action: "start" });
    if (epoch !== sessionEpoch.current)
      throw new Error(
        "Shopping session changed. Send the request again in the current account.",
      );
    apply(view, epoch);
    return view;
  }, [apply]);
  const executeBrowser = useCallback(
    async (action: BrowserAction, signal: AbortSignal) => {
      const operation = action.operation;
      let status: "succeeded" | "failed" = "failed";
      let outcome = "";
      try {
        if (operation.type === "tabs") {
          const opened = operation.paths.map((path) => {
            if (!registeredPath(path)) return false;
            const tab = window.open(path, "_blank");
            if (tab) tab.opener = null;
            return Boolean(tab);
          });
          status = opened.every(Boolean) ? "succeeded" : "failed";
          outcome = JSON.stringify({
            opened,
            reason:
              status === "failed"
                ? "Browser blocked one or more popups; use the product links manually."
                : "Browser returned window handles. Destination page load is not independently inspected.",
          });
        } else {
          if (!registeredPath(operation.path))
            throw new Error("Unregistered destination.");
          router.push(operation.path);
          const destination = new URL(operation.path, window.location.origin);
          const until = Date.now() + 20000;
          let observed = false;
          while (Date.now() < until) {
            signal.throwIfAborted();
            const reached =
              window.location.pathname === destination.pathname &&
              window.location.search === destination.search;
            const page = document.querySelector<HTMLElement>(
              "[data-concierge-page]",
            );
            const needsReady = [
              "/search",
              "/compare",
              "/cart",
              "/wishlist",
            ].includes(destination.pathname);
            if (
              reached &&
              (!needsReady ||
                (page?.dataset.conciergePage === destination.pathname &&
                  page.dataset.ready === "true"))
            ) {
              observed = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
          if (!observed)
            throw new Error(
              "Navigation or destination data rendering timed out.",
            );
          status = "succeeded";
          outcome = "Observed requested URL and rendered destination.";
        }
      } catch (e) {
        outcome = e instanceof Error ? e.message : "Browser operation failed";
      }
      return api<View>(
        "/api/copilot/action",
        {
          id: action.id,
          turn_id: action.turnId,
          status,
          outcome,
          client_context: context(),
        },
        signal,
      );
    },
    [router, context],
  );
  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || activeRequest.current) return;
      const epoch = sessionEpoch.current;
      activeRequest.current = true;
      setOpen(true);
      setThinking(true);
      setError("");
      const abort = new AbortController();
      controller.current = abort;
      try {
        await ensure();
        const id = crypto.randomUUID();
        let view = await api<View>(
          "/api/copilot/chat",
          { turn_id: id, message: prompt, client_context: context() },
          abort.signal,
        );
        apply(view, epoch);
        for (let i = 0; view.turn?.status === "awaiting_ui" && i < 12; i++) {
          for (const action of view.actions) {
            view = await executeBrowser(action, abort.signal);
            apply(view, epoch);
          }
          view = await api<View>(
            "/api/copilot/chat",
            { turn_id: id, resume: true, client_context: context() },
            abort.signal,
          );
          apply(view, epoch);
        }
        if (view.turn?.error) setError(view.turn.error);
      } catch (e) {
        if (!abort.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Agent connection failed. Check state before retrying.",
          );
      } finally {
        if (epoch === sessionEpoch.current) {
          activeRequest.current = false;
          setThinking(false);
          controller.current = null;
        }
      }
    },
    [ensure, context, apply, executeBrowser],
  );
  const loadEarlier = useCallback(async () => {
    const snapshot = current.current;
    if (
      !snapshot?.conversation.hasEarlier ||
      !snapshot.conversation.before ||
      isLoadingHistory
    )
      return;
    const epoch = sessionEpoch.current;
    setLoadingHistory(true);
    try {
      const page = await api<{
        id: string;
        messages: View["messages"];
        hasEarlier: boolean;
        before: number | null;
        total: number;
      }>(
        `/api/copilot/history?conversation_id=${encodeURIComponent(snapshot.conversation.id)}&before=${snapshot.conversation.before}`,
      );
      const latest = current.current;
      if (
        epoch !== sessionEpoch.current ||
        latest?.owner_id !== snapshot.owner_id ||
        latest?.conversation.id !== page.id
      )
        return;
      const byId = new Map(
        [...page.messages, ...latest.messages].map((m) => [m.id, m]),
      );
      const next = {
        ...latest,
        messages: [...byId.values()].sort((a, b) => a.sequence - b.sequence),
        conversation: {
          ...latest.conversation,
          hasEarlier: page.hasEarlier,
          before: page.before,
        },
      };
      current.current = next;
      setState(next);
    } catch (e) {
      if (epoch === sessionEpoch.current)
        setError(
          e instanceof Error ? e.message : "History could not be loaded.",
        );
    } finally {
      setLoadingHistory(false);
    }
  }, [isLoadingHistory]);
  const newChat = useCallback(async () => {
    if (activeRequest.current) return;
    const epoch = sessionEpoch.current;
    activeRequest.current = true;
    setThinking(true);
    setError("");
    try {
      await ensure();
      apply(
        await api<View>("/api/copilot/state", { action: "new_chat" }),
        epoch,
      );
    } catch (e) {
      if (epoch === sessionEpoch.current)
        setError(
          e instanceof Error ? e.message : "New chat could not be started.",
        );
    } finally {
      if (epoch === sessionEpoch.current) {
        activeRequest.current = false;
        setThinking(false);
      }
    }
  }, [ensure, apply]);
  const resume = useCallback(async () => {
    if (activeRequest.current) return;
    const epoch = sessionEpoch.current;
    const abort = new AbortController();
    controller.current = abort;
    activeRequest.current = true;
    setThinking(true);
    setError("");
    try {
      let view = await api<View>("/api/copilot/state", undefined, abort.signal);
      if (view.turn?.status !== "awaiting_ui")
        throw new Error(
          "No browser action is awaiting recovery. Refresh to inspect the current turn.",
        );
      const id = view.turn.id;
      for (let i = 0; view.turn?.status === "awaiting_ui" && i < 12; i++) {
        for (const action of view.actions) {
          view = await executeBrowser(action, abort.signal);
          apply(view, epoch);
        }
        view = await api<View>(
          "/api/copilot/chat",
          { turn_id: id, resume: true, client_context: context() },
          abort.signal,
        );
        apply(view, epoch);
      }
      if (epoch === sessionEpoch.current && view.turn?.error)
        setError(view.turn.error);
    } catch (e) {
      if (epoch === sessionEpoch.current && !abort.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Browser recovery failed. Inspect current state before retrying.",
        );
    } finally {
      if (epoch === sessionEpoch.current) {
        activeRequest.current = false;
        setThinking(false);
        controller.current = null;
      }
    }
  }, [apply, context, executeBrowser]);
  const mutateCollection = useCallback(
    async (
      collection: "cart" | "wishlist",
      action: "add" | "set" | "remove" | "clear" | "select_group",
      productId?: string,
      quantity = 1,
      groupId?: string | null,
    ) => {
      const epoch = sessionEpoch.current;
      try {
        setError("");
        const v = await ensure();
        apply(
          await api<View>("/api/copilot/state", {
            collection,
            action,
            items: productId
              ? [
                  {
                    productId,
                    quantity,
                    ...(groupId !== undefined ? { groupId } : {}),
                  },
                ]
              : [],
            expected_revision: v.basket.revision,
          }),
          epoch,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Collection update failed");
        throw e;
      }
    },
    [ensure, apply],
  );
  const safeMutation = (
    collection: "cart" | "wishlist",
    action: "add" | "remove" | "clear",
    id?: string,
    quantity = 1,
  ) => {
    void mutateCollection(collection, action, id, quantity).catch(() => {});
  };
  const confirm = useCallback(
    async (id: string, cancel = false) => {
      const epoch = sessionEpoch.current;
      try {
        setError("");
        const result = await api<{ state: View }>("/api/copilot/confirm", {
          confirmation_id: id,
          cancel,
        });
        apply(result.state, epoch);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Confirmation failed");
        await refresh();
      }
    },
    [apply, router, refresh],
  );
  const cancel = useCallback(() => {
    const epoch = sessionEpoch.current;
    controller.current?.abort();
    void api<View>("/api/copilot/state", { action: "cancel" })
      .then((v) => apply(v, epoch))
      .catch((e) => setError(e.message));
  }, [apply]);
  const startListening = useCallback(() => {
    const epoch = sessionEpoch.current;
    speechController.current?.abort();
    const abort = new AbortController();
    speechController.current = abort;
    setOpen(true);
    setError("");
    setListening(true);
    void (async () => {
      await ensure();
      const capture = await recordSpeech(abort.signal);
      recognition.current = { abort: () => abort.abort(), stop: capture.stop };
      const bytes = await capture.recording;
      if (epoch !== sessionEpoch.current || abort.signal.aborted) return;
      setListening(false);
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "audio/wav" },
        body: bytes,
        signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (epoch === sessionEpoch.current && !abort.signal.aborted)
        setVoiceDraft(data.transcript);
    })()
      .catch((e) => {
        if (!abort.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Local speech recognition failed",
          );
      })
      .finally(() => {
        if (
          epoch === sessionEpoch.current &&
          speechController.current === abort
        )
          setListening(false);
      });
  }, [ensure]);
  const openProductInNewTab = (p: Product) => {
    const tab = window.open(`/product/${encodeURIComponent(p.id)}`, "_blank");
    if (tab) tab.opener = null;
    else setError("Popup blocked. Use the product link to open it.");
  };
  return (
    <Context.Provider
      value={{
        isOpen,
        toggleOpen: (v) => setOpen((p) => v ?? !p),
        isListening,
        isThinking,
        messages: state?.messages || [],
        cart:
          state?.basket.cart
            .filter((i) => i.product)
            .map((i) => ({
              product: i.product!,
              quantity: i.quantity,
              addedAt: 0,
            })) || [],
        sendMessage,
        startListening,
        stopListening: () => {
          recognition.current?.stop();
          setListening(false);
        },
        cancel,
        resume,
        newChat,
        loadEarlier,
        isLoadingHistory,
        addToCart: (p, q) => safeMutation("cart", "add", p.id, q),
        removeFromCart: (id) => safeMutation("cart", "remove", id),
        clearCart: () => safeMutation("cart", "clear"),
        openProductInNewTab,
        voiceDraft,
        clearVoiceDraft: () => setVoiceDraft(""),
        state,
        error,
        refresh,
        confirm,
        mutateCollection,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCopilot() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("CopilotProvider is required.");
  return ctx;
}
