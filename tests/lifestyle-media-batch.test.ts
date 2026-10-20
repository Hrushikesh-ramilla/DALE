import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseAnyCatalogManifest } from "../src/domain/catalog-manifest";
import {
  resolveVerifiedProductImage,
  type VerifiedImage,
} from "../src/domain/verified-product-image";

describe("reviewed lifestyle manufacturer replacement cohort", () => {
  it("preserves original identities and binds every exact SKU to reviewed bytes", async () => {
    const directory = "catalog/media/batches/lifestyle";
    const batch = JSON.parse(await readFile(directory + "/batch.json", "utf8"));
    const manifest = parseAnyCatalogManifest(batch.manifest);
    const entries = JSON.parse(
      await readFile(directory + "/entries.json", "utf8"),
    ).entries as Record<string, VerifiedImage>;
    const reviews = JSON.parse(
      await readFile(directory + "/visual-reviews.json", "utf8"),
    ).reviews;
    const originals = new Map(
      (
        await Promise.all(
          (await readdir("catalog/manifests"))
            .filter((file) => file.endsWith("-v2.json"))
            .map(
              async (file) =>
                JSON.parse(await readFile("catalog/manifests/" + file, "utf8"))
                  .products || [],
            ),
        )
      )
        .flat()
        .map((product) => [product.id, product]),
    );
    expect(manifest.products.length).toBeGreaterThan(100);
    expect(
      new Set(
        batch.replacements.map(
          (item: { oldProductId: string }) => item.oldProductId,
        ),
      ).size,
    ).toBe(manifest.products.length);
    expect(Object.keys(entries)).toHaveLength(manifest.products.length);
    for (const product of manifest.products) {
      const replacement = batch.replacements.find(
        (item: { newProductId: string }) => item.newProductId === product.id,
      );
      const old = originals.get(replacement.oldProductId);
      expect(old, product.id).toBeDefined();
      expect(old.brand).toBe(product.brand);
      expect(old.category).toBe(product.category);
      expect(old.leafType).toBe(product.leafType);
      expect(old.id).not.toBe(product.id);
      const entry = entries[product.id];
      const evidence = batch.evidence.find(
        (item: { productId: string }) => item.productId === product.id,
      );
      const review = reviews.find(
        (item: { productId: string }) => item.productId === product.id,
      );
      expect(evidence.manufacturerSku).toBe(entry.sourceSku);
      expect(evidence.sourceImage).toBe(entry.sourceImage);
      expect(evidence.source).toBe(product.source);
      expect(review.sha256).toBe(entry.sha256);
      expect(review.decision).toBe("approved");
      expect(resolveVerifiedProductImage(product, entries).url).toBe(entry.url);
      expect(entry.width).toBeLessThanOrEqual(960);
      expect(entry.height).toBeLessThanOrEqual(960);
      const bytes = await readFile("public" + entry.url);
      expect(bytes.length).toBe(entry.bytes);
      expect(bytes.length).toBeLessThanOrEqual(140000);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        entry.sha256,
      );
      if (evidence.imageBinding === "variant-featured-image") {
        expect(evidence.variantFeaturedImage.id).toBe(evidence.sourceImageId);
        expect(evidence.variantFeaturedImage.src).toBe(entry.sourceImage);
      } else if (evidence.imageBinding === "sole-variant-primary-image") {
        expect(evidence.manufacturerVariantCount).toBe(1);
      } else {
        expect(evidence.sourceImageVariantIds).toContain(
          evidence.manufacturerVariantId,
        );
      }
      expect(
        product.specs.some((value) =>
          /clinical|guaranteed compatible/i.test(value),
        ),
      ).toBe(false);
    }
  });
});
