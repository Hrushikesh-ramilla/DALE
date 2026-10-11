# Marketplace catalogue expansion

Status: planned; no product import, application change or deployment is claimed by this document. Existing application and customer data remain in place. This supersedes the mixed electronics brand shortlist, not the core customer-first agent goals in MASTER_PLAN.md.

Expanded 11 October: sunglasses and a production implementation specification are included below. The full specification is in [MARKETPLACE_ARCHITECTURE.md](MARKETPLACE_ARCHITECTURE.md). The first deliverable remains a reviewed exact-product manifest; document completion is not storefront expansion completion.

## Research and current state

On 11 October 2026, direct browser inspection of Amazon India showed 44 search-selector options including All Categories: 43 named selections. These include services, digital content, overlapping departments and shopping filters; they are not 43 independent physical-product departments. Its electronics page separately navigates computing, tablets, headphones, speakers, cameras, smartwatches, storage, networking, printers, components and gaming.

References: https://www.amazon.in/ and https://www.amazon.in/electronics/b/?node=976419031 . Navigation is a structural reference, not authorization to copy Amazon inventory, images, prices or seller stock. Manufacturer records supply product facts; merchant feeds supply actual offers and fulfilment claims.

Current DALE has six departments and 13 category IDs in src/domain/departments.ts. The released ordinary catalogue has 35 source-linked records. Historical/sample identities and customer orders must remain addressable. Expansion must preserve the shopping agent, exact-variant group commitments, separately approved PayPal checkout and evidence-based remedies.

## Navigation and approved assortment

Use Department -> Category -> Product type -> filterable products -> exact SKU. Brands are filters and optional landing pages, not mandatory traversal steps. Latest models, price range and attributes are filters. Each product has one canonical identity, even when discoverable through multiple collections.

Electronics categories:

- Mobile phones: Apple, Samsung, Google, Motorola, OnePlus, Xiaomi, OPPO, vivo, realme. Add current verified flagship, midrange and foldable models where available; 10-15 distinct models per brand where documented supply supports it.
- Laptops: Apple, Dell, HP, ASUS, Acer, MSI, Microsoft, Lenovo, Alienware. Preserve Alienware as a Dell-owned line and distinguish laptop models from configurations.
- Tablets and e-readers: independent category; source a category-specific brand/model shortlist before import.
- Headphones: Beyerdynamic, Bose, Sennheiser, Sony, Bang & Olufsen, Shure; include over-ear/on-ear, wireless/wired, open/closed-back and studio types. Additional brands are candidates, not approved inventory.
- Earphones and earbuds: separate from headphones; true wireless, wired and in-ear monitor types. Use the approved audio houses where they actually publish products; shortlist other brands separately.
- Speakers and soundbars; cameras and lenses; monitors; desktops and components; gaming hardware; keyboards and mice; storage; networking; printers and scanners; smartwatches and wearables. Each receives its own manufacturer shortlist and typed comparison fields.
- Accessories: phone, laptop, tablet, audio and camera accessory collections. Types include chargers, cables, power banks, cases, screen protectors, docks, adapters, replacement pads and stands. Also discoverable from the associated device detail page.

Other explicitly selected departments:

- Clothing: Hermès, Chanel, Dior, Saint Laurent, Prada, Givenchy, Valentino, Louis Vuitton, Gucci, Burberry, Ralph Lauren, Tom Ford, Versace, Oscar de la Renta, Armani, Brioni. Types: shirts, T-shirts, knitwear, trousers, denim, dresses, suits, jackets and coats. Identify the exact Armani label and manufacturer product reference; do not merge distinct labels or collections.
- Fragrance: Maison Francis Kurkdjian, Chanel, Dior, Hermès, Tom Ford, Creed, Amouage, Parfums de Marly, Initio, Serge Lutens, Maison Margiela, Armani. Separate named fragrances from concentration, bottle volume and gift-set variants.
- Watches: Jaeger-LeCoultre, Rolex, Omega, Patek Philippe, Audemars Piguet, Vacheron Constantin, A. Lange & Söhne, IWC, TAG Heuer, Tissot. Treat repeated Jaeger/LeCoultre mentions as one brand. Tissot is the presumed normalization of "Pissot". Exact reference numbers identify models; mechanical watches are distinct from electronic smartwatches.
- Footwear: Loro Piana, Brunello Cucinelli, Ferragamo, Nike, Adidas. Types: loafers, formal shoes, sneakers, running shoes, boots, sandals and heels. Preserve regional size systems and model-specific charts.
- Beauty and skincare: prepare a manufacturer-backed shortlist including Chanel, Dior, Lancôme, Guerlain, La Mer, La Prairie, Clé de Peau Beauté, Sisley Paris, Shiseido and Estée Lauder. These are proposals under the user's luxury-brand direction, not yet a product manifest. Separate skincare, makeup, haircare, bodycare and tools.
- Sunglasses and eyewear: Oakley and Ray-Ban are explicitly selected. Further candidates: Persol, Maui Jim, Oliver Peoples, Jacques Marie Mage, DITA, Cutler and Gross, MOSCOT, Garrett Leight, MYKITA, LINDBERG, Gentle Monster, Cartier, Tom Ford, Prada, Gucci, Saint Laurent, Bottega Veneta and Chanel. The 20-brand shortlist offers specialist and fashion houses; source ten distinct frame models per selected house where verified supply supports it, rather than counting lens colours as models. Exact model/lens/size variants record frame dimensions, material, lens type, polarization and explicitly documented protection claims. Smart glasses are cross-listed in electronics with one canonical SKU. Prescription suitability requires the exact manufacturer's prescription eligibility, not inferred medical advice.

