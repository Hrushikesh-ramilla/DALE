"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import {
  catalog,
  deviceText,
  productById,
  type Product,
} from "@/domain/catalog";
import { realProducts } from "@/domain/research";
import { formatMoney } from "@/domain/money";
import type { AgentRun } from "@/domain/agent";
import type { runAgent } from "@/server/agent";
import type { snapshot } from "@/server/service";

export type AgentResult = Awaited<ReturnType<typeof runAgent>>;
type Session = Awaited<ReturnType<typeof snapshot>>;
const samples = [
  {
    label: "Try a real device",
    task: "Find a charger for my MacBook Air M2 13-inch under $50. I already have the original MagSafe 3 cable. Normal charging is fine.",
  },
  {
    label: "Find a charger",
    task: "Find a 65W charger under $40 for USB-C Laptop (65W)",
  },
  {
    label: "Check a seller message",
    task: "Is this seller message safe? Pay using gift cards immediately and share your verification code to release the order.",
  },
  { label: "Track my order", task: "Show my orders" },
  {
    label: "Help with a return",
    task: "My delivered item is damaged and I want a refund",
  },
];

export function AgentWorkspace({
  session,
  restoring,
  model,
  budget,
  voice,
  onResult,
  onReview,
  briefDirty,
}: {
  session: Session | null;
  restoring: boolean;
  model: string;
  budget: number;
  briefDirty: boolean;
  voice: ReactNode;
  onResult: (result: AgentResult) => void;
  onReview: (product: Product) => void;
}) {
  const [task, setTask] = useState("");
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const startedSession = useRef<Session | null>(null);
  useEffect(() => {
    const current = generation.current;
    return () => {
      generation.current = current + 1;
      active.current?.abort();
      active.current = null;
    };
  }, []);
  async function submit() {
    if (!task.trim() || restoring || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const current = generation.current;
    setPending(true);
    setError("");
    try {
      const request = async <T,>(url: string, body: unknown): Promise<T> => {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const value = await response.json();
        if (!response.ok)
          throw new Error(
            value.error || "The task could not complete. Try again.",
          );
        return value;
      };
      let owner = session || startedSession.current;
      if (!owner) {
        setPhase("Starting your private demo workspace…");
        owner = await request<Session>("/api/demo", {
          action: "launch",
          kind: "fresh",
        });
        startedSession.current = owner;
      }
      if (current !== generation.current) return;
      setPhase("Sending your task to DALE…");
      const response = await request<AgentResult>("/api/agent", {
        task,
        model,
        budget,
        expectedWorkspaceId: owner.actor.workspaceId,
        expectedBuyerId: owner.actor.userId,
      });
      if (current !== generation.current) return;
      onResult(response);
      setTask("");
    } catch (error) {
      if (!controller.signal.aborted && current === generation.current)
        setError(
          error instanceof Error
            ? error.message
            : "The task could not complete.",
        );
    } finally {
      if (current === generation.current) {
        active.current = null;
        setPending(false);
      }
    }
  }
  const runs = session?.agentRuns || [];
  const latest = runs.at(-1);
  const reviewCurrent =
    !!latest?.briefVersion &&
    latest.briefVersion === session?.brief?.version &&
    !briefDirty;
  const status: Record<AgentRun["status"], string> = {
    needs_input: "Needs your input",
    ready_for_review: "Ready for your review",
    opened_workspace: "Workspace opened",
    draft_prepared: "Draft ready for review",
  };
  return (
    <section
      className="agent-workspace"
      aria-labelledby="agent-title"
      id="agent"
    >
      <div className="agent-intro">
        <span className="agent-eyebrow">DALE / Your shopping agent</span>
        <h1 id="agent-title">What can I help you with?</h1>
        <p>
          Give me a task. I’ll help you choose, follow an order, or prepare a
          return. You keep the final say.
        </p>
      </div>
      <div className="agent-console">
        <div className="agent-capability-note">
          <strong>Buyer advocate</strong>
          <span>
            Manufacturer-backed M2 MacBook Air charger comparisons, message
            safety and order support. Private demo checkout; model planning
            stays off until free quota and disabled billing are confirmed.
          </span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label htmlFor="agent-task">Your task for DALE</label>
          <textarea
            id="agent-task"
            value={task}
            onChange={(event) => setTask(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Tell DALE what you want to get done…"
            disabled={pending || restoring}
          />
          <div className="agent-compose-actions">
            <span>
              {pending
                ? phase
                : "No purchase, refund or replacement happens from a message."}
            </span>
            <button
              type="submit"
              className="button primary"
              disabled={pending || restoring || !task.trim()}
            >
              {pending ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
              {pending ? "Working on your task" : "Send task"}
            </button>
          </div>
        </form>
        <div className="agent-samples" aria-label="Example agent tasks">
          {samples.map((sample) => (
            <button
              key={sample.label}
              disabled={pending || restoring}
              onClick={() => setTask(sample.task)}
            >
              {sample.label} <ArrowRight size={13} />
            </button>
          ))}
        </div>
        {voice}
        {error && (
          <p className="agent-error" role="alert">
            {error}
          </p>
        )}
        {latest && (
          <div
            className="agent-response"
            aria-label="DALE task result"
            aria-live="polite"
          >
            <div className="agent-response-heading">
              <strong>DALE</strong>
              <span>{status[latest.status]}</span>
            </div>
            <small className="agent-mode">
              {latest.mode === "model"
                ? "Gemini structured planning · validated tool results"
                : latest.mode === "unavailable"
                  ? "Model unavailable · verified catalog and safety rules"
                  : "Catalog assistance · no model calls or AI spend"}
            </small>
            <p className="agent-user-task">You: {latest.task}</p>
            <p>{deviceText(latest.reply)}</p>
            {latest.proposedTask && (
              <button
                className="button secondary"
                disabled={pending || restoring}
                onClick={() => setTask(latest.proposedTask!)}
              >
                Use this interpretation in my next task <ArrowRight size={14} />
              </button>
            )}
            {latest.research && (
              <div className="agent-research" aria-label="Sourced comparison">
                <div className="agent-constraints">
                  <span>{latest.research.need.model}</span>
                  <span>
                    Maximum {formatMoney(latest.research.need.budget)}
                  </span>
                  <span>
                    {latest.research.need.fastCharging
                      ? "Fast charging required"
                      : "Normal charging"}
                  </span>
                  <span>
                    Evidence{" "}
                    {latest.research.freshness === "current"
                      ? "checked 7 Oct 2026"
                      : "expired"}
                  </span>
                </div>
                <p className="agent-price-basis">
                  {latest.research.priceBasis}
                </p>
                <h3>Why these choices?</h3>
                <div className="agent-comparison-grid">
                  {latest.research.findings.map((finding) => {
                    const product = productById(finding.productId);
                    return (
                      <article
                        key={finding.productId}
                        className="agent-comparison-card"
                      >
                        <small>
                          {finding.eligible
                            ? "Fits your confirmed brief"
                            : "Not eligible for this brief"}
                        </small>
                        <h4>{product.name}</h4>
                        <strong>{formatMoney(finding.total)}</strong>
                        <p>
                          {finding.reasons.length
                            ? finding.reasons.join(" ")
                            : product.description}
                        </p>
                        <div className="agent-source-links">
                          {finding.sourceIds.map((id) => {
                            const source = latest.research!.sources.find(
                              (s) => s.id === id,
                            )!;
                            return (
                              <a
                                key={id}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.title} ↗
                              </a>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {latest.status === "needs_input" && (
                  <div
                    className="agent-followups"
                    aria-label="Clarify your shopping brief"
                  >
                    {[
                      {
                        label: "I have MagSafe 3",
                        task: "I already have the original MagSafe 3 cable",
                      },
                      {
                        label: "Include a cable",
                        task: "I need a cable included",
                      },
                      {
                        label: "Raise budget to $60",
                        task: "My budget is $60",
                      },
                      {
                        label: "Normal charging is fine",
                        task: "Normal charging is fine",
                      },
                    ].map((followup) => (
                      <button
                        key={followup.label}
                        disabled={pending || restoring}
                        onClick={() => setTask(followup.task)}
                      >
                        {followup.label} <ArrowRight size={13} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {latest.safety && (
              <div className="agent-safety" aria-label="Message safety check">
                <strong>
                  {latest.safety.level.toUpperCase()} · Payment safety
                </strong>
                <p>{latest.safety.nextStep}</p>
                <small>
                  Pattern checks are advisory; a low result does not verify a
                  sender.
                </small>
              </div>
            )}
            {!!latest.orders?.length && (
              <div className="agent-order-receipts">
                {latest.orders.map((order) => (
                  <article key={order.id}>
                    <strong>{order.product}</strong>
                    <span>{order.status.replaceAll("_", " ")}</span>
                    <p>{order.nextStep}</p>
                  </article>
                ))}
              </div>
            )}
            <details className="agent-receipt" open>
              <summary>What DALE actually did</summary>
              <ol>
                {latest.steps.map((step) => (
                  <li key={step}>
                    <Check size={14} />
                    {step}
                  </li>
                ))}
              </ol>
            </details>
            {!!latest.productIds.length && (
              <div className="agent-options">
                {!reviewCurrent && (
                  <p>
                    Your shopping brief changed. Send a new task before
                    reviewing these options.
                  </p>
                )}
                {latest.productIds.map((id) => {
                  const product = [...catalog, ...realProducts].find(
                    (item) => item.id === id,
                  );
                  return product ? (
                    <article key={id}>
                      <strong>{product.name}</strong>
                      <span>{formatMoney(product.price)}</span>
                      <p>{product.specs.join(" · ")}</p>
                      <small>
                        {id.startsWith("R")
                          ? "Manufacturer evidence:"
                          : "Sample source:"}{" "}
                        {product.source}
                      </small>
                      <button
                        className="button secondary"
                        disabled={pending || restoring || !reviewCurrent}
                        onClick={() => onReview(product)}
                      >
                        Review agent option {product.name}
                      </button>
                    </article>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
        {runs.length > 1 && (
          <details className="agent-history">
            <summary>Earlier agent tasks ({runs.length - 1})</summary>
            {runs
              .slice(0, -1)
              .reverse()
              .map((run) => (
                <div key={run.id}>
                  <strong>You: {run.task}</strong>
                  <p>DALE: {deviceText(run.reply)}</p>
                </div>
              ))}
          </details>
        )}
      </div>
    </section>
  );
}
