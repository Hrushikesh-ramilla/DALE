import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse } from "dotenv";
import { customerSession } from "../src/server/customers";
import { runConcierge } from "../src/server/concierge/engine";
import { readConcierge } from "../src/server/concierge/store";
import { closeDatabase } from "../src/server/database";
import { uiContext } from "../src/domain/concierge";
Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
if (process.env.CONCIERGE_PROVIDER !== "gemini")
  throw new Error("This evaluation requires the configured Gemini provider.");
// Run only while the local PGlite app is stopped. Creates an independent guest;
// no existing shopper state or catalog records are changed, and no payment runs.
try {
  const actor = (await customerSession({ action: "guest" })).actor;
  const message = "hmm any tom forb that smells like baby powder";
  const start = Date.now();
  const view = await runConcierge(actor, {
    turn_id: randomUUID(),
    message,
    client_context: uiContext.parse({
      current_url: "/department/electronics",
      current_page_type: "department",
    }),
  });
  const state = await readConcierge(actor);
  const response =
    view.messages.filter((m) => m.sender === "assistant").at(-1)?.text || "";
  const calls = state.messages
    .flatMap((m) => m.tool_calls || [])
    .map((c) => ({
      name: c.function.name,
      arguments: JSON.parse(c.function.arguments),
    }));
  const products = view.products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
  }));
  const scopedSearch = calls.some(
    (c) =>
      c.name === "search_catalog" &&
      c.arguments.brands?.includes("Tom Ford") &&
      c.arguments.categories?.includes("fragrance"),
  );
  const report = {
    at: new Date().toISOString(),
    scope:
      "Actual source engine, Gemini and existing indexed local database; independent guest; app stopped for exclusive PGlite ownership. No mocked inference or payment calls.",
    provider: process.env.CONCIERGE_PROVIDER,
    model: process.env.CONCIERGE_MODEL,
    message,
    elapsedMs: Date.now() - start,
    status: view.turn?.status,
    error: view.turn?.error,
    response,
    calls,
    products,
    passed:
      view.turn?.status === "completed" &&
      scopedSearch &&
      products.every(
        (p) => p.brand === "Tom Ford" && p.category === "fragrance",
      ) &&
      !/\bitem:\d+\b|tom forrest/i.test(response) &&
      /powder|soft|talc|iris|cosmetic|musk|suede/i.test(response),
  };
  await writeFile(
    ".data/concierge-verification/buyer-gemini-preference-native.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await closeDatabase();
}
