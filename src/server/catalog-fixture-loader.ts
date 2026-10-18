import { parseAnyCatalogManifest, type AnyCatalogManifest } from "@/domain/catalog-manifest";
import { stageCatalog, publishCatalog, retireCatalog } from "./catalog-publishing";
import { getDatabase } from "./database";

export interface LoadFixtureResult {
  releaseId: string;
  hash: string;
  count: number;
  status: "staged" | "published" | "already_published";
}

export async function loadAndPublishManifestFixture(
  manifestInput: unknown,
  options: { publish?: boolean } = { publish: true },
): Promise<LoadFixtureResult> {
  if (
    typeof manifestInput === "object" &&
    manifestInput !== null &&
    "products" in manifestInput &&
    Array.isArray((manifestInput as Record<string, unknown>).products) &&
    (manifestInput as { products: unknown[] }).products.length > 500
  ) {
    throw new Error(
      `Manifest batch size ${(manifestInput as { products: unknown[] }).products.length} exceeds the maximum allowed batch size of 500 records.`,
    );
  }

  const manifest = parseAnyCatalogManifest(manifestInput);

  // Stage the manifest
  const staged = await stageCatalog(manifest);

  if (staged.existing) {
    // Check if it's already published
    const db = await getDatabase();
    const rel = await db.query<{ status: string }>(
      "SELECT status FROM catalog_releases WHERE id=$1",
      [staged.id],
    );
    if (rel.rows[0]?.status === "published") {
      return {
        releaseId: staged.id,
        hash: staged.hash,
        count: staged.count,
        status: "already_published",
      };
    }
  }

  if (options.publish) {
    await publishCatalog(staged.id, staged.hash);
    return {
      releaseId: staged.id,
      hash: staged.hash,
      count: staged.count,
      status: "published",
    };
  }

  return {
    releaseId: staged.id,
    hash: staged.hash,
    count: staged.count,
    status: "staged",
  };
}

export async function rollbackManifestFixture(releaseId: string): Promise<{ retired: boolean }> {
  try {
    await retireCatalog(releaseId);
    return { retired: true };
  } catch (err) {
    return { retired: false };
  }
}
