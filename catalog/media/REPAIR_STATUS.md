# Product photograph and identity repair

Updated 2026-10-13. This is an incomplete repair, not a catalog certification.

## Verified results

- Audited 5,666 manifest records and 5,936 existing local assets.
- Found all manifest image provenance overwritten with local paths.
- Restored original image source metadata for 107 records across nine existing v1 manifests without changing product IDs, prices, stock, or other facts.
- Recovered 136 image candidates; approved 112 after source and visual review. Approval does not certify every specification on the associated record.
- Approved images are content-addressed WebP, at most 960 pixels per dimension and 140,000 bytes, with source URLs and hashes recorded in `verified-product-images.json`.
- Storefront rendering and public catalog API responses reject unapproved images, identity/variant mismatches and unsafe asset references. Failed photographs never fall back to another product.

## Outstanding work

The bounded source recovery pass inspected 5,529 grouped URLs. It recorded 2,543 HTTP 404 responses, 1,345 pages without exact-model image evidence and 1,010 URLs deferred after their origins repeatedly denied access. Other responses include redirects, removed pages and network failures. A blocked or dead URL alone does not prove a product is fictitious.

User authorization now includes correcting product records. Remaining work must use manufacturer-identified products and source evidence. Correct facts on the same physical SKU through immutable revisions; retire unidentifiable offers and create replacements with new IDs rather than substituting a different item under an ordered ID. Preserve order snapshots, approvals, payments, stock history and existing private configuration.

Do not execute the legacy `generate-all-missing-packshots.ts` script: it draws generic silhouettes, overwrites provenance and publishes those assets as official photography. Bing search results, logos, generated silhouettes, model families and alternate colors are not exact-product evidence.

## Reproducible checks

Run `node scripts/audit-product-media.mjs` for local asset inventory and contact sheets. Run `node scripts/collect-exact-photo-candidates.mjs` for resumable bounded source discovery, then `node scripts/prepare-exact-photo-candidates.mjs` to prepare unapproved manufacturer candidates. These scripts do not publish records or automatically approve candidates.

Run `npx vitest run tests/verified-product-image.test.ts tests/verified-product-image-assets.test.ts tests/product-media-presentation.test.ts` for the image gate and asset integrity. Type checking passed before the final API projection change and must be rerun afterward.

The broader regression run reported 14 failed, 533 passed and 6 skipped tests. Existing expanded-catalog count assumptions, source mismatches, bootstrap timeouts and legacy heuristic-image expectations remain unresolved. Full lint also contains errors in the crashed agent's existing changes. This checkout is not ready for release.

Browser verification used a separate fixture database on port 3101: an approved MFK photograph decoded correctly; unapproved watch cards showed explicit review status. No AI calls, payments or production database mutations were made. Production HTTPS and restricted SSH timed out; no deployment was performed.
