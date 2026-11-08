import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import plan from "../catalog/repairs/exact-fragrance-duplicates-2026-10-24.json";
import registry from "../catalog/media/verified-product-images.json";
import { hasConsistentBottleVolume, resolveVerifiedProductImage } from "../src/domain/verified-product-image";

it("consolidates only identical manufacturer variants while enriching their surviving references", () => {
  expect(plan.operations).toHaveLength(40);
  const corrected = new Map(plan.operations.filter(o=>o.oldId===o.product.id).map(o=>[o.product.id,o]));
  const duplicates = plan.operations.filter(o=>o.oldId!==o.product.id);
  expect(corrected.size).toBe(20);
  expect(duplicates).toHaveLength(20);
  for (const operation of duplicates) {
    const target=corrected.get(operation.product.id)!;
    expect(target,operation.oldId).toBeTruthy();
    expect(operation.evidence.manufacturerVariantId).toBe(target.evidence.manufacturerVariantId);
    expect(operation.evidence.manufacturerSku).toBe(target.evidence.manufacturerSku);
    expect(operation.product).toEqual(target.product);
    expect(hasConsistentBottleVolume(operation.product)).toBe(true);
    expect(operation.expected.attributes.concentration).toBe(operation.product.attributes.concentration);
  }
  for (const {product} of corrected.values()) {
    const image=resolveVerifiedProductImage(product,registry.entries);
    expect(image.url,product.id).toBe(product.media.url);
    const entry=registry.entries[product.id as keyof typeof registry.entries];
    expect(createHash("sha256").update(readFileSync("public"+image.url)).digest("hex")).toBe(entry.sha256);
    expect(product.description).not.toMatch(/mood enhancer|therapeutic|protective energy|boosting confidence|seduct/i);
    expect(product.evidence.missing.join(" ")).toContain("not a complete ingredient or allergen list");
  }
});
