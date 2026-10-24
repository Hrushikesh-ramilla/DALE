import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const directory = process.env.CHAT_MEMORY_BROWSER_DIR!;
test("pages the full conversation, keeps loaded history after a reply, restores on refresh, and isolates New chat", async ({
  page,
  context,
  browser,
}) => {
  const seed = JSON.parse(
    await readFile(resolve(directory, "browser-session.json"), "utf8"),
  );
  await context.addCookies([
    {
      name: "bg_session",
      value: seed.token,
      url: "http://127.0.0.1:3130",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/department/electronics");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  const feed = page.locator(".dale-messages-feed");
  await expect(feed.locator("[data-message-id]")).toHaveCount(50);
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click();
  await expect(feed.locator("[data-message-id]")).toHaveCount(100);
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click();
  await expect(feed.locator("[data-message-id]")).toHaveCount(130);
  await expect(feed).toContainText(
    "Original preference: oud and incense; budget INR 15000.",
  );
  await page
    .getByLabel("Message DALE")
    .fill("What was my original preference and budget?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(feed).toContainText("Browser contract reply:");
  await expect(feed.locator("[data-message-id]")).toHaveCount(132);
  const request = JSON.parse(
    await readFile(resolve(directory, "last-model-input.json"), "utf8"),
  );
  expect(request.messages).toHaveLength(132); // system + 130 originals + question
  expect(request.messages[1].content).toContain("oud and incense");
  expect(
    request.tools.map((t: { function: { name: string } }) => t.function.name),
  ).toEqual(
    expect.arrayContaining([
      "search_catalog",
      "get_catalog_products",
      "get_catalog_info",
      "use_website",
      "get_website_context",
      "manage_collection",
    ]),
  );
  await page.reload();
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await expect(feed.locator("[data-message-id]")).toHaveCount(50);
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.conversation.id).toBe(seed.conversationId);
  expect(state.conversation.total).toBe(132);
  const outsider = await browser.newContext();
  const denied = await outsider.request.get(
    `/api/copilot/history?conversation_id=${seed.conversationId}`,
  );
  expect(denied.ok()).toBe(false);
  await outsider.close();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(feed.locator("[data-message-id]")).toHaveCount(0);
  const fresh = await (await page.request.get("/api/copilot/state")).json();
  expect(fresh.conversation.id).not.toBe(seed.conversationId);
  expect(fresh.conversation.total).toBe(0);
  await page.getByLabel("Message DALE").fill("Hello in a new conversation");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(feed).toContainText("Browser contract reply:");
  const newRequest = JSON.parse(
    await readFile(resolve(directory, "last-model-input.json"), "utf8"),
  );
  expect(newRequest.messages).toHaveLength(2);
  expect(JSON.stringify(newRequest.messages)).not.toContain("oud and incense");
});

test("passes a catalog observation through the complete browser chat journey", async ({
  page,
  context,
}) => {
  const seed = JSON.parse(
    await readFile(resolve(directory, "browser-session.json"), "utf8"),
  );
  await context.addCookies([
    {
      name: "bg_session",
      value: seed.token,
      url: "http://127.0.0.1:3130",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/department/electronics");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page
    .getByLabel("Message DALE")
    .fill("Browser catalog lookup for oud and incense");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser RAG reply: Browser-only Oud and Incense Perfume, price 3750 cents.",
  );
  const input = JSON.parse(
    await readFile(resolve(directory, "last-model-input.json"), "utf8"),
  );
  const observation = JSON.parse(input.messages.at(-1).content);
  expect(observation.data.products[0].id).toBe("browser-rag-fragrance");
  expect(observation.data.products[0].price_cents).toBe(3750);
  const state = await (await page.request.get("/api/copilot/state")).json();
  expect(state.turn.status).toBe("completed");
  expect(state.actions).toEqual([]);
  expect(state.basket.cart).toEqual([]);
});
