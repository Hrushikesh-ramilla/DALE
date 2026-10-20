"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  X,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  MessageSquarePlus,
} from "lucide-react";
import { useCopilot } from "./copilot-context";
import { formatMoney } from "@/domain/money";
import { AssistantMessage } from "./assistant-message";

export function DaleCopilotSidecar() {
  const c = useCopilot();
  const [input, setInput] = useState("");
  const [cartView, setCartView] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const historyHeight = useRef<number | null>(null);
  useEffect(() => {
    if (feed.current) {
      feed.current.scrollTop =
        historyHeight.current === null
          ? feed.current.scrollHeight
          : feed.current.scrollHeight - historyHeight.current;
      historyHeight.current = null;
    }
  }, [c.messages, c.isThinking, c.error]);
  const send = () => {
    if (!(input || c.voiceDraft).trim() || c.isThinking) return;
    const text = input || c.voiceDraft;
    setInput("");
    c.clearVoiceDraft();
    void c.sendMessage(text);
  };
  if (!c.isOpen)
    return (
      <button
        type="button"
        className="dale-copilot-launcher"
        aria-label="Open DALE assistant"
        onClick={() => {
          c.toggleOpen(true);
          void c.refresh();
        }}
      >
        <span className="dale-launcher-inner">
          <Sparkles size={18} /> Talk to DALE
        </span>
      </button>
    );
  return (
    <aside
      data-copilot-panel
      className="dale-copilot-sidecar"
      aria-label="DALE assistant"
      data-lenis-prevent="true"
    >
      <header className="dale-sidecar-header">
        <div>
          <strong>DALE</strong>
          <small style={{ display: "block" }}>
            {c.state?.inference?.provider === "gemini"
              ? "Powered by Gemini"
              : c.state?.inference?.provider === "self_hosted"
                ? "Powered by local AI"
                : "Your shopping assistant"}
          </small>
        </div>
        <div className="dale-header-actions">
          <button
            type="button"
            aria-label="New chat"
            title="New chat"
            disabled={c.isThinking}
            onClick={() => void c.newChat()}
          >
            <MessageSquarePlus size={16} />
          </button>
          <button
            type="button"
            aria-label="Show server cart"
            onClick={() => setCartView((v) => !v)}
          >
            <ShoppingBag size={16} />
            <span>{c.cart.length}</span>
          </button>
          <button
            type="button"
            aria-label="Close assistant"
            onClick={() => c.toggleOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
      </header>
      <div
        ref={feed}
        className="dale-messages-feed"
        tabIndex={0}
        data-lenis-prevent="true"
        style={{ overflowY: "auto", flex: 1, minHeight: 0 }}
      >
        {cartView ? (
          <section>
            <h2>Your cart</h2>
            {c.cart.length === 0 ? (
              <p>Your server cart is empty.</p>
            ) : (
              c.cart.map((i) => (
                <div key={i.product.id} className="dale-cart-item">
                  <Link href={`/product/${i.product.id}`}>
                    {i.product.name}
                  </Link>
                  <p>
                    {i.quantity} × {formatMoney(i.product.price)}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove ${i.product.name}`}
                    onClick={() => c.removeFromCart(i.product.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
            <Link href="/cart" onClick={() => c.toggleOpen(false)}>
              Review cart and checkout →
            </Link>
            <p>Prices and fulfillment are sandbox offers.</p>
          </section>
        ) : (
          <>
            {c.state?.conversation.hasEarlier && (
              <button
                type="button"
                disabled={c.isLoadingHistory}
                onClick={() => {
                  historyHeight.current = feed.current?.scrollHeight ?? null;
                  void c.loadEarlier();
                }}
              >
                {c.isLoadingHistory
                  ? "Loading earlier messages…"
                  : "Load earlier messages"}
              </button>
            )}
            {c.messages.length === 0 && (
              <p style={{ padding: "1rem" }}>
                Describe what you need, ask a question, or tell DALE what to do
                on this site. Purchases and submissions require your
                confirmation.
              </p>
            )}
            {c.messages.map((m) => (
              <div
                key={m.id}
                data-message-id={m.id}
                className={`dale-msg-wrapper ${m.sender === "user" ? "user-side" : "assistant-side"}`}
              >
                <div
                  className="dale-msg-bubble"
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {m.sender === "assistant" ? (
                    <AssistantMessage text={m.text} />
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
            {c.state?.catalog_match_status === "not_found" && (
              <p className="dale-action-card">
                No matching product was found under the requested identity and
                filters.
              </p>
            )}
            {c.state?.catalog_match_status === "choose_variant" && (
              <p className="dale-action-card">
                Matching variants — choose the exact product before adding it.
              </p>
            )}
            {c.state?.catalog_match_status === "semantic_candidates" && (
              <p className="dale-action-card">
                Search candidates — requested features need recorded evidence.
              </p>
            )}
            {c.state?.products.length ? (
              <section aria-label="Retrieved catalog products">
                {c.state.products.map((p) => (
                  <div className="dale-action-card" key={p.id}>
                    <Link href={`/product/${p.id}`}>{p.name}</Link>
                    <p>{formatMoney(p.price)} · Recorded sandbox offer</p>
                    <button type="button" onClick={() => c.addToCart(p)}>
                      Add to cart
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => c.openProductInNewTab(p)}
                    >
                      Open tab
                    </button>
                  </div>
                ))}
              </section>
            ) : null}
            {c.state?.confirmations
              .filter(
                (p) => (p.status === "pending" && !p.expired) || p.recoverable,
              )
              .map((p) => (
                <section
                  key={p.id}
                  className="dale-action-card"
                  aria-label="Customer confirmation"
                >
                  <strong>Review before confirming</strong>
                  <p>{p.summary}</p>
                  {p.kind === "checkout" && (
                    <Link href="/cart">
                      Review all item terms and approve checkout
                    </Link>
                  )}
                  <p>Expires {new Date(p.expiresAt).toLocaleTimeString()}</p>
                  {p.kind !== "checkout" && (
                    <button type="button" onClick={() => void c.confirm(p.id)}>
                      Confirm {p.kind.replaceAll("_", " ")}
                    </button>
                  )}{" "}
                  <button
                    type="button"
                    onClick={() => void c.confirm(p.id, true)}
                  >
                    Cancel
                  </button>
                </section>
              ))}
            {c.state?.receipts.slice(-3).map((r) => (
              <p key={r.id} className="dale-action-card">
                <strong>Browser: {r.status}</strong> — {r.outcome}
              </p>
            ))}
          </>
        )}
        {c.isThinking && (
          <div role="status" className="dale-msg-bubble thinking-bubble">
            DALE is working…{" "}
            <button type="button" onClick={c.cancel}>
              Stop
            </button>
          </div>
        )}
        {!c.isThinking && c.state?.turn?.status === "awaiting_ui" && (
          <section
            className="dale-action-card"
            aria-label="Interrupted browser action"
          >
            <p>
              {c.state.actions.find((a) => a.outcome)?.outcome ||
                "A browser action is awaiting acknowledgment."}
            </p>
            {c.state.actions.some((a) => a.operation.type === "tabs") && (
              <button type="button" onClick={c.recoverTabs}>
                Open requested tabs
              </button>
            )}
            <button type="button" onClick={() => void c.resume()}>
              Resume browser action
            </button>{" "}
            <button type="button" onClick={c.cancel}>
              Cancel pending action
            </button>
          </section>
        )}
        {!c.isThinking &&
          ["running", "failed"].includes(c.state?.turn?.status || "") && (
            <section className="dale-action-card">
              <p>The server still records an active turn.</p>
              <button type="button" onClick={() => void c.refresh()}>
                Refresh turn status
              </button>{" "}
              <button type="button" onClick={() => void c.resume()}>
                Resume saved task
              </button>{" "}
              <button type="button" onClick={c.cancel}>
                Cancel active turn
              </button>
            </section>
          )}
        {c.voiceDraft && (
          <p>Review the transcript in the input before sending.</p>
        )}
        {c.error && (
          <p role="alert" className="dale-action-card">
            {c.error}
          </p>
        )}
      </div>
      <form
        className="dale-sidecar-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="dale-input-box">
          <button
            type="button"
            aria-label={c.isListening ? "Stop voice input" : "Voice input"}
            className="dale-mic-btn"
            onClick={c.isListening ? c.stopListening : c.startListening}
          >
            {c.isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <input
            aria-label="Message DALE"
            value={input || c.voiceDraft}
            onChange={(e) => {
              setInput(e.target.value);
              c.clearVoiceDraft();
            }}
            placeholder="Ask DALE or describe a task…"
            maxLength={6000}
          />
          <button
            aria-label="Send message"
            type="submit"
            disabled={c.isThinking || !(input || c.voiceDraft).trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </aside>
  );
}
