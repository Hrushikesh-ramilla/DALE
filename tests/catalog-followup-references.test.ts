import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import fragrance from "../catalog/repairs/fragrance-variants-2026-10-24.json";
import apparel from "../catalog/repairs/apparel-variants-2026-10-24.json";
import device from "../catalog/repairs/device-reference-2026-10-24.json";
import registry from "../catalog/media/verified-product-images.json";
import {
  hasConsistentBottleVolume,
  resolveVerifiedProductImage,
} from "../src/domain/verified-product-image";

it("binds every follow-up record to its actual variant and intact photograph", () => {
  for (const operation of [
    ...fragrance.operations,
    ...apparel.operations,
    ...device.operations,
  ]) {
    const image = resolveVerifiedProductImage(
      operation.product,
      registry.entries,
    );
    expect(image.url, operation.oldId).toBeTruthy();
    expect(hasConsistentBottleVolume(operation.product)).toBe(true);
    const entry =
      registry.entries[operation.product.id as keyof typeof registry.entries];
    expect(
      createHash("sha256")
        .update(readFileSync("public" + image.url))
        .digest("hex"),
    ).toBe(entry.sha256);
    expect(operation.product.media.url).toBe(image.url);
  }
});
it("preserves intended Givenchy size labels while correcting the contradictory charcoal field", () => {
  expect(apparel.operations.map((o) => o.product.attributes.size)).toEqual([
    "S",
    "M",
    "L",
  ]);
  expect(
    new Set(
      apparel.operations.map((o) => o.product.attributes.manufacturerVariantId),
    ).size,
  ).toBe(3);
  for (const operation of apparel.operations) {
    expect(operation.expected.name).toContain("Dark Havanna");
    expect(operation.product.color).toBe("Dark Havanna");
    expect(operation.product.attributes.materialComposition).toBe(
      "100% cotton",
    );
  }
});
it("keeps the Fold6 generation, selected capacity, region SKU and photograph aligned", () => {
  const { product, evidence } = device.operations[0];
  expect(product.attributes.sourceSku).toBe("SM-F956BZSBEUB");
  expect(product.attributes.gtin).toBe("8806095667645");
  expect([
    product.attributes.storageGb,
    product.attributes.ramGb,
    product.attributes.displayInches,
    product.attributes.refreshHz,
  ]).toEqual([256, 12, 7.6, 120]);
  expect(product.color).toBe("Silver Shadow");
  expect(evidence.skuColorStorageSource).toContain("images.samsung.com");
  expect(evidence.specificationSource).toContain("samsungmobilepress.com");
  expect(product.description).not.toContain("1TB");
});
