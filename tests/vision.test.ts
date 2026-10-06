import { expect, it } from "vitest";
import { selectVisionEvidence } from "../src/server/vision";
import type { Evidence } from "../src/domain/claims";
it("bounds image memory while representing both parties and all available checkpoints", () => {
  const checkpoints = [
    "seller_dispatch",
    "seller_dispatch",
    "seller_dispatch",
    "seller_dispatch",
    "buyer_receipt",
    "buyer_return",
    "seller_return",
  ] as const;
  const records: Evidence[] = checkpoints.map((checkpoint, i) => ({
    id: String(i),
    checkpoint,
    serial: "",
    note: "Test record",
    hash: "hash",
    createdAt: "2026-10-05",
    assetKey: `asset-${i}`,
  }));
  const selected = selectVisionEvidence(records);
  expect(selected).toHaveLength(4);
  expect(new Set(selected.map((entry) => entry.checkpoint)).size).toBe(4);
});
it("keeps text records out of the image sample and fills remaining image slots", () => {
  const records: Evidence[] = Array.from({ length: 6 }, (_, i) => ({
    id: String(i),
    checkpoint: "buyer_receipt",
    serial: "",
    note: "Record",
    hash: "hash",
    createdAt: "2026-10-05",
    assetKey: i ? `asset-${i}` : undefined,
  }));
  expect(selectVisionEvidence(records).map((entry) => entry.id)).toEqual([
    "1",
    "2",
    "3",
    "4",
  ]);
});
