import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { chromium, request } from "@playwright/test";
async function main() {
  const config = parse(await readFile(".data/deploy/production.env"));
  const baseURL = config.APP_URL;
  const health = await (await fetch(`${baseURL}/api/health`)).json();
  const checks: { scenario: string; passed: boolean }[] = [];
  const context = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
    timeout: 30000,
  });
  const session = await context.post("/api/session", {
    data: { role: "buyer", accessCode: config.DEMO_ACCESS_CODE },
  });
  if (!session.ok()) throw new Error("Hosted shopper authorization failed.");
  const input = {
    message: "An Orbit 13 charger under $20",
    model: "Atlas 14",
    budget: 4000,
    category: "chargers",
    preference: "",
    priority: "price",
  };
  const asked = await (
    await context.post("/api/shopping", { data: input })
  ).json();
  checks.push({
    scenario: "Conflicting constraints require clarification",
    passed: asked.questions?.length === 2 && asked.products.length === 0,
  });
  const denied = await context.post("/api/actions", {
    data: { action: "quote", productId: "P001", model: "Atlas 14" },
  });
  checks.push({
    scenario: "Unconfirmed brief cannot produce purchase approval",
    passed: denied.status() === 400,
  });
  const confirmed = await (
    await context.post("/api/shopping", {
      data: { ...input, confirmConstraints: true },
    })
  ).json();
  checks.push({
    scenario: "Confirmed comparison uses eligible catalog facts",
    passed:
      confirmed.products.length > 0 &&
      confirmed.comparisons.every(
        (p: { price: number; compatible: boolean; source: string }) =>
          p.price <= 4000 && p.compatible && p.source.startsWith("catalog:"),
      ) &&
      confirmed.analysis.mode === "fixture",
  });
  for (const [index, expected] of [
    [4, "Slate 11"],
    [5, null],
    [6, null],
  ] as const) {
    const response = await context.post("/api/identify", {
      multipart: {
        selectedModel: "Atlas 14",
        image: {
          name: `label-${index}.png`,
          mimeType: "image/png",
          buffer: await readFile(`fixtures/device-labels/label-${index}.png`),
        },
      },
    });
    const result = await response.json();
    checks.push({
      scenario: `Label fixture ${index} remains a confirmation-only suggestion`,
      passed:
        response.ok() &&
        result.proposedModel === expected &&
        result.needsConfirmation === true &&
        result.mode === "fixture",
    });
  }
  const state = await (await context.get("/api/session")).json();
  checks.push({
    scenario: "Extraction preserves brief and private conversation",
    passed:
      state.brief.input.model === "Atlas 14" && state.conversation.length === 4,
  });
  const stranger = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  await stranger.post("/api/session", {
    data: {
      role: "buyer",
      accessCode: config.DEMO_ACCESS_CODE,
      invite: state.invite,
    },
  });
  checks.push({
    scenario: "Invited second shopper cannot read the conversation",
    passed:
      (await (await stranger.get("/api/session")).json()).conversation
        .length === 0,
  });
  const api = await (await context.get("/api/openapi")).json();
  checks.push({
    scenario: "Hosted generated contracts cover identify and confirmation",
    passed:
      !!api.paths["/api/identify"] &&
      !!api.components.schemas.ShoppingBrief.properties.confirmConstraints &&
      api.components.schemas.Action.oneOf.length > 10,
  });
  const browser = await chromium.launch();
  const profile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: await context.storageState(),
  });
  const page = await profile.newPage();
  await page.goto(baseURL);
  await page.getByText("Compare catalog facts", { exact: true }).click();
  checks.push({
    scenario:
      "Mobile comparison and restored conversation render without overflow",
    passed:
      (await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      )) && (await page.locator(".catalog-comparison table").isVisible()),
  });
  await mkdir(".data/reports", { recursive: true });
  await page.screenshot({
    path: ".data/reports/hosted-shopping-mobile.png",
    fullPage: true,
  });
  await browser.close();
  await context.dispose();
  await stranger.dispose();
  await writeFile(
    ".data/reports/hosted-shopping.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        build: health.build,
        modes: { ai: "fixture", payment: "no payment requested" },
        checks,
      },
      null,
      2,
    ),
  );
  console.log(
    `${checks.filter((check) => check.passed).length}/${checks.length} hosted shopping/identification checks passed.`,
  );
  if (checks.some((check) => !check.passed)) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Hosted shopping verification failed; credentials and response bodies withheld.",
  );
  process.exitCode = 1;
});
