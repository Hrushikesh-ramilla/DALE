# Catalog repair status — 24 October 2026

The repair policy is **verify and correct first**. A missing page, blocked request,
or incomplete first search is not a reason to remove a product. There is no target
catalog size and no exclusive product allowlist.

## Applied to the current preview

| Change | Count |
| --- | ---: |
| Active listings before repairs | 4,489 |
| Source-bound repair operations | 407 |
| Ambiguous legacy offers replaced by separately identified references | 252 |
| Duplicate offers consolidated into exact manufacturer references | 27 |
| Existing offers corrected in place | 128 |
| Generic descriptions and specification labels copy-edited | 4,087 |
| Active listings after repairs | 4,462 |
| Products removed solely because verification was incomplete | 0 |

The repair manifests record the old identity, observed preimages, new reference,
source, manufacturer SKU and photograph hash. Consolidations cover exact
Amouage, Initio, Parfums de Marly and MFK bottle duplicates with matching
concentrations and manufacturer variants, plus the exact Balenciaga Track
style/color duplicated across lifestyle and running categories. They are not
withdrawals for lack of information.

The follow-up manifests correct eight fragrance records, preserve three Givenchy
S/M/L variants while correcting their contradictory charcoal color to Dark
Havanna, and bind the Silver Shadow 256GB Galaxy Z Fold6 to Samsung SKU
SM-F956BZSBEUB and EAN 8806095667645. Photographs and bottle sizes follow the
selected references. Manufacturer notes replace unsupported note pyramids.
Missing legacy browse indexes are recovered from existing metadata without
rewriting product facts or assigning arbitrary categories.

Twenty surviving fragrance references now include concise manufacturer-described
compositions. Therapeutic, attraction and medical marketing claims are excluded.
Five Logitech references bind exact Graphite SKUs to their photographs, keyboard
language and switch choice or mouse handedness. Conditional battery claims remain
in their original days/months and usage conditions; they are not represented as
continuous operating hours. Receiver inclusion is specific to the selected SKU.

Eighteen Rolex and TAG Heuer references now include the exact dial, case,
bracelet/strap, calibre and supported technical properties. The Sky-Dweller
m336934-0001 is corrected to its mint-green dial. The quartz Formula 1 no longer
claims a mechanical power reserve. The discontinued Monaco Calibre 11 remains
available as a documented reference, with its status disclosed. Tiny lazy-load
thumbnails are replaced with the original-resolution manufacturer photographs.

Brand counts group case variants together. Browsing uses the indexed brand rather
than requiring a second exact match against potentially different legacy attribute
spellings. This repairs Chanel/CHANEL counts and missing All-Clad and Apple results.

The black Balenciaga Track reference 542023W1GB11000 is classified as a lifestyle
sneaker from the manufacturer's stated everyday styling. Its duplicate
"performance" running listing is consolidated into that reference. Unsupported
heel-drop, stack-height, pronation, weight and 176-panel claims are removed;
manufacturer-confirmed construction, origin and full-resolution photography are
recorded instead. An unspecified shoe size is disclosed rather than invented.

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

**This is not a claim that all 4,462 listings have completed factual verification.**
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

- 37 focused tests passed: repair migration, exact-photo bindings, catalog
  publication, historical orders, deterministic retrieval, language handling,
  safe taxonomy, idempotent index recovery, duplicate references and conditional
  battery/receiver variants, watch reference fields, brand scope consistency and
  the lifestyle/performance duplicate correction.
- The scoped release type-checks and passes ESLint.
- All 407 operations applied to both fresh and current preview databases; none remained pending.
- All 4,462 active listings have usable category indexes. Exact-model retrieval
  finds the corrected Fold6, all three Givenchy sizes and one Petit Matin offer.
- No published record has an empty name, media reference or source field.
- The production audit checked all 38 populated categories and 495 brand scopes:
  every page responded successfully and every brand count matched its filtered
  inventory. The 93-page API scan found no duplicate IDs or missing local images;
  browser checks found no runtime errors. Historical audited replacement links
  redirect to their published references.

The database was backed up before application. Research bodies, session data and
private evidence caches are not part of the published repository.

Two discontinued Tudor references were recovered without dropping them: the Black Bay Fifty-Eight M79030N-0001 uses [Tudor’s archived reference sheet](https://media.tudorwatch.com/image/upload/fl_attachment/v1/tudorwatch/pressroom/products/black-bay-58/pdf/bw18-tudor-black-bay-fifty-eight-en.pdf), and the Royal M28600-0005 uses its [REEDS product reference](https://www.reeds.com/tudor-royal-blue-dial-stainless-steel-watch-41mm-m28600-0005-plum28600-0005.html). Exact dial/bracelet photographs were obtained at their original resolution, rather than substituted with current-generation models.
