import { beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve, sep } from "node:path";
vi.mock("../src/server/concierge/model", () => ({ modelTurn: vi.fn() }));
import { modelTurn } from "../src/server/concierge/model";
import { customerSession } from "../src/server/customers";
import { getDatabase, closeDatabase } from "../src/server/database";
import {
  changeConcierge,
  readConcierge,
  conversationMessages,
  conversationPage,
  startConversation,
  ownerKey,
  conciergeDatabase,
} from "../src/server/concierge/store";
import {
  runConcierge,
  conciergeView,
  cancelTurn,
} from "../src/server/concierge/engine";
import { prepareConversation } from "../src/server/concierge/memory";
import { uiContext, type ConciergeState } from "../src/domain/concierge";
import type { Actor } from "../src/server/state";
const context = uiContext.parse({
  current_url: "/shop",
  current_page_type: "shop",
});
const buyer = async () => (await customerSession({ action: "guest" })).actor;
async function seed(actor: Actor, n: number, size = 30) {
  await changeConcierge(actor, (s) => {
    for (let i = 0; i < n; i++)
      s.transcript.push({
        id: randomUUID(),
        sender: i % 2 ? "assistant" : "user",
        text: `Message ${i}: ` + "x".repeat(size),
        timestamp: Date.now() + i,
      });
  });
  return (await readConcierge(actor)).conversationId!;
}
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.SESSION_SECRET = "chat-memory-test-session-secret-32-characters";
  await getDatabase();
}, 60000);
beforeEach(() => {
  vi.mocked(modelTurn).mockReset();
  process.env.CONCIERGE_PROVIDER = "self_hosted";
  process.env.CONCIERGE_MODEL = "memory-contract";
  process.env.CONCIERGE_INPUT_TOKEN_LIMIT = "100000";
  process.env.CONCIERGE_REPLY_TOKENS = "64";
  delete process.env.CONCIERGE_CONTEXT_BUDGET_TOKENS;
  vi.mocked(modelTurn).mockResolvedValue({
    role: "assistant",
    content: "A natural answer.",
  });
});
afterAll(async () => {
  await closeDatabase();
});
it("sends the entire session beyond both old cutoffs with a single generation and no catalog tools", async () => {
  const a = await buyer();
  const id = await seed(a, 180);
  await changeConcierge(a, (s) => {
    s.transcript.push({
      id: randomUUID(),
      sender: "user",
      text: "Correction: my budget is ₹15,000, not $15,000. Keep oud and incense together.",
      timestamp: Date.now() + 1000,
    });
  });
  const turn = randomUUID();
  const view = await runConcierge(a, {
    turn_id: turn,
    message:
      "What did I say at the beginning, and what is my corrected budget?",
    client_context: context,
  });
  expect(view.turn?.status).toBe("completed");
  expect(modelTurn).toHaveBeenCalledTimes(1);
  const [input, tools] = vi.mocked(modelTurn).mock.calls[0];
  expect(tools).toEqual([]);
  expect(input).toHaveLength(183);
  expect(input[1].content).toContain("Message 0:");
  expect(input.at(-2)?.content).toContain("₹15,000, not $15,000");
  expect(await conversationMessages(a, id)).toHaveLength(183);
  expect((await readConcierge(a)).transcript).toHaveLength(50);
  await runConcierge(a, {
    turn_id: turn,
    message: "retry",
    client_context: context,
  });
  expect(modelTurn).toHaveBeenCalledTimes(1);
  expect(await conversationMessages(a, id)).toHaveLength(183);
});
it("pages every archived message exactly once and isolates owners and conversations", async () => {
  const a = await buyer(),
    other = await buyer();
  const id = await seed(a, 137);
  const all = [];
  let before: number | undefined;
  for (;;) {
    const page = await conversationPage(a, id, before);
    all.unshift(...page.messages);
    if (!page.hasEarlier) break;
    before = page.before!;
  }
  expect(all).toHaveLength(137);
  expect(new Set(all.map((m) => m.id)).size).toBe(137);
  expect(all[0].text).toContain("Message 0:");
  expect(all.at(-1)?.text).toContain("Message 136:");
  expect(await conversationMessages(other, id)).toEqual([]);
  await expect(conversationPage(other, id)).rejects.toThrow(
    "Conversation changed",
  );
});
it("migrates the complete available legacy transcript before bounding UI caches", async () => {
  const a = await buyer();
  await conciergeDatabase();
  const legacy: ConciergeState = {
    revision: 7,
    messages: [{ role: "user", content: "Legacy native text" }],
    transcript: Array.from({ length: 120 }, (_, i) => ({
      id: randomUUID(),
      sender: i % 2 ? ("assistant" as const) : ("user" as const),
      text: `Legacy ${i}`,
      timestamp: 1000 + i,
    })),
    cart: [],
    wishlist: [],
    actions: [],
    confirmations: [],
    resultSets: [],
  };
  await (
    await getDatabase()
  ).query("INSERT INTO concierge_documents(owner,state) VALUES($1,$2::jsonb)", [
    ownerKey(a),
    JSON.stringify(legacy),
  ]);
  const view = await conciergeView(a);
  expect(view.conversation.total).toBe(120);
  expect(view.messages).toHaveLength(50);
  const saved = await conversationMessages(a, view.conversation.id);
  expect(saved[0].text).toBe("Legacy 0");
  expect(saved.at(-1)?.text).toBe("Legacy 119");
  const snapshot = await (
    await getDatabase()
  ).query<{ legacy_snapshot: ConciergeState }>(
    "SELECT legacy_snapshot FROM concierge_conversations WHERE owner=$1 AND id=$2",
    [ownerKey(a), view.conversation.id],
  );
  expect(snapshot.rows[0].legacy_snapshot.transcript).toHaveLength(120);
  expect(snapshot.rows[0].legacy_snapshot.messages).toEqual(legacy.messages);
});
it("starts an isolated new chat without losing the previous archive or basket", async () => {
  const a = await buyer();
  const old = await seed(a, 30);
  await changeConcierge(a, (s) => {
    s.cart = [{ productId: "B002", quantity: 1 }];
  });
  await startConversation(a);
  const state = await readConcierge(a);
  expect(state.conversationId).not.toBe(old);
  expect(state.cart).toEqual([{ productId: "B002", quantity: 1 }]);
  expect(state.transcript).toEqual([]);
  expect(await conversationMessages(a, state.conversationId!)).toEqual([]);
  expect(await conversationMessages(a, old)).toHaveLength(30);
  const result = await runConcierge(a, {
    turn_id: randomUUID(),
    message: "Hello new chat",
    client_context: context,
  });
  expect(result.turn?.status).toBe("completed");
  expect(vi.mocked(modelTurn).mock.calls[0][0]).toHaveLength(2);
});
it("prevents a second tab/new chat from racing an active turn and stores no canceled reply", async () => {
  const a = await buyer();
  let resolve!: (v: { role: "assistant"; content: string }) => void;
  vi.mocked(modelTurn).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const pending = runConcierge(a, {
    turn_id: randomUUID(),
    message: "Slow answer",
    client_context: context,
  });
  await vi.waitFor(() => expect(modelTurn).toHaveBeenCalledTimes(1));
  await expect(startConversation(a)).rejects.toThrow("Stop the current reply");
  await expect(
    runConcierge(a, {
      turn_id: randomUUID(),
      message: "Other tab",
      client_context: context,
    }),
  ).rejects.toThrow("Another turn");
  await cancelTurn(a);
  resolve({
    role: "assistant",
    content: "Canceled answer must never be committed",
  });
  await pending;
  const state = await readConcierge(a);
  expect(state.turn?.status).toBe("canceled");
  expect(
    (await conversationMessages(a, state.conversationId!)).some((m) =>
      m.text.includes("Canceled answer"),
    ),
  ).toBe(false);
});
it("compacts only near the token budget, cites originals and reuses memory without extra summaries", async () => {
  process.env.CONCIERGE_CONTEXT_BUDGET_TOKENS = "6000";
  const a = await buyer();
  const id = await seed(a, 26, 160);
  await changeConcierge(a, (s) =>
    s.transcript.push({
      id: randomUUID(),
      sender: "user",
      text: "Remember Message 0 and my original budget",
      timestamp: Date.now() + 2000,
    }),
  );
  vi.mocked(modelTurn).mockImplementation(async (messages) => {
    const payload = JSON.parse(messages[1].content!);
    const first = payload.messages.find(
      (m: { speaker: string }) => m.speaker === "user",
    );
    return {
      role: "assistant",
      content: JSON.stringify({
        overview: "Earlier conversation retained.",
        facts: [{ text: first.text, origin: "user", source_ids: [first.id] }],
        unresolved: [],
      }),
    };
  });
  const prepared = await prepareConversation(
    a,
    id,
    "Natural Gemini conversation",
  );
  expect(prepared.mode).toBe("compacted");
  expect(modelTurn).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(prepared.messages)).toContain("Message 0:");
  expect(await conversationMessages(a, id)).toHaveLength(27);
  await prepareConversation(a, id, "Natural Gemini conversation");
  expect(modelTurn).toHaveBeenCalledTimes(1);
});
it("rejects fabricated summary sources and leaves all original messages intact", async () => {
  process.env.CONCIERGE_CONTEXT_BUDGET_TOKENS = "6000";
  const a = await buyer();
  const id = await seed(a, 44, 160);
  vi.mocked(modelTurn).mockResolvedValue({
    role: "assistant",
    content: JSON.stringify({
      overview: "Bad",
      facts: [
        { text: "Invented budget", origin: "user", source_ids: [randomUUID()] },
      ],
      unresolved: [],
    }),
  });
  await expect(prepareConversation(a, id, "Natural")).rejects.toThrow(
    "unknown message",
  );
  expect(await conversationMessages(a, id)).toHaveLength(44);
});
it("retains all messages after the database closes and reopens", async () => {
  await closeDatabase();
  const root = resolve(".data"),
    directory = resolve(root, `chat-memory-restart-${randomUUID()}`);
  process.env.LOCAL_DATA_DIR = directory;
  try {
    const a = await buyer();
    const id = await seed(a, 130);
    await closeDatabase();
    expect(await conversationMessages(a, id)).toHaveLength(130);
    expect((await conversationMessages(a, id))[0].text).toContain("Message 0:");
  } finally {
    await closeDatabase();
    if (
      !directory.startsWith(root + sep) ||
      !directory.split(sep).at(-1)?.startsWith("chat-memory-restart-")
    )
      throw new Error("Unexpected test cleanup target");
    await rm(directory, { recursive: true, force: true });
    process.env.LOCAL_DATA_DIR = ":memory:";
  }
}, 60000);
