import { createHash } from "node:crypto";
import { parseAnyCatalogManifest } from "@/domain/catalog-manifest";
import {
  isLeafTypeKey,
  categoryToDefaultLeaf,
  type LeafTypeKey,
  type Category,
} from "@/domain/departments";
import type { Product } from "@/domain/catalog";
import { getDatabase } from "./database";

export interface ProductRevisionInput {
  productId: string;
  revisionId: string;
  leafType?: LeafTypeKey;
  brand?: string;
  modelName?: string;
  skuVariant?: string;
  facts: Record<string, unknown>;
  sourceUrl: string;
  observedAt: string;
  observedRegion: string;
  operatorAudit: string;
  price?: number;
  specs?: string[];
  attributes?: Record<string, unknown>;
  media?: Product["media"];
  expectedRecordHash?: string;
}

/** Privileged local operator service. No anonymous publish endpoint exists. */
export async function stageCatalog(input: unknown) {
  const manifest = parseAnyCatalogManifest(input);
  const content = JSON.stringify(manifest);
  const hash = createHash("sha256").update(content).digest("hex");
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const existing = await sql.query<{ content_hash: string }>(
      "SELECT content_hash FROM catalog_releases WHERE id=$1",
      [manifest.id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].content_hash !== hash)
        throw new Error(
          "Release ID already belongs to a different immutable manifest.",
        );
      return {
        id: manifest.id,
        hash,
        count: manifest.products.length,
        existing: true,
      };
    }
    const collision = await sql.query<{ id: string }>(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length)
      throw new Error(
        "Imported IDs cannot replace existing product identities.",
      );
    await sql.query(
      "INSERT INTO catalog_releases(id,content_hash,status,manifest,reviewed_by) VALUES($1,$2,'staged',$3::jsonb,$4)",
      [manifest.id, hash, content, manifest.reviewedBy],
    );
    return {
      id: manifest.id,
      hash,
      count: manifest.products.length,
      existing: false,
    };
  });
}

export interface ReviewedOfferReplacement {
  oldProductId: string;
  newProductId: string;
  expectedRecordHash: string;
}

