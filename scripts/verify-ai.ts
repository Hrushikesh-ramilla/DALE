import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import {
  shoppingSummary,
  scamAnalysis,
  evidenceAnalysis,
} from "../src/server/ai";
import { catalog } from "../src/domain/catalog";
process.env.AI_MODE = "live";
const results: { scenario: string; passed: boolean }[] = [];
const shopping = await shoppingSummary(
  "A compact charger for my Atlas 14 under $40",
  catalog.filter(
    (p) =>
      p.compatibleModels.includes("Atlas 14") &&
      p.price <= 4000 &&
      p.category === "chargers",
  ),
  "Atlas 14",
);
results.push({
  scenario: "Grounded shopping summary",
  passed: shopping.mode === "live" && shopping.sources.length > 0,
});
const scam = await scamAnalysis(
  "Send your verification code and pay with gift cards immediately or your account will be suspended.",
);
results.push({
  scenario: "Coercive payment message",
  passed: scam.level !== "low" && scam.reasons.length > 0,
});
const photo = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
const evidence = await evidenceAnalysis(
  [
    {
      id: "test-photo",
      checkpoint: "buyer_receipt",
      serial: "",
      note: "This image contains no readable product details. Do not infer a device or damage.",
      hash: "fixture",
      createdAt: new Date().toISOString(),
      assetKey: "fixture-image",
    },
  ],
  [{ mime: "image/png", bytes: photo }],
);
results.push({
  scenario: "Vision input with insufficient evidence",
  passed: evidence.mode === "live" && evidence.outcome === "insufficient",
});
await mkdir(".data/reports", { recursive: true });
await writeFile(
  ".data/reports/ai-integration.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      mode: "live",
      results,
      limitation:
        "Three smoke checks do not establish held-out accuracy or real-world fraud detection.",
    },
    null,
    2,
  ),
);
for (const result of results)
  console.log(`${result.passed ? "PASS" : "FAIL"}: ${result.scenario}`);
if (results.some((r) => !r.passed)) process.exitCode = 1;
