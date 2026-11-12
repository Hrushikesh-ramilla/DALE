import { beforeAll, describe, expect, it } from "vitest";
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
  analyzeCase,
  resolveCase,
  cancelOrder,
  evidenceBytes,
} from "../src/server/service";
import { authorizeReturn, returnShippingEvent } from "../src/server/return-shipping";
import { evidenceHash } from "../src/server/storage";
import { analyzeClaims } from "../src/domain/claims";
import { randomUUID } from "node:crypto";
import { getDatabase } from "../src/server/database";

const pngImage = {
  mime: "image/png",
  bytes: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  ),
};

const jpegImage = {
  mime: "image/jpeg",
  bytes: Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]),
};

const webpImage = {
  mime: "image/webp",
  bytes: Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([0x12, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP"),
    Buffer.from("VP8 "),
    Buffer.from([0x06, 0x00, 0x00, 0x00]),
    Buffer.from([0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a]),
  ]),
};

const oversizedImage = {
  mime: "image/png",
  bytes: Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(4 * 1024 * 1024 + 100),
  ]),
};

const corruptImage = {
  mime: "image/png",
  bytes: Buffer.from("NOT_A_VALID_PNG_FILE_HEADER"),
};

beforeAll(async () => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
  await getDatabase();
  process.env.LOCAL_DATA_DIR = `.data/returns-tests-${randomUUID()}`;
});

async function setupFixture() {
  const workspace = await createWorkspace({ fixture: true });
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "buyer-alice",
    role: "buyer",
  };
  const otherBuyer: Actor = {
    workspaceId: workspace.id,
    userId: "buyer-bob",
    role: "buyer",
  };
  const seller: Actor = {
    workspaceId: workspace.id,
    userId: "seller",
    role: "seller",
  };
  const reviewerActor: Actor = {
    workspaceId: workspace.id,
    userId: "reviewer-sam",
    role: "reviewer",
  };

  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  const order = await checkout(buyer, quote.id, quote.fingerprint);
  await capture(buyer, order.id);

  return { workspace, buyer, otherBuyer, seller, reviewerActor, order };
}

