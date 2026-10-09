import "dotenv/config";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { evidenceAnalysis } from "../src/server/ai";
import type { Evidence } from "../src/domain/claims";
import { recordLiveChecks } from "./live-check-report";
assert.ok(
  process.argv.includes("--prepared"),
  "Explicit private candidate required; no cloud verification.",
);
const candidate = JSON.parse(
  await readFile(".data/self-hosted/candidate.json", "utf8"),
);
process.env.AI_PROVIDER = "self_hosted";
process.env.AI_MODEL = candidate.alias;
process.env.AI_SELF_HOSTED_PROFILE = candidate.profile;
process.env.AI_SELF_HOSTED_BASE_URL = "http://127.0.0.1:8081/v1";
process.env.AI_SELF_HOSTED_API_KEY = (
  await readFile(".data/self-hosted/api-key", "utf8")
).trim();
const images = await Promise.all(
  ["label-1.png", "label-12.png"].map(async (file, index) => ({
    evidenceId: `owned-photo-${index}`,
    mime: "image/png",
    bytes: await readFile(`fixtures/evaluation/vision-v1/${file}`),
  })),
);
const records: Evidence[] = images.map((image, index) => ({
  id: image.evidenceId,
  checkpoint: index ? "seller_return" : "buyer_receipt",
  serial: "OWNED-TEST-SERIAL",
  note: "Owned staged label image; no physical product claim.",
  hash: createHash("sha256").update(image.bytes).digest("hex"),
  createdAt: "2026-10-09T00:00:00Z",
  assetKey: `owned/${image.evidenceId}`,
  mime: "image/png",
}));
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (url, init) => {
  assert.equal(new URL(String(url)).hostname, "127.0.0.1");
  const body = JSON.parse(String(init?.body));
  assert.equal(
    body.messages[1].content.filter(
      (part: { type: string }) => part.type === "image_url",
    ).length,
    1,
  );
  const input = JSON.parse(body.messages[1].content[0].text);
  assert.equal(input.imageEvidenceIds.length, 1);
  assert.equal(Object.keys(input).length, 1);
  calls++;
  return originalFetch(url, init);
};
try {
  const report = await recordLiveChecks(
    ".data/reports/local-evidence.json",
    [
      {
        scenario:
          "Recorded-only claim makes no model call or physical assertion",
        check: async () => {
          const result = await evidenceAnalysis(records, [], "live");
          return (
            calls === 0 &&
            result.mode === "rules" &&
            result.outcome === "insufficient"
          );
        },
      },
      {
        scenario:
          "Two actual local image reviews stay independently sourced and non-authoritative",
        check: async () => {
          const result = await evidenceAnalysis(records, images, "live");
          const appearances =
            result.propositions?.filter(
              (claim) => claim.category === "media_appearance",
            ) || [];
          return (
            calls === 2 &&
            result.mode === "live" &&
            result.outcome === "insufficient" &&
            appearances.every(
              (claim) =>
                claim.outcome === "insufficient" &&
                claim.sourceIds.every((source) =>
                  records.some((record) => record.id === source),
                ),
            ) &&
            result.sources.every((source) =>
              records.some((record) => record.id === source),
            )
          );
        },
      },
      {
        scenario: "Model annotation preserves every original image hash",
        check: async () =>
          images.every(
            (image, index) =>
              createHash("sha256").update(image.bytes).digest("hex") ===
              records[index].hash,
          ),
      },
    ],
    {
      provider: "self_hosted",
      model: candidate.alias,
      purpose:
        "Actual adapter/image safety integration on owned synthetic regression images; not physical appearance accuracy or independent human agreement",
    },
  );
  console.log(
    `Local evidence integration: ${report.complete ? "passed" : "failed"}.`,
  );
  if (!report.complete) process.exitCode = 1;
} finally {
  globalThis.fetch = originalFetch;
}
