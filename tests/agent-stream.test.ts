import { afterEach, expect, it, vi } from "vitest";
import { modelTurn } from "../src/server/concierge/model";
import {
  createAgentTrace,
  withAgentTrace,
  type AgentProgress,
} from "../src/server/concierge/latency";
import { readAgentStream } from "../src/lib/agent-stream";
import { sseData } from "../src/lib/sse";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function configure() {
  vi.stubEnv("CONCIERGE_PROVIDER", "self_hosted");
  vi.stubEnv("CONCIERGE_MODEL", "fixture");
  vi.stubEnv("CONCIERGE_SELF_HOSTED_BASE_URL", "http://127.0.0.1:8081/v1");
  vi.stubEnv("CONCIERGE_STREAMING", "true");
}
const encoder = new TextEncoder();
const frame = (delta: unknown, finish_reason: string | null = null) =>
  `data: ${JSON.stringify({ choices: [{ index: 0, delta, finish_reason }] })}\r\n\r\n`;
function transport(text: string, split = 7) {
  const bytes = encoder.encode(text);
  return new Response(
    new ReadableStream({
      start(c) {
        for (let i = 0; i < bytes.length; i += split)
          c.enqueue(bytes.slice(i, i + split));
        c.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}
function generate(text: string) {
  configure();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(transport(text)));
  const events: AgentProgress[] = [];
  const trace = createAgentTrace({ onProgress: (event) => events.push(event) });
  return {
    events,
    trace,
    promise: withAgentTrace(trace, () =>
      modelTurn([{ role: "user", content: "natural task" }], []),
    ),
  };
}
it("delivers genuine text before the provider finishes and preserves UTF-8 across byte splits", async () => {
  configure();
  let finish!: () => void;
  const provider = new ReadableStream<Uint8Array>({
    start(c) {
      const bytes = encoder.encode(frame({ content: "Hello 🌸 " }));
      for (const byte of bytes) c.enqueue(new Uint8Array([byte]));
      finish = () => {
        c.enqueue(
          encoder.encode(
            frame({ content: "shopper." }, "stop") + "data: [DONE]\n\n",
          ),
        );
        c.close();
      };
    },
  });
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(provider, {
      headers: { "content-type": "text/event-stream" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const events: AgentProgress[] = [];
  const trace = createAgentTrace({ onProgress: (event) => events.push(event) });
  let settled = false;
  const promise = withAgentTrace(trace, () =>
    modelTurn([{ role: "user", content: "hello" }], []),
  );
  void promise.then(() => {
    settled = true;
  });
  await vi.waitFor(() =>
    expect(events).toContainEqual(
      expect.objectContaining({ type: "assistant.delta", text: "Hello 🌸 " }),
    ),
  );
  expect(settled).toBe(false);
  finish();
  expect((await promise).content).toBe("Hello 🌸 shopper.");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).stream).toBe(true);
  expect(trace.timings.some((t) => t.phase === "model.first_text")).toBe(true);
});
it("assembles indexed calls and late opaque metadata through the terminal frame", async () => {
  const { promise, events } = generate(
    frame({
      tool_calls: [
        {
          index: 1,
          id: "second",
          type: "function",
          function: { name: "read", arguments: "{" },
        },
        {
          index: 0,
          id: "first",
          type: "function",
          function: { name: "open", arguments: "{}" },
        },
      ],
    }) +
      frame(
        { tool_calls: [{ index: 1, function: { arguments: "}" } }] },
        "tool_calls",
      ) +
      frame({
        content: "",
        extra_content: { google: { thought_signature: "message-secret" } },
        tool_calls: [
          {
            index: 0,
            extra_content: { google: { thought_signature: "call-secret" } },
          },
        ],
      }) +
      "data: [DONE]\n\n",
  );
  const message = await promise;
  expect(message.tool_calls?.map((c) => c.id)).toEqual(["first", "second"]);
  expect(message.tool_calls?.[0].extra_content?.google.thought_signature).toBe(
    "call-secret",
  );
  expect(message.extra_content?.google.thought_signature).toBe(
    "message-secret",
  );
  expect(JSON.stringify(events)).not.toContain("secret");
  expect(events.at(-1)).toMatchObject({
    type: "model.finished",
    has_tools: true,
  });
});
it("accepts ID-addressed Gemini calls without indices and associates late metadata by ID", async () => {
  const { promise } = generate(
    frame(
      {
        tool_calls: [
          {
            id: "first",
            type: "function",
            function: { name: "open", arguments: "{}" },
          },
          {
            id: "second",
            type: "function",
            function: { name: "read", arguments: "{}" },
          },
        ],
      },
      "tool_calls",
    ) +
      frame({
        tool_calls: [
          {
            id: "first",
            extra_content: {
              google: { thought_signature: "original-opaque-metadata" },
            },
          },
        ],
      }) +
      "data: [DONE]\n\n",
  );
  const reply = await promise;
  expect(reply.tool_calls?.map((call) => call.id)).toEqual(["first", "second"]);
  expect(reply.tool_calls?.[0].extra_content?.google.thought_signature).toBe(
    "original-opaque-metadata",
  );
});
it("rejects an unaddressed continuation when multiple calls make its ownership ambiguous", async () => {
  const { promise } = generate(
    frame({
      tool_calls: [
        { id: "a", function: { name: "one", arguments: "{}" } },
        { id: "b", function: { name: "two", arguments: "{}" } },
      ],
    }) +
      frame(
        {
          tool_calls: [
            {
              extra_content: { google: { thought_signature: "unknown-call" } },
            },
          ],
        },
        "tool_calls",
      ) +
      "data: [DONE]\n\n",
  );
  await expect(promise).rejects.toThrow("index");
});
it.each([
  [frame({ content: "partial" }), "incomplete"],
  [frame({ content: "cut" }, "length") + "data: [DONE]\n\n", "incomplete"],
  [
    frame(
      {
        tool_calls: [
          {
            index: 0,
            id: "call",
            function: { name: "open", arguments: '{"path":' },
          },
        ],
      },
      "tool_calls",
    ) + "data: [DONE]\n\n",
    "JSON",
  ],
  [
    frame({
      tool_calls: [
        { index: 0, id: "a", function: { name: "open", arguments: "{}" } },
      ],
    }) +
      frame({ tool_calls: [{ index: 0, id: "b" }] }, "tool_calls") +
      "data: [DONE]\n\n",
    "identity",
  ],
  ['data: {"choices":', "unfinished"],
])("rejects incomplete or inconsistent stream %s", async (stream, error) => {
  await expect(generate(stream).promise).rejects.toThrow(error);
});
it("aborts a stalled reader without returning a partial function", async () => {
  const abort = new AbortController();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(encoder.encode("data: unfinished"));
    },
  });
  const consume = (async () => {
    for await (const _ of sseData(body, abort.signal)) {
      void _;
    }
  })();
  abort.abort();
  await expect(consume).rejects.toThrow();
});
const wire = (sequence: number, type: string, extra = {}) => ({
  version: 1,
  sequence,
  type,
  stream_id: "stream",
  turn_id: "turn",
  owner_id: "owner",
  ...extra,
});
const appTransport = (...events: unknown[]) =>
  transport(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""));
it("reconciles duplicate events and requires an owned terminal result", async () => {
  const event = wire(1, "turn.started");
  const received: string[] = [];
  const view = { owner_id: "owner", revision: 4 };
  const result = await readAgentStream(
    appTransport(event, event, wire(2, "request.completed", { view })),
    "turn",
    (e) => received.push(e.type),
  );
  expect(result).toEqual(view);
  expect(received).toEqual(["turn.started", "request.completed"]);
});
it.each([
  [wire(2, "turn.started")],
  [wire(1, "turn.started", { turn_id: "other" })],
  [
    wire(1, "turn.started"),
    wire(2, "request.completed", { view: { owner_id: "other" } }),
  ],
  [wire(1, "turn.started"), wire(2, "assistant.delta", { text: "partial" })],
  [
    wire(1, "turn.started"),
    wire(2, "request.failed", { error: "Provider unavailable" }),
  ],
])("rejects invalid/lost/failed application stream", async (...events) => {
  await expect(
    readAgentStream(appTransport(...events), "turn"),
  ).rejects.toThrow();
});
