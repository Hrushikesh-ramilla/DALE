import { expect, it } from "vitest";
import evidence from "../catalog/media/evidence/original-image-classification-2026-10-13.json";
import reviews from "../catalog/media/original-image-visual-reviews.json";
import registry from "../catalog/media/verified-product-images.json";

it("has a specific inspection outcome for every original record without certifying visual guesses", () => {
  const records = new Map(
    evidence.records.map((record) => [record.id, record]),
  );
  const visual = new Map(reviews.records.map((record) => [record.id, record]));
  expect(records.size).toBe(evidence.records.length);
  expect(visual.size).toBe(reviews.records.length);
  for (const record of evidence.records) {
    if (record.status === "rejected-exact-generated-drawing") {
      expect(record.generatedSha256).toBe(record.originalSha256);
    } else {
      expect(record.status).toBe("visual-review-required");
      if (record.replacement) {
        const image =
          registry.entries[record.id as keyof typeof registry.entries];
        expect(image?.verified).toBe(true);
        expect(image?.url).toBe(record.replacement);
      } else {
        const review = visual.get(record.id);
        expect(review).toBeDefined();
        expect(review?.originalSha256).toBe(record.originalSha256);
        expect(review?.reason).toBeTruthy();
        expect([
          "rejected-visual-mismatch",
          "visually-inspected-exact-identity-pending",
        ]).toContain(review?.status);
      }
    }
  }
  for (const review of reviews.records)
    expect(records.has(review.id)).toBe(true);
});
