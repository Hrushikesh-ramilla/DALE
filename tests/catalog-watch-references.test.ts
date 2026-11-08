import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import plan from "../catalog/repairs/watch-references-2026-10-24.json";
import registry from "../catalog/media/verified-product-images.json";
import { resolveVerifiedProductImage } from "../src/domain/verified-product-image";

it("binds exact watch references, full-resolution photos and technical specifications without changing model generations", () => {
  expect(plan.operations).toHaveLength(18);
  for (const operation of plan.operations) {
    const {product,evidence}=operation;
    expect(product.id).toBe(operation.oldId);
    expect(product.source.toLowerCase()).toContain(evidence.manufacturerSku.toLowerCase());
    expect(product.attributes.sourceSku).toBe(evidence.manufacturerSku);
    const image=resolveVerifiedProductImage(product,registry.entries);
    expect(image.url,product.id).toBe(product.media.url);
    const entry=registry.entries[product.id as keyof typeof registry.entries];
    expect(Math.min(entry.width,entry.height)).toBeGreaterThanOrEqual(200);
    expect(createHash("sha256").update(readFileSync("public"+image.url)).digest("hex")).toBe(entry.sha256);
  }
  const bySku=new Map(plan.operations.map(o=>[o.product.attributes.sourceSku,o.product]));
  expect(bySku.get("m336934-0001")?.attributes.dialColor).toBe("Mint green");
  expect(bySku.get("m336934-0001")?.color).toContain("Mint green");
  expect(bySku.get("m126603-0001")?.attributes.waterResistanceM).toBe(1220);
  expect(bySku.get("CAZ1010.FT8024")?.attributes).not.toHaveProperty("powerReserveHours");
  expect(bySku.get("CAW211P.FC6356")?.attributes.powerReserveHours).toBe(40);
  expect(bySku.get("CAW211P.FC6356")?.attributes.manufacturerStatus).toBe("Discontinued");
});
