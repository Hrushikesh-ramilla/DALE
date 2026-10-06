import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { models } from "../src/domain/catalog";
await mkdir("fixtures/device-labels", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 640, height: 240 },
  deviceScaleFactor: 1,
});
const fixtures = [];
for (const [index, model] of [
  ...models,
  "Unreadable",
  "Atlas 14 / Orbit 13",
].entries()) {
  const expectedModels =
    index < 4 ? [model] : index === 4 ? [] : ["Atlas 14", "Orbit 13"];
  const file = `label-${index + 1}.png`;
  await page.setContent(
    `<html><body style="margin:0;padding:28px;background:#ecefed;font-family:Arial;color:#16392a"><div style="border:2px solid #476453;border-radius:12px;padding:24px;background:white"><small>SYNTHETIC DEVICE LABEL · TEST FIXTURE</small><h1 style="font-size:32px;${index === 4 ? "filter:blur(14px)" : ""}">Model: ${index === 4 ? "????????" : model}</h1><span>Not an actual commercial device or physical capture</span></div></body></html>`,
  );
  await page.screenshot({ path: `fixtures/device-labels/${file}` });
  const hash = createHash("sha256")
    .update(await readFile(`fixtures/device-labels/${file}`))
    .digest("hex");
  fixtures.push({
    id: `device-label-${index + 1}`,
    file,
    sha256: hash,
    readable: index !== 4,
    expectedModels,
  });
}
await browser.close();
await writeFile(
  "fixtures/device-labels/manifest.json",
  JSON.stringify(
    {
      version: "device-labels-v1",
      provenance:
        "Owned synthetic HTML-rendered labels. Fixture lookup tests adapter/workflow contracts; it does not measure live OCR accuracy.",
      fixtures,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Generated six synthetic device label fixtures and their hash manifest.",
);
