# Catalog expansion acceptance

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

Verification: application `5ce1403` passes 394 unit/contract tests, lint, type checks, local and Linux production builds, six production browser journeys and eleven packaged OCR checks. The staged CLI bundle is separately checked against an isolated local database. The publication contract covers a full 500-record isolated batch across eleven pages without duplicates, including withdrawal; this is functional capacity coverage, not a 10,000-product commercial load result.

## Reviewed starter batches and hosted receipt

Application `5ce1403` is deployed at https://65.0.19.200.sslip.io/shop with 55 published records across eight nonempty departments. Ten Oakley sunglasses and ten Tissot watches are distinct exact-model/reference records with manufacturer photographs, source links and explicit evidence gaps. Ten additional Rolex collections are implemented in the next batch; its source/parser/query tests pass, but it is not part of the `5ce1403` release.

The watch browser journey verifies a fresh guest task, imported agent review buttons, exact movement/diameter filters, group commitment, a second independent customer joining, retained recommendations after reload, an explicit simulated purchase and private orders. The actual public-site browser confirms Tissot/Oakley photographs render and that blocked photographs show a visible failure message. All imported offers remain sandbox merchant inventory; manufacturer MSRP, commercial stock and affiliation are not inferred.

Twenty actual hosted PostgreSQL/customer/fixture-commerce checks pass: [receipt](evaluations/retail-5ce1403-prepare.json). Private configuration fields were preserved during packaging. The installation health reports the correct ready build. A separate post-install app/worker restart verification is pending because the subsequent restricted SSH connection timed out; it is not marked passed. All tests avoid new model calls, AI spend and real payment capture.

## Remaining enlarged-scope gates

The requested 2,000-product catalog and per-category, per-brand depth are not implemented by these initial batches. Exact manufacturer manifests, real media, category-specific evidence and shortages must be recorded for every subsequent batch. Watches and sunglasses are populated; footwear and appliances remain hidden until reviewed records are published. Cursor pagination, inventory/price refresh jobs, licensed media delivery and commercial load gates remain pending. The original AI, payment and support acceptance statuses remain separate from catalog expansion. No new provider call, AI billing or paid resource is required for fixture acceptance.
