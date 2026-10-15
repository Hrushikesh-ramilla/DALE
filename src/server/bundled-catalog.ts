import { createHash } from "node:crypto";
import watches from "../../catalog/manifests/watches-tissot-2026-10-11-v1.json";
import rolex from "../../catalog/manifests/watches-rolex-2026-10-11-v1.json";
import rayBan from "../../catalog/manifests/eyewear-ray-ban-2026-10-11-v1.json";
import applePhones from "../../catalog/manifests/phones-apple-2026-10-11-v1.json";
import eyewear from "../../catalog/manifests/eyewear-oakley-2026-10-11-v1.json";
import mfk from "../../catalog/manifests/fragrance-mfk-2026-10-11-v1.json";
import pdm from "../../catalog/manifests/fragrance-pdm-2026-10-11-v1.json";
import amouage from "../../catalog/manifests/fragrance-amouage-2026-10-11-v1.json";
import initio from "../../catalog/manifests/fragrance-initio-2026-10-11-v1.json";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseAnyCatalogManifest, catalogManifestSchema } from "@/domain/catalog-manifest";
import { isLeafTypeKey, leafTypeKeys } from "@/domain/departments";
import type { Sql } from "./database";

import earbudsCore from "../../catalog/manifests/earbuds-core-2026-10-11-v2.json";
import hardDrivesCore from "../../catalog/manifests/hard-drives-core-2026-10-11-v2.json";
import headphonesCore from "../../catalog/manifests/headphones-core-2026-10-11-v2.json";
import internalSsdsCore from "../../catalog/manifests/internal-ssds-core-2026-10-11-v2.json";
import keyboardsCore from "../../catalog/manifests/keyboards-core-2026-10-11-v2.json";
import laptopsCore from "../../catalog/manifests/laptops-core-2026-10-11-v2.json";
import miceCore from "../../catalog/manifests/mice-core-2026-10-11-v2.json";
import phonesCore from "../../catalog/manifests/phones-core-2026-10-11-v2.json";
import portableSsdsCore from "../../catalog/manifests/portable-ssds-core-2026-10-11-v2.json";
import powerBanksCore from "../../catalog/manifests/power-banks-core-2026-10-11-v2.json";
import speakersCore from "../../catalog/manifests/speakers-core-2026-10-11-v2.json";
import tabletsCore from "../../catalog/manifests/tablets-core-2026-10-11-v2.json";
import wallChargersCore from "../../catalog/manifests/wall-chargers-core-2026-10-11-v2.json";

/** Deploy the reviewed starter batch once. Withdrawal survives subsequent restarts. */
export async function bootstrapReviewedCatalog(sql: Sql) {
  for (const input of [
    eyewear,
    watches,
    rolex,
    rayBan,
    applePhones,
    mfk,
    pdm,
    amouage,
    initio,
  ]) {
    const manifest = catalogManifestSchema.parse(input);
    const content = JSON.stringify(manifest);
    const hash = createHash("sha256").update(content).digest("hex");
    const existing = await sql.query<{ content_hash: string }>(
      "SELECT content_hash FROM catalog_releases WHERE id=$1",
      [manifest.id],
    );
    if (existing.rows.length) {
      if (existing.rows[0].content_hash !== hash) {
        await sql.query("UPDATE catalog_releases SET content_hash=$1, manifest=$2::jsonb WHERE id=$3", [hash, JSON.stringify(manifest), manifest.id]);
        for (const p of manifest.products) {
          await sql.query(
            "UPDATE catalog_products SET record=$1::jsonb WHERE id=$2",
            [JSON.stringify(p), p.id]
          );
        }
      }
      continue;
    }
    const collision = await sql.query(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length)
      throw new Error(
        "Bundled catalog cannot replace existing product identities.",
      );
    if (manifest.products.some((p) => !p.media || p.comparisonOnly))
      throw new Error(
        "The reviewed starter batch requires purchasable records and attributed media.",
      );
    await sql.query(
      "INSERT INTO catalog_releases(id,content_hash,status,manifest,reviewed_by,published_at) VALUES($1,$2,'published',$3::jsonb,$4,now())",
      [manifest.id, hash, content, manifest.reviewedBy],
    );
    await sql.query(
      `INSERT INTO catalog_products(id,category,price,record,publication,release_id)
    SELECT id,category,price,record,'published',$2 FROM jsonb_to_recordset($1::jsonb)
    AS items(id text,category text,price integer,record jsonb)`,
      [
        JSON.stringify(
          manifest.products.map((record) => ({
            id: record.id,
            category: record.category,
            price: record.price,
            record,
          })),
        ),
        manifest.id,
      ],
    );
  }

  // Deploy All Core Expanded manifests across all 50 leaf targets
  const coreInputs: unknown[] = [
    laptopsCore,
    tabletsCore,
    phonesCore,
    headphonesCore,
    earbudsCore,
    speakersCore,
    wallChargersCore,
    powerBanksCore,
    portableSsdsCore,
    internalSsdsCore,
    hardDrivesCore,
    keyboardsCore,
    miceCore,
  ];

  for (const leaf of leafTypeKeys) {
    const candidatePaths = [
      resolve(process.cwd(), `catalog/manifests/${leaf}-core-2026-10-11-v2.json`),
      resolve(process.cwd(), `.next/standalone/catalog/manifests/${leaf}-core-2026-10-11-v2.json`),
    ];
    for (const p of candidatePaths) {
      if (existsSync(p)) {
        try {
          const raw = JSON.parse(readFileSync(p, "utf-8"));
          if (!coreInputs.some((existing: any) => existing?.id === raw?.id)) {
            coreInputs.push(raw);
          }
          break;
        } catch {
          // ignore read error
        }
      }
    }
  }

  for (const input of coreInputs) {
    const manifest = parseAnyCatalogManifest(input);
    const content = JSON.stringify(manifest);
    const hash = createHash("sha256").update(content).digest("hex");
    const existing = await sql.query<{ content_hash: string }>(
      "SELECT content_hash FROM catalog_releases WHERE id=$1",
      [manifest.id],
    );
    if (existing.rows.length) {
      continue;
    }
    const collision = await sql.query(
      "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
      [manifest.products.map((p) => p.id)],
    );
    if (collision.rows.length) {
      continue;
    }
    await sql.query(
      "INSERT INTO catalog_releases(id,content_hash,status,manifest,reviewed_by,published_at) VALUES($1,$2,'published',$3::jsonb,$4,now())",
      [manifest.id, hash, content, manifest.reviewedBy],
    );
    const records = manifest.products.map((p) => {
      const p2 = p as Record<string, unknown>;
      const brand = p.brand || p.attributes?.brand || null;
      const modelName =
        (p2.modelName as string | undefined) ||
        p.attributes?.modelName ||
        null;
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
      [JSON.stringify(records), manifest.id],
    );
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
  }
}

