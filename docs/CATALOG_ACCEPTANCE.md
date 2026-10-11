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

Verification: the complete pre-assortment suite passes 387 tests; the added withdrawal/restore contract passes with the focused publication/language suite (10 tests). A production build passes. The staged CLI bundle is separately checked against an isolated local database. Subsequent assortment and hosted browser receipts are recorded below when completed.

## Remaining enlarged-scope gates

The requested 2,000-product catalog and per-category, per-brand depth are not implemented by this foundation. Exact manufacturer manifests, real media, category-specific evidence and shortages must be recorded for every subsequent batch. Watches, footwear and other newly typed departments have no public stock until reviewed records are published. The original AI, payment and support acceptance statuses remain separate from catalog expansion. No new provider call, AI billing or paid resource is required for fixture acceptance.
