import { sseData } from "./sse";

export type AgentStreamEvent = {
  version: 1;
  stream_id: string;
  owner_id: string;
  turn_id: string;
  sequence: number;
  type: string;
  generation_id?: string;
  text?: string;
  has_tools?: boolean;
  view?: unknown;
  error?: string;
  timings?: unknown;
};
/** A terminal response is required. Never retry a POST implicitly after a lost
 * stream: it may already have committed customer effects. */
export async function readAgentStream<T>(
  response: Response,
  expectedTurn: string,
  onEvent?: (event: AgentStreamEvent) => void,
  signal?: AbortSignal,
): Promise<T> {
  if (!response.body) throw new Error("Agent stream has no body.");
  let stream: string | undefined,
    owner: string | undefined,
    sequence = 0;
  let result: T | undefined,
    completed = false;
  for await (const raw of sseData(response.body, signal)) {
    const event = JSON.parse(raw) as AgentStreamEvent;
    if (
      event.version !== 1 ||
      event.turn_id !== expectedTurn ||
      typeof event.stream_id !== "string" ||
      typeof event.owner_id !== "string" ||
      !Number.isInteger(event.sequence) ||
      typeof event.type !== "string"
    )
      throw new Error("Invalid agent stream event.");
    stream ??= event.stream_id;
    owner ??= event.owner_id;
    if (stream !== event.stream_id || owner !== event.owner_id)
      throw new Error("Agent stream identity changed.");
    if (event.sequence <= sequence) continue;
    if (event.sequence !== sequence + 1 || completed)
      throw new Error("Agent stream sequence is incomplete.");
    sequence = event.sequence;
    if (event.type === "request.failed")
      throw new Error(
        event.error ||
          "Agent request failed. Inspect saved state before recovery.",
      );
    if (event.type === "request.completed") {
      if (
        !event.view ||
        typeof event.view !== "object" ||
        !("owner_id" in event.view) ||
        event.view.owner_id !== owner
      )
        throw new Error("Agent result ownership is invalid.");
      result = event.view as T;
      completed = true;
    }
    onEvent?.(event);
  }
  if (!completed)
    throw new Error(
      "Agent connection interrupted. Inspect saved state before recovery.",
    );
  return result!;
}
