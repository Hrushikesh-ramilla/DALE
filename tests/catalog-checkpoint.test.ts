import { expect, it } from "vitest";
import { mkdtemp, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { catalogCheckpoint } from "../scripts/catalog-checkpoint";
import pdm from "../catalog/manifests/fragrance-pdm-2026-10-11-v1.json";
import {
  catalogManifestSchema,
  type CatalogManifest,
} from "../src/domain/catalog-manifest";

it("reassembles the identical reviewed manufacturer manifest after a partial collection", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-catalog-checkpoint-"));
  try {
    const original = catalogManifestSchema.parse(pdm);
    const identity = { id: original.id, source: "frozen-source-snapshot" };
    const initial = await catalogCheckpoint(directory, identity);
    for (const product of original.products.slice(0, 7))
      await initial.put(product.id, product);
    const resumed = await catalogCheckpoint(directory, identity);
    const reconstructed = [];
    let collectedAfterRestart = 0;
    for (const product of original.products) {
      const retained = await resumed.get<CatalogManifest["products"][number]>(
        product.id,
      );
      if (retained) reconstructed.push(retained);
      else {
        await resumed.put(product.id, product);
        reconstructed.push(product);
        collectedAfterRestart++;
      }
    }
    expect(collectedAfterRestart).toBe(7);
    expect(
      catalogManifestSchema.parse({ ...original, products: reconstructed }),
    ).toEqual(original);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("resumes immutable reviewed records after an interruption and rejects changed inputs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-catalog-checkpoint-"));
  try {
    const identity = {
      sourceHash: "snapshot-one",
      profile: "reviewed",
      date: "2026-10-11",
    };
    const initial = await catalogCheckpoint(directory, identity);
    await initial.put("model A", { reference: "A", volumeMl: 75 });
    // A new collector instance follows an interrupted collection.
    const resumed = await catalogCheckpoint(directory, identity);
    expect(await resumed.get("model A")).toEqual({
      reference: "A",
      volumeMl: 75,
    });
    expect(await resumed.get("model B")).toBeUndefined();
    await resumed.put("model A", { reference: "A", volumeMl: 75 });
    await expect(
      resumed.put("model A", { reference: "other" }),
    ).rejects.toThrow("different");
    await expect(
      catalogCheckpoint(directory, { ...identity, sourceHash: "changed" }),
    ).rejects.toThrow("different");
    await expect(
      catalogCheckpoint(directory, { ...identity, profile: "other" }),
    ).rejects.toThrow("different");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("concurrent identical writers cannot replace reviewed content and truncated temporaries are ignored", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-catalog-checkpoint-"));
  try {
    const [a, b] = await Promise.all([
      catalogCheckpoint(directory, { source: "same" }),
      catalogCheckpoint(directory, { source: "same" }),
    ]);
    await writeFile(join(directory, "interrupted.part"), "{");
    await Promise.all([
      a.put("one", { sku: "one" }),
      b.put("one", { sku: "one" }),
    ]);
    expect(await a.get("one")).toEqual({ sku: "one" });
    expect(await a.get("interrupted")).toBeUndefined();
    const results = await Promise.allSettled([
      a.put("two", { sku: "a" }),
      b.put("two", { sku: "b" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await a.get("two")).toEqual(
      results[0].status === "fulfilled" ? { sku: "a" } : { sku: "b" },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("refuses modified checkpoint contents instead of trusting saved source evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-catalog-checkpoint-"));
  try {
    const journal = await catalogCheckpoint(directory, { source: "reviewed" });
    await journal.put("one", { sku: "one" });
    const file = (await readdir(directory)).find(
      (name) => name !== "input.json" && name.endsWith(".json"),
    )!;
    const path = join(directory, file);
    const content = JSON.parse(await readFile(path, "utf8"));
    content.payload = JSON.stringify({ sku: "tampered" });
    await writeFile(path, JSON.stringify(content));
    await expect(journal.get("one")).rejects.toThrow("integrity");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
