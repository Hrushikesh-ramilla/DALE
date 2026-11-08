import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import plan from "../catalog/repairs/logitech-references-2026-10-24.json";
import registry from "../catalog/media/verified-product-images.json";
import { resolveVerifiedProductImage } from "../src/domain/verified-product-image";

it("keeps conditional battery claims and exact layout, switch, handedness and receiver variants", () => {
  expect(plan.operations).toHaveLength(5);
  for (const { product, evidence } of plan.operations) {
    expect(product.id).toBe(plan.operations.find(o=>o.oldId===product.id)?.oldId);
    expect(product.attributes).not.toHaveProperty("batteryHours");
    expect(product.attributes.batteryRuntimeClaim).toContain("Varies with usage");
    expect(product.attributes.sourceSku).toBe(evidence.manufacturerSku);
    expect(product.source).toContain("sku="+evidence.manufacturerSku);
    const image=resolveVerifiedProductImage(product,registry.entries);
    expect(image.url,product.id).toBe(product.media.url);
    const entry=registry.entries[product.id as keyof typeof registry.entries];
    expect(createHash("sha256").update(readFileSync("public"+image.url)).digest("hex")).toBe(entry.sha256);
  }
  const bySku=new Map(plan.operations.map(o=>[o.product.attributes.sourceSku,o.product]));
  expect(bySku.get("920-010550")?.attributes.switchType).toContain("Tactile Quiet");
  expect(bySku.get("920-011558")?.attributes.batteryRuntimeClaim).toContain("10 days");
  expect(bySku.get("910-006466")?.attributes.handedness).toBe("Right-handed");
  expect(bySku.get("910-006466")?.attributes.batteryRuntimeClaim).toContain("24 months");
  expect(bySku.get("910-006925")?.attributes.receiverIncluded).toBe(false);
});