export async function publishCatalog(
  id: string,
  expectedHash: string,
  replacements: ReviewedOfferReplacement[] = [],
) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const release = await sql.query<{
      status: string;
      content_hash: string;
      manifest: unknown;
    }>(
      "SELECT status,content_hash,manifest FROM catalog_releases WHERE id=$1 FOR UPDATE",
      [id],
    );
    const row = release.rows[0];
    if (!row || row.content_hash !== expectedHash)
      throw new Error("Reviewed release hash does not match.");
    if (row.status === "published") {
      if (replacements.length) {
        const audit = await sql.query<{
          payload: {
            releaseHash: string;
            replacements: ReviewedOfferReplacement[];
          };
        }>(
          "SELECT payload FROM catalog_operator_jobs WHERE id=$1 AND status='completed'",
          [`media-replacement:${id}`],
        );
        const payload = audit.rows[0]?.payload;
        if (
          payload?.releaseHash !== expectedHash ||
          payload.replacements.length !== replacements.length ||
          replacements.some((item, index) => {
            const stored = payload.replacements[index];
            return (
              stored.oldProductId !== item.oldProductId ||
              stored.newProductId !== item.newProductId ||
              stored.expectedRecordHash !== item.expectedRecordHash
            );
          })
        )
          throw new Error("Published replacement audit does not match.");
      }
      return { id, status: "published", existing: true };
    }
    if (row.status !== "staged")
      throw new Error("A retired release cannot be republished.");
    const manifest = parseAnyCatalogManifest(row.manifest);
    if (
      new Set(replacements.map((item) => item.oldProductId)).size !==
        replacements.length ||
      new Set(replacements.map((item) => item.newProductId)).size !==
        replacements.length
    )
      throw new Error("Replacement identities must be unique.");
    for (const replacement of replacements) {
      const next = manifest.products.find(
        (product) => product.id === replacement.newProductId,
      );
      const previous = await sql.query<{
        record: Product;
        publication: string;
      }>(
        "SELECT record,publication FROM catalog_products WHERE id=$1 FOR UPDATE",
        [replacement.oldProductId],
      );
      const old = previous.rows[0];
      if (
        !next ||
        next.comparisonOnly ||
        !old ||
        old.publication !== "published" ||
        next.id === replacement.oldProductId ||
        next.category !== old.record.category ||
        next.brand !== old.record.brand ||
        createHash("sha256")
          .update(JSON.stringify(old.record))
          .digest("hex") !== replacement.expectedRecordHash
      )
        throw new Error(
          "Replacement review is stale or product identities do not match.",
        );
    }
    if (
      manifest.products.some(
        (product) => !product.comparisonOnly && !product.media,
      )
    )
      throw new Error(
        "Reviewed exact-product media is required before publishing a shopping offer.",
      );
    const collision = await sql.query(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length)
      throw new Error("A product identity collision occurred since staging.");
    const records = manifest.products.map((p) => {
      const p2 = p as Record<string, unknown>;
      const brand = p.brand || p.attributes?.brand || null;
      const modelName =
        (p2.modelName as string | undefined) || p.attributes?.modelName || null;
      const leafType =
        (p2.leafType as string | undefined) ||
        (isLeafTypeKey(p.category) ? p.category : null);
      const skuVariant =
        (p2.skuVariant as string | undefined) || p.attributes?.size || null;
      const revisionId = (p2.revisionId as string | undefined) || null;
      return {
        id: p.id,
        category: p.category,
        price: p.price,
        record: p,
        publication: p.comparisonOnly ? "retired" : "published",
        leaf_type: leafType,
        brand,
        model_name: modelName,
        sku_variant: skuVariant,
        revision_id: revisionId,
      };
    });
    await sql.query(
      `INSERT INTO catalog_products(id,category,price,record,publication,release_id,leaf_type,brand,model_name,sku_variant,revision_id)
      SELECT id,category,price,record,publication,$2,leaf_type,brand,model_name,sku_variant,revision_id FROM jsonb_to_recordset($1::jsonb)
      AS items(id text,category text,price integer,record jsonb,publication text,leaf_type text,brand text,model_name text,sku_variant text,revision_id text)`,
      [JSON.stringify(records), id],
    );

    if (replacements.length) {
      await sql.query(
        "UPDATE catalog_products SET publication='retired' WHERE id=ANY($1::text[])",
        [replacements.map((item) => item.oldProductId)],
      );
      await sql.query(
        "INSERT INTO catalog_operator_jobs(id,kind,payload,status,completed_at) VALUES($1,'review_revision',$2::jsonb,'completed',now())",
        [
          `media-replacement:${id}`,
          JSON.stringify({ releaseHash: expectedHash, replacements }),
        ],
      );
    }

    // Persist device accessory relations if specified
    for (const p of manifest.products) {
      const p2 = p as Record<string, unknown>;
      if (
        Array.isArray(p2.deviceCompatibility) &&
        p2.deviceCompatibility.length > 0
      ) {
        for (const deviceId of p2.deviceCompatibility) {
          if (typeof deviceId === "string") {
            const accId = `${p.id}-compat-${deviceId}`;
            await sql.query(
              `INSERT INTO catalog_device_accessories(id, device_id, accessory_id, compatibility_state, evidence)
               VALUES($1, $2, $3, 'fits', $4::jsonb)
               ON CONFLICT(id) DO NOTHING`,
              [
                accId,
                deviceId,
                p.id,
                JSON.stringify({
                  verifiedBy: manifest.reviewedBy,
                  observedAt: manifest.reviewedAt,
                }),
              ],
            );
          }
        }
      }
    }

    await sql.query(
      "UPDATE catalog_releases SET status='published',published_at=now() WHERE id=$1",
      [id],
    );
    return { id, status: "published", existing: false };
  });
}

export async function retireCatalog(id: string) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const rows = await sql.query(
      "UPDATE catalog_releases SET status='retired' WHERE id=$1 AND status='published' RETURNING id",
      [id],
    );
    if (!rows.rows.length) throw new Error("Published release not found.");
    await sql.query(
      "UPDATE catalog_products SET publication='retired' WHERE release_id=$1",
      [id],
    );
    return { id, status: "retired" };
  });
}

