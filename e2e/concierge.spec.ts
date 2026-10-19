import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import type { NativeMessage } from "../src/domain/concierge";
// This provider is a TEST-ONLY transport fixture. All website/database operations
// below execute actual application code; these tests do not measure model quality.
let server: Server;
let responses: NativeMessage[] = [];
const nativeCall = (name: string, args: unknown): NativeMessage => ({
  role: "assistant",
  content: null,
  tool_calls: [
    {
      id: randomUUID(),
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    },
  ],
});
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    for await (const _chunk of req) {
      void _chunk;
    }
    const response = responses.shift();
    if (!response) {
      res.writeHead(500);
      res.end("Test fixture exhausted");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        choices: [
          {
            finish_reason: response.tool_calls ? "tool_calls" : "stop",
            message: response,
          },
        ],
      }),
    );
  });
  await new Promise<void>((resolve) =>
    server.listen(3181, "127.0.0.1", resolve),
  );
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((e) => (e ? reject(e) : resolve())),
  );
});
test("real search, navigation acknowledgment, server cart, reload, comparison and wishlist", async ({
  page,
}) => {
  const source = await page.request.get(
    "/api/copilot/search?filters=%7B%22limit%22%3A2%7D",
  );
  expect(source.ok()).toBeTruthy();
  const { products } = await source.json();
  expect(products.length).toBe(2);
  responses = [
    nativeCall("search_catalog", {
      max_price: products[1].price,
      sort: "price_asc",
      limit: 2,
    }),
    nativeCall("operate_ui", {
      operation: "filter",
      constraints: {
        max_price: products[1].price,
        sort: "price_asc",
        limit: 2,
      },
      clear_existing: true,
    }),
    nativeCall("manage_collection", {
      collection: "cart",
      action: "add",
      items: [{ productId: products[0].id }],
    }),
    {
      role: "assistant",
      content:
        "Browser contract: navigation was acknowledged and the server cart contains the selected item.",
    },
  ];
  await page.goto("/search");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page
    .getByLabel("Message DALE")
    .fill("Independent browser contract request");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?filters=/);
  await expect(
    page.getByText("Browser contract: navigation was acknowledged", {
      exact: false,
    }),
  ).toBeVisible({ timeout: 60000 });
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.basket.cart[0].productId).toBe(products[0].id);
  expect(state.receipts.at(-1).status).toBe("succeeded");
  await page.getByRole("button", { name: "Close assistant" }).click();
  await page.goto("/cart");
  await expect(page.locator("[data-concierge-page='/cart']")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(
    page
      .locator(".concierge-page")
      .getByText(products[0].name, { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".concierge-page")
      .getByText(products[0].name, { exact: true }),
  ).toBeVisible();
  await page.goto(
    `/compare?ids=${encodeURIComponent(products.map((p: { id: string }) => p.id).join(","))}`,
  );
  await expect(page.getByRole("table")).toBeVisible();
  for (const p of products)
    await expect(
      page.getByRole("columnheader", { name: p.name, exact: true }),
    ).toBeVisible();
  await page.request.post("/api/copilot/state", {
    headers: { origin: "http://127.0.0.1:3120" },
    data: {
      collection: "wishlist",
      action: "add",
      items: [{ productId: products[1].id }],
    },
  });
  await page.goto("/wishlist");
  await expect(
    page
      .locator(".concierge-page")
      .getByText(products[1].name, { exact: true }),
  ).toBeVisible();
});
test("browser failure receipt and no fake conversational fallback on provider outage", async ({
  page,
}) => {
  responses = [
    nativeCall("operate_ui", {
      operation: "navigate",
      destination: "catalog",
      new_tab: true,
    }),
    {
      role: "assistant",
      content: "The popup was blocked. No tab was reported as opened.",
    },
  ];
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await page.goto("/search");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page.getByLabel("Message DALE").fill("Check a browser action failure");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("The popup was blocked. No tab was reported as opened.", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 60000 });
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.receipts.at(-1).status).toBe("failed");
  responses = [];
  await page
    .getByLabel("Message DALE")
    .fill("A new independent query while the provider is unavailable");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page
      .getByRole("complementary", { name: "DALE assistant" })
      .getByRole("alert")
      .filter({ hasText: "inference returned HTTP" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(
    page.getByText(
      "I am DALE, your personal luxury concierge. How may I assist you with our catalog today?",
      { exact: true },
    ),
  ).toHaveCount(0);
});
test("a delayed previous shopper response cannot overwrite the new session", async ({
  page,
}) => {
  await page.goto("/search");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  responses = [
    { role: "assistant", content: "PRIVATE PREVIOUS SHOPPER CONTENT" },
  ];
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let arrived!: () => void;
  const captured = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route("**/api/copilot/chat", async (route) => {
    const response = await route.fetch();
    arrived();
    await delayed;
    try {
      await route.fulfill({ response });
    } catch {
      /* Aborted old request is the expected outcome. */
    }
  });
  await page.getByLabel("Message DALE").fill("Old shopper request");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await captured;
  const headers = { origin: "http://127.0.0.1:3120" };
  await page.request.delete("/api/session", { headers });
  await page.request.post("/api/copilot/state", {
    headers,
    data: { action: "start" },
  });
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("dale:session-changed")),
  );
  release();
  await expect(
    page.getByText("PRIVATE PREVIOUS SHOPPER CONTENT", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      "Describe what you need, ask a question, or tell DALE what to do on this site.",
      { exact: false },
    ),
  ).toBeVisible();
});

