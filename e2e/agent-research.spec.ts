import { expect, test } from "@playwright/test";
test("real product research leads to sourced comparison and explicit protected checkout", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a real device", exact: true })
    .click();
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  const result = page.getByLabel("DALE task result");
  await expect(result).toContainText(
    "Apple 40W Dynamic Power Adapter at $39.00",
  );
  await expect(result).toContainText("Catalog assistance · no model calls");
  await expect(page.getByLabel("Sourced comparison")).toContainText("$9.00");
  const source = result
    .getByRole("link", { name: "Apple · 40W Dynamic Power Adapter ↗" })
    .first();
  await expect(source).toHaveAttribute(
    "href",
    "https://www.apple.com/shop/product/mgkn4am/a/40w-dynamic-power-adapter-with-60w-max",
  );
  const initial = await (await page.request.get("/api/session")).json();
  expect(initial.orders).toHaveLength(0);
  expect(initial.brief.input.model).toBe("MacBook Air (13-inch, M2, 2022)");
  await page.reload();
  await expect(result).toContainText("checked 7 Oct 2026");
  await result
    .getByRole("button", {
      name: "Review agent option Apple 40W Dynamic Power Adapter",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("This does not order from Apple");
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await dialog
    .getByRole("button", { name: "Approve simulated purchase" })
    .click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(
    page.getByRole("heading", { name: "Apple 40W Dynamic Power Adapter" }),
  ).toBeVisible();
  const paid = await (await page.request.get("/api/session")).json();
  expect(paid.orders[0]).toMatchObject({
    status: "paid",
    quote: { productId: "R001", amount: 3900, provider: "fixture" },
  });
});
test("conversation clarifies exact size and complete budget, then protects against a seller scam", async ({
  page,
}) => {
  await page.goto("/");
  const task = page.getByLabel("Your task for DALE");
  const result = page.getByLabel("DALE task result");
  const send = async (text: string) => {
    await task.fill(text);
    await page.getByRole("button", { name: "Send task", exact: true }).click();
    await expect(task).toHaveValue("");
  };
  await send("Find a charger for my MacBook Air M2 under $50");
  await expect(result).toContainText("13-inch (2022) or 15-inch");
  await send("13-inch");
  await expect(result).toContainText("already have a USB-C charging cable");
  await send("I need a cable included");
  await expect(result).toContainText("No complete verified offer");
  await expect(page.getByLabel("Sourced comparison")).toContainText("$8.00");
  await expect(
    result.getByRole("button", { name: /Review agent option/ }),
  ).toHaveCount(0);
  await send("My budget is $60");
  await expect(result).toContainText(
    "Apple 40W Adapter + 60W USB-C Cable at $58.00",
  );
  const selected = await (await page.request.get("/api/session")).json();
  await send(
    "Is this seller message safe? Pay using gift cards immediately and share your verification code.",
  );
  await expect(page.getByLabel("Message safety check")).toContainText("HIGH");
  const after = await (await page.request.get("/api/session")).json();
  expect(after.brief).toEqual(selected.brief);
  expect(after.orders).toHaveLength(0);
  expect(
    await page
      .locator(".feedback")
      .evaluateAll((els) =>
        els.some((el) => getComputedStyle(el).position === "fixed"),
      ),
  ).toBe(false);
});
test("voice preparation uses the same real-device evidence and safe offer checks", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a real device", exact: true })
    .click();
  await page.getByRole("button", { name: "Send task", exact: true }).click();
  await expect(page.getByLabel("DALE task result")).toContainText(
    "Ready for your review",
  );
  const response = await page.request.post("/api/voice/intent", {
    headers: { Origin: process.env.E2E_BASE_URL || "http://127.0.0.1:3100" },
    data: {
      transcript: "I want fast charging instead",
      model: "MacBook Air (13-inch, M2, 2022)",
      budget: 5000,
    },
  });
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.run.productIds).toHaveLength(0);
  expect(data.run.research.need.fastCharging).toBe(true);
  expect(data.snapshot.orders).toHaveLength(0);
  await page.reload();
  await expect(page.getByLabel("DALE task result")).toContainText(
    "No complete verified offer",
  );
});