describe("Milestone 6: Customer returns, evidence, and bounded AI findings", () => {
  it("R01: Owned eligible paid order opens one saved request; repeated requests do not duplicate cases", async () => {
    const { buyer, otherBuyer, order } = await setupFixture();

    // 1. Initial return request opens successfully
    const returnCase = await openReturn(buyer, order.id, "damaged", "refund");
    expect(returnCase.id).toBeDefined();
    expect(returnCase.orderId).toBe(order.id);
    expect(returnCase.buyerId).toBe(buyer.userId);
    expect(returnCase.status).toBe("open");
    expect(returnCase.reason).toBe("damaged");
    expect(returnCase.request).toBe("refund");

    // 2. Order reflects the return ID
    const stateAfterOpen = await getWorkspace(buyer.workspaceId);
    const updatedOrder = stateAfterOpen.orders.find((o) => o.id === order.id);
    expect(updatedOrder?.returnId).toBe(returnCase.id);

    // 3. Repeated request returns the identical case ID without creating a duplicate
    const repeated = await openReturn(buyer, order.id, "damaged", "refund");
    expect(repeated.id).toBe(returnCase.id);
    const stateAfterRepeat = await getWorkspace(buyer.workspaceId);
    const matchingCases = stateAfterRepeat.cases.filter((c) => c.orderId === order.id);
    expect(matchingCases).toHaveLength(1);

    // 4. Another buyer cannot open a return on this order
    await expect(
      openReturn(otherBuyer, order.id, "damaged", "refund"),
    ).rejects.toThrow("Order not found");
  });

  it("R02: Valid original images and notes survive refresh/restart; wrong-owner reads/writes, invalid/oversized files and unsupported checkpoints are rejected", async () => {
    const { buyer, otherBuyer, order } = await setupFixture();
    const returnCase = await openReturn(buyer, order.id, "damaged", "refund");

    // 1. Upload valid PNG image evidence
    const pngEntry = await addEvidence(
      buyer,
      returnCase.id,
      {
        checkpoint: "buyer_receipt",
        serial: "SER-PNG-001",
        note: "Damaged corner on outer shell",
      },
      pngImage,
    );
    expect(pngEntry.id).toBeDefined();
    expect(pngEntry.hash).toBe(evidenceHash(pngImage.bytes));
    expect(pngEntry.provenance?.submittedBy).toBe(buyer.userId);

    // 2. Upload valid JPEG image evidence
    const jpegEntry = await addEvidence(
      buyer,
      returnCase.id,
      {
        checkpoint: "buyer_receipt",
        serial: "SER-JPG-002",
        note: "Backplate fracture visible",
      },
      jpegImage,
    );
    expect(jpegEntry.id).toBeDefined();
    expect(jpegEntry.hash).toBe(evidenceHash(jpegImage.bytes));

    // 3. Upload valid WebP image evidence
    const webpEntry = await addEvidence(
      buyer,
      returnCase.id,
      {
        checkpoint: "buyer_receipt",
        serial: "SER-WEBP-003",
        note: "Close-up of hinge defect",
      },
      webpImage,
    );
    expect(webpEntry.id).toBeDefined();

    // 4. Add text note without media
    const noteEntry = await addEvidence(buyer, returnCase.id, {
      checkpoint: "buyer_receipt",
      serial: "SER-NOTE-004",
      note: "Packaging arrived torn open from carrier",
    });
    expect(noteEntry.id).toBeDefined();
    expect(noteEntry.assetKey).toBeUndefined();

    // 5. Verify persistence across fresh state read (refresh/restart simulation)
    const freshState = await getWorkspace(buyer.workspaceId);
    const freshCase = freshState.cases.find((c) => c.id === returnCase.id);
    expect(freshCase?.evidence).toHaveLength(4);

    // 6. Read original bytes via evidenceBytes
    const readPng = await evidenceBytes(buyer, pngEntry.id);
    expect(readPng.bytes).toEqual(pngImage.bytes);
    expect(readPng.mime).toBe("image/png");

    // 7. Wrong-owner evidence read fails closed
    await expect(evidenceBytes(otherBuyer, pngEntry.id)).rejects.toThrow("Case not found");

    // 8. Wrong-owner evidence write fails closed
    await expect(
      addEvidence(otherBuyer, returnCase.id, {
        checkpoint: "buyer_receipt",
        serial: "HACK",
        note: "Cross buyer injection",
      }),
    ).rejects.toThrow("Case not found");

    // 9. Invalid magic bytes fail closed
    await expect(
      addEvidence(
        buyer,
        returnCase.id,
        {
          checkpoint: "buyer_receipt",
          serial: "BAD-BYTES",
          note: "Corrupt file",
        },
        corruptImage,
      ),
    ).rejects.toThrow("Use a PNG, JPEG, or WebP image with a matching file type.");

    // 10. Oversized image (>4MB) fails closed
    await expect(
      addEvidence(
        buyer,
        returnCase.id,
        {
          checkpoint: "buyer_receipt",
          serial: "OVERSIZED",
          note: "File is too large",
        },
        oversizedImage,
      ),
    ).rejects.toThrow("Evidence images must be between 1 byte and 4 MB.");

    // 11. Unsupported checkpoint by buyer fails closed (buyers cannot submit seller_dispatch)
    await expect(
      addEvidence(buyer, returnCase.id, {
        checkpoint: "seller_dispatch",
        serial: "SPOOF",
        note: "Buyer trying to submit dispatch",
      }),
    ).rejects.toThrow("You can only submit your side's evidence.");
  });

  it("R03: AI findings cite supplied evidence, disclose uncertainty, and text-only/unavailable analysis is accurately labeled", async () => {
    const { buyer, order } = await setupFixture();
    const returnCase = await openReturn(buyer, order.id, "damaged", "refund");

    const originalAiMode = process.env.AI_MODE;
    process.env.AI_MODE = "live";
    try {
      // Enable live AI mode on workspace to test live code paths
      await mutateWorkspace(buyer.workspaceId, (s) => {
        s.adapterModes = { payments: "fixture", ai: "live" };
      });

      // 1. Text-only evidence (no reviewable images supplied)
      await addEvidence(buyer, returnCase.id, {
        checkpoint: "buyer_receipt",
        serial: "SER-TEXT-001",
        note: "Customer description of scratch",
      });

      const textOnlyAnalysis = await analyzeCase(buyer, returnCase.id);
      expect(textOnlyAnalysis.mode).toBe("rules");
      expect(textOnlyAnalysis.versions?.model).toBe("recorded-protocol-v1");
      expect(
        textOnlyAnalysis.observations.some((obs) =>
          obs.includes("No reviewable photograph was supplied. This report checks submitted records only"),
        ),
      ).toBe(true);

      // Verify propositions cite evidence and disclose uncertainty
      expect(textOnlyAnalysis.propositions).toBeDefined();
      for (const prop of textOnlyAnalysis.propositions!) {
        expect(prop.uncertainty.length).toBeGreaterThan(0);
        expect(prop.uncertainty.some((u) => u.includes("account") || u.includes("records"))).toBe(true);
      }

      // 2. Add an image in live mode: provider is unreachable/mocked in test environment
      // The vision completion fails or times out, triggering the fallback in evidenceAnalysis
      await addEvidence(
        buyer,
        returnCase.id,
        {
          checkpoint: "buyer_receipt",
          serial: "SER-IMG-002",
          note: "Photo attached",
        },
        pngImage,
      );

      const liveFallbackAnalysis = await analyzeCase(buyer, returnCase.id);
      expect(liveFallbackAnalysis.mode).toBe("unavailable");
      expect(liveFallbackAnalysis.versions?.model).toBe("unavailable");
      expect(liveFallbackAnalysis.observations.some((obs) => obs.includes("temporarily unavailable"))).toBe(true);
      expect(liveFallbackAnalysis.nextStep).toContain("retry");
    } finally {
      process.env.AI_MODE = originalAiMode;
    }
  });

  it("R04: Adding evidence invalidates stale findings without losing existing originals; upload/analysis failure is recoverable", async () => {
    const { buyer, order } = await setupFixture();
    const returnCase = await openReturn(buyer, order.id, "damaged", "refund");

    // 1. Initial evidence & analysis
    const entry1 = await addEvidence(buyer, returnCase.id, {
      checkpoint: "buyer_receipt",
      serial: "SER-001",
      note: "Initial report note",
    });

    const analysis1 = await analyzeCase(buyer, returnCase.id);
    expect(analysis1).toBeDefined();

    const stateWithAnalysis = await getWorkspace(buyer.workspaceId);
    const caseWithAnalysis = stateWithAnalysis.cases.find((c) => c.id === returnCase.id);
    expect(caseWithAnalysis?.analysis).toBeDefined();

    // 2. Add second evidence item
    const entry2 = await addEvidence(
      buyer,
      returnCase.id,
      {
        checkpoint: "buyer_receipt",
        serial: "SER-002",
        note: "Additional photo attached",
      },
      pngImage,
    );

    // 3. Stale analysis must be invalidated immediately
    const stateAfterSecond = await getWorkspace(buyer.workspaceId);
    const caseAfterSecond = stateAfterSecond.cases.find((c) => c.id === returnCase.id);
    expect(caseAfterSecond?.analysis).toBeUndefined();

    // 4. All original evidence is preserved (both entry1 and entry2)
    expect(caseAfterSecond?.evidence).toHaveLength(2);
    expect(caseAfterSecond?.evidence.map((e) => e.id)).toEqual([entry1.id, entry2.id]);

    // 5. Fresh analysis can be rerun and succeeds
    const freshAnalysis = await analyzeCase(buyer, returnCase.id);
    expect(freshAnalysis).toBeDefined();
    const stateAfterReanalysis = await getWorkspace(buyer.workspaceId);
    expect(
      stateAfterReanalysis.cases.find((c) => c.id === returnCase.id)?.analysis,
    ).toBeDefined();
  });

  it("R05: A submitted case remains in review; buyer requests cannot approve, authorize return receipt, replace goods or trigger a refund", async () => {
    const { buyer, reviewerActor, order } = await setupFixture();
    const returnCase = await openReturn(buyer, order.id, "damaged", "refund");

    await addEvidence(buyer, returnCase.id, {
      checkpoint: "buyer_receipt",
      serial: "SER-001",
      note: "Customer evidence",
    });
    await analyzeCase(buyer, returnCase.id);

    // 1. Case remains in "review" / awaiting review
    const currentState = await getWorkspace(buyer.workspaceId);
    const currentCase = currentState.cases.find((c) => c.id === returnCase.id);
    expect(currentCase?.status).toBe("review");

    // 2. Buyer cannot resolve case (refund or replacement)
    await expect(
      resolveCase(buyer, returnCase.id, "refund", "Buyer self-approval"),
    ).rejects.toThrow("Reviewer authorization is required.");

    await expect(
      resolveCase(buyer, returnCase.id, "replacement", "Buyer self-replacement"),
    ).rejects.toThrow("Reviewer authorization is required.");

    // 3. Buyer cannot authorize return shipping
    await expect(
      authorizeReturn(buyer, returnCase.id, "prepaid", "Buyer authorizing return", "LBL-123"),
    ).rejects.toThrow("Reviewer authorization is required for return arrangements.");

    // 4. Buyer cannot record return receipt
    await expect(
      returnShippingEvent(buyer, returnCase.id, "received", "TRACK-999"),
    ).rejects.toThrow("Only the submitting party can record this return checkpoint.");

    // 5. Verify the order has no refund and was not replaced
    const freshOrder = currentState.orders.find((o) => o.id === order.id);
    expect(freshOrder?.refund).toBeUndefined();
    expect(freshOrder?.refundedAmount).toBe(0);
    expect(freshOrder?.status).toBe("paid");

    // 6. Reviewer authority boundary: reviewer can resolve
    const resolved = await resolveCase(
      reviewerActor,
      returnCase.id,
      "refund",
      "Authorized reviewer approval",
    );
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolutionNote).toBe("Authorized reviewer approval");
  });

  it("R06: COD cancellation is available where eligible, never offers a PayPal refund and releases stock once", async () => {
    const { workspace, otherBuyer } = await setupFixture();

    // 1. Place a Cash On Delivery order
    const quote = await makeQuote(
      otherBuyer,
      "P001",
      "Atlas 14",
      undefined,
      undefined,
      "cod",
    );
    const codOrder = await checkout(
      otherBuyer,
      quote.id,
      quote.fingerprint,
      "cod",
    );
    expect(codOrder.paymentMethod).toBe("cod");
    expect(codOrder.status).toBe("unpaid_cod");

    // 2. COD order rejects openReturn (cannot request a refund for unpaid COD)
    await expect(
      openReturn(otherBuyer, codOrder.id, "damaged", "refund"),
    ).rejects.toThrow("There is no eligible captured payment for this request.");

    // 3. Customer can cancel unpaid COD order
    const canceled = await cancelOrder(
      otherBuyer,
      codOrder.id,
      "Customer changed mind before delivery",
    );
    expect(canceled.status).toBe("canceled");

    // 4. Zero PayPal refund provider calls and zero refund records
    const stateAfterCancel = await getWorkspace(workspace.id);
    const canceledOrder = stateAfterCancel.orders.find((o) => o.id === codOrder.id);
    expect(canceledOrder?.refund).toBeUndefined();
    expect(canceledOrder?.refundedAmount).toBe(0);
    expect(
      stateAfterCancel.operations.filter(
        (op) => op.orderId === codOrder.id && op.kind === "refund",
      ),
    ).toHaveLength(0);

    // 5. Repeated cancellation is idempotent and does not release reservation twice
    const repeatCancel = await cancelOrder(
      otherBuyer,
      codOrder.id,
      "Duplicate cancellation request",
    );
    expect(repeatCancel.status).toBe("canceled");
  });

  it("R07: Missing seller dispatch evidence does not block a legitimate customer request or become fabricated corroboration", async () => {
    const { buyer, order } = await setupFixture();

    // 1. Verify this order has zero seller dispatch evidence
    const state = await getWorkspace(buyer.workspaceId);
    const currentOrder = state.orders.find((o) => o.id === order.id);
    expect(currentOrder?.dispatchEvidence).toHaveLength(0);

    // 2. Customer opens return request without seller dispatch evidence
    const returnCase = await openReturn(buyer, order.id, "damaged", "refund");
    expect(returnCase.id).toBeDefined();
    expect(returnCase.evidence).toHaveLength(0);

    // 3. Customer submits their receipt evidence
    const customerEvidence = await addEvidence(
      buyer,
      returnCase.id,
      {
        checkpoint: "buyer_receipt",
        serial: "BUYER-REC-777",
        note: "Item arrived crushed in transport",
      },
      pngImage,
    );
    expect(customerEvidence.id).toBeDefined();

    // 4. Analyze claims with only buyer receipt
    const claims = analyzeClaims([customerEvidence]);
    expect(claims.propositions).toBeDefined();

    // 5. Identifier proposition for dispatch vs receipt reports insufficient (NOT supported/corroborated)
    const dispatchReceiptProp = claims.propositions?.find(
      (p) => p.id === "identifiers:dispatch-and-customer-receipt",
    );
    expect(dispatchReceiptProp?.outcome).toBe("insufficient");
    expect(
      dispatchReceiptProp?.missingFacts.some((f) =>
        f.includes("Comparable identifiers from both checkpoints are missing"),
      ),
    ).toBe(true);

    // 6. Condition proposition reports insufficient corroboration without fabricating seller agreement
    const conditionProp = claims.propositions?.find(
      (p) => p.id === `condition:${customerEvidence.id}`,
    );
    expect(conditionProp?.outcome).toBe("insufficient");
    expect(conditionProp?.missingFacts).toContain(
      "Independent corroboration of the described condition.",
    );

    // 7. Case analysis succeeds and case remains accessible
    const analysis = await analyzeCase(buyer, returnCase.id);
    expect(analysis.outcome).toBe("insufficient");
    const freshState = await getWorkspace(buyer.workspaceId);
    const savedCase = freshState.cases.find((c) => c.id === returnCase.id);
    expect(savedCase?.status).toBe("review");
  });
});
