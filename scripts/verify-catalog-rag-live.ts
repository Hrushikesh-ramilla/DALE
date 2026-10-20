// Explicit real-provider check. Copies only public catalog records into an
// isolated database; never opens the database owned by the running preview.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "dotenv";
import { randomUUID } from "node:crypto";
import { getDatabase, closeDatabase } from "../src/server/database";
import { customerSession } from "../src/server/customers";
import { runConcierge } from "../src/server/concierge/engine";
import { uiContext } from "../src/domain/concierge";
if (!process.argv.includes("--live"))
  throw new Error("Pass --live for bounded configured-provider verification.");
const source = parse(await readFile(".data/concierge.env", "utf8"));
if (
  source.CONCIERGE_PROVIDER !== "gemini" ||
  source.AI_BILLING_DISABLED !== "true" ||
  source.AI_FREE_QUOTA_CONFIRMED !== "true"
)
  throw new Error("Configured free Gemini policy required.");
const copied = new Map<string, Record<string, unknown>>();
for (const query of ["Imagination", "Ombre Nomade"]) {
  const r = await fetch(
    `http://localhost:3000/api/catalog?query=${encodeURIComponent(query)}`,
  );
  if (!r.ok) throw new Error("Public catalog snapshot unavailable.");
  const body = await r.json();
  for (const p of body.products) copied.set(p.id, p);
}
if (![...copied.values()].some((p) => /imagination/i.test(String(p.name))))
  throw new Error("Required published catalog sample was not found.");
Object.assign(process.env, source, {
  LOCAL_DATA_DIR: ":memory:",
  DATABASE_URL: "",
  PAYMENT_MODE: "fixture",
});
const receipts: unknown[] = [];
const originalFetch = globalThis.fetch;
let calls: unknown[] = [];
globalThis.fetch = async (input, init) => {
  const response = await originalFetch(input, init);
  if (String(input).includes("/openai/chat/completions")) {
    const sent = JSON.parse(String(init?.body));
    const returned = await response.clone().json();
    calls.push({
      status: response.status,
      tool_calls: returned.choices?.[0]?.message?.tool_calls,
      observations: sent.messages
        .filter((m: { role: string }) => m.role === "tool")
        .map((m: { content: string }) => JSON.parse(m.content)),
    });
  }
  return response;
};
try {
  const db = await getDatabase();
  await db.query("UPDATE catalog_products SET publication='retired'");
  for (const p of copied.values())
    await db.query(
      "INSERT INTO catalog_products(id,category,price,record,publication,brand,leaf_type) VALUES($1,$2,$3,$4::jsonb,'published',$5,$6) ON CONFLICT(id) DO UPDATE SET record=EXCLUDED.record,price=EXCLUDED.price,publication='published',brand=EXCLUDED.brand,leaf_type=EXCLUDED.leaf_type",
      [
        p.id,
        p.category,
        p.price,
        JSON.stringify(p),
        p.brand || null,
        p.leafType || p.category,
      ],
    );
  const { actor } = await customerSession({ action: "guest" });
  for (const message of [
    "Do you have LV Imagination in our catalog? What's our price?",
    "And do we also have Ombre Nomade? Tell me its catalog price too.",
  ]) {
    calls = [];
    const start = performance.now();
    const view = await runConcierge(actor, {
      turn_id: randomUUID(),
      message,
      client_context: uiContext.parse({
        current_url: "/department/electronics",
        current_page_type: "department",
      }),
    });
    const text = view.messages.at(-1)?.text;
    const toolCount = calls.reduce<number>(
      (n, c) => n + ((c as { tool_calls?: unknown[] }).tool_calls?.length || 0),
      0,
    );
    const passed =
      view.turn?.status === "completed" &&
      toolCount > 0 &&
      Boolean(
        text?.match(
          message.startsWith("And") ? /ombre nomade/i : /imagination/i,
        ),
      );
    receipts.push({
      message,
      provider: source.CONCIERGE_PROVIDER,
      model: source.CONCIERGE_MODEL,
      publicSnapshotProducts: copied.size,
      status: view.turn?.status,
      error: view.turn?.error,
      reply: text,
      durationMs: Math.round(performance.now() - start),
      calls,
      passed,
    });
    if (!passed) {
      process.exitCode = 1;
      break;
    }
  }
} finally {
  globalThis.fetch = originalFetch;
  await closeDatabase();
  await mkdir(".data/concierge-verification", { recursive: true });
  await writeFile(
    ".data/concierge-verification/catalog-rag-live.json",
    JSON.stringify({ checkedAt: new Date().toISOString(), receipts }, null, 2),
  );
  console.log(
    JSON.stringify(
      receipts.map((r) => {
        const x = r as { calls: unknown[] };
        return { ...x, calls: x.calls.length };
      }),
      null,
      2,
    ),
  );
}
