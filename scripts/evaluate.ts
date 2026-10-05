import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { catalog, models, searchCatalog } from "../src/domain/catalog";
import { analyzeClaims, type Evidence } from "../src/domain/claims";
import { scanMessage } from "../src/domain/scams";
const checks: { scenario: string; passed: boolean }[] = [];
for (const model of models) for (const budget of [0, 2500, 4000, 8000, 20000]) for (const category of ["chargers", "docks", "storage", "audio", "accessories"]) {
  const results = searchCatalog({ model, budget, category });
  checks.push({ scenario: `${model}/${category}/${budget}`, passed: results.every((p) => p.price <= budget && p.compatibleModels.includes(model) && p.category === category) && results.length === catalog.filter((p) => p.price <= budget && p.compatibleModels.includes(model) && p.category === category).length });
}
const messages = [
  { text: "Pay with gift cards immediately or your account will be suspended", suspicious: true },
  { text: "Please send your verification code", suspicious: true },
  { text: "Your package arrives tomorrow. Track it in your account.", suspicious: false },
  { text: "The item has a thirty-day return window.", suspicious: false },
];
for (const message of messages) checks.push({ scenario: `Message: ${message.text}`, passed: (scanMessage(message.text).level !== "low") === message.suspicious });
for (const serial of ["", "ABC", "DIFFERENT"]) {
  const records: Evidence[] = [{ id: "dispatch", checkpoint: "seller_dispatch", serial: "ABC", note: "Recorded dispatch", hash: "fixture", createdAt: new Date().toISOString() }, { id: "receipt", checkpoint: "buyer_receipt", serial, note: "Recorded receipt", hash: "fixture", createdAt: new Date().toISOString() }];
  const result = analyzeClaims(records); checks.push({ scenario: `Evidence identifier ${serial || "missing"}`, passed: result.outcome === (serial === "DIFFERENT" ? "contradicted" : "insufficient") && result.nextStep.length > 0 });
}
await mkdir(".data/reports", { recursive: true });
const passed = checks.filter((c) => c.passed).length;
await writeFile(".data/reports/evaluation.json", JSON.stringify({ checkedAt: new Date().toISOString(), mode: "deterministic", passed, total: checks.length, checks, limitation: "Synthetic rule checks only. These results do not measure learned model accuracy or prove physical parcel contents." }, null, 2));
console.log(`${passed}/${checks.length} deterministic evaluation scenarios passed.`);
if (passed !== checks.length) process.exitCode = 1;
