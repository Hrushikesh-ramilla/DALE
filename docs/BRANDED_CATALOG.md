# Sourced branded catalogue

This release replaces the ordinary shopper's invented catalogue with 35 reviewed product/offer records across six departments. Thirty-two new exact branded records join the three previously reviewed Apple charging offers. Existing engineering SKU IDs remain in isolated fixtures and historical orders; none was renamed into a branded product.

## Selection and evidence

Electronics includes Apple iPhone 17, Samsung Galaxy S25 Ultra, OnePlus 13, Xiaomi 15, MacBook Air M4, iPad Air M4, Galaxy Tab S10 FE, Logitech keyboards/mice, Samsung T7 Shield and Sony WH-1000XM5. Clothing includes Givenchy and Valentino cotton tees in manufacturer-listed S/M/L variants. Fragrance includes Maison Francis Kurkdjian, CHANEL, Tom Ford, Maison Margiela, Serge Lutens, Parfums de Marly, Creed and Amouage. Bags include Louis Vuitton, Hermès, Michael Kors and Gucci. Skincare includes Lancôme and CHANEL; homeware includes a Hermès porcelain mug.

Manufacturer URLs, reviewed region/date, exact attributes and missing facts are stored per record in src/domain/branded-catalog.ts and shown with every product and agent option. The seed is a reviewed snapshot, not an arbitrary internet crawler, live stock feed or authorized reseller integration. DALE prices are synthetic USD sandbox offers; stock, payment and fulfilment retain their existing test boundaries. No claim of current bestseller rank or latest generation is made.

Identity-only Brioni, Saint Laurent, Armani and Prada candidates are archived outside the shopper catalogue: their exact sizes/full composition could not be verified. Quotes and group commitments for those IDs are blocked server-side. Unknown facts such as Apple battery mAh/RAM remain absent; inconsistent LV/Gucci dimensions are withheld. No clothing fit guarantee, fragrance preference prediction, device fit based on bag exterior dimensions or allergy-safety claim is inferred.

## Navigation and agent

Browsing now follows department → category grid → recorded product type → exact products, with breadcrumbs and department switching. Electronics opens phones, laptops, tablets, charging, storage, audio and computer accessories. Empty categories are omitted. Brand, exact model, size, material, concentration, volume, RAM and storage filters operate on persisted JSON attributes. Filters never manufacture an unavailable combination.

The same typed constraints run through chat, validated model workflow output, parameterized PostgreSQL queries, group discovery, quote approval and immutable orders. Prices support budgets up to $10,000. A new device purchase does not claim accessory compatibility. Existing reviewed MacBook charging research retains its separate compatibility path. Unavailable models/variants, ambiguous GB, currency conversion, unverified performance/color requirements and medical safety stop for clarification. Multiple brand/model restrictions currently require one exact filter or a category comparison; they are not silently ignored.

## Manual acceptance

1. Open /shop → Electronics. See category tiles including Mobile Phones, Laptops and Tablets; open Mobile Phones and filter by Apple. Expect only the reviewed iPhone variant and its source/missing facts.
2. Ask: “Compare phones with 12GB RAM and 256GB storage under $1000”. Expect Xiaomi 15, OnePlus 13 and Galaxy S25 Ultra. Apple is excluded because RAM is not recorded, not because a guessed value was assigned.
3. Ask: “Find MFK Baccarat Rouge 540 perfume in 70ml under $400”. Expect the 70ml eau de parfum with manufacturer link. Then “Budget is $350 instead”: retain brand and volume.
4. Ask: “Find Givenchy cotton t-shirt size M under $600 and use group buying”. Expect only the M variant. A separate shopper joins the same SKU: shared counts update, but orders and chat remain private. A different size cannot satisfy the saved brief. Purchasing still needs separate confirmation.
5. Ask: “Find Tom Ford Oud Wood perfume in 50ml under $350”, “Find Lancôme serum in 100ml under $300”, or “Find Gucci leather key pouch under $700”. Expect exact manufacturer-linked records.
6. Ask for iPhone 17 Pro, an unrecorded clothing size, allergy safety or ambiguous “256GB”. Expect clarification, not a convenient substitute. Ask for 512GB phone storage: no recorded match, not the 256GB SKU.
7. Guided fixtures continue to expose original samples for reproducible payment/return testing. Ordinary browsing exposes the sourced list. No model call or actual payment capture is needed for this catalogue release's fixture checks.

## Release evidence

Application 365347809346f9d5458f0cd0cdcce80e44eaecc2 is deployed at https://65.0.19.200.sslip.io/shop and compiled locally at http://localhost:3000. Linux customer-release workflow 38129029279 passes lint, TypeScript, all 377 unit/contract tests, eleven isolated packaged OCR checks and four production browser journeys. The browser journeys cover independent customers, exact Givenchy fixture checkout/reload, public query validation and desktop/mobile nested navigation with no premature ranking claim.

The 63246603-byte Linux archive has SHA-256 19807eda38316c858a3d7bff1beeee257a969a81b92f14b6772ebcb632c6f29a. The authenticated installer verifies its identity/checksum, preserves the previous release and private database backup, and restarts app/worker successfully. All 20 actual hosted journey checks and eight post-restart checks pass; receipts are in docs/evaluations/retail-3653478-prepare.json and retail-3653478-restart.json. Two ordinary sessions finalize one exact Givenchy M SKU and retain private orders. Branded agent checks and capture are explicitly isolated fixtures; no model generation or real payment capture occurs.

Retained-fixture PostgreSQL pagination separately passes 255 records and two disjoint 48-record pages. Public queries exclude those samples and the four incomplete apparel records. Before/after private configuration fingerprints match for every existing setting except BUILD_ID. No credentials, provider selection, billing, paid resource or customer database reset is introduced.

All catalogue release gates are closed: 100% of this update. This is not a claim of commercial inventory, unlimited external research or new live-model/payment-provider qualification. Subsequent documentation-only commits preserve this exact application build identity.
