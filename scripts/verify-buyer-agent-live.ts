import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse } from "dotenv";
import { runConcierge, warmConcierge } from "../src/server/concierge/engine";
import { readConcierge } from "../src/server/concierge/store";
import { hybridSearch } from "../src/server/concierge/retrieval";
import { customerSession } from "../src/server/customers";
import { closeDatabase } from "../src/server/database";
import { uiContext } from "../src/domain/concierge";
import { formatMoney } from "../src/domain/money";
import { manageBasket } from "../src/server/concierge/shopping";
import type { Actor } from "../src/server/state";

Object.assign(
  process.env,
  parse(await readFile(".data/concierge.env", "utf8")),
);
const candidate = process.argv.includes("--text-candidate");
if (candidate) {
  const model = JSON.parse(
    await readFile("deploy/concierge-text-candidate.json", "utf8"),
  );
  process.env.CONCIERGE_MODEL = model.alias;
  process.env.CONCIERGE_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8083/v1";
}
process.env.LOCAL_DATA_DIR = ":memory:";
process.env.PAYMENT_MODE = "fixture"; // No payment operation is requested by this evaluation.
const context = uiContext.parse({
  current_url: "/department/electronics",
  current_page_type: "department",
});
const results: Record<string, unknown>[] = [];
let warmupMs: number | null = null;
if (process.argv.includes("--warmup")) {
  const at = Date.now();
  await warmConcierge();
  warmupMs = Date.now() - at;
  console.log(
    JSON.stringify({ event: "buyer.live.warmup", elapsedMs: warmupMs }),
  );
}
if (process.argv.includes("--trace-model")) {
  const transport = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    if (String(args[0]).includes("/chat/completions")) {
      const sent=JSON.parse(String(args[1]?.body||"{}"));
      const last=sent.messages?.at(-1);
      if(last?.role === "tool") console.log(JSON.stringify({event:"buyer.live.observation",content:last.content}));
    }
    const result = await transport(...args);
    if (String(args[0]).includes("/chat/completions")) {
      const body = await result.clone().json();
      console.log(
        JSON.stringify({ event: "buyer.live.model", choices: body.choices }),
      );
    }
    return result;
  };
}
async function shopper() {
  return (await customerSession({ action: "guest" })).actor;
}
async function turn(actor: Actor, message: string) {
  const at = Date.now();
  const view = await runConcierge(actor, {
    turn_id: randomUUID(),
    message,
    client_context: context,
  });
  const state = await readConcierge(actor);
  const response =
    view.messages.filter((m) => m.sender === "assistant").at(-1)?.text || "";
  const result = {
    message,
    elapsedMs: Date.now() - at,
    status: view.turn?.status,
    error: view.turn?.error,
    response,
    products: view.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    toolCalls: state.messages
      .slice(state.messages.findLastIndex((m) => m.role === "user"))
      .flatMap((m) => m.tool_calls || [])
      .map((c) => ({ name: c.function.name, arguments: c.function.arguments })),
  };
  console.log(
    JSON.stringify({
      event: "buyer.live.turn",
      elapsedMs: result.elapsedMs,
      status: result.status,
      error: result.error,
      response: result.response,
      toolCalls: result.toolCalls.map((c) => c.name),
    }),
  );
  return { result, view };
}
try {
  const absent = await turn(await shopper(), "get me lv imagination perfume");
  const truth = await hybridSearch({
    query: "Imagination",
    brands: ["Louis Vuitton"],
    in_stock: false,
  });
  const noSubstitution = absent.view.products.every(
    (p) => p.brand === "Louis Vuitton" && /imagination/i.test(p.name),
  );
  results.push({
    ...absent.result,
    capability: "reported named-product substitution",
    passed:
      absent.view.turn?.status === "completed" &&
      absent.result.toolCalls.some((c) =>
        ["lookup_product", "search_catalog"].includes(c.name),
      ) &&
      noSubstitution &&
      (truth.total > 0
        ? absent.view.products.length > 0
        : /not.*(?:found|available|listed|carry)|(?:don.t|do not|doesn.t).*?(?:have|carry)|(?:couldn.t|wasn.t able to) find|no.*(?:match|listing)|not in/i.test(
            absent.result.response,
          )),
  });
  const typo = await turn(
    await shopper(),
    "get me omega peedmater and wat the cost ??",
  );
  results.push({
    ...typo.result,
    capability: "reported typo and price",
    passed:
      typo.view.turn?.status === "completed" &&
      (typo.view.products.length === 1 ||
        /which|variant|options|multiple|choose|did you mean/i.test(
          typo.result.response,
        ) ||
        typo.result.response.includes("?")) &&
      typo.view.products.length > 0 &&
      typo.view.products.every(
        (p) => p.brand === "Omega" && /speedmaster/i.test(p.name),
      ) &&
      typo.view.products.some((p) =>
        typo.result.response.includes(formatMoney(p.price)),
      ),
  });
  const p = (
    await hybridSearch({ categories: ["headphones"], offset: 6, limit: 1 })
  ).products[0];
  if (!p)
    throw new Error("Independent published product unavailable for evaluation");
  const actor = await shopper();
  const named = await turn(
    actor,
    `Do you carry ${p.name}? What is the recorded price?`,
  );
  results.push({
    ...named.result,
    capability: "independent actual product and price",
    passed:
      named.view.turn?.status === "completed" &&
      named.view.products.some((v) => v.id === p.id) &&
      named.result.response.includes(formatMoney(p.price)),
  });
  const saved = await turn(
    actor,
    "Save that same item to my wishlist, without adding it to the cart.",
  );
  results.push({
    ...saved.result,
    capability: "contextual wishlist reference",
    passed:
      saved.view.turn?.status === "completed" &&
      saved.view.basket.wishlist.some((v) => v.productId === p.id) &&
      saved.view.basket.cart.length === 0,
  });
  const unrelated = (
    await hybridSearch({ categories: ["headphones"], offset: 9, limit: 1 })
  ).products[0];
  if (!unrelated || unrelated.id === p.id)
    throw new Error("Independent wishlist sentinel unavailable");
  await manageBasket(actor, {
    collection: "wishlist",
    action: "add",
    items: [{ productId: unrelated.id }],
  });
  const changed = await turn(
    actor,
    "Actually remove it from the wishlist and put one in my cart. No checkout.",
  );
  results.push({
    ...changed.result,
    capability: "compound correction and two actual mutations",
    passed:
      changed.view.turn?.status === "completed" &&
      !changed.view.basket.wishlist.some((v) => v.productId === p.id) &&
      changed.view.basket.wishlist.some((v) => v.productId === unrelated.id) &&
      changed.view.basket.cart.some(
        (v) => v.productId === p.id && v.quantity === 1,
      ) &&
      changed.view.confirmations.length === 0,
  });
  const general = await turn(
    await shopper(),
    "Briefly explain why the sky looks blue. Do not change my shopping session.",
  );
  results.push({
    ...general.result,
    capability: "general conversation without shopping mutation",
    passed:
      general.view.turn?.status === "completed" &&
      general.result.response.length > 40 &&
      /scatter|rayleigh/i.test(general.result.response) &&
      general.view.basket.cart.length === 0 &&
      general.view.basket.wishlist.length === 0 &&
      general.view.confirmations.length === 0,
  });
  const combinedActor = await shopper();
  const combined = await turn(
    combinedActor,
    `Find ${p.name} and save it to my wishlist. Do not checkout.`,
  );
  results.push({
    ...combined.result,
    capability: "combined lookup and wishlist action",
    passed:
      combined.view.turn?.status === "completed" &&
      combined.view.basket.wishlist.some((v) => v.productId === p.id) &&
      combined.view.basket.cart.length === 0 &&
      combined.view.confirmations.length === 0,
  });
} catch (error) {
  results.push({
    passed: false,
    error: error instanceof Error ? error.message : String(error),
  });
} finally {
  await closeDatabase();
}
await mkdir(".data/concierge-verification", { recursive: true });
const report = {
  at: new Date().toISOString(),
  model: process.env.CONCIERGE_MODEL,
  provider: "self_hosted",
  candidate,
  warmupMs,
  scope:
    "Actual local model and isolated real application database. No inference mocks, no payment calls. Five shopper capabilities plus one general-conversation probe; not full production acceptance. warmupMs, when present, is separate startup work; otherwise the first request includes cold prompt preparation. Later requests may reuse the native prefix cache.",
  passed: results.every((r) => r.passed),
  results,
};
await writeFile(
  `.data/concierge-verification/buyer-live-${candidate ? "text-candidate" : "vision-baseline"}.json`,
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
