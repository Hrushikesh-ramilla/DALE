# Marketplace assortment implementation

Updated 11 October 2026. This measures the enlarged catalog, not overall project readiness. Source-reviewed implementation contains 142 offer records representing 138 distinct product families: 6.9% of the 2,000-family target. The original 35-record assortment had 31 families; five ten-model batches and 57 distinct fragrances add 107 families. Size variants do not increase the count. The actual public release `9547200` now contains all 142 records; the fragrance batches passed release and hosted/restart verification. This count does not establish completed brand depth or overall project readiness.

| Category | Records | Distinct families | Published brands |
| --- | ---: | ---: | --- |
| Phones | 14 | 14 | Apple, Samsung, OnePlus, Xiaomi |
| Laptops | 1 | 1 | Apple |
| Tablets | 2 | 2 | Apple, Samsung |
| Headphones (legacy audio category) | 1 | 1 | Sony |
| Storage | 1 | 1 | Samsung |
| Keyboards/mice | 2 | 2 | Logitech |
| Charging | 3 | 3 | Existing sourced device/accessory records |
| Clothing | 6 | 2 | Givenchy, Valentino |
| Fragrance | 65 | 65 | MFK, CHANEL, Tom Ford, Creed, Amouage, Serge Lutens, Maison Margiela, Parfums de Marly, Initio |
| Bags | 4 | 4 | Gucci, Louis Vuitton, Hermès, Michael Kors |
| Beauty | 2 | 2 | Lancôme, CHANEL |
| Home | 1 | 1 | Hermès |
| Watches | 20 | 20 | Rolex, Tissot |
| Sunglasses | 20 | 20 | Oakley, Ray-Ban |

Apple has eleven distinct phone models including the existing iPhone 17. Rolex, Tissot, Oakley and Ray-Ban each have ten distinct models. MFK, Parfums de Marly, Amouage and Initio each have fifteen distinct fragrances in the reviewed implementation. Other houses have not reached their model-depth gates. Footwear, appliance and further electronics department types remain hidden until reviewed records are published.

## Completed implementation milestones

- Additive persisted publication states and immutable reviewed releases, with operator staging, publication, withdrawal and hash-checked restoration. Read operations cannot overwrite imported records or operator changes.
- Database full-text/attribute search, 48-record pages, counts, facets and imported-product resolution for recommendations, groups, quotes, orders and saved conversations.
- Ten-model Oakley, Tissot, Rolex, Ray-Ban and Apple batches, explicit evidence gaps, exact model/reference identities and attributed manufacturer photographs.
- Independent-customer watch group purchase with retained recommendations and order privacy; exact Pro Max model review; category-specific browsing and empty electronics landing grids.
- Reviewed image origin/path allowlist, local-network rejection, bounded image response/redirect/cache policies and visible image errors. External reference attribution is not a commercial image license.
- Resumable operator fragrance collection checkpoints bind reviewed records to the feed hash, profile and date; interrupted work does not recollect completed models. Four regression tests and five packaged Linux filesystem checks pass. This does not replace a durable refresh queue or reviewed SKU revisions.

Verification and actual deployed build are recorded in [CATALOG_ACCEPTANCE.md](CATALOG_ACCEPTANCE.md). A commit containing a manifest does not by itself establish that the public server has installed it.

## Remaining work, in plan order

1. Complete source-reviewed exact-model manifests for every approved brand/category, including manufacturer media and region/release metadata. The requested brand lists remain in MARKETPLACE_CATALOG_PLAN.md; do not replace missing depth with generated names or extra sizes/colours.
2. Expand electronics facts and device/accessory relationships; separate headphones and earbuds from legacy audio without breaking existing orders. Qualify each compatibility claim against explicit protocol/device evidence.
3. Expand clothing, fragrance, watches, bags, shoes, sunglasses, beauty, home and appliances to their per-brand depth gates, with category-specific fact boundaries. Clothing size is not individual fit; fragrance notes are not enjoyment; watch water resistance is not activity suitability; skincare facts do not establish medical safety.
4. Complete general multi-category agent evaluation, contextual refinements, source-backed comparison and unknown-model/unknown-fact cases. Preset fixtures remain testing tools and do not establish live model quality.
5. Add durable ingestion/refresh jobs, reviewed SKU revisions, merchant price/stock feeds and licensed media workflows. Filter-bound cursor pagination and an isolated 10,000-record query-plan/traversal gate are implemented. A fifty-request EC2 catalog burst at concurrency ten passes against 142 records; sustained commercial and 2,000-record HTTP load gates remain pending.
6. Verify import withdrawal/restoration, migrations, independent-account commerce and app/worker restart on the actual host for each release. Retain the working release and existing customer/provider data.

## Manual checks for the reviewed batches

Use the local fixture preview to avoid provider calls and payment spend. Enter a task in the homepage prompt, select **Ask DALE**, then send it from the shopping conversation:

- `Find Apple iPhone 18 Pro Max with 256GB storage under $1500` — exactly the Pro Max record, source facts and explicit unknown RAM; opening its review must not create an order.
- `Find a Tissot quartz watch with a 40mm case under $600 and use group buying` — matching quartz/40mm records, conditional group offers and commitment without payment. A different browser profile joins the same product; the first customer's group becomes ready. Payment still requires approval of the quote.
- `Find Rayban sunglasses under $250 and use group buying` — the Ray-Ban filter resolves despite the compact spelling. A request for polarized lenses cannot treat unverified lens information as a match.
- `Find Oakley Holbrook XL sunglasses under $250` — clarification instead of a substitution with base Holbrook.
- `Find MFK APOM eau de parfum 70ml under $400 and use group buying` — exact APOM bottle, concentration and volume; conditional group terms with a separate commitment. Allergy-safety requests must not become guarantees.
- `Find PDM Delina Exclusif parfum 75ml under $400` — the exact source-classified Parfum record, not an invented eau de parfum substitution.
- `Find Initio Rehab extrait de parfum 90ml under $400` — the documented extrait record. `Find Initio Atomic Rose extrait de parfum` must ask for clarification because that concentration is not documented for the reviewed Atomic Rose offer.

Browse **Fragrance**, then select MFK, Parfums de Marly, Amouage or Initio in **Brand**: each returns fifteen distinct families with manufacturer photos and source links. Clear filters and use **Load more**: 142 records arrive across three pages (48/48/46). These published products do not need sample role switching to be discovered. Independent browsers retain separate accounts and shared eligible group state; fixture tests isolate financial operations from genuine PayPal capture.

Browse **Electronics**: choose a category before any products appear. Browse **Watches** or **Sunglasses**: a product grid opens directly, and brand/model filters use published database facts. Product photographs must decode inside the grid; a failed image must show its product name and a clear failure message with the source still available.
