import { beforeAll, afterEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeClaims, type Evidence } from "../src/domain/claims";
import {
  validateEvidenceMedia,
  validateImage,
  MAX_EVIDENCE_VIDEO_BYTES,
} from "../src/server/storage";
import { selectVisionEvidence } from "../src/server/vision";
import { evidenceAnalysis } from "../src/server/ai";
import { createWorkspace, getWorkspace, type Actor } from "../src/server/state";
import { getDatabase } from "../src/server/database";
import {
  makeQuote,
  checkout,
  capture,
  openReturn,
  addEvidence,
  addDispatchEvidence,
  analyzeCase,
  evidenceBytes,
} from "../src/server/service";
import { issueCaptureSession } from "../src/server/provenance";
import { caseReport } from "../src/server/case-report";
import { POST, GET } from "../src/app/api/evidence/route";

const requestActor = vi.hoisted(() => ({ current: null as Actor | null }));
vi.mock("../src/server/auth", () => ({
  actorFromRequest: async () => requestActor.current,
}));
const png = {
  mime: "image/png",
  bytes: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  ),
};
const videos = { mp4: Buffer.alloc(0), webm: Buffer.alloc(0) };
beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  process.env.APP_URL = "http://localhost:3000";
  await getDatabase();
  process.env.LOCAL_DATA_DIR = `.data/evidence-report-tests-${randomUUID()}`;
  videos.mp4 = await readFile("fixtures/evidence-media/synthetic.mp4");
  videos.webm = await readFile("fixtures/evidence-media/synthetic.webm");
});
afterEach(() => vi.unstubAllGlobals());
function record(
  id: string,
  checkpoint: Evidence["checkpoint"],
  serial = "SER-100",
): Evidence {
  return {
    id,
    checkpoint,
    serial,
    note: "Submitted condition account",
    hash: "hash",
    createdAt: "2026-10-08",
  };
}
async function fixture() {
  const workspace = await createWorkspace({ fixture: true });
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "owner",
    role: "buyer",
  };
  const seller: Actor = { ...buyer, userId: "seller", role: "seller" };
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);
  const item = await openReturn(buyer, order.id, "damaged", "refund");
  return { buyer, seller, order, item };
}
it("reports individual identifier propositions without promoting record agreement to physical truth", () => {
  const evidence = [
    record("dispatch", "seller_dispatch"),
    record("receipt", "buyer_receipt"),
    record("returned", "buyer_return", "OTHER"),
    record("seller", "seller_return", "OTHER"),
  ];
  const analysis = analyzeClaims(evidence);
  const claims = analysis.propositions!;
  expect(
    claims
      .filter((claim) => claim.category === "recorded_identifier")
      .map((claim) => claim.outcome),
  ).toEqual(["supported", "contradicted", "supported"]);
  expect(
    claims.find((claim) => claim.category === "physical_causation")?.outcome,
  ).toBe("insufficient");
  expect(
    claims
      .filter((claim) => claim.category === "reported_condition")
      .every((claim) => claim.outcome === "insufficient"),
  ).toBe(true);
  expect(
    claims.every((claim) =>
      claim.sourceIds.every((id) => evidence.some((entry) => entry.id === id)),
    ),
  ).toBe(true);
  expect(
    claims.every((claim) => claim.uncertainty.length && claim.nextAction),
  ).toBe(true);
  expect(analysis.nextStep).toContain("claim remains open");
});
it("retains missing facts and conflicting duplicate-checkpoint submissions", () => {
  const empty = analyzeClaims([]).propositions!;
  expect(
    empty.every(
      (claim) => claim.outcome === "insufficient" && claim.missingFacts.length,
    ),
  ).toBe(true);
  const evidence = [
    record("first", "seller_dispatch"),
    record("changed", "seller_dispatch", "OTHER"),
    record("receipt", "buyer_receipt"),
  ];
  const claim = analyzeClaims(evidence).propositions![0];
  expect(claim.outcome).toBe("contradicted");
  expect(claim.sourceIds).toEqual(["first", "changed", "receipt"]);
});
it("accepts real bounded MP4/WebM containers but rejects mismatched MIME, truncated signatures and oversized videos", () => {
  expect(() => validateEvidenceMedia(videos.mp4, "video/mp4")).not.toThrow();
  expect(() => validateEvidenceMedia(videos.webm, "video/webm")).not.toThrow();
  expect(() => validateEvidenceMedia(videos.mp4, "video/webm")).toThrow(
    "matching file type",
  );
  expect(() => validateEvidenceMedia(videos.webm, "image/png")).toThrow(
    "matching file type",
  );
  expect(() => validateEvidenceMedia(png.bytes, "video/mp4")).toThrow(
    "matching file type",
  );
  expect(() =>
    validateEvidenceMedia(videos.mp4.subarray(0, 12), "video/mp4"),
  ).toThrow();
  expect(() =>
    validateEvidenceMedia(
      Buffer.alloc(MAX_EVIDENCE_VIDEO_BYTES + 1),
      "video/webm",
    ),
  ).toThrow("8 MB");
  expect(() => validateImage(videos.webm, "video/webm")).toThrow();
});
it("never forwards video as image and retains sourced appearance uncertainty", async () => {
  const evidence = [
    {
      ...record("video", "buyer_receipt"),
      assetKey: "video",
      mime: "video/webm",
    },
    {
      ...record("photo", "seller_dispatch"),
      assetKey: "photo",
      mime: "image/png",
    },
  ];
  expect(selectVisionEvidence(evidence).map((entry) => entry.id)).toEqual([
    "photo",
  ]);
  process.env.AI_API_KEY = "mock-only";
  process.env.AI_MODEL = "gemini-mock";
  delete process.env.AI_API_BASE_URL;
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      observations: [
                        { source: "photo", appearance: "visible_damage" },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
  vi.stubGlobal("fetch", fetch);
  const analysis = await evidenceAnalysis(
    evidence,
    [
      { ...png, evidenceId: "photo" },
      { mime: "video/webm", bytes: videos.webm, evidenceId: "video" },
    ],
    "live",
  );
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(
    body.contents[0].parts.filter(
      (part: { inlineData?: unknown }) => part.inlineData,
    ),
  ).toHaveLength(1);
  expect(body.contents[0].parts[1].inlineData.mimeType).toBe("image/png");
  expect(
    analysis.propositions?.find((claim) => claim.id === "appearance:photo"),
  ).toMatchObject({ outcome: "insufficient", sourceIds: ["photo"] });
  expect(
    analysis.propositions
      ?.find((claim) => claim.id === "condition:video")
      ?.uncertainty.join(" "),
  ).toContain("human review");
});
it("records an optional private video with capture provenance, exports sourced claims and preserves financial permissions", async () => {
  const { buyer, seller, item, order } = await fixture();
  await addDispatchEvidence(seller, order.id, {
    serial: "SER-100",
    note: "Seller condition account",
  });
  // The return was opened before dispatch was added, so add a case-local buyer record; export still cannot infer causation.
  const challenge = await issueCaptureSession(
    buyer,
    { caseId: item.id },
    "buyer_receipt",
  );
  requestActor.current = buyer;
  const form = new FormData();
  form.set("caseId", item.id);
  form.set("checkpoint", "buyer_receipt");
  form.set("serial", "SER-100");
  form.set("note", "Customer optional video");
  form.set("captureSessionId", challenge.id);
  form.set(
    "video",
    new File([new Uint8Array(videos.webm)], "receipt.webm", {
      type: "video/webm",
    }),
  );
  const uploaded = await POST(
    new Request("http://localhost:3000/api/evidence", {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
      body: form,
    }),
  );
  expect(uploaded.status).toBe(200);
  const entry = (await uploaded.json()).result as Evidence;
  expect(entry.provenance?.challenge?.id).toBe(challenge.id);
  await addEvidence(buyer, item.id, {
    checkpoint: "buyer_return",
    serial: "SER-100",
    note: "Description without mandatory media",
  });
  const analysis = await analyzeCase(buyer, item.id);
  expect(analysis.observations.join(" ")).toContain("does not analyze video");
  const report = await caseReport(buyer, item.id);
  expect(report.schemaVersion).toBe("case-report-v2");
  expect(
    report.submittedRecords.find((record) => record.id === entry.id),
  ).toMatchObject({
    integrity: "verified_at_export",
    media: { kind: "video", review: "human_review_required" },
  });
  expect(
    report.propositions.find((claim) => claim.id === `integrity:${entry.id}`),
  ).toMatchObject({ outcome: "supported", sourceIds: [entry.id] });
  expect(
    report.propositions.every((claim) =>
      claim.sourceIds.every((id) =>
        report.sourceIndex.some((source) => source.id === id),
      ),
    ),
  ).toBe(true);
  expect(JSON.stringify(report)).not.toContain(entry.assetKey);
  expect(report.transactionRecords.adapter).toBe("fixture");
  const original = await GET(
    new Request(`http://localhost:3000/api/evidence?id=${entry.id}`),
  );
  expect(original.headers.get("content-type")).toBe("video/webm");
  expect(original.headers.get("cache-control")).toBe("private, no-store");
  expect(original.headers.get("x-content-type-options")).toBe("nosniff");
  expect(Buffer.from(await original.arrayBuffer())).toEqual(videos.webm);
  requestActor.current = { ...buyer, userId: "other" };
  expect(
    (
      await GET(
        new Request(`http://localhost:3000/api/evidence?id=${entry.id}`),
      )
    ).status,
  ).toBe(404);
  await expect(caseReport(requestActor.current, item.id)).rejects.toThrow(
    "not found",
  );
  expect(
    (await getWorkspace(buyer.workspaceId)).operations.filter(
      (operation) => operation.kind === "refund",
    ),
  ).toHaveLength(0);
  await writeFile(
    path.resolve(process.env.LOCAL_DATA_DIR!, "assets", entry.assetKey!),
    Buffer.from("changed bytes"),
  );
  expect(
    (await caseReport(buyer, item.id)).propositions.find(
      (claim) => claim.id === `integrity:${entry.id}`,
    )?.outcome,
  ).toBe("insufficient");
  await expect(evidenceBytes(buyer, entry.id)).rejects.toThrow("integrity");
});
it("rejects dual media and wrong-side video submissions without storing evidence", async () => {
  const { buyer, seller, item } = await fixture();
  requestActor.current = buyer;
  const form = new FormData();
  form.set("caseId", item.id);
  form.set("checkpoint", "buyer_receipt");
  form.set("serial", "");
  form.set("note", "Both files");
  form.set(
    "image",
    new File([new Uint8Array(png.bytes)], "photo.png", { type: png.mime }),
  );
  form.set(
    "video",
    new File([new Uint8Array(videos.mp4)], "video.mp4", { type: "video/mp4" }),
  );
  expect(
    (
      await POST(
        new Request("http://localhost:3000/api/evidence", {
          method: "POST",
          headers: { Origin: "http://localhost:3000" },
          body: form,
        }),
      )
    ).status,
  ).toBe(400);
  await expect(
    addEvidence(
      seller,
      item.id,
      { checkpoint: "buyer_receipt", serial: "", note: "Wrong side" },
      { bytes: videos.mp4, mime: "video/mp4" },
    ),
  ).rejects.toThrow("your side");
  expect(
    (await getWorkspace(buyer.workspaceId)).cases[0].evidence,
  ).toHaveLength(0);
});