Keep bags/accessories and home/living and expand their internal types. Add appliances, home/kitchen, furniture/lighting, sports/outdoors, books/stationery, toys/games, luggage/travel, tools/home improvement, pet supplies, pantry/household and automotive accessories as data and test gates permit. Every new category needs its own sourcing and evaluation; no empty or generic category page is a completed feature.

## Accessory relationships

One charger SKU may appear in phone and laptop collections; do not duplicate inventory or orders. Store evidence-backed relationships with the device model, interface, protocol, power profiles, cable requirements and source. Distinguish fits, does not fit and unknown. USB-C alone does not establish charging speed, video support or accessory compatibility. Cases and screen protectors require the exact model; lenses require mount and other stated constraints; laptop chargers require model-specific power/connector evidence.

Device detail pages expose Compatible accessories and an agent action to find accessories for that exact device. Ambiguous device requests ask for clarification. Unknown compatibility never becomes a positive fit claim.

## Data and sourcing

Extend rather than replace the current catalogue read model. Separate brand, product family, model/reference, SKU/variant, offer, source observation, media asset and compatibility relationship. Use stable existing IDs and additive migrations.

Store each sourced fact with URL, observation time, region, units and missing/conflicting-data status. Store release year independently from observation date. A page reviewed in 2026 does not imply a 2026 model. Prefer current documented models; mark previous generations and discontinued products explicitly. Never invent models to meet a quota or count colours, capacities and sizes toward the distinct-model requirement.

Store original manufacturer/merchant names and exact references. Proper product photography must come from approved/manufacturer-provided media or a licensed feed; maintain attribution/usage records and resilient local delivery where rights allow. Generic category illustrations do not count as real product photography.

Merchant prices, currency, stock, delivery, returns and authenticity claims are separate from manufacturer specifications. Manufacturer facts cannot turn simulated DALE offers into real seller inventory. Existing sandbox labelling remains until verified merchant integrations replace it.

Use validated import manifests, field/unit normalization, duplicate detection, review queues and provenance checks. Index relational typed attributes and full-text search; use server-side filtering/pagination. Do not ship the full thousands-product inventory in the browser bundle or put it all into an LLM prompt. Retrieve a bounded candidate set and deterministic eligibility checks before model explanation.

## Agent capability boundaries

Strong structured comparisons: electronics, appliances, watches, storage, networking, tools and dimensional furniture. Compare recorded specifications; subjective performance claims need separately attributed test evidence.

Preference-based comparisons: clothing, footwear, fragrance, bags and skincare. Compare recorded size charts, materials, concentration/notes, volume and ingredient lists. Do not guarantee fit, scent preference, longevity, comfort, allergy safety or clinical outcomes from a product listing.

Other categories: books/games by metadata and user preference; pantry/pet products by label facts, quantity and documented dietary constraints; automotive products by exact documented vehicle fitment. Medical recommendations, pet treatment, safety guarantees and undocumented vehicle compatibility are not ordinary catalogue claims.

No category can correctly answer every possible customer question. Responses must identify supported facts, missing evidence and required clarification, and reject unsupported guarantees. Unsupported requests stay visible in evaluations rather than being hidden by canned prompts.

## Implementation gates

1. Approve/record the category-specific brand/model manifest. Add typed taxonomy and schemas with stable-ID migration tests. Keep existing navigation links and order histories functional.
2. Import selected phones, laptops, headphones/earbuds and accessory evidence. Source 10-15 distinct models per approved brand where available. Review new/previous-generation tags and media. Do not inflate inventory through variants.
3. Import at least ten distinct products per selected clothing, fragrance and watch house; add footwear and beauty with their separate typed schemas and source manifests. Correctly disclose houses without sufficient verified supply.
4. Expand remaining comparison-suitable departments in separate source-reviewed batches. A target of thousands is permitted; the verified manifest determines the actual count. Brand selection for unspecified categories is a separate deliverable.
5. Extend agent tools and filters for category-specific attributes and multi-item tasks. Preserve exact-SKU group pools, independent-device identities, inventory constraints, ownership, immutable offers and user approval before payments/remedies.
6. Test import validation, missing/conflicting facts, ambiguous models, unsupported questions, exact variants, source attribution, accessory fit and multi-category retrieval. Evaluate unseen natural-language requests and adversarial seller instructions. Test pagination/query latency and concurrent users with the existing server's measured resources.
7. Run independent-device browser journeys through group joining, checkout fixtures and order/return persistence, with separate real-provider tests accurately labelled. Deploy reviewed batches via checked Linux artifacts and database backup. Verify actual hosted state and restart persistence; commit each completed milestone with source/count/test evidence.

Completion is gate-based: taxonomy, verified inventory, media, agent correctness, multi-customer commerce, performance and hosted acceptance. This document completes planning only; the thousands-product expansion is not implemented yet.
