// Test-only provider and seed, never imported by application routes.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { customerSession } from "../src/server/customers";
import { changeConcierge, readConcierge } from "../src/server/concierge/store";
import { closeDatabase, getDatabase } from "../src/server/database";
const directory = resolve(process.env.LOCAL_DATA_DIR || "");
if (
  process.env.AI_MODE !== "fixture" ||
  !directory.startsWith(resolve(".data") + sep) ||
  !directory.split(sep).at(-1)?.startsWith("chat-memory-browser-")
)
  throw new Error("Isolated fixture directory required.");
const session = await customerSession({ action: "guest" });
const fragrance = {
  id: "browser-rag-fragrance",
  name: "Browser-only Oud and Incense Perfume",
  brand: "Browser contract",
  category: "fragrance",
  description: "Oud and incense",
  specs: ["Oud", "Incense"],
  attributes: { notes: "oud incense" },
  stock: 3,
  price: 3750,
  source: "test-only",
  compatibleModels: [],
  sponsored: false,
  color: "black",
};
await (
  await getDatabase()
).query(
  "INSERT INTO catalog_products(id,category,price,record,publication,brand,leaf_type) VALUES($1,'fragrance',3750,$2::jsonb,'published','Browser contract','fragrance') ON CONFLICT(id) DO NOTHING",
  [fragrance.id, JSON.stringify(fragrance)],
);
const second = {
  ...fragrance,
  id: "browser-rag-fragrance-two",
  name: "Second Browser-only Perfume",
  price: 4900,
};
await (
  await getDatabase()
).query(
  "INSERT INTO catalog_products(id,category,price,record,publication,brand,leaf_type) VALUES($1,'fragrance',4900,$2::jsonb,'published','Browser contract','fragrance') ON CONFLICT(id) DO NOTHING",
  [second.id, JSON.stringify(second)],
);
await changeConcierge(session.actor, (s) => {
  for (let i = 0; i < 130; i++)
    s.transcript.push({
      id: randomUUID(),
      sender: i % 2 ? "assistant" : "user",
      text:
        i === 0
          ? "Original preference: oud and incense; budget INR 15000."
          : `Earlier exchange ${i}`,
      timestamp: Date.now() + i,
    });
});
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, "browser-session.json"),
  JSON.stringify({
    token: session.token,
    conversationId: (await readConcierge(session.actor)).conversationId,
  }),
  { mode: 0o600 },
);
await closeDatabase(); // The application is the sole database owner after this point.
const provider = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const input = JSON.parse(Buffer.concat(chunks).toString());
  await writeFile(
    resolve(directory, "last-model-input.json"),
    JSON.stringify(input),
  );
  const latest = input.messages.at(-1);
  const needsCatalog =
    latest.role === "user" &&
    latest.content === "Browser catalog lookup for oud and incense";
  const observation =
    latest.role === "tool" ? JSON.parse(latest.content) : null;
  let response = needsCatalog
    ? {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "browser-rag-call",
            type: "function",
            function: {
              name: "search_catalog",
              arguments: JSON.stringify({
                query: "oud incense",
                categories: ["fragrance"],
                brands: ["Browser contract"],
              }),
            },
          },
        ],
      }
    : {
        role: "assistant",
        content: observation?.data?.products?.length
          ? `Browser RAG reply: ${observation.data.products[0].name}, price ${observation.data.products[0].price_cents} cents.`
          : "Browser contract reply: your earlier conversation was supplied.",
      };
  // Deterministic provider fixture: tests exercise the production executor,
  // router, browser tabs and real database without consuming cloud quota.
  const userIndex = input.messages.findLastIndex(
    (m: { role: string }) => m.role === "user",
  );
  const command = input.messages[userIndex]?.content;
  const flows: Record<string, { name: string; args: unknown }[]> = {
    "Browser action: open the perfume": [
      {
        name: "use_website",
        args: { type: "navigate", path: "/product/browser-rag-fragrance" },
      },
    ],
    "Browser action: two separate product tabs": [
      {
        name: "use_website",
        args: {
          type: "tabs",
          paths: [
            "/product/browser-rag-fragrance",
            "/product/browser-rag-fragrance-two",
          ],
        },
      },
    ],
    "Browser action: add two and show my cart": [
      {
        name: "manage_collection",
        args: {
          collection: "cart",
          action: "add",
          items: [{ productId: "browser-rag-fragrance", quantity: 2 }],
        },
      },
      { name: "use_website", args: { type: "navigate", path: "/cart" } },
    ],
    "Browser action: go back": [
      { name: "use_website", args: { type: "history", direction: "back" } },
    ],
    "Browser action: go forward": [
      { name: "use_website", args: { type: "history", direction: "forward" } },
    ],
    "Browser action: cheapest perfume results": [
      {
        name: "set_search_filters",
        args: {
          clear_existing: true,
          patch: {
            categories: ["fragrance"],
            brands: ["Browser contract"],
            sort: "price_asc",
          },
        },
      },
    ],
    "Browser action: add and open in one step": [
      {
        name: "manage_collection",
        args: {
          collection: "cart",
          action: "add",
          items: [{ productId: "browser-rag-fragrance", quantity: 2 }],
          show_collection: true,
        },
      },
    ],
  };
  if (typeof command === "string" && flows[command]) {
    const done = input.messages
      .slice(userIndex + 1)
      .filter((m: { role: string }) => m.role === "tool").length;
    const step = flows[command][done];
    response = step
      ? {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: `browser-action-${done}`,
              type: "function",
              function: {
                name: step.name,
                arguments: JSON.stringify(step.args),
              },
            },
          ],
        }
      : {
          role: "assistant",
          content: "Browser action completed from observed results.",
        };
  }
  if (command === "Browser action: open menu and change budget") {
    const observations = input.messages
      .slice(userIndex + 1)
      .filter((m: { role: string }) => m.role === "tool")
      .map((m: { content: string }) => JSON.parse(m.content));
    const done = observations.length;
    const page = observations.at(-1)?.data?.page;
    const label =
      done === 1
        ? "Filter products and adjust shopping brief"
        : "Shopping brief maximum budget USD";
    const control = page?.controls?.find(
      (c: { label: string }) => c.label === label,
    );
    const step =
      done === 0 || done === 2
        ? { name: "get_website_context", args: {} }
        : done === 1 || done === 3
          ? {
              name: "use_website",
              args: {
                type: "control",
                control_id: control?.id || "missing",
                ...(done === 3 ? { value: "250" } : {}),
              },
            }
          : null;
    response = step
      ? {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: `browser-control-${done}`,
              type: "function",
              function: {
                name: step.name,
                arguments: JSON.stringify(step.args),
              },
            },
          ],
        }
      : {
          role: "assistant",
          content: "Browser controls completed from observed results.",
        };
  }
  if (command === "Browser action: open account and fill my name") {
    const observations = input.messages
      .slice(userIndex + 1)
      .filter((m: { role: string }) => m.role === "tool")
      .map((m: { content: string }) => JSON.parse(m.content));
    const done = observations.length;
    const label = done === 2 ? "Open account sign in" : "Name";
    const control = observations
      .at(-1)
      ?.data?.page?.controls?.find((c: { label: string }) => c.label === label);
    const step =
      done === 0
        ? { name: "use_website", args: { type: "navigate", path: "/groups" } }
        : done === 1 || done === 3
          ? { name: "get_website_context", args: {} }
          : done === 2 || done === 4
            ? {
                name: "use_website",
                args: {
                  type: "control",
                  control_id: control?.id || "missing",
                  ...(done === 4 ? { value: "Browser Shopper" } : {}),
                },
              }
            : null;
    response = step
      ? {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: `browser-account-${done}`,
              type: "function",
              function: {
                name: step.name,
                arguments: JSON.stringify(step.args),
              },
            },
          ],
        }
      : {
          role: "assistant",
          content: "Browser account controls completed from observed results.",
        };
  }
  if (
    [
      "Browser action: compare the opened listings",
      "Browser action: close the tabs you opened",
      "Browser action: add from the second opened tab",
      "Browser action: navigate the second tab to the first listing",
    ].includes(command)
  ) {
    const observations = input.messages
      .slice(userIndex + 1)
      .filter((m: { role: string }) => m.role === "tool")
      .map((m: { content: string }) => JSON.parse(m.content));
    const done = observations.length;
    const observed =
      observations[0]?.data?.tabs?.filter(
        (t: { createdByAction?: string }) => t.createdByAction,
      ) || [];
    let steps: { name: string; args: unknown }[] = [];
    if (!done) steps = [{ name: "get_website_context", args: {} }];
    else if (
      done === 1 &&
      command === "Browser action: compare the opened listings"
    )
      steps = [
        {
          name: "use_website",
          args: {
            type: "navigate",
            path: `/compare?ids=${encodeURIComponent(observed.map((t: { context: { currently_viewed_product_id: string } }) => t.context.currently_viewed_product_id).join(","))}`,
          },
        },
      ];
    else if (
      done === 1 &&
      command === "Browser action: close the tabs you opened"
    )
      steps = observed.map((t: { id: string }) => ({
        name: "use_website",
        args: { type: "tab", command: "close", tab_id: t.id },
      }));
    else if (
      done === 1 &&
      command === "Browser action: add from the second opened tab"
    )
      steps = [
        {
          name: "manage_collection",
          args: {
            collection: "cart",
            action: "add",
            items: [
              {
                productId: observed[1]?.context.currently_viewed_product_id,
                quantity: 2,
              },
            ],
          },
        },
      ];
    if (
      done === 1 &&
      command === "Browser action: navigate the second tab to the first listing"
    )
      steps = [
        {
          name: "use_website",
          args: {
            type: "tab",
            command: "navigate",
            tab_id: observed[1]?.id,
            path: `/product/${observed[0]?.context.currently_viewed_product_id}`,
          },
        },
      ];
    response = steps.length
      ? {
          role: "assistant",
          content: null,
          tool_calls: steps.map((step, i) => ({
            id: `browser-tab-step-${done}-${i}`,
            type: "function",
            function: { name: step.name, arguments: JSON.stringify(step.args) },
          })),
        }
      : {
          role: "assistant",
          content: "Browser tab task completed from observed results.",
        };
  }
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      choices: [
        {
          finish_reason: "tool_calls" in response ? "tool_calls" : "stop",
          message: response,
        },
      ],
    }),
  );
});
await new Promise<void>((r) => provider.listen(3182, "127.0.0.1", r));
const app = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: process.env,
});
app.on("exit", (code) => {
  provider.close();
  process.exitCode = code || 0;
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    app.kill(signal);
    provider.close();
  });
