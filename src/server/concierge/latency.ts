import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type AgentProgress =
  | { type: "model.started"; generation_id: string }
  | { type: "assistant.delta"; generation_id: string; text: string }
  | { type: "model.finished"; generation_id: string; has_tools: boolean };
export type Timing = {
  phase: string;
  at_ms: number;
  duration_ms?: number;
  data?: Record<string, string | number | boolean>;
};
type Trace = {
  id: string;
  started: number;
  timings: Timing[];
  onProgress?: (event: AgentProgress) => void;
  beforeAttempt?: () => Promise<void>;
};
const traces = new AsyncLocalStorage<Trace>();
/** Timings contain labels and counts only, never prompts, keys or native frames. */
export function createAgentTrace(
  options: Pick<Trace, "onProgress" | "beforeAttempt"> = {},
) {
  return {
    id: randomUUID(),
    started: performance.now(),
    timings: [],
    ...options,
  } satisfies Trace;
}
export function withAgentTrace<T>(trace: Trace, fn: () => T): T {
  return traces.run(trace, fn);
}
export function timing(
  phase: string,
  data?: Timing["data"],
  duration_ms?: number,
) {
  const trace = traces.getStore();
  if (!trace || trace.timings.length >= 500) return;
  trace.timings.push({
    phase,
    at_ms: performance.now() - trace.started,
    ...(duration_ms === undefined ? {} : { duration_ms }),
    ...(data ? { data } : {}),
  });
}
export async function timed<T>(
  phase: string,
  fn: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    return await fn();
  } finally {
    timing(phase, undefined, performance.now() - started);
  }
}
export function agentProgress(event: AgentProgress) {
  traces.getStore()?.onProgress?.(event);
}
export function agentStreams() {
  return (
    Boolean(traces.getStore()?.onProgress) &&
    process.env.CONCIERGE_STREAMING !== "false"
  );
}
export async function admitModelAttempt() {
  await traces.getStore()?.beforeAttempt?.();
}
