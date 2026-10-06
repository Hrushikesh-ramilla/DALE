import { describe, expect, it } from "vitest";
import { catalog, searchCatalog } from "../src/domain/catalog";
import {
  allowedRefund,
  checkPurchase,
  Quote,
  quoteFingerprint,
} from "../src/domain/guard";
import { analyzeClaims, customerRemedy, Evidence } from "../src/domain/claims";
import { scanMessage } from "../src/domain/scams";
const quote: Quote = {
  id: "q1",
  productId: "P001",
  model: "Atlas 14",
  payee: "merchant",
  amount: 2900,
  currency: "USD",
  expiresAt: "2099-01-01T00:00:00Z",
  version: 1,
};
describe("customer purchase rules", () => {
  it("accepts the exact approved purchase", () => {
    expect(checkPurchase(quote, quoteFingerprint(quote), { ...quote })).toBe(
      true,
    );
  });
  it.each(["amount", "currency", "payee", "productId"])(
    "rejects a changed %s",
    (field) => {
      expect(() =>
        checkPurchase(quote, quoteFingerprint(quote), {
          ...quote,
          [field]: field === "amount" ? 1 : "changed",
        }),
      ).toThrow();
    },
  );
  it("invalidates approval when the quote changes", () => {
    expect(() =>
      checkPurchase({ ...quote, amount: 3000 }, quoteFingerprint(quote), {
        ...quote,
      }),
    ).toThrow();
  });
  it("rejects an expired quote", () => {
    expect(() =>
      checkPurchase(
        quote,
        quoteFingerprint(quote),
        { ...quote },
        new Date("2100-01-01").getTime(),
      ),
    ).toThrow();
  });
  it("reserves pending refunds", () => {
    expect(() => allowedRefund(1000, 500, 400, 200)).toThrow();
    expect(allowedRefund(1000, 500, 400, 100)).toBe(true);
  });
});
describe("recommendations", () => {
  it("uses the customer's explicit feature priority and keeps price priority within budget", () => {
    const input = {
      model: "Atlas 14",
      category: "chargers",
      budget: 5000,
      preference: "100W",
    };
    expect(searchCatalog({ ...input, priority: "features" })[0].id).toBe(
      "P003",
    );
    expect(searchCatalog({ ...input, priority: "price" })[0].id).toBe("P001");
    expect(
      searchCatalog({ ...input, budget: 4000, priority: "features" }).some(
        (p) => p.id === "P003",
      ),
    ).toBe(false);
  });
  it("removes incompatible sponsored products", () => {
    expect(
      searchCatalog({
        model: "Atlas 14",
        category: "chargers",
        budget: 5000,
      }).every((p) => p.compatibleModels.includes("Atlas 14")),
    ).toBe(true);
  });
  it("does not change rank when sponsorship changes", () => {
    const before = searchCatalog({ model: "Atlas 14", budget: 9000 }).map(
      (p) => p.id,
    );
    const old = catalog.map((p) => p.sponsored);
    catalog.forEach((p) => {
      p.sponsored = !p.sponsored;
    });
    expect(
      searchCatalog({ model: "Atlas 14", budget: 9000 }).map((p) => p.id),
    ).toEqual(before);
    catalog.forEach((p, i) => {
      p.sponsored = old[i];
    });
  });
  it("asks for a known model instead of guessing", () => {
    expect(searchCatalog({ model: "unknown", budget: 9000 })).toEqual([]);
  });
});
describe("claims and customer priority", () => {
  const evidence = (
    id: string,
    checkpoint: Evidence["checkpoint"],
    serial: string,
  ): Evidence => ({
    id,
    checkpoint,
    serial,
    note: "",
    hash: "hash",
    createdAt: "2026-10-05",
  });
  it("identifies conflicting records without denying a claim", () => {
    const result = analyzeClaims([
      evidence("a", "buyer_return", "A"),
      evidence("b", "seller_return", "B"),
    ]);
    expect(result.outcome).toBe("contradicted");
    expect(result.nextStep).toContain("remains open");
  });
  it("does not call matching identifiers proof of physical truth", () => {
    expect(
      analyzeClaims([
        evidence("a", "seller_dispatch", "A"),
        evidence("b", "buyer_receipt", "A"),
      ]).outcome,
    ).toBe("insufficient");
  });
  it("does not penalize missing evidence", () => {
    expect(analyzeClaims([]).observations.join(" ")).toContain(
      "does not imply dishonesty",
    );
  });
  it("escalates seller silence", () => {
    expect(
      customerRemedy({
        reason: "damaged",
        sellerResponded: false,
        deadlinePassed: true,
        eligible: true,
        requested: "refund",
        approvedByReviewer: false,
      }).action,
    ).toBe("escalate");
  });
  it("honors a reviewed customer refund choice", () => {
    expect(
      customerRemedy({
        reason: "damaged",
        sellerResponded: true,
        deadlinePassed: false,
        eligible: true,
        requested: "refund",
        approvedByReviewer: true,
      }).action,
    ).toBe("refund");
  });
});
describe("message warnings", () => {
  it("flags coercive out-of-checkout payment", () => {
    expect(
      scanMessage(
        "Pay right now with gift cards or your account will be suspended",
      ).level,
    ).toBe("high");
  });
  it("allows a normal delivery update without a warning", () => {
    expect(
      scanMessage("Your order is dispatched. Track it in your order page.")
        .level,
    ).toBe("low");
  });
});
