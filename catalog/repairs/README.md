# Catalog repair status — 24 October 2026

The repair policy is **verify and correct first**. A missing page, blocked request,
or incomplete first search is not a reason to remove a product. There is no target
catalog size and no exclusive product allowlist.

## Applied to the current preview

| Change | Count |
| --- | ---: |
| Active listings before repairs | 4,489 |
| Source-bound repair operations | 329 |
| Ambiguous legacy offers replaced by separately identified references | 252 |
| Duplicate offers consolidated into those same exact manufacturer SKUs | 5 |
| Existing offers corrected in place | 72 |
| Generic descriptions and specification labels copy-edited | 4,087 |
| Active listings after repairs | 4,484 |
| Products removed solely because verification was incomplete | 0 |

The repair manifests record the old identity, observed preimages, new reference,
source, manufacturer SKU and photograph hash. The five consolidations are
duplicate Amouage bottle offers, not withdrawals for lack of information.

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

**This is not a claim that all 4,484 listings have completed factual verification.**
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

- 27 focused tests passed: repair migration, exact-photo bindings, catalog
  publication, historical orders, deterministic retrieval and language handling.
- The scoped release type-checks and passes ESLint.
- All 329 operations applied to the current preview database; none remained pending.
- No published record has an empty name, media reference or source field.

The database was backed up before application. Research bodies, session data and
private evidence caches are not part of the published repository.

Two discontinued Tudor references were recovered without dropping them: the Black Bay Fifty-Eight M79030N-0001 uses [Tudor’s archived reference sheet](https://media.tudorwatch.com/image/upload/fl_attachment/v1/tudorwatch/pressroom/products/black-bay-58/pdf/bw18-tudor-black-bay-fifty-eight-en.pdf), and the Royal M28600-0005 uses its [REEDS product reference](https://www.reeds.com/tudor-royal-blue-dial-stainless-steel-watch-41mm-m28600-0005-plum28600-0005.html). Exact dial/bracelet photographs were obtained at their original resolution, rather than substituted with current-generation models.
