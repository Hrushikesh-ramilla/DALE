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
import { browserOperation } from "@/domain/concierge";
import {
  browserTabId,
  observeControls,
  localBrowserOperation,
  waitForPage,
  openActionTabs,
  reserveRequestedTab,
  releaseReservedTab,
  type ReservedTab,
  closeActionTab,
  fileSelectionReady,
  chooseActionFile,
} from "./website-browser";
import type { conciergeView } from "@/server/concierge/engine";
import type { CartItem, CopilotMessage } from "./copilot-types";
import { readAgentStream, type AgentStreamEvent } from "@/lib/agent-stream";

type View = Awaited<ReturnType<typeof conciergeView>>;
interface CopilotContextType {
  isOpen: boolean;
  toggleOpen: (v?: boolean) => void;
  isListening: boolean;
  isThinking: boolean;
  activity: string;
  messages: CopilotMessage[];
  cart: CartItem[];
  sendMessage: (prompt: string, context?: unknown) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
  resume: () => Promise<void>;
  recoverTabs: () => void;
  recoverFile: (actionId: string) => void;
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
class ApiFailure extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  onEvent?: (event: AgentStreamEvent) => void,
): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
            ...(path === "/api/copilot/chat"
              ? { Accept: "text/event-stream" }
              : {}),
          },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  if (
    response.ok &&
    response.headers.get("content-type")?.includes("text/event-stream")
  )
    return readAgentStream<T>(
      response,
      (body as { turn_id: string }).turn_id,
      onEvent,
      signal,
    );
  const result = await response.json();
  if (!response.ok)
    throw new ApiFailure(
      result.error || `Request failed (${response.status})`,
      response.status,
    );
  return result as T;
}
export function CopilotProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [isListening, setListening] = useState(false);
  const [isThinking, setThinking] = useState(false);
  const [activity, setActivity] = useState("");
  const [state, setState] = useState<View | null>(null);
  const current = useRef<View | null>(null);
  const [error, setError] = useState("");
  const [isLoadingHistory, setLoadingHistory] = useState(false);
  const [draft, setDraft] = useState<CopilotMessage | null>(null);
  const draftBuffer = useRef<{
    generation: string;
    text: string;
    turn: string;
  } | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearDraft = useCallback(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    draftBuffer.current = null;
    setDraft(null);
  }, []);
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
  const channel = useRef<BroadcastChannel | null>(null);
  const remoteRequests = useRef(new Map<string, Promise<string>>());
  const expireSession = useCallback((failure: unknown, epoch: number) => {
    if (
      !(failure instanceof ApiFailure) ||
      failure.status !== 401 ||
      epoch !== sessionEpoch.current
    )
      return false;
    window.dispatchEvent(new CustomEvent("dale:session-changed"));
    setError(
      "Shopping session expired. Send your request again to start a fresh session, or sign in.",
    );
    return true;
  }, []);
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
    if (!state?.owner_id) return;
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
  }, [state?.owner_id, apply]);
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
      tab_id: browserTabId(),
      controls: observeControls(),
      notices: Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="status"], [role="alert"]',
        ),
      )
        .filter(
          (el) =>
            !el.closest(
              "[data-copilot-panel], [inert], [aria-hidden='true']",
            ) && el.getClientRects().length,
        )
        .map((el) => (el.textContent || "").trim().slice(0, 500))
        .filter(Boolean)
        .slice(0, 8),
      dialogs: Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"]'),
      )
        .filter(
          (el) =>
            el.getAttribute("aria-hidden") !== "true" &&
            el.getClientRects().length,
        )
        .map((el) => ({
          title: (el.querySelector("h1,h2,h3")?.textContent || "")
            .trim()
            .slice(0, 160),
          label: (el.getAttribute("aria-label") || "").slice(0, 160),
        }))
        .slice(0, 6),
      current_url: url.pathname + url.search,
      current_page_type: path[1] || "home",
      active_filters: filters,
      currently_viewed_product_id:
        path[1] === "product"
          ? document.querySelector<HTMLElement>(".pdp-page[data-product-id]")
              ?.dataset.productId || null
          : null,
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
  const register = useCallback(async () => {
    if (!current.current?.owner_id) return;
    await waitForPage(
      location.pathname + location.search,
      AbortSignal.timeout(20000),
    );
    await api("/api/copilot/tabs", context());
  }, [context]);
  useEffect(() => {
    if (!state?.owner_id) return;
    let disposed = false;
    const heartbeat = () => {
      if (!disposed) void register().catch(() => {});
    };
    heartbeat();
    const timer = setInterval(heartbeat, 10000);
    const bc =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("dale-customer-tabs");
    channel.current = bc;
    if (bc)
      bc.onmessage = (event) => {
        const request = event.data;
        if (
          request?.kind === "session" &&
          request.owner === current.current?.owner_id
        ) {
          window.dispatchEvent(
            new CustomEvent("dale:session-changed", {
              detail: { remote: true },
            }),
          );
          window.location.reload();
          return;
        }
        if (
          request?.kind !== "request" ||
          request.owner !== current.current?.owner_id ||
          request.target !== browserTabId() ||
          typeof request.id !== "string"
        )
          return;
        const parsed = browserOperation.safeParse(request.operation);
        if (
          !parsed.success ||
          !["navigate", "scroll", "control", "tab"].includes(parsed.data.type)
        )
          return;
        let pending = remoteRequests.current.get(request.id);
        if (!pending) {
          const op = parsed.data;
          pending = (async () => {
            if (
              op.type === "tab" &&
              op.command === "focus" &&
              op.tab_id === browserTabId()
            ) {
              window.focus();
              await new Promise((r) => setTimeout(r, 100));
              if (!document.hasFocus())
                throw new Error(
                  "The browser did not grant focus. Select this tab manually.",
                );
              return "Target browser tab reported active focus.";
            }
            if (op.type === "tabs" || op.type === "tab")
              throw new Error("Unsupported remote operation.");
            const result = await localBrowserOperation(
              op,
              router.push,
              AbortSignal.timeout(25000),
            );
            await register();
            return result;
          })();
          remoteRequests.current.set(request.id, pending);
        }
        void pending.then(
          (outcome) =>
            bc.postMessage({
              kind: "response",
              id: request.id,
              owner: request.owner,
              target: request.target,
              ok: true,
              outcome,
            }),
          (e) =>
            bc.postMessage({
              kind: "response",
              id: request.id,
              owner: request.owner,
              target: request.target,
              ok: false,
              outcome: e instanceof Error ? e.message : "Target tab failed.",
            }),
        );
      };
    return () => {
      disposed = true;
      clearInterval(timer);
      bc?.close();
      if (channel.current === bc) channel.current = null;
    };
  }, [state?.owner_id, register, router]);
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
      const snapshot = current.current;
      void fetch("/api/copilot/state", { cache: "no-store" })
        .then(async (r) => {
          if (r.ok) apply(await r.json(), epoch);
          else if (
            epoch === sessionEpoch.current &&
            current.current === snapshot
          ) {
            current.current = null;
            setState(null);
          }
        })
        .catch(() => {});
    };
    const sessionChanged = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          remote?: boolean;
          owner_id?: string | null;
          initial?: boolean;
        }>
      ).detail;
      // The initial storefront snapshot can arrive while ensure() is resolving
      // the same authenticated session. It is not an account switch; ensure's
      // server response remains authoritative for this first unowned request.
      if (detail?.initial && !current.current && activeRequest.current) return;
      if (
        detail &&
        Object.hasOwn(detail, "owner_id") &&
        detail.owner_id === (current.current?.owner_id || null)
      )
        return;
      if (!detail?.remote && current.current?.owner_id)
        channel.current?.postMessage({
          kind: "session",
          owner: current.current.owner_id,
        });
      sessionEpoch.current++;
      controller.current?.abort();
      speechController.current?.abort();
      recognition.current?.abort();
      current.current = null;
      manual.current = { path: "", filters: {} };
      setState(null);
      clearDraft();
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
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [apply, clearDraft]);
  const ensure = useCallback(
    async (fresh = false) => {
      if (current.current && !fresh) return current.current;
      const epoch = sessionEpoch.current;
      const view = await api<View>("/api/copilot/state", { action: "start" });
      if (epoch !== sessionEpoch.current)
        throw new Error(
          "Shopping session changed. Send the request again in the current account.",
        );
      apply(view, epoch);
      window.dispatchEvent(
        new CustomEvent("dale:customer-session-ready", {
          detail: { owner_id: view.owner_id },
        }),
      );
      return view;
    },
    [apply],
  );
  const chat = useCallback(
    (
      body: {
        turn_id: string;
        message?: string;
        resume?: boolean;
        client_context: UIContext;
      },
      signal: AbortSignal,
      epoch: number,
    ) =>
      api<View>("/api/copilot/chat", body, signal, (event) => {
        if (
          epoch !== sessionEpoch.current ||
          signal.aborted ||
          event.owner_id !== current.current?.owner_id
        )
          return;
        if (
          event.type === "provider.wait" &&
          typeof event.delay_ms === "number"
        ) {
          setActivity(
            `AI provider requested a retry in ${Math.ceil(event.delay_ms / 1000)} seconds. You can stop this request.`,
          );
          return;
        }
        if (
          event.type === "model.started" &&
          typeof event.generation_id === "string"
        ) {
          clearDraft();
          draftBuffer.current = {
            generation: event.generation_id,
            text: "",
            turn: body.turn_id,
          };
        } else if (
          event.type === "assistant.delta" &&
          typeof event.text === "string" &&
          draftBuffer.current !== null &&
          event.generation_id === draftBuffer.current?.generation
        ) {
          setActivity("");
          draftBuffer.current.text += event.text;
          if (!draftTimer.current)
            draftTimer.current = setTimeout(() => {
              draftTimer.current = null;
              const buffer = draftBuffer.current;
              if (buffer && epoch === sessionEpoch.current && !signal.aborted)
                setDraft({
                  id: `stream:${buffer.generation}`,
                  sender: "assistant",
                  text: buffer.text,
                  timestamp: Date.now(),
                });
            }, 32);
        } else if (
          event.type === "request.completed" ||
          event.type === "request.failed" ||
          (event.type === "model.finished" && event.has_tools)
        )
          clearDraft();
      }),
    [clearDraft],
  );
  const executeBrowser = useCallback(
    async (
      action: BrowserAction,
      signal: AbortSignal,
      reservation?: ReservedTab,
    ) => {
      const operation = action.operation;
      if (action.controllerTabId && action.controllerTabId !== browserTabId())
        throw new Error(
          "This action belongs to another browser tab. Resume it there.",
        );
      let status: "succeeded" | "failed" | "blocked" = "failed";
      let outcome = "";
      try {
        const effectKey = `dale-browser-effect:${action.id}:${browserTabId()}`;
        if (!sessionStorage.getItem(effectKey)) {
          const observed = context();
          if (
            action.sourceURL &&
            action.sourceURL !== observed.current_url &&
            !(
              operation.type === "navigate" &&
              operation.path === observed.current_url
            )
          )
            throw new Error(
              "The page changed after this action was planned. Inspect its current state before continuing.",
            );
          if (
            operation.type === "control" &&
            action.interaction !== "file" &&
            action.controlValue !== undefined &&
            observed.controls.find((c) => c.id === operation.control_id)
              ?.value !== action.controlValue
          )
            throw new Error(
              "This field changed after the action was planned. Inspect its current value before continuing.",
            );
        }
        if (action.interaction === "file" && !fileSelectionReady(action)) {
          status = "blocked";
          outcome =
            "Choose a file to continue. Selecting it does not submit the form.";
        } else if (operation.type === "tabs") {
          openActionTabs(action, reservation);
          let ready = false;
          for (let i = 0; i < 40; i++) {
            signal.throwIfAborted();
            const tabs = await api<View["tabs"]>(
              "/api/copilot/tabs",
              undefined,
              signal,
            );
            ready = Boolean(
              action.targets?.every((target) =>
                tabs.some(
                  (t) =>
                    t.id === target.tabId &&
                    t.createdByAction === action.id &&
                    t.context.current_url === target.path,
                ),
              ),
            );
            if (ready) break;
            await new Promise((r) => setTimeout(r, 250));
          }
          status = ready ? "succeeded" : "blocked";
          outcome = ready
            ? "Every requested destination rendered in its registered browser tab."
            : "One or more tabs have not loaded. Allow this site's popups or use Open requested tabs, then resume.";
        } else if (operation.type === "tab") {
          if (operation.command === "close") {
            closeActionTab(operation.tab_id);
            outcome = "Agent-created browser tab was observed closed.";
          } else {
            const bc = channel.current;
            if (!bc)
              throw new Error(
                "This browser does not support cross-tab commands. Open the tab manually.",
              );
            outcome = await new Promise<string>((resolve, reject) => {
              const timeout = setTimeout(
                () =>
                  finish(new Error("The target browser tab did not respond.")),
                25000,
              );
              const abort = () => finish(new Error("Operation stopped."));
              const receive = (event: MessageEvent) => {
                const data = event.data;
                if (
                  data?.kind === "response" &&
                  data.id === action.id &&
                  data.owner === current.current?.owner_id &&
                  data.target === operation.tab_id
                )
                  finish(data.ok ? data.outcome : new Error(data.outcome));
              };
              const finish = (result: string | Error) => {
                clearTimeout(timeout);
                signal.removeEventListener("abort", abort);
                bc.removeEventListener("message", receive);
                if (result instanceof Error) reject(result);
                else resolve(result);
              };
              signal.addEventListener("abort", abort, { once: true });
              bc.addEventListener("message", receive);
              bc.postMessage({
                kind: "request",
                id: action.id,
                owner: current.current?.owner_id,
                target: operation.tab_id,
                operation:
                  operation.command === "navigate"
                    ? { type: "navigate", path: operation.path }
                    : operation,
              });
            });
          }
          status = "succeeded";
        } else {
          const key = `dale-browser-effect:${action.id}:${browserTabId()}`;
          const saved = sessionStorage.getItem(key);
          if (saved) {
            const receipt = JSON.parse(saved) as { outcome?: string };
            if (!receipt.outcome)
              throw new Error(
                "This component action was interrupted after it started. Inspect the page before requesting another action.",
              );
            outcome = receipt.outcome;
          } else {
            if (operation.type === "control")
              sessionStorage.setItem(key, JSON.stringify({ started: true }));
            outcome = await localBrowserOperation(
              operation,
              router.push,
              signal,
            );
            sessionStorage.setItem(key, JSON.stringify({ outcome }));
          }
          await register();
          status = "succeeded";
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
    [router, context, register],
  );
  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || activeRequest.current) return;
      const reservation = reserveRequestedTab(prompt);
      const epoch = sessionEpoch.current;
      activeRequest.current = true;
      setOpen(true);
      setThinking(true);
      setActivity("");
      setError("");
      const abort = new AbortController();
      controller.current = abort;
      const release = () => releaseReservedTab(reservation);
      abort.signal.addEventListener("abort", release, { once: true });
      try {
        await ensure();
        const id = crypto.randomUUID();
        let view = await chat(
          { turn_id: id, message: prompt, client_context: context() },
          abort.signal,
          epoch,
        );
        apply(view, epoch);
        for (let i = 0; view.turn?.status === "awaiting_ui" && i < 12; i++) {
          for (const action of view.actions) {
            view = await executeBrowser(action, abort.signal, reservation);
            apply(view, epoch);
          }
          if (view.actions.some((a) => a.status === "pending")) break;
          view = await chat(
            { turn_id: id, resume: true, client_context: context() },
            abort.signal,
            epoch,
          );
          apply(view, epoch);
        }
        if (view.turn?.error) setError(view.turn.error);
      } catch (e) {
        if (expireSession(e, epoch)) return;
        if (!abort.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Agent connection failed. Check state before retrying.",
          );
      } finally {
        abort.signal.removeEventListener("abort", release);
        release();
        if (epoch === sessionEpoch.current) {
          clearDraft();
          activeRequest.current = false;
          setThinking(false);
          controller.current = null;
        }
      }
    },
    [ensure, context, apply, executeBrowser, chat, clearDraft, expireSession],
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
      if (
        !view.turn ||
        !["awaiting_ui", "running", "failed"].includes(view.turn.status)
      )
        throw new Error(
          "No browser action is awaiting recovery. Refresh to inspect the current turn.",
        );
      const id = view.turn.id;
      if (view.turn.status !== "awaiting_ui") {
        view = await chat(
          { turn_id: id, resume: true, client_context: context() },
          abort.signal,
          epoch,
        );
        apply(view, epoch);
      }
      for (let i = 0; view.turn?.status === "awaiting_ui" && i < 12; i++) {
        for (const action of view.actions) {
          view = await executeBrowser(action, abort.signal);
          apply(view, epoch);
        }
        if (view.actions.some((a) => a.status === "pending")) break;
        view = await chat(
          { turn_id: id, resume: true, client_context: context() },
          abort.signal,
          epoch,
        );
        apply(view, epoch);
      }
      if (epoch === sessionEpoch.current && view.turn?.error)
        setError(view.turn.error);
    } catch (e) {
      if (expireSession(e, epoch)) return;
      if (epoch === sessionEpoch.current && !abort.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Browser recovery failed. Inspect current state before retrying.",
        );
    } finally {
      if (epoch === sessionEpoch.current) {
        clearDraft();
        activeRequest.current = false;
        setThinking(false);
        controller.current = null;
      }
    }
  }, [apply, context, executeBrowser, chat, clearDraft, expireSession]);
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
        const v = await ensure(true);
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
    clearDraft();
    void api<View>("/api/copilot/state", { action: "cancel" })
      .then((v) => apply(v, epoch))
      .catch((e) => setError(e.message));
  }, [apply, clearDraft]);
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
        activity: isThinking ? activity : "",
        messages:
          draft && isThinking && state?.turn?.status !== "completed"
            ? [...(state?.messages || []), draft]
            : state?.messages || [],
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
        recoverTabs: () => {
          for (const action of current.current?.actions || [])
            if (
              action.operation.type === "tabs" &&
              (!action.controllerTabId ||
                action.controllerTabId === browserTabId())
            )
              openActionTabs(action);
          void resume();
        },
        recoverFile: (actionId) => {
          const action = current.current?.actions.find(
            (a) => a.id === actionId && a.interaction === "file",
          );
          if (!action || action.controllerTabId !== browserTabId()) {
            setError(
              "This file request belongs to another browser tab or is no longer active.",
            );
            return;
          }
          const epoch = sessionEpoch.current;
          try {
            chooseActionFile(action, () => {
              if (epoch === sessionEpoch.current) void resume();
            });
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "The file picker could not be opened.",
            );
          }
        },
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
