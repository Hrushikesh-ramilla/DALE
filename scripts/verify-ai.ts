import "dotenv/config";
import {
  shoppingSummary,
  scamAnalysis,
  evidenceAnalysis,
} from "../src/server/ai";
import { catalog } from "../src/domain/catalog";
import { recordLiveChecks } from "./live-check-report";
if (
  process.env.AI_PROVIDER !== "self_hosted" &&
  (process.env.AI_FREE_QUOTA_CONFIRMED !== "true" ||
    process.env.AI_BILLING_DISABLED !== "true")
) {
  throw new Error(
    "Live verification requires confirmed free quota and disabled billing. No provider request sent.",
  );
}
process.env.AI_MODE = "live";
const report = await recordLiveChecks(".data/reports/ai-integration.json", [
  {
    scenario: "Grounded shopping summary",
    check: async () => {
      const shopping = await shoppingSummary(
        "A compact charger for USB-C Laptop (65W) under $40",
        catalog.filter(
          (p) =>
            p.compatibleModels.includes("Atlas 14") &&
            p.price <= 4000 &&
            p.category === "chargers",
        ),
        "Atlas 14",
      );
      return shopping.mode === "live" && shopping.sources.length > 0;
    },
  },
  {
    scenario: "Coercive payment message",
    check: async () => {
      const scam = await scamAnalysis(
        "Send your verification code and pay with gift cards immediately or your account will be suspended.",
      );
      return (
        scam.mode === "live" && scam.level !== "low" && scam.reasons.length > 0
      );
    },
  },
  {
    scenario: "Vision input with insufficient evidence",
    check: async () => {
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
      return evidence.mode === "live" && evidence.outcome === "insufficient";
    },
  },
]);
for (const result of report.results)
  console.log(
    `${result.status.toUpperCase()}: ${result.scenario}${result.error ? " — " + result.error : ""}`,
  );
if (!report.complete) process.exitCode = 1;
