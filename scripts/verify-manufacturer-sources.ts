import { mkdir, writeFile } from "node:fs/promises";
import { researchSources } from "../src/domain/research";
import { retrieveSource } from "../src/server/manufacturer-retrieval";
const receipts = await Promise.all(researchSources.map(retrieveSource));
const passed = receipts.every((receipt) => receipt.status === "matched");
await mkdir(".data/reports", { recursive: true });
await writeFile(
  ".data/reports/manufacturer-retrieval.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      passed,
      receipts,
      limitations:
        "Public manufacturer pages and reviewed anchors only; no live stock, fulfillment, AI inference or price guarantee. Structured record changes require review.",
    },
    null,
    2,
  ),
);
console.log(
  `${receipts.filter((receipt) => receipt.status === "matched").length}/${receipts.length} manufacturer sources matched reviewed anchors. No AI call or payment.`,
);
if (!passed) process.exitCode = 1;
