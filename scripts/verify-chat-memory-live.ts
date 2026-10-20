// Explicit, bounded live check using synthetic conversations in an isolated DB.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse } from "dotenv";
import { customerSession } from "../src/server/customers";
import {
  changeConcierge,
  readConcierge,
  conversationMessages,
} from "../src/server/concierge/store";
import { closeDatabase } from "../src/server/database";
import { runConcierge } from "../src/server/concierge/engine";
import { uiContext } from "../src/domain/concierge";
if (!process.argv.includes("--live"))
  throw new Error(
    "Pass --live to authorize the bounded configured-provider check.",
  );
const source = parse(await readFile(".data/concierge.env", "utf8"));
if (
  source.CONCIERGE_PROVIDER !== "gemini" ||
  source.AI_BILLING_DISABLED !== "true" ||
  source.AI_FREE_QUOTA_CONFIRMED !== "true"
)
  throw new Error("Configured free Gemini policy required.");
Object.assign(process.env, source, {
  LOCAL_DATA_DIR: ":memory:",
  DATABASE_URL: "",
  PAYMENT_MODE: "fixture",
  CONCIERGE_REPLY_TOKENS: "1536",
});
const results: unknown[] = [];
try {
  for (const mode of ["full", "compacted"] as const) {
    if (mode === "compacted")
      process.env.CONCIERGE_CONTEXT_BUDGET_TOKENS = "7000";
    else delete process.env.CONCIERGE_CONTEXT_BUDGET_TOKENS;
    const { actor } = await customerSession({ action: "guest" });
    await changeConcierge(actor, (s) => {
      for (let i = 0; i < 120; i++)
        s.transcript.push({
          id: randomUUID(),
          sender: i % 2 ? "assistant" : "user",
          text:
            i === 0
              ? "Remember my test preferences: Louis Vuitton Ombre Nomade, oud and incense, exclude vanilla. Budget INR 25000."
              : i === 10
                ? "Correction: budget INR 18000, not INR 25000. Keep the perfume and exclusion unchanged."
                : mode === "full"
                  ? `Unrelated earlier exchange ${i}.`
                  : `Earlier discussion ${i}: ` +
                    Array.from(
                      { length: 35 },
                      (_, j) => `detail${i}item${j}`,
                    ).join(" "),
          timestamp: Date.now() + i,
        });
    });
    const start = performance.now();
    const view = await runConcierge(actor, {
      turn_id: randomUUID(),
      message:
        "Recall my original perfume, scent combination, excluded note, and latest corrected budget with currency. Reply concisely.",
      client_context: uiContext.parse({
        current_url: "/",
        current_page_type: "home",
      }),
    });
    const reply = view.messages.at(-1)?.text || "";
    const passed =
      view.turn?.status === "completed" &&
      /ombre nomade/i.test(reply) &&
      /oud/i.test(reply) &&
      /incense/i.test(reply) &&
      /vanilla/i.test(reply) &&
      /18[,.]?000/.test(reply) &&
      /INR|₹|rupees/i.test(reply);
    const state = await readConcierge(actor);
    const count = (await conversationMessages(actor, state.conversationId!))
      .length;
    results.push({
      mode,
      provider: source.CONCIERGE_PROVIDER,
      model: source.CONCIERGE_MODEL || source.AI_MODEL,
      syntheticHistory: true,
      realProvider: true,
      messagesSaved: count,
      status: view.turn?.status,
      error: view.turn?.error,
      reply,
      passed,
      durationMs: Math.round(performance.now() - start),
    });
    if (!passed) {
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await closeDatabase();
  await mkdir(".data/concierge-verification", { recursive: true });
  await writeFile(
    ".data/concierge-verification/session-memory-live.json",
    JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
}
