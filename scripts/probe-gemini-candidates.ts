import { readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { declarations } from "../src/server/concierge/tools";
const env = parse(await readFile(".data/concierge.env", "utf8"));
if (
  !env.AI_API_KEY ||
  env.CONCIERGE_PROVIDER !== "gemini" ||
  env.CONCIERGE_ALLOW_CLOUD !== "true" ||
  env.AI_BILLING_DISABLED !== "true" ||
  env.AI_FREE_QUOTA_CONFIRMED !== "true"
)
  throw new Error("Existing free-tier policy is required.");
const models = process.argv.slice(2);
if (
  !models.length ||
  models.length > 3 ||
  models.some((m) => !/^gemini-[a-z0-9.-]+$/.test(m))
)
  throw new Error("Pass up to three researched model IDs.");
const tools = declarations([
  "lookup_product",
  "search_catalog",
  "get_categories_and_brands",
  "get_product_details",
  "manage_collection",
  "move_collection",
]);
const results = await Promise.all(
  models.map(async (model) => {
    const start = Date.now();
    try {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.AI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are a shopping assistant. For named models use lookup_product. For descriptive preferences use search_catalog with explicit hard brand and category filters; discover the catalog vocabulary if needed. Do not invent store inventory.",
              },
              {
                role: "user",
                content: "hmm any tom forb that smells like baby powder",
              },
            ],
            tools: tools.map((t) => ({ type: "function", function: t })),
            tool_choice: "auto",
            reasoning_effort: "low",
            max_tokens: 700,
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(25000),
        },
      );
      const body = await r.json();
      return {
        model,
        status: r.status,
        elapsedMs: Date.now() - start,
        finish: body.choices?.[0]?.finish_reason,
        calls: body.choices?.[0]?.message?.tool_calls?.map(
          (c: { function: { name: string; arguments: string } }) => c.function,
        ),
        response: body.choices?.[0]?.message?.content,
        error: body.error?.status,
      };
    } catch (error) {
      return {
        model,
        elapsedMs: Date.now() - start,
        error: error instanceof Error ? error.name : "transport error",
      };
    }
  }),
);
await writeFile(
  ".data/concierge-verification/gemini-candidate-planning-probes.json",
  JSON.stringify(
    {
      scope:
        "Single-generation planning probes with real native tool declarations; no functions execute. Not end-to-end acceptance.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
