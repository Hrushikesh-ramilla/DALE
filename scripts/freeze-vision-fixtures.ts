import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const directory = "fixtures/evaluation/vision-v1";
try {
  await readFile(`${directory}/manifest.json`);
  throw new Error("Vision v1 is frozen; use a new version.");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
const labels = JSON.parse(
  await readFile("fixtures/evaluation/v1/shopping.json", "utf8"),
).filter((item: { kind: string }) => item.kind === "canonical_label") as {
  id: string;
  input: { text: string };
  expected: string | null;
}[];
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 620, height: 240 },
  deviceScaleFactor: 1,
});
const fixtures = [];
for (const [index, item] of labels.entries()) {
  const escape = (text: string) =>
    text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const unreadable = !item.input.text || item.input.text === "unreadable";
  await page.setContent(
    `<html><body style="margin:0;background:#eef2f5;font:24px Arial;padding:40px;color:#1d2939"><div style="font-size:14px;letter-spacing:2px">SYNTHETIC DEVICE LABEL / RELEASE FIXTURE</div><p style="filter:${unreadable ? "blur(14px)" : "none"}">${escape(unreadable ? "UNKNOWN MODEL TEXT" : item.input.text)}</p><small style="font-size:12px">Owned staged label graphic; not an actual device photograph.</small></body></html>`,
  );
  const file = `label-${index + 1}.png`;
  const bytes = await page.screenshot();
  await writeFile(`${directory}/${file}`, bytes);
  fixtures.push({
    caseId: item.id,
    file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    readable: !unreadable,
    expectedCanonicalModel: item.expected,
  });
}
await browser.close();
await writeFile(
  `${directory}/manifest.json`,
  JSON.stringify(
    {
      version: "vision-labels-v1",
      frozenAt: new Date().toISOString(),
      provenance:
        "20 owned HTML-rendered release label graphics derived from frozen protocol labels, separate from six development images. Not real device photographs, independently human-labeled images, or physical claim ground truth. Created before any model evaluation; no model was called.",
      fixtures,
    },
    null,
    2,
  ) + "\n",
);
console.log("Frozen 20 owned release label images; no AI request or spend.");
