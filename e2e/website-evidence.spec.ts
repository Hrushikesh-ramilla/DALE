import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";

test("keeps file choice human-mediated, then submits the chosen photo through the owned customer form", async ({
  page,
  context,
  browser,
}) => {
  const seed = JSON.parse(
    await readFile(
      resolve(process.env.CHAT_MEMORY_BROWSER_DIR!, "browser-session.json"),
      "utf8",
    ),
  );
  await context.addCookies([
    {
      name: "bg_session",
      value: seed.supportToken,
      url: "http://127.0.0.1:3130",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/support");
  await page.getByRole("button", { name: "Open DALE assistant" }).click();
  await page
    .getByLabel("Message DALE")
    .fill("Browser action: attach photo with note and submit my evidence");
  await page
    .locator("[data-copilot-panel]")
    .getByRole("button", { name: "Send message", exact: true })
    .click();
  const choose = page.getByRole("button", {
    name: "Choose file for DALE task",
    exact: true,
  });
  await expect(choose).toBeVisible();
  let state = await (await page.request.get("/api/session")).json();
  expect(
    state.cases.find((c: { id: string }) => c.id === seed.supportCaseId)
      .evidence,
  ).toHaveLength(0);
  const fileChooser = page.waitForEvent("filechooser");
  await choose.click();
  const picker = await fileChooser;
  const buffer = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 224, g: 224, b: 224 },
    },
  })
    .png()
    .toBuffer();
  await picker.setFiles({
    name: "customer-proof.png",
    mimeType: "image/png",
    buffer,
  });
  await expect(page.locator(".dale-messages-feed")).toContainText(
    "Browser evidence submitted through the customer's form.",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  state = await (await page.request.get("/api/session")).json();
  const evidence = state.cases.find(
    (c: { id: string }) => c.id === seed.supportCaseId,
  ).evidence;
  expect(evidence).toHaveLength(1);
  expect(evidence[0].checkpoint).toBe("buyer_receipt");
  expect(evidence[0].note).toBe("The outer packaging was crushed on receipt.");
  expect(evidence[0].provenance.source).toBe("uploaded_file");
  const media = await page.request.get(`/api/evidence?id=${evidence[0].id}`);
  expect(media.ok()).toBe(true);
  expect(media.headers()["content-type"]).toContain("image/");
  expect(
    createHash("sha256")
      .update(await media.body())
      .digest("hex"),
  ).toBe(evidence[0].hash);
  const outsider = await browser.newContext();
  expect(
    (
      await outsider.request.get(
        `http://127.0.0.1:3130/api/evidence?id=${evidence[0].id}`,
      )
    ).ok(),
  ).toBe(false);
  await outsider.request.post("http://127.0.0.1:3130/api/copilot/state", {
    headers: { Origin: "http://127.0.0.1:3130" },
    data: { action: "start" },
  });
  expect(
    (
      await outsider.request.get(
        `http://127.0.0.1:3130/api/evidence?id=${evidence[0].id}`,
      )
    ).ok(),
  ).toBe(false);
  await outsider.close();
});
