import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { parseAnyCatalogManifest } from "../src/domain/catalog-manifest";
import {
  resolveVerifiedProductImage,
  type VerifiedImage,
} from "../src/domain/verified-product-image";

const registry = JSON.parse(
  readFileSync("catalog/media/verified-product-images.json", "utf8"),
).entries as Record<string, VerifiedImage>;
const originals = new Map(
  readdirSync("catalog/manifests")
    .filter((name) => name.endsWith(".json") && !name.includes("observations"))
    .flatMap(
      (name) =>
        JSON.parse(readFileSync("catalog/manifests/" + name, "utf8"))
          .products || [],
    )
    .map((product) => [product.id, product]),
);

it.each(["serge-lutens", "amouage", "portronics"])(
  "%s replacement batch retains old identities and binds every new SKU to its reviewed photograph",
  (profile) => {
    const batch = JSON.parse(
      readFileSync(
        "catalog/media/evidence/" + profile + "-replacement-batch.json",
        "utf8",
      ),
    );
    const manifest = parseAnyCatalogManifest(batch.manifest);
    expect(
      new Set(
        batch.replacements.map(
          (item: { oldProductId: string }) => item.oldProductId,
        ),
      ).size,
    ).toBe(manifest.products.length);
    expect(
      new Set(
        batch.replacements.map(
          (item: { newProductId: string }) => item.newProductId,
        ),
      ).size,
    ).toBe(manifest.products.length);
    for (const product of manifest.products) {
      const mapping = batch.replacements.find(
        (item: { newProductId: string }) => item.newProductId === product.id,
      );
      const original = originals.get(mapping.oldProductId);
      expect(original).toBeDefined();
      expect(product.id).not.toBe(mapping.oldProductId);
      expect(product.brand).toBe(original.brand);
      expect(product.category).toBe(original.category);
      const proof = batch.evidence.find(
        (item: { productId: string }) => item.productId === product.id,
      );
      const image = resolveVerifiedProductImage(product, registry);
      expect(image.url).toMatch(/^\/images\/verified\//);
      expect(image.source).toBe(product.source);
      expect(proof.source).toBe(image.source);
      expect(proof.manufacturerSku).toBe(registry[product.id].sourceSku);
      expect(proof.feedSha256).toMatch(/^[a-f0-9]{64}$/);
      if (profile === "portronics") {
        expect(product.deviceCompatibility).toEqual([]);
        expect(product.compatibleModels).toEqual([]);
        expect(product.attributes?.voltageProfiles).toBeUndefined();
        expect(product.evidence.missing).toContain(
          "deviceSpecificCompatibility",
        );
      }
    }
  },
);

it("does not approve or publish the manufacturer photo with conflicting port counts", () => {
  expect(registry["CHARGER-PORTRONICS-POR-2022"].verified).toBe(false);
  const batch = JSON.parse(
    readFileSync(
      "catalog/media/evidence/portronics-replacement-batch.json",
      "utf8",
    ),
  );
  expect(
    batch.manifest.products.some(
      (product: { id: string }) => product.id === "CHARGER-PORTRONICS-POR-2022",
    ),
  ).toBe(false);
});
