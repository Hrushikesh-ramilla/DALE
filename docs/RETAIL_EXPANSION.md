# Multi-department retail expansion

11 October sourced-catalogue release: application `365347809346f9d5458f0cd0cdcce80e44eaecc2` is deployed at https://65.0.19.200.sslip.io/shop and ready locally at http://localhost:3000. Ordinary shoppers see 35 manufacturer-linked records across six departments, with nested category/type navigation and strict brand/model/size/concentration/RAM/storage constraints. Legacy samples remain in isolated fixtures and historical orders; incomplete apparel candidates are withheld. All 377 unit/contract checks, four production browser journeys, 20 actual hosted checks and eight actual restart checks pass. All release gates for this catalogue update are closed (100% of this scope). Provider settings and customer data are preserved; prices/stock/fulfilment remain sandbox data. See [BRANDED_CATALOG](BRANDED_CATALOG.md). Earlier milestone descriptions below are historical.

DALE is a customer-first shopping agent operating a managed merchant storefront. This release expands that storefront into six departments without replacing its agent, consent, payment or evidence contracts.

## Historical engineering-catalogue scope

| Department | Inventory | Decision inputs |
| --- | --- | --- |
| Electronics | Existing 40 engineering SKUs plus 3 separately sourced manufacturer products | Reviewed device, ports, cable, power and budget |
| Clothing | 12 families, 36 size SKUs | Material, S/M/L and recorded measurement chart |
| Fragrance | 12 families, 36 bottle SKUs | Scent family, concentration, notes and 30/50/100 ml |
| Bags and accessories | 12 families, 36 finish SKUs | Material, use and recorded dimensions |
| Home and living | 12 families, 36 finish SKUs | Material, dimensions, capacity and use |
| Beauty and care | 12 families, 36 volume SKUs | Listed ingredients, use and 30/50/100 ml |

The catalog contains 223 purchasable records: 220 merchant engineering SKUs and 3 reviewed manufacturer identities with simulated merchant offers. The 180 new lifestyle SKUs represent **60 distinct product families**, not 180 independent designs. Their specifications are explicitly merchant-authored samples; they are not manufacturer-verified retail products or proof of physical inventory. There are no invented customer reviews or ratings. Illustrations are original category drawings, not product photography.

Lifestyle shopping has no device profile. Its exact SKU and structured attributes establish eligibility; comparison never claims electronic compatibility for a garment or fragrance. Preferences do not prove fit, scent enjoyment or medical safety. All categories retain the existing 30-day merchant review policy; no new automatic refusal for opened cosmetics has been introduced.

## Backend and agent

The additive `catalog_products` PostgreSQL table stores versioned catalog records, with category/price and JSON attribute indexes. Startup synchronization loads the committed seed into this read model. This release does not expose merchant editing or arbitrary imports; the committed seed remains authoritative for quotes and inventory. Server shopping reads persisted records and applies deterministic eligibility before customer-weighted ranking. `GET /api/catalog` provides strict, parameterized category, name, budget, size, material, scent, volume and page queries, with totals, six-department metadata and a maximum of 48 records per page.

The model workflow includes `search_retail`, followed by optional group discovery. Structured model output is validated against recognized customer constraints; an unavailable or invalid model is disclosed and retains bounded catalog assistance. Fixture tests never incur AI spend. This release adds adapter contract tests, not a claim that an actual new model completed live retail evaluation.

Customers can refine a retained lifestyle brief (for example “Actually size L instead”), without repeating the budget/material. Ambiguous alternatives, unsupported removals and financial instructions are not silently resolved. Exact variants remain separate group pools. A size-M buyer cannot use a size-L quote, and a revised brief invalidates unpaid approvals. Shared guest/account identities, live group updates, stock reservation, own-order privacy and independent payment approval continue to apply.

The seven original capabilities remain central: AgentGuard protects each approval; BuyTogether uses real shared commitments; ScamPause isolates seller instructions; PartsMatch stays an electronics capability; Buyer’s Advocate retains customer authority; ReturnShield records evidence for human review; RescueMyOrder reads the customer’s own order state. This expansion does not add unrelated social or seller-marketplace features.

## Release evidence — 11 October 2026

