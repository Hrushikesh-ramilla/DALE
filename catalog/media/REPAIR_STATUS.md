# Product photograph and identity repair

Updated 2026-10-14. This is an incomplete repair, not a catalog certification.

## Latest repair checkpoint

The previous 141-approval figure was too broad: 17 bottle photographs were withdrawn after finding contradictions between selected 50/75 ml variants and recorded 100/125 ml specifications. A volume consistency gate now rejects those contradictions. The preserved conflict report contains 157 records. Six Parfums de Marly 75 ml records and Baccarat Rouge 540 35 ml now have exact photographs and tested fact-revision recipes.

There are currently 155 approved photograph bindings: 124 match unchanged original manifests, seven require reviewed fact corrections, and 24 belong to manufacturer-identified replacements (ten Serge Lutens, ten Amouage and four Portronics chargers). Replacements use new IDs for physical SKU changes; old records are retained and their offers retired atomically. All 31 changes were applied only to the isolated preview database, not production. The unchanged-manifest ledger therefore still reports 5,542 pending records; it does not pretend local database revisions are already deployed.

The replacement service checks current record hashes, preserves old records, writes an operator audit, rejects altered replays and commits new offers plus old-offer withdrawal in one transaction. Seventeen focused tests and type checking passed. All 24 replacement APIs and served photographs passed identity, attribute, image hash, compression and historical-record checks. Browser verification showed Chergui 100 ml, Opus XIV Royal Tobacco EDP 100 ml and Adapto 45 Plus with their matching photographs and specifications, with no reported JavaScript errors. The local detail page has a pre-existing text contrast problem; correcting its image does not certify its entire design.

Royal Tobacco's previous Extrait label was corrected to the manufacturer's documented EDP SKU under a new identity. Portronics Adapto 45B was rejected: its manufacturer description says two output ports while its primary photo shows three. The four approved chargers contain no guessed device-specific compatibility, voltage profiles or port-sharing guarantees. A separate Adapto 45 Plus reference has matching two-port imagery and documented GaN/PPS facts.

To apply reviewed corrections to an authorized target database: run `npx tsx scripts/apply-reviewed-media-repairs.ts review catalog/media/reviewed-bottle-repairs.json`, then its `apply` command. For the ten replacements, run `npx tsx scripts/publish-reviewed-media-replacements.ts review catalog/media/evidence/serge-lutens-replacement-batch.json`, then its `apply` command. Confirm the target environment before using either privileged operator command. Both support checked replays; neither calls an AI/payment provider or deletes old product records. The complete catalog repair and production deployment remain unfinished.

Use the same replacement command for `amouage-replacement-batch.json` and `portronics-replacement-batch.json`. Run `node scripts/verify-reviewed-media-replacements.mjs <application-origin> catalog/media/evidence/serge-lutens-replacement-batch.json catalog/media/evidence/amouage-replacement-batch.json catalog/media/evidence/portronics-replacement-batch.json` against the actual target after publication. The verifier is read-only and never places orders or calls inference.

The following inspection statistics describe the earlier checkpoint; approval figures are superseded above.

## Verified results

- Audited 5,666 manifest records and 5,936 existing local assets.
- Found all manifest image provenance overwritten with local paths.
- Restored original image source metadata for 107 records across nine existing v1 manifests without changing product IDs, prices, stock, or other facts.
- Recovered 165 image candidates; approved 141 after source and visual review. Approval does not certify every specification on the associated record.
- The additional 29 fragrances use manufacturer product handles, exact bottle volumes and SKU-bound photograph associations. Their evidence is retained in `evidence/fragrance-feed-variants-2026-10-13.json`.
- Approved images are content-addressed WebP, at most 960 pixels per dimension and 140,000 bytes, with source URLs and hashes recorded in `verified-product-images.json`.
- Storefront rendering and public catalog API responses reject unapproved images, identity/variant mismatches and unsafe asset references. Failed photographs never fall back to another product.

## Outstanding work

The first inspection pass now covers every original record:

- 4,607 originals exactly reproduce the legacy generic SVG drawing generator and are rejected as product photographs.
- 993 other original images were visually inspected in 42 labeled contact sheets: 246 have concrete visual mismatches and 747 require further exact model/variant/source verification.
- 66 other originals already have reviewed replacements.

These sets total 5,666 records. The deterministic classification and per-record hashes are retained in `evidence/original-image-classification-2026-10-13.json`; manual decisions, reasons and sheet positions are retained in `original-image-visual-reviews.json`. The pure drawing functions are archived as forensic evidence, not used to produce storefront imagery. A nonmatching reconstruction or plausible thumbnail never automatically grants approval. The current 141 approved replacements include some records whose originals were generated drawings; do not add 141 to the inspection sets as if they were different records.

Six focused verification tests pass, including a completeness check requiring an exact generated-image rejection, explicit manual review, or approved replacement for every original record. This validates coverage and asset integrity, not the completion of the remaining replacement work.

The bounded source recovery pass inspected 5,529 grouped URLs. It recorded 2,543 HTTP 404 responses, 1,345 pages without exact-model image evidence and 1,010 URLs deferred after their origins repeatedly denied access. Other responses include redirects, removed pages and network failures. A blocked or dead URL alone does not prove a product is fictitious.

User authorization now includes correcting product records. Remaining work must use manufacturer-identified products and source evidence. Correct facts on the same physical SKU through immutable revisions; retire unidentifiable offers and create replacements with new IDs rather than substituting a different item under an ordered ID. Preserve order snapshots, approvals, payments, stock history and existing private configuration.

Do not execute the legacy `generate-all-missing-packshots.ts` script: it draws generic silhouettes, overwrites provenance and publishes those assets as official photography. Bing search results, logos, generated silhouettes, model families and alternate colors are not exact-product evidence.

## Reproducible checks

Run `node scripts/audit-product-media.mjs` for local asset inventory and contact sheets. Run `node scripts/collect-exact-photo-candidates.mjs` for resumable bounded source discovery, then `node scripts/prepare-exact-photo-candidates.mjs` to prepare unapproved manufacturer candidates. These scripts do not publish records or automatically approve candidates.

Run `npx vitest run tests/verified-product-image.test.ts tests/verified-product-image-assets.test.ts tests/product-media-presentation.test.ts` for the image gate and asset integrity. All five tests passed after the latest photograph batch; type checking also passed after the API projection change. The local Layton detail API returned HTTP 200 and its verified image and manufacturer source.

Run `node scripts/report-product-media-repair.mjs` for the full per-record JSON/CSV ledger. Current scope is 5,666 records, 141 approved images and 5,525 pending. No catalog records or original assets were deleted. Missing images remain incomplete work; hiding them does not count as repairing them. Candidate preparation checkpoints the registry atomically after each image to preserve progress if interrupted.

The broader regression run reported 14 failed, 533 passed and 6 skipped tests. Existing expanded-catalog count assumptions, source mismatches, bootstrap timeouts and legacy heuristic-image expectations remain unresolved. Full lint also contains errors in the crashed agent's existing changes. This checkout is not ready for release.

Browser verification used a separate fixture database on port 3101: an approved MFK photograph decoded correctly; unapproved watch cards showed explicit review status. No AI calls, payments or production database mutations were made. Production HTTPS and restricted SSH timed out; no deployment was performed.
