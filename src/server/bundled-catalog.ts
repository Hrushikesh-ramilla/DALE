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
import headphonesCore from "../../catalog/manifests/headphones-core-2026-10-11-v2.json";
import keyboardsCore from "../../catalog/manifests/keyboards-core-2026-10-11-v2.json";
import laptopsCore from "../../catalog/manifests/laptops-core-2026-10-11-v2.json";
import miceCore from "../../catalog/manifests/mice-core-2026-10-11-v2.json";
import phonesCore from "../../catalog/manifests/phones-core-2026-10-11-v2.json";
import portableSsdsCore from "../../catalog/manifests/portable-ssds-core-2026-10-11-v2.json";
import powerBanksCore from "../../catalog/manifests/power-banks-core-2026-10-11-v2.json";
import speakersCore from "../../catalog/manifests/speakers-core-2026-10-11-v2.json";
import tabletsCore from "../../catalog/manifests/tablets-core-2026-10-11-v2.json";
import wallChargersCore from "../../catalog/manifests/wall-chargers-core-2026-10-11-v2.json";
import watchesCore from "../../catalog/manifests/watches-core-2026-10-11-v2.json";
import fragranceCore from "../../catalog/manifests/fragrance-core-2026-10-11-v2.json";
import sunglassesCore from "../../catalog/manifests/sunglasses-core-2026-10-11-v2.json";
import handbagsCore from "../../catalog/manifests/handbags-core-2026-10-11-v2.json";
import backpacksCore from "../../catalog/manifests/backpacks-core-2026-10-11-v2.json";
import bootsCore from "../../catalog/manifests/boots-core-2026-10-11-v2.json";
import formalShoesCore from "../../catalog/manifests/formal-shoes-core-2026-10-11-v2.json";
import lifestyleSneakersCore from "../../catalog/manifests/lifestyle-sneakers-core-2026-10-11-v2.json";
import runningShoesCore from "../../catalog/manifests/running-shoes-core-2026-10-11-v2.json";
import suitsCore from "../../catalog/manifests/suits-core-2026-10-11-v2.json";
import shirtsCore from "../../catalog/manifests/shirts-core-2026-10-11-v2.json";
import jacketsCore from "../../catalog/manifests/jackets-core-2026-10-11-v2.json";
import coatsCore from "../../catalog/manifests/coats-core-2026-10-11-v2.json";
import denimCore from "../../catalog/manifests/denim-core-2026-10-11-v2.json";
import dressesCore from "../../catalog/manifests/dresses-core-2026-10-11-v2.json";
import knitwearCore from "../../catalog/manifests/knitwear-core-2026-10-11-v2.json";
import trousersCore from "../../catalog/manifests/trousers-core-2026-10-11-v2.json";
import kitchenwareCore from "../../catalog/manifests/kitchenware-core-2026-10-11-v2.json";
import decorCore from "../../catalog/manifests/decor-core-2026-10-11-v2.json";
import homeTextilesCore from "../../catalog/manifests/home-textiles-core-2026-10-11-v2.json";

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
    keyboardsCore,
    miceCore,
    watchesCore,
    fragranceCore,
    sunglassesCore,
    handbagsCore,
    backpacksCore,
    bootsCore,
    formalShoesCore,
    lifestyleSneakersCore,
    runningShoesCore,
    suitsCore,
    shirtsCore,
    jacketsCore,
    coatsCore,
    denimCore,
    dressesCore,
    knitwearCore,
    trousersCore,
    kitchenwareCore,
    decorCore,
    homeTextilesCore,
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
      if (existing.rows[0].content_hash !== hash) {
        await sql.query(
          "UPDATE catalog_releases SET content_hash=$1, manifest=$2::jsonb WHERE id=$3",
          [hash, JSON.stringify(manifest), manifest.id],
        );
      }
      const existingProductIds = await sql.query<{ id: string }>(
        "SELECT id FROM catalog_products WHERE id=ANY($1::text[])",
        [manifest.products.map((p) => p.id)],
      );
      const existingSet = new Set(existingProductIds.rows.map((r) => r.id));
      const missingProducts = manifest.products.filter(
        (p) => !existingSet.has(p.id),
      );
      if (missingProducts.length === 0) {
        continue;
      }
    } else {
      await sql.query(
        "INSERT INTO catalog_releases(id,content_hash,status,manifest,reviewed_by,published_at) VALUES($1,$2,'published',$3::jsonb,$4,now())",
        [manifest.id, hash, content, manifest.reviewedBy],
      );
    }
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
      AS items(id text,category text,price integer,record jsonb,publication text,leaf_type text,brand text,model_name text,sku_variant text,revision_id text)
      ON CONFLICT(id) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        record = EXCLUDED.record,
        publication = EXCLUDED.publication,
        leaf_type = EXCLUDED.leaf_type,
        brand = EXCLUDED.brand,
        model_name = EXCLUDED.model_name,
        sku_variant = EXCLUDED.sku_variant`,
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

