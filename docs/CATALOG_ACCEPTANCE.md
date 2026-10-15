# Catalog expansion acceptance

## Verified 142-record release — 11 October 2026

Application **9547200** is ready locally and deployed at https://65.0.19.200.sslip.io/shop. It contains 142 offers / 138 distinct families, across eight populated departments. MFK, Parfums de Marly, Amouage and Initio each have fifteen reviewed fragrance families. Product pages and variant metadata bind the concentration, volume, reference and photograph; missing notes, ingredients and performance evidence are not invented. Prices, inventory and fulfilment remain sandbox merchant terms, independent of manufacturer product identity.

[GitHub release verification](https://github.com/Hrushikesh-ramilla/DALE/actions/runs/38153912756) passes lint, type checks, **410 tests in 56 files**, **ten Linux production browser journeys**, **eleven packaged OCR checks**, Linux build and the isolated 10,000-record capacity gate. The local production build and persistent preview also pass. The corrected restoration test looks up the restored record directly rather than assuming it appears on the first 48-record page.

Actual hosted evidence:

- [Twenty customer/commerce checks](evaluations/retail-9547200-prepare.json), using real hosted PostgreSQL and independent owned customer sessions with isolated agent/payment fixtures.
- [Eight persistence checks](evaluations/retail-9547200-restart.json) after an actual app and worker restart; both services report active.
- [Four-house photograph and read-burst receipt](evaluations/fragrance-9547200-hosted.json): actual browser image decoding, fifteen distinct families per house, fifty requests in five waves of ten; network-inclusive p95 425 ms.
- Public cursor traversal: 48/48/46 records, 142 unique IDs. [Linux capacity receipt](evaluations/catalog-capacity-linux-9547200.json): 10,000 isolated synthetic records, 209 pages, ten concurrent typed filters, no fixture leakage, query p95 250 ms. The isolated receipt is not EC2 HTTP throughput or public inventory.

The exact CI artifact was checksum-checked and installed with a pre-upgrade snapshot. Every private setting except BUILD_ID was preserved; no database reset, new model request, billing change or genuine payment capture occurred. The real instance reports 1,905 MiB RAM, so an earlier owner-reported 4 GiB is not used as a measured capacity claim.

This release closes the batch gates. It does **not** close the 2,000-family/per-brand assortment, all category/accessory facts, durable refresh/revision operations, full agent evaluation, genuine payment-provider qualification or sustained commercial-load requirements.


## Database publication foundation — 11 October 2026

The application reads published inventory from PostgreSQL/PGlite, rather than a bundled ID whitelist. Legacy records are classified once at database initialization and are never overwritten on ordinary reads. Imported records can be searched, quoted, purchased in fixtures, grouped between independent shoppers and resolved in historical orders. Withdrawal blocks new checkout while retaining history; restoration requires the original reviewed hash.

The public catalog exposes indexed text search, bounded 48-record pages, category counts and database-derived facets. The storefront consumes these endpoints and resolves imported products in orders and group views. Newly added department types stay hidden until they contain published records.

Operator workflow:

```powershell
npm run catalog:release -- stage catalog/manifests/example.json
npm run catalog:release -- publish RELEASE_ID REVIEWED_HASH
npm run catalog:release -- retire RELEASE_ID
npm run catalog:release -- restore RELEASE_ID REVIEWED_HASH
```

Linux release archives include `scripts/catalog-release.mjs`. Run it with the existing service environment as an authorized operator; never expose a public publication endpoint. A source-reviewed manifest is immutable once its ID is staged. Product IDs cannot replace existing identities. Media attribution distinguishes external manufacturer references from licensed assets; an external reference is not a commercial redistribution license.

Verification: application `3fec71a` passes 401 unit/contract tests, lint, type checks, local and Linux production builds, nine production browser journeys and eleven packaged OCR checks (GitHub run 38149685701). The staged CLI bundle is separately checked against an isolated local database. The publication contract covers a full 500-record isolated batch across eleven pages without duplicates, including withdrawal.

## Reviewed starter batches and hosted receipt

Application `3fec71a` is deployed at https://65.0.19.200.sslip.io/shop with 85 published records across eight nonempty departments: 81 distinct product families. Five ten-model batches add Oakley, Ray-Ban, Tissot, Rolex and Apple phone records with manufacturer photographs, source links and explicit evidence gaps. Combined with the existing iPhone 17, Apple has eleven distinct phone models. These counts describe published models, not current commercial availability or a completed broad assortment.

The watch browser journey verifies a fresh guest task, imported agent review buttons, exact movement/diameter filters, group commitment, a second independent customer joining, retained recommendations after reload, an explicit simulated purchase and private orders. The actual public-site browser confirms Tissot/Oakley photographs render and that blocked photographs show a visible failure message. All imported offers remain sandbox merchant inventory; manufacturer MSRP, commercial stock and affiliation are not inferred.

Twenty actual hosted PostgreSQL/customer/fixture-commerce checks pass: [receipt](evaluations/retail-3fec71a-prepare.json). Eight checks after an actual app/worker restart also pass: [restart receipt](evaluations/retail-3fec71a-restart.json). All private configuration fields except BUILD_ID were preserved during packaging. Installation and public health report the correct ready build. Three actual hosted browser journeys independently verify photograph decoding inside product grids, Ray-Ban filters, a visible blocked-image state, prohibited image targets and nested electronics browsing on desktop/mobile. All tests avoid new model calls, AI spend and real payment capture.

## Cursor and isolated capacity milestone

Filter-bound cursor pagination uses the indexed (price, SKU) continuation, with bounded 48-record responses. Existing page-number clients remain compatible. Withdrawal of an earlier record cannot shift the continuation. Malformed or differently filtered cursors are rejected. The storefront consumes the returned continuation and deduplicates appended results.

The isolated runner `npx tsx scripts/verify-catalog-capacity.ts` creates 10,000 synthetic records only in an in-memory database. All 209 pages contain 10,000 unique products; ten concurrent typed filters return their own results and ordinary public browsing leaks zero fixtures. Local query p95 was 351 ms; an index-only query plan was observed. See [local capacity receipt](evaluations/catalog-capacity-local-20261011.json). These measurements qualify this laptop/PGlite query contract, not EC2 HTTP throughput, a commercial SLA, model accuracy or the real inventory count. The Linux release workflow repeats the capacity gate and retains its receipt.

## Remaining enlarged-scope gates

Operator commands (source retrieval only; review and publication remain separate):

```powershell
npx tsx scripts/collect-manufacturer-fragrances.ts pdm
npx tsx scripts/collect-manufacturer-fragrances.ts amouage
npx tsx scripts/collect-manufacturer-fragrances.ts initio
```

On EC2, use `node /home/ubuntu/catalog-operator/collect-manufacturer-fragrances.mjs MANUFACTURER` from an operator-owned working directory, outside the application checkout. Existing immutable manifest paths are never replaced. A changed feed/profile for an existing collection date fails for review; do not delete checkpoints to disguise a change or automatically overwrite a published SKU. Checkpoints protect process interruptions, not disk failure or commercial offer freshness.

The manufacturer fragrance collector now keeps resumable operator checkpoints under ignored `.data/catalog-ingestion`. They are bound to a feed snapshot, profile and date, and persist only reviewed product/observation results. Re-running the same input reuses completed models; changed inputs or modified checkpoint contents fail for operator review. Four tests cover reconstruction of the identical fourteen-model PDM manifest after interruption, concurrent/idempotent writers, changed inputs and tampering. Five additional [actual Linux filesystem checks](evaluations/catalog-checkpoint-linux-20261011.json) pass for the packaged tool installed in `/home/ubuntu/catalog-operator`, separate from the application release. This does not automatically refresh published inventory or close the worker queue/SKU revision gate. The web application release remains `9547200`; collection is an operator task, never a public request handler.

The requested 2,000-product catalog and per-category, per-brand depth are not implemented by these initial batches. Exact manufacturer manifests, real media, category-specific evidence and shortages must be recorded for every subsequent batch. Watches and sunglasses are populated; footwear and appliances remain hidden until reviewed records are published. Inventory/price refresh jobs, licensed media delivery, full assortment and EC2 commercial load gates remain pending. The original AI, payment and support acceptance statuses remain separate from catalog expansion. No new provider call, AI billing or paid resource is required for fixture acceptance.
