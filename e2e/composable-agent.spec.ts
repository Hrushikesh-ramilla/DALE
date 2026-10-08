import { expect, test } from "@playwright/test";
test("confirmed voice uses composed research and memory without substituting unknown real devices", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill(
      "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping. Show my orders.",
    );
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  const session = await (await page.request.get("/api/session")).json();
  expect(
    session.agentRuns
      .at(-1)
      .toolCalls.map((call: { tool: string }) => call.tool),
  ).toEqual(["research_products", "discover_groups", "inspect_orders"]);
  expect(session.brief.input.model).toBe("MacBook Air (M1, 2020)");
  expect(session.orders).toHaveLength(0);
  expect(session.groups).toHaveLength(0);
  const unsupported = await page.request.post("/api/voice/intent", {
    headers: { origin: new URL(page.url()).origin },
    data: {
      transcript: "Find a charger for MacBook Pro M1 Max under $100",
      model: session.brief.input.model,
      budget: 10000,
    },
  });
  expect(unsupported.ok()).toBe(true);
  expect((await unsupported.json()).intent.kind).toBe("clarification");
  const unchanged = await (await page.request.get("/api/session")).json();
  expect(unchanged.brief.input.model).toBe("MacBook Air (M1, 2020)");
  expect(unchanged.orders).toHaveLength(0);
});
test("an M1 task composes savings, orders and support, preserves source receipts and never buys from chat", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Your task for DALE")
    .fill(
      "Find a charger for MacBook Air M1 under $60. Include a cable, normal charging. Use grouping. Show my orders. The old item is damaged; I want a refund.",
    );
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(page).toHaveURL(/\/support$/);
  const session = await (await page.request.get("/api/session")).json();
  expect(
    session.agentRuns
      .at(-1)
      .toolCalls.map((call: { tool: string }) => call.tool),
  ).toEqual([
    "research_products",
    "discover_groups",
    "inspect_orders",
    "prepare_support",
  ]);
  expect(session.brief.input.model).toBe("MacBook Air (M1, 2020)");
  expect(session.orders).toHaveLength(0);
  expect(session.cases).toHaveLength(0);
  expect(session.groups).toHaveLength(0);
  await page.goto("/");
  const result = page.getByLabel("DALE task result");
  await expect(result).toContainText("MacBook Air (M1, 2020)");
  await expect(result).toContainText("support draft");
  await result
    .getByText("Manufacturer retrieval receipts", { exact: true })
    .click();
  await expect(
    result.getByRole("link", { name: "airm1 ↗", exact: true }),
  ).toHaveAttribute("href", "https://support.apple.com/en-us/111883");
  await page.reload();
  await expect(result).toContainText("MacBook Air (M1, 2020)");
  const persisted = await (await page.request.get("/api/session")).json();
  expect(persisted.agentRuns.at(-1).sourceReceipts).toHaveLength(4);
  await page
    .getByLabel("Your task for DALE")
    .fill("Show my cases and evidence report");
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(result).toContainText("no submitted case");
});
