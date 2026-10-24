import { createHash } from "node:crypto";
import release from "../../catalog/repairs/repair-first-2026-10-24.json";
import fragranceFollowup from "../../catalog/repairs/fragrance-variants-2026-10-24.json";
import apparelFollowup from "../../catalog/repairs/apparel-variants-2026-10-24.json";
import deviceFollowup from "../../catalog/repairs/device-reference-2026-10-24.json";
import exactDuplicates from "../../catalog/repairs/exact-fragrance-duplicates-2026-10-24.json";
import logitechReferences from "../../catalog/repairs/logitech-references-2026-10-24.json";
import watchReferences from "../../catalog/repairs/watch-references-2026-10-24.json";
import trackReference from "../../catalog/repairs/track-reference-2026-10-24.json";
import type { Product } from "@/domain/catalog";
import type { Sql } from "./database";

export interface CatalogRepair {
  oldId: string;
  expected: {
    name: string;
    brand?: string;
    source: string;
    attributes?: Product["attributes"];
  };
  acceptedPreimages?: CatalogRepair["expected"][];
  product: Product;
  reason: string;
  evidence: object;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
const signature = (p: Product) => ({
  name: p.name,
  brand: p.brand,
  source: p.source,
  attributes: p.attributes,
});

/** Called inside database initialization's transaction. Every change is scoped,
 * audited and applied once; unrelated products and later withdrawals are untouched. */
export async function applyCatalogRepairs(
  sql: Sql,
  operations = [
    ...release.operations,
    ...fragranceFollowup.operations,
    ...apparelFollowup.operations,
    ...deviceFollowup.operations,
    ...exactDuplicates.operations,
    ...logitechReferences.operations,
    ...watchReferences.operations,
    ...trackReference.operations,
  ] as CatalogRepair[],
) {
  const receipts = await sql.query<{ id: string }>(
    "SELECT id FROM catalog_operator_jobs WHERE kind='catalog_repair_first' AND status='completed'",
  );
  const done = new Set(receipts.rows.map((r) => r.id));
  const outcome = { applied: 0, skipped: 0, alreadyApplied: 0 };
  for (const operation of operations) {
    const id =
      "catalog-repair-first:" +
      createHash("sha256").update(canonical(operation)).digest("hex");
    if (done.has(id)) {
      outcome.alreadyApplied++;
      continue;
    }
    const result = await sql.query<{
      record: Product;
      publication: string;
      release_id: string | null;
    }>(
      "SELECT record,publication,release_id FROM catalog_products WHERE id=$1 FOR UPDATE",
      [operation.oldId],
    );
    const before = result.rows[0];
    // A later operator decision always wins. Missing/stale inputs stay pending.
    if (
      !before ||
      before.publication !== "published" ||
      ![operation.expected, ...(operation.acceptedPreimages || [])].some(
        (expected) =>
          canonical(signature(before.record)) === canonical(expected),
      )
    ) {
      outcome.skipped++;
      continue;
    }
    const next = structuredClone(operation.product);
    if (
      next.brand !== before.record.brand ||
      next.category !== before.record.category ||
      !operation.reason ||
      !next.media ||
      !next.source.startsWith("https://")
    )
      throw Error("Invalid catalog repair: " + operation.oldId);
    if (next.id === operation.oldId) {
      // Fact corrections must not overwrite stock changes, prices or reservations.
      next.price = before.record.price;
      next.stock = before.record.stock;
      await sql.query(
        "UPDATE catalog_products SET record=$2::jsonb,leaf_type=$3,brand=$4,model_name=$5,sku_variant=$6 WHERE id=$1",
        [
          next.id,
          JSON.stringify(next),
          next.leafType || null,
          next.brand || null,
          next.modelName || next.attributes?.modelName || null,
          next.skuVariant || null,
        ],
      );
    } else {
      const collision = await sql.query<{
        record: Product;
        publication: string;
      }>(
        "SELECT record,publication FROM catalog_products WHERE id=$1 FOR UPDATE",
        [next.id],
      );
      const target = collision.rows[0];
      // Multiple ambiguous legacy rows may resolve to one exact manufacturer SKU.
      // Consolidate only when all target facts/media match; never revive a retired target.
      const sameReference = (p: Product) => ({ ...p, price: 0, stock: 0 });
      if (
        target &&
        (target.publication !== "published" ||
          canonical(sameReference(target.record)) !==
            canonical(sameReference(next)))
      ) {
        outcome.skipped++;
        continue;
      }
      if (!target)
        await sql.query(
          `INSERT INTO catalog_products(id,category,price,record,publication,release_id,leaf_type,brand,model_name,sku_variant)
        VALUES($1,$2,$3,$4::jsonb,'published',$5,$6,$7,$8,$9)`,
          [
            next.id,
            next.category,
            next.price,
            JSON.stringify(next),
            release.id,
            next.leafType || null,
            next.brand || null,
            next.modelName || next.attributes?.modelName || null,
            next.skuVariant || null,
          ],
        );
      await sql.query(
        "UPDATE catalog_products SET publication='retired' WHERE id=$1",
        [operation.oldId],
      );
    }
    await sql.query(
      "INSERT INTO catalog_operator_jobs(id,kind,payload,status,completed_at) VALUES($1,'catalog_repair_first',$2::jsonb,'completed',now())",
      [
        id,
        JSON.stringify({
          oldId: operation.oldId,
          newId: next.id,
          before,
          after: next,
          reason: operation.reason,
          evidence: operation.evidence,
        }),
      ],
    );
    outcome.applied++;
  }
  return outcome;
}

/** Redirect only a recorded replacement whose destination is still published. */
export async function publishedReplacement(
  sql: Sql,
  id: string,
): Promise<string | undefined> {
  const result = await sql.query<{ id: string }>(
    `SELECT p.id FROM catalog_operator_jobs j JOIN catalog_products p ON p.id=j.payload->>'newId'
    WHERE j.kind='catalog_repair_first' AND j.status='completed' AND j.payload->>'oldId'=$1
    AND p.publication='published' AND p.id<>$1 ORDER BY j.completed_at DESC LIMIT 1`,
    [id],
  );
  return result.rows[0]?.id;
}
