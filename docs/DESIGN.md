# DALE editorial storefront

The storefront uses charcoal, black, off-white and muted neutral surfaces, generous product space, and serif editorial headings paired with a readable sans-serif interface. Inspiration came from [Awwwards' ETQ Amsterdam listing](https://www.awwwards.com/websites/html/?mobile=1&page=174) and direct inspection of [ETQ's storefront](https://www.etq-amsterdam.com/): substantial product presentation, restrained navigation, collection browsing and clear service information. This is an original electronics-store implementation; no reference site's imagery, code or claims are reused.

## Application structure

The customer-facing brand is **DALE**, a single word selected by the owner. An original uppercase SVG wordmark with custom letterforms stands alone in the header, footer and browser icon. There is no separate D emblem. Assistant labels, page metadata, checkout descriptions and the public API document use the same name. Unbranded catalog illustrations carry functional markings rather than a store emblem.

The latest research included [Awwwards' e-commerce directory](https://www.awwwards.com/websites/e-commerce/), [Electronic Materials Office's Altar II entry](https://www.awwwards.com/sites/emo-r-altar-ii), its [actual storefront](https://electronicmaterialsoffice.com), and [Unimatic's Awwwards entry](https://www.awwwards.com/sites/unimatic). Altar II informed the substantial dark product stage and deliberate reveals; Unimatic informed the restrained product presentation and typography. The layout, letterforms and catalog illustrations remain original.

The opening composition combines a large headline, a four-product stage and an oversized low-contrast wordmark. Shoppers change featured products explicitly; there is no autoplay. Motion animates product changes and restrained scroll movement. An asymmetric five-collection mosaic follows, with paper and charcoal surfaces. A closing full-width wordmark completes the page.

The 40-product catalog now uses concrete unbranded names: 65W USB-C Wall Charger, USB-C HDMI Dock, 512GB Portable SSD, Bluetooth Over-Ear Headphones and Silent Bluetooth Mouse, with neutral finish variants rather than numbered series. These remain synthetic offers and labeled illustrations, not independently verified retail inventory or physical photography.

The device selector shows USB-C Laptop (65W/100W/45W) and Barrel-jack Laptop (45W) demo profiles. Display labels and conversational aliases map to existing internal identifiers; frozen label images and persisted records remain reproducible. Power/connector labels alone do not establish compatibility with arbitrary physical laptops: the demo uses its curated compatibility matrix.

Discovery initially includes every category within the chosen device and budget. Twelve results appear at a time; Show more products reveals additional eligible results without changing ranking or approval terms. Pagination resets on search, collection changes, saved brief and session restoration. Screen navigation returns to the top while the shared layout preserves shopper context.

The existing `buyerguard` repository, package, health service identifier, database/cache names and deployment paths remain operational identifiers so the branding change does not require a data or infrastructure migration. Historical validation and release references retain their original names.

- `/` and `/shop`: editorial entry, five collection selectors, device/budget brief, grounded recommendations, search within matched products and detailed catalog views.
- `/groups`: commitments, invitations, individual approval and locked group pricing.
- `/orders`: recorded-order/delivery/support overview, timelines and fulfillment/customer actions.
- `/support`: open/resolved request overview, both-party evidence, return stages, remedies and appeals.

Next.js App Router's shared `(store)` layout keeps the client storefront mounted across these screens. URLs support direct entry, reload and browser Back; saved shopper context restores from the private session on a full reload. Page metadata identifies each screen. Product details remain a focused dialog rather than a separate purchase mechanism.

Collection selectors provide a compatible/budget-filtered preview and mark the shopping brief changed. The shopper saves it with Find my match before reviewing a purchase. Text search only narrows the current candidates; it cannot expand compatibility or change approved terms. Product-detail checkout goes through the existing quote and approval guards. A featured item outside the selected category/budget offers collection matching rather than direct approval.

## Frontend implementation

The existing Next.js/React/TypeScript stack now uses pinned Motion for React for navigation indicators, result layout and entry/dialog transitions. MotionConfig respects device reduced-motion preferences; CSS smooth scrolling/hover transitions also turn off when reduced motion is requested. No scroll hijacking or animation-based purchase timing is used. See [Motion's configuration documentation](https://motion.dev/docs/react-motion-config) and [Next.js shared layouts](https://nextjs.org/docs/app/api-reference/file-conventions/layout).

DM Sans and Cormorant Garamond are self-hosted through pinned Fontsource packages; the interface does not depend on a third-party font request. Original SVG catalog illustrations have unique gradient IDs for repeated products and remain explicitly identified as illustrations. They do not imply verified physical photography.

The typography/control scale replaces the previous 7–10px product text. Mobile product cards become a single readable column. Forms use 16px input text on mobile to avoid automatic focus zoom. Product dialogs lock background scrolling, make the background inert, trap focus, support Escape and restore focus to the opener. Notices remain visible near the viewport when an action happens far down the collection.

## Verification and deployment boundary

The revised 7 October DALE implementation at 5a58bc3 passes lint/typecheck, the optimized production build, all 135 unit/contract/database checks and all 15 browser journeys against development and packaged production. The final reduced-motion test also asserts that hydration errors are absent across four viewport widths. Updated captures are `.data/reports/editorial-desktop.png`, `editorial-collections.png`, `editorial-mobile.png` and `editorial-product.png`.

`e2e/editorial.spec.ts` exercises routed history/reload, collection-to-purchase approval boundaries, result search, product facts/sponsorship, focus return, featured-item budget guards and desktop/tablet/mobile widths (1440, 820, 390, 320), including reduced motion. Existing browser journeys retain shopping clarification, compatibility, purchase/refund, group failure, cancellation, prepaid return and recovery coverage. Screenshots are private artifacts under `.data/reports/editorial-*.png`.

No payment, evidence or provider policy is relaxed by this redesign. The live Gemini and genuine PayPal gates remain as recorded in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

All 200 workflow traces, 107 deterministic scenarios, 300 frozen synthetic records and 180 repeated mocked native-adapter checks also pass after the catalog/profile changes. Production-mode browser testing uses a separate local embedded database and fixture adapters; it is not an EC2 or real-provider check. GitHub run 37606847215 at 5a58bc3 passes its production app/worker/PostgreSQL container job.

The local preview contains this redesign. EC2 SSH timed out during the 7 October deployment attempt, so public health still reports the earlier application build `5b393c0`. Update this record after a verified release transfer/service restart and hosted browser regression; do not describe the redesigned source as publicly deployed until then.
