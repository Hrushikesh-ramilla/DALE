import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parse } from "dotenv";
import { getDatabase, closeDatabase } from "../src/server/database";
import type { ConciergeState } from "../src/domain/concierge";
Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
const message =
  process.argv[2] || "hmm any tom forb that smells like baby powder";
try {
  const db = await getDatabase();
  const { rows } = await db.query<{
    state: ConciergeState;
    updated_at: string;
  }>(
    "SELECT state,updated_at FROM concierge_documents WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(state->'transcript') m WHERE m->>'text'=$1) ORDER BY updated_at DESC LIMIT 1",
    [message],
  );
  const history = rows[0]?.state.messages || [];
  console.log(
    JSON.stringify({
      updatedAt: rows[0]?.updated_at,
      turn: rows[0]?.state.turn,
    }),
  );
  const start = history.findLastIndex(
    (m) => m.role === "user" && m.content === message,
  );
  if (start < 0) throw new Error("The known browser test turn was not found.");
  const end = history.findIndex((m, i) => i > start && m.role === "user");
  const steps = history.slice(start + 1, end < 0 ? undefined : end).map((m) => {
    if (m.tool_calls)
      return {
        calls: m.tool_calls.map((c) => ({
          name: c.function.name,
          arguments: JSON.parse(c.function.arguments),
        })),
      };
    if (m.role !== "tool") return { answer: m.content };
    const result = JSON.parse(m.content || "{}");
    return {
      result: {
        ok: result.ok,
        error: result.error,
        status: result.data?.status,
        constraints: result.data?.constraints,
        degradation: result.data?.degradation,
        total: result.data?.total,
        brands: [
          ...new Set(
            result.data?.products?.map((p: { brand?: string }) => p.brand) ||
              [],
          ),
        ],
        categories: [
          ...new Set(
            result.data?.products?.map(
              (p: { category?: string }) => p.category,
            ) || [],
          ),
        ],
      },
    };
  });
  await writeFile(
    `.data/concierge-verification/gemini-turn-trace-${createHash("sha256").update(message).digest("hex").slice(0, 12)}-${Date.now()}.json`,
    JSON.stringify({ at: new Date().toISOString(), message, steps }, null, 2),
  );
  console.log(JSON.stringify(steps, null, 2));
} finally {
  await closeDatabase();
}