Application `81962d56d8f6ed659cf05ec0933fcd6ac15f469c` is deployed at https://65.0.19.200.sslip.io/shop and runs locally at http://localhost:3000. This expansion's seven release gates are closed: lint/typecheck; 354 unit/contract checks; Windows production build; Linux production build/artifact and three browser journeys; 15 actual hosted retail checks; six persistence checks after completed app/worker restart; public HTTPS/source identity. **7/7 expansion release gates (100%)** is a scope-specific acceptance count, not a claim that the original project's remaining provider/physical gates or an Amazon-scale commercial rollout are complete.

[Linux release verification](https://github.com/Hrushikesh-ramilla/DALE/actions/runs/38098671243) passes all 354 checks, the packaged OCR checks, the independent-customer browser journey and both retail browser journeys. The deployed 63,222,920-byte Linux x64/Node 22 archive has SHA-256 `cf3704c204ab0ca75b250f08805d4463c215832b283d735e6795cacc1942ec85`. The checksum/backup installer retained the previous release and a private pre-upgrade database snapshot.

Actual hosted reports are [retail journey](evaluations/retail-81962d5-prepare.json) and [restart persistence](evaluations/retail-81962d5-restart.json). They use real PostgreSQL/customer sessions, isolated fixture agent/payment flows and no model calls or real payment capture. Source identity, catalog, two independent customers, exact size enforcement, all five new departments, retained refinement, explicit fixture capture and privacy pass. Sessions, both group memberships, conversation and captured fixture order survive actual service restart. Services are active. Private credentials/cookies remain in ignored, restricted local files. The existing provider configuration was preserved; no billing or infrastructure resource was added.

## Manual acceptance

1. Open `/shop`. Confirm six department cards and appropriate illustrations. Explore Clothing. Choose Size M and Material linen, then save through Brief & Filters → Find my match. The results must contain only matching variants; unsaved changes must block purchase review.
2. Alternatively, send **“Find a linen shirt in size M under $60 and use group buying”** to DALE. Expect the short-sleeve linen shirt M, $42 individual price and $37.80 conditional group price under the default two-shopper/10% policy. No group membership or payment is created by this message.
3. Send **“Actually size L instead”**. Expect size L, retained linen material/$60 limit, a new brief version and invalidation of any unpaid size-M approval. Review a fresh offer.
4. From two independent browsers/devices, explicitly join the same exact variant. The first screen should update automatically after the second commitment. Two different sizes must form different groups. Each participant approves their own locked quote and retains private orders. See [MULTI_CUSTOMER.md](MULTI_CUSTOMER.md) for account recovery instructions.
5. Send **“Compare citrus perfumes in 50 ml under $40”**. Expect only citrus/50 ml variants within budget. **“Find perfume in 75 ml under $90”** must return no matching variant, rather than substituting 50 or 100 ml.
6. Send **“Find a canvas tote under $30”**, **“Find a glass vase under $30”**, and **“Find body lotion in 100 ml under $50”** separately. Expect the relevant department and exact attribute filtering; no device selection is required.
7. **“Find a shirt size M or size L under $50”** must ask for clarification. **“Find body lotion safe for my allergy”** must not assert safety. **“Pay for a linen shirt now”** must not authorize payment.
8. Review an agent option. Confirm the exact SKU, total, merchant, payment mode and review policy. In fixtures, approve the simulated purchase and confirm a captured order survives reload. In public sandbox mode, approval requires PayPal; credentials alone do not establish a completed provider checkout.
9. Inspect `/api/catalog?category=fragrance&scent=citrus&volumeMl=50&budget=4000`, then `/api/catalog?page=2`. Expect filtered facts, totals and distinct pages. Unknown categories and invalid numeric limits must be rejected.
10. Existing electronics, own-order tracking, support drafts, returns, evidence and operator review remain available. Lifestyle orders use the same protection and support pipeline.

## Boundaries and next data milestone

This is a tested multi-department merchant demonstrator, not an operational Amazon-scale business. Real merchandising requires authorized product/offer feeds, reviewed size charts and ingredient records, licensed photography, actual inventory and shipping connections. The database read model provides a foundation; it does not prove million-product performance. Checkout remains one exact SKU per independently approved payment, not a new multi-item basket transaction. Existing provider qualification and physical acceptance gates are unchanged.

The research-derived direction remains tool use grounded in records, session state, guarded money movement and adversarial evaluation. A broader catalog makes that workflow more useful; product count itself is not the AI contribution. The original documents do not establish an exact paper/code implementation for every feature, so this release makes no such claim.