test("reload recovers a persisted browser action and continues the same turn", async ({
  page,
}) => {
  const headers = { origin: "http://127.0.0.1:3120" };
  await page.request.post("/api/copilot/state", {
    headers,
    data: { action: "start" },
  });
  responses = [
    nativeCall("operate_ui", {
      operation: "filter",
      constraints: { max_price: 123456, sort: "price_desc" },
      clear_existing: true,
    }),
    {
      role: "assistant",
      content: "Recovery contract: the saved browser action was acknowledged.",
    },
  ];
  const id = randomUUID();
  const suspended = await page.request.post("/api/copilot/chat", {
    headers,
    data: {
      turn_id: id,
      message: "Persist a browser action across an interruption",
      client_context: {
        current_url: "/shop",
        current_page_type: "shop",
        revision: 0,
      },
    },
  });
  expect(suspended.ok()).toBeTruthy();
  expect((await suspended.json()).turn.status).toBe("awaiting_ui");
  await page.goto("/search");
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page
    .getByRole("button", { name: "Resume browser action", exact: true })
    .click();
  await expect(page).toHaveURL(/\/search\?filters=/);
  await expect(
    page.getByText(
      "Recovery contract: the saved browser action was acknowledged.",
      { exact: true },
    ),
  ).toBeVisible();
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.turn.id).toBe(id);
  expect(state.turn.status).toBe("completed");
  expect(state.receipts.at(-1).status).toBe("succeeded");
});

test("state streaming requires a session and limits each owner to one stream", async ({
  page,
}) => {
  expect((await page.request.get("/api/copilot/events")).status()).toBe(401);
  await page.request.post("/api/copilot/state", {
    headers: { origin: "http://127.0.0.1:3120" },
    data: { action: "start" },
  });
  await page.goto("/search");
  const receipt = await page.evaluate(async () => {
    const response = await fetch("/api/copilot/events");
    const reader = response.body!.getReader();
    let text = "";
    try {
      while (!text.includes("event: state")) {
        const chunk = await reader.read();
        if (chunk.done) throw new Error("Stream ended before a state event");
        text += new TextDecoder().decode(chunk.value);
      }
      const duplicate = await fetch("/api/copilot/events");
      const logout = await fetch("/api/session", { method: "DELETE" });
      if (!logout.ok) throw new Error("Logout failed");
      let timer;
      const revoked = await Promise.race([
        (async () => {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) return true;
          }
        })(),
        new Promise<boolean>((resolve) => {
          timer = setTimeout(() => resolve(false), 7000);
        }),
      ]);
      clearTimeout(timer);
      return {
        status: response.status,
        type: response.headers.get("content-type"),
        duplicate: duplicate.status,
        hasOwner: text.includes('"owner_id"'),
        revoked,
      };
    } finally {
      await reader.cancel();
    }
  });
  expect(receipt).toEqual({
    status: 200,
    type: "text/event-stream",
    duplicate: 429,
    hasOwner: true,
    revoked: true,
  });
});
