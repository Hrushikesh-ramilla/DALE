import { beforeAll, expect, it } from "vitest";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import {
  capture,
  checkout,
  makeQuote,
  openReturn,
  addEvidence,
  addDispatchEvidence,
  evidenceBytes,
} from "../src/server/service";
import { issueCaptureSession } from "../src/server/provenance";
import { caseReport } from "../src/server/case-report";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase } from "../src/server/database";
const file = {
  mime: "image/png",
  bytes: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  ),
};
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  await getDatabase();
  process.env.LOCAL_DATA_DIR = `.data/provenance-tests-${randomUUID()}`;
});
async function fixture() {
  const workspace = await createWorkspace({ fixture: true });
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "owner",
    role: "buyer",
  };
  const seller: Actor = { ...buyer, role: "seller", userId: "seller" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  return { buyer, seller, order, item };
}
const note = {
  checkpoint: "buyer_receipt" as const,
  serial: "ITEM-100",
  note: "Synthetic condition image.",
};
it("atomically consumes a capture code once and keeps uploads optional", async () => {
  const { buyer, item } = await fixture();
  const session = await issueCaptureSession(
    buyer,
    { caseId: item.id },
    note.checkpoint,
  );
  const input = { ...note, captureSessionId: session.id };
  const attempts = await Promise.allSettled([
    addEvidence(buyer, item.id, input, file),
    addEvidence(buyer, item.id, input, file),
  ]);
  expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const entry = (await getWorkspace(buyer.workspaceId)).cases[0].evidence[0];
  expect(entry.provenance?.source).toBe("challenge_associated_upload");
  expect(entry.provenance?.challenge?.code).toBe(session.code);
  expect((await evidenceBytes(buyer, entry.id)).bytes).toEqual(file.bytes);
  expect((await addEvidence(buyer, item.id, note)).provenance?.source).toBe(
    "submitted_note",
  );
});
it("rejects expired, wrong checkpoint, wrong actor, wrong resource, and non-image challenges", async () => {
  const { buyer, item, order } = await fixture();
  const session = await issueCaptureSession(
    buyer,
    { caseId: item.id },
    "buyer_receipt",
  );
  const input = { ...note, captureSessionId: session.id };
  await expect(
    addEvidence(buyer, item.id, { ...input, checkpoint: "buyer_return" }, file),
  ).rejects.toThrow("capture code");
  await expect(addEvidence(buyer, item.id, input)).rejects.toThrow(
    "capture code",
  );
  await expect(
    issueCaptureSession(
      { ...buyer, userId: "other" },
      { caseId: item.id },
      "buyer_receipt",
    ),
  ).rejects.toThrow("not found");
  await expect(
    issueCaptureSession(
      { ...buyer, role: "reviewer" },
      { caseId: item.id },
      "buyer_receipt",
    ),
  ).rejects.toThrow("your side");
  const seller = { ...buyer, userId: "seller", role: "seller" as const };
  await expect(
    addEvidence(
      seller,
      item.id,
      { ...input, checkpoint: "seller_return" },
      file,
    ),
  ).rejects.toThrow("capture code");
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const pending = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, pending.id);
  const other = await openReturn(buyer, pending.id, "damaged", "refund");
  await expect(addEvidence(buyer, other.id, input, file)).rejects.toThrow(
    "capture code",
  );
  await expect(
    issueCaptureSession(
      buyer,
      { caseId: item.id, orderId: order.id },
      "buyer_receipt",
    ),
  ).rejects.toThrow("Exactly one");
  await mutateWorkspace(buyer.workspaceId, (s) => {
    s.captureSessions![0].expiresAt = new Date(Date.now() - 1).toISOString();
  });
  await expect(addEvidence(buyer, item.id, input, file)).rejects.toThrow(
    "capture code",
  );
});
it("records dispatch provenance before shipping and treats repeated bytes as a review cue", async () => {
  const { buyer, seller, item, order } = await fixture();
  const session = await issueCaptureSession(
    seller,
    { orderId: order.id },
    "seller_dispatch",
  );
  const dispatch = await addDispatchEvidence(
    seller,
    order.id,
    { serial: "100", note: "Synthetic dispatch", captureSessionId: session.id },
    file,
  );
  expect(dispatch.provenance?.source).toBe("challenge_associated_upload");
  const first = await addEvidence(buyer, item.id, note, file);
  const repeated = await addEvidence(
    buyer,
    item.id,
    { ...note, checkpoint: "buyer_return" },
    file,
  );
  expect(repeated.provenance?.repeatedEvidenceIds).toEqual([first.id]);
  expect((await getWorkspace(buyer.workspaceId)).cases[0].status).toBe("open");
});
it("exports only an owned case, verifies original integrity, and separates synthetic money from claims", async () => {
  const { buyer, item } = await fixture();
  const entry = await addEvidence(buyer, item.id, note, file);
  const report = await caseReport(buyer, item.id);
  expect(report.transactionRecords.adapter).toBe("fixture");
  expect(report.submittedRecords[0].integrity).toBe("verified_at_export");
  expect(JSON.stringify(report)).not.toContain(entry.assetKey);
  await expect(
    caseReport({ ...buyer, userId: "other" }, item.id),
  ).rejects.toThrow("not found");
  await writeFile(
    path.resolve(process.env.LOCAL_DATA_DIR!, "assets", entry.assetKey!),
    Buffer.from("changed bytes"),
  );
  expect((await caseReport(buyer, item.id)).submittedRecords[0].integrity).toBe(
    "unavailable_or_mismatched",
  );
  await expect(evidenceBytes(buyer, entry.id)).rejects.toThrow("integrity");
});
it("bounds unused capture codes without consuming or charging anything", async () => {
  const { buyer, item } = await fixture();
  for (let i = 0; i < 5; i++)
    await issueCaptureSession(buyer, { caseId: item.id }, "buyer_receipt");
  await expect(
    issueCaptureSession(buyer, { caseId: item.id }, "buyer_receipt"),
  ).rejects.toThrow("Five");
  expect(
    (await getWorkspace(buyer.workspaceId)).operations.filter(
      (o) => o.kind === "refund",
    ),
  ).toHaveLength(0);
});