/** Restore the same reviewed records after withdrawal; no data is rewritten. */
export async function restoreCatalog(id: string, expectedHash: string) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const result = await sql.query<{ status: string; content_hash: string }>(
      "SELECT status,content_hash FROM catalog_releases WHERE id=$1 FOR UPDATE",
      [id],
    );
    const row = result.rows[0];
    if (!row || row.content_hash !== expectedHash)
      throw new Error("Reviewed release hash does not match.");
    if (row.status === "published")
      return { id, status: "published", existing: true };
    if (row.status !== "retired")
      throw new Error("Only a retired release can be restored.");
    await sql.query(
      "UPDATE catalog_products SET publication=CASE WHEN coalesce((record->>'comparisonOnly')::boolean,false) THEN 'retired' ELSE 'published' END WHERE release_id=$1",
      [id],
    );
    await sql.query(
      "UPDATE catalog_releases SET status='published' WHERE id=$1",
      [id],
    );
    return { id, status: "published", existing: false };
  });
}

export async function createProductRevision(input: ProductRevisionInput) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const productRes = await sql.query<{
      id: string;
      category: string;
      price: number;
      record: Product;
      publication: string;
      leaf_type: string | null;
      brand: string | null;
      model_name: string | null;
      sku_variant: string | null;
      revision_id: string | null;
    }>(
      "SELECT id,category,price,record,publication,leaf_type,brand,model_name,sku_variant,revision_id FROM catalog_products WHERE id=$1 FOR UPDATE",
      [input.productId],
    );
    if (!productRes.rows[0]) {
      throw new Error(`Product ${input.productId} not found.`);
    }
    const current = productRes.rows[0];
    if (
      input.expectedRecordHash &&
      createHash("sha256")
        .update(JSON.stringify(current.record))
        .digest("hex") !== input.expectedRecordHash
    ) {
      throw new Error(
        "Product changed since repair review; inspect the current record before retrying.",
      );
    }

    const revCheck = await sql.query<{ revision_id: string }>(
      "SELECT revision_id FROM catalog_fact_revisions WHERE revision_id=$1",
      [input.revisionId],
    );
    if (revCheck.rows[0]) {
      throw new Error("Revision ID already exists.");
    }

    await sql.query(
      "UPDATE catalog_fact_revisions SET superseded_at=now() WHERE product_id=$1 AND superseded_at IS NULL",
      [input.productId],
    );

    const brand =
      input.brand ||
      current.brand ||
      current.record.brand ||
      (current.record.attributes?.brand as string) ||
      "Unknown";
    const modelName =
      input.modelName ||
      current.model_name ||
      (current.record.attributes?.modelName as string) ||
      current.record.name;
    const leafType =
      input.leafType ||
      (current.leaf_type as LeafTypeKey) ||
      (isLeafTypeKey(current.category)
        ? current.category
        : categoryToDefaultLeaf[current.category as Category] || "accessories");
    const skuVariant =
      input.skuVariant !== undefined
        ? input.skuVariant
        : current.sku_variant || current.record.attributes?.size || null;

    await sql.query(
      `INSERT INTO catalog_fact_revisions (
        revision_id, product_id, leaf_type, brand, model_name, sku_variant, facts, source_url, observed_at, observed_region, operator_audit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
      [
        input.revisionId,
        input.productId,
        leafType,
        brand,
        modelName,
        skuVariant,
        JSON.stringify(input.facts),
        input.sourceUrl,
        input.observedAt,
        input.observedRegion,
        input.operatorAudit,
      ],
    );

    const updatedAttributes = {
      ...current.record.attributes,
      brand,
      modelName,
      ...input.attributes,
      ...(input.facts as Record<string, unknown>),
    };
    const updatedRecord: Product = {
      ...current.record,
      brand,
      source: input.sourceUrl,
      price: input.price ?? current.price,
      specs: input.specs ?? current.record.specs,
      attributes: updatedAttributes as any,
      media: input.media ?? current.record.media,
      evidence: {
        checkedAt: input.observedAt.slice(0, 10),
        region: input.observedRegion,
        missing: current.record.evidence?.missing ?? [],
        review: current.record.evidence?.review ?? "specifications",
      },
    };
    const newPrice = input.price ?? current.price;

    await sql.query(
      `UPDATE catalog_products SET 
        leaf_type=$1,
        brand=$2,
        model_name=$3,
        sku_variant=$4,
        revision_id=$5,
        price=$6,
        record=$7::jsonb
      WHERE id=$8`,
      [
        leafType,
        brand,
        modelName,
        skuVariant,
        input.revisionId,
        newPrice,
        JSON.stringify(updatedRecord),
        input.productId,
      ],
    );

    return {
      productId: input.productId,
      revisionId: input.revisionId,
      status: "revised" as const,
    };
  });
}

export async function rollbackProductRevision(
  productId: string,
  targetRevisionId: string,
  operatorAudit: string,
) {
  const database = await getDatabase();
  return database.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(72190462)");
    const target = await sql.query<{
      revision_id: string;
      product_id: string;
      leaf_type: string;
      brand: string;
      model_name: string;
      sku_variant: string | null;
      facts: Record<string, unknown>;
      source_url: string;
      observed_at: string;
      observed_region: string;
      operator_audit: string;
    }>(
      "SELECT * FROM catalog_fact_revisions WHERE revision_id=$1 AND product_id=$2",
      [targetRevisionId, productId],
    );
    if (!target.rows[0]) {
      throw new Error(
        `Target revision ${targetRevisionId} not found for product ${productId}.`,
      );
    }
    const rev = target.rows[0];

    const prodRes = await sql.query<{
      id: string;
      record: Product;
      price: number;
      revision_id: string | null;
    }>(
      "SELECT id, record, price, revision_id FROM catalog_products WHERE id=$1 FOR UPDATE",
      [productId],
    );
    if (!prodRes.rows[0]) {
      throw new Error(`Product ${productId} not found.`);
    }
    const current = prodRes.rows[0];
    if (current.revision_id === targetRevisionId) {
      return {
        productId,
        revisionId: targetRevisionId,
        status: "already_active" as const,
      };
    }

    await sql.query(
      "UPDATE catalog_fact_revisions SET superseded_at=now() WHERE product_id=$1 AND superseded_at IS NULL",
      [productId],
    );

    const rollbackRevId = `${targetRevisionId}-rollback-${Date.now()}`;
    await sql.query(
      `INSERT INTO catalog_fact_revisions (
        revision_id, product_id, leaf_type, brand, model_name, sku_variant, facts, source_url, observed_at, observed_region, operator_audit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
      [
        rollbackRevId,
        productId,
        rev.leaf_type,
        rev.brand,
        rev.model_name,
        rev.sku_variant,
        JSON.stringify(rev.facts),
        rev.source_url,
        rev.observed_at,
        rev.observed_region,
        `Rollback to ${targetRevisionId}: ${operatorAudit}`,
      ],
    );

    const restoredAttributes = {
      ...current.record.attributes,
      brand: rev.brand,
      modelName: rev.model_name,
      ...(rev.facts as Record<string, unknown>),
    };
    const updatedRecord: Product = {
      ...current.record,
      brand: rev.brand,
      attributes: restoredAttributes as any,
      evidence: {
        checkedAt: new Date(rev.observed_at).toISOString().slice(0, 10),
        region: rev.observed_region,
        missing: current.record.evidence?.missing ?? [],
        review: current.record.evidence?.review ?? "specifications",
      },
    };

    await sql.query(
      `UPDATE catalog_products SET
        leaf_type=$1,
        brand=$2,
        model_name=$3,
        sku_variant=$4,
        revision_id=$5,
        record=$6::jsonb
      WHERE id=$7`,
      [
        rev.leaf_type,
        rev.brand,
        rev.model_name,
        rev.sku_variant,
        rollbackRevId,
        JSON.stringify(updatedRecord),
        productId,
      ],
    );

    return {
      productId,
      revisionId: rollbackRevId,
      targetRevisionId,
      status: "rolled_back" as const,
    };
  });
}

export async function getProductRevisions(productId: string) {
  const database = await getDatabase();
  const res = await database.query<{
    revision_id: string;
    product_id: string;
    leaf_type: string;
    brand: string;
    model_name: string;
    sku_variant: string | null;
    facts: Record<string, unknown>;
    source_url: string;
    observed_at: string;
    observed_region: string;
    operator_audit: string;
    created_at: string;
    superseded_at: string | null;
  }>(
    "SELECT * FROM catalog_fact_revisions WHERE product_id=$1 ORDER BY created_at DESC",
    [productId],
  );
  return res.rows;
}
