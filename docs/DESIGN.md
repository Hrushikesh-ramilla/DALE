# Editorial storefront

The storefront uses charcoal, black, off-white and muted neutral surfaces, generous product space, and serif editorial headings paired with a readable sans-serif interface. Inspiration came from [Awwwards' ETQ Amsterdam listing](https://www.awwwards.com/websites/html/?mobile=1&page=174) and direct inspection of [ETQ's storefront](https://www.etq-amsterdam.com/): substantial product presentation, restrained navigation, collection browsing and clear service information. This is an original electronics-store implementation; no reference site's imagery, code or claims are reused.

## Application structure

The customer-facing brand is **Dale**, a single word selected by the owner. The identity pairs a Cormorant Garamond wordmark with an original serif D monogram in the header, footer and browser icon. Assistant labels, page metadata, product illustrations, checkout descriptions and the public API document use the same name. Character inspiration informs the calm, attentive service tone; the mark is an original letterform.

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

The 7 October Dale identity passes lint/typecheck, the optimized production build, all 134 unit/contract/database checks and all 14 development browser journeys. The four editorial journeys also pass after the final illustration engraving update. HTTP inspection confirms the Dale route title/home label, SVG icon and public API title; the updated desktop capture is `.data/reports/dale-desktop.png`.

`e2e/editorial.spec.ts` exercises routed history/reload, collection-to-purchase approval boundaries, result search, product facts/sponsorship, focus return, featured-item budget guards and desktop/tablet/mobile widths (1440, 820, 390, 320), including reduced motion. Existing browser journeys retain shopping clarification, compatibility, purchase/refund, group failure, cancellation, prepaid return and recovery coverage. Screenshots are private artifacts under `.data/reports/editorial-*.png`.

No payment, evidence or provider policy is relaxed by this redesign. The live Gemini and genuine PayPal gates remain as recorded in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

Final lint/typecheck and all 134 unit/contract/database checks pass. All 14 browser journeys pass against the development server and the packaged standalone production server, including owned-font/illustration rendering. Production-mode browser testing uses a separate local embedded database and fixture adapters; it is not an EC2 PostgreSQL or real-provider check.

The local preview contains this redesign. EC2 SSH timed out during the 7 October deployment attempt, so public health still reports the earlier application build `5b393c0`. Update this record after a verified release transfer/service restart and hosted browser regression; do not describe the redesigned source as publicly deployed until then.
