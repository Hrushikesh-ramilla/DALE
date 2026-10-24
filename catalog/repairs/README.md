# Catalog repair status — 24 October 2026

The repair policy is **verify and correct first**. A missing page, blocked request,
or incomplete first search is not a reason to remove a product. There is no target
catalog size and no exclusive product allowlist.

## Applied to the current preview

| Change | Count |
| --- | ---: |
| Active listings before repairs | 4,489 |
| Source-bound repair operations | 342 |
| Ambiguous legacy offers replaced by separately identified references | 252 |
| Duplicate offers consolidated into exact manufacturer references | 6 |
| Existing offers corrected in place | 84 |
| Generic descriptions and specification labels copy-edited | 4,087 |
| Active listings after repairs | 4,483 |
| Products removed solely because verification was incomplete | 0 |

The repair manifests record the old identity, observed preimages, new reference,
source, manufacturer SKU and photograph hash. The six consolidations are
five duplicate Amouage bottle offers and one duplicate MFK Petit Matin 70 ml
offer, not withdrawals for lack of information.

The follow-up manifests correct eight fragrance records, preserve three Givenchy
S/M/L variants while correcting their contradictory charcoal color to Dark
Havanna, and bind the Silver Shadow 256GB Galaxy Z Fold6 to Samsung SKU
SM-F956BZSBEUB and EAN 8806095667645. Photographs and bottle sizes follow the
selected references. Manufacturer notes replace unsupported note pyramids.
Missing legacy browse indexes are recovered from existing metadata without
rewriting product facts or assigning arbitrary categories.

Historical product and order records remain intact. Each applied operation has
a database receipt with its preimage and evidence. In-place repairs preserve live
prices and stock. Repeating initialization does not resurrect later withdrawals.
Copy editing does not establish or change factual verification.

Category previews use the corresponding product's actual name and photograph.
Department/category navigation and watch-house counts come from published
inventory. Empty brand/category destinations are hidden or redirected. Public
product access excludes fixtures and retired offers; recorded replacement links
redirect to their still-published replacements.

## Verification still outstanding

**This is not a claim that all 4,483 listings have completed factual verification.**
The source investigation checked the original catalog URLs, alternate references
for 3,752 flagged listings, another 484 original pages for structured product data,
and 27,320 manufacturer-feed records. Candidate matches remain research evidence
until model generation, variant, specifications and photograph agree.

Unresolved listings remain available while further recovery is attempted. The
unapplied draft corrections are deliberately excluded from the release: some
manufacturer redirects point to a newer generation; some generic images show a
different bottle size or color. A completed future withdrawal requires a specific
product-level reason and documented unsuccessful recovery, not a network status.

## Checks

- 32 focused tests passed: repair migration, exact-photo bindings, catalog
  publication, historical orders, deterministic retrieval, language handling,
  safe taxonomy and idempotent index recovery.
- The scoped release type-checks and passes ESLint.
- All 342 operations applied to both fresh and current preview databases; none remained pending.
- All 4,483 active listings have usable category indexes. Exact-model retrieval
  finds the corrected Fold6, all three Givenchy sizes and one Petit Matin offer.
- No published record has an empty name, media reference or source field.

The database was backed up before application. Research bodies, session data and
private evidence caches are not part of the published repository.

Two discontinued Tudor references were recovered without dropping them: the Black Bay Fifty-Eight M79030N-0001 uses [Tudor’s archived reference sheet](https://media.tudorwatch.com/image/upload/fl_attachment/v1/tudorwatch/pressroom/products/black-bay-58/pdf/bw18-tudor-black-bay-fifty-eight-en.pdf), and the Royal M28600-0005 uses its [REEDS product reference](https://www.reeds.com/tudor-royal-blue-dial-stainless-steel-watch-41mm-m28600-0005-plum28600-0005.html). Exact dial/bracelet photographs were obtained at their original resolution, rather than substituted with current-generation models.
