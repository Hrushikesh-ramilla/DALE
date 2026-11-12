# Bundled catalog origin repair — 25 October 2026

Scope: repair source-origin declarations preventing a fresh database bootstrap. This review establishes manufacturer website origins, not product-specific specifications, stock, photo rights, authenticity or current retailer pricing. Existing product facts and review dates are not newly certified by this change.

The expanded manifests included products whose source hosts were absent from their own approved lists. Retained all listings and kept the strict origin validator. Added only the explicitly reviewed manufacturer origins below; no automatic trust of arbitrary product URLs.

| Manifest | Reviewed additional origins / supporting manufacturer pages |
| --- | --- |
| Phones | [OPPO](https://www.oppo.com/en/smartphones/), [HONOR](https://www.honor.com/au/phones/), [Sony](https://www.sony.com/electronics/support/mobile-phones-tablets-mobile-phones/xperia-1/articles/SX243901), [ASUS](https://www.asus.com/mobile-handhelds/phones/all-series/) |
| Backpacks | [Hermès](https://www.hermes.com/us/en/) |
| Boots, formal shoes, trousers | [Loro Piana](https://www.loropiana.com/) |
| Earbuds | [Bang & Olufsen](https://www.bang-olufsen.com/en/us) |
| Shirts | [Brunello Cucinelli](https://shop.brunellocucinelli.com/) |
| Watches | [Seiko](https://www.seikowatches.com/), [Breguet](https://www.breguet.com/en), [Blancpain](https://www.blancpain.com/en), [Girard-Perregaux](https://www.girard-perregaux.com/en-us), [A. Lange & Söhne](https://www.alange-soehne.com/gb-en), [Ulysse Nardin](https://www.ulysse-nardin.com/en-us); Apple and Samsung hosts already reviewed in the bundled electronics manifests |

Watch additions contained malformed manufacturer origins `www.alangeshne.com`, `www.girardperregaux.com`, and `www.ulyssenardin.com`. Corrected source/media-source references to the explicit official hyphenated domains above. Normalized Seiko references from the generic `www.seiko.com` to the watch corporation's `www.seikowatches.com`. These are manufacturer-homepage references; product-specific supporting references remain a separate evidence-quality limitation. No product identifier, specification, price, stock or image bytes were changed by this repair.

The storage navigation assertion also expected planned census leaves `internal-ssds` and `hard-drives`, although neither is a supported storefront leaf or has a bundled core manifest. Updated the test to distinguish implemented portable SSD navigation from those census targets. No categories were silently added or existing listings removed.

Regression coverage: `tests/catalog-bootstrap-contract.test.ts` validates every bundled v2 manifest before database startup and verifies that an unreviewed origin is still rejected. Customer/session and publication/restart checks qualify behavior separately; consult the implementation ledger for current results.
