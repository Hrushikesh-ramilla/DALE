# Manufacturer evidence pack

Expanded 8 October 2026. Exact model/chip/year/charging-port records and aliases live in `src/domain/device-registry.ts`; sourced product and complete-cost constraints live in `src/domain/research.ts`. Reverification is required after 30 days; expired evidence cannot create a new purchase quote. The reviewed registry is extensible without a new intent rule for every device. Unknown devices remain unresolved rather than inheriting an engineering sample.

`REAL_RESEARCH_REFRESH_ENABLED=true` enables bounded HTTP retrieval of the reviewed manufacturer URLs for ordinary shopper research. Fixture workspaces always use dated snapshots. Redirects, unknown URLs, oversized/non-HTML responses, outages and changed identity/price anchors cannot become new product facts. Pages that differ from reviewed anchors stop the new recommendation before updating the brief. Successful reads record source IDs, timestamps and content hashes; they verify those anchors, not every assertion or live inventory. Structured specification changes still require review. All seven actual public pages matched on 8 October using `npm run verify:research`, with no AI call or payment.

| Record | Evidence and scope |
| --- | --- |
| 13-inch MacBook Air M2 (2022) | [Apple technical specifications](https://support.apple.com/en-us/111867): USB-C charging and MagSafe 3; distinguishes normal charging from the supported fast-charge configuration. |
| 15-inch MacBook Air M2 (2023) | [Apple technical specifications](https://support.apple.com/en-us/111346): separate exact model. Never infer compatibility from the similar product name. |
| MacBook Air M1 (2020) | [Apple technical specifications](https://support.apple.com/en-us/111883): 30W adapter and USB-C charging. No MagSafe 3 port or sourced MacBook fast-charge claim. |
| MacBook Pro 13-inch M1 (2020) | [Apple technical specifications](https://support.apple.com/en-us/111893): 61W adapter and USB-C charging. The 70W listed adapter requires a 100W+ cable for the normal-power configuration; a 60W cable does not establish that full requirement. |
| 40W Dynamic adapter | [Apple product listing](https://www.apple.com/shop/product/mgkn4am/a/40w-dynamic-power-adapter-with-60w-max): $39 US reference, USB-C, peak output differs from continuous rating, cable separate; lists the 13-inch M2 Air. No MacBook fast-charge claim. The 15-inch M2 Air is not established by this pack. |
| 70W adapter | [Apple product listing](https://www.apple.com/shop/product/mxn53am/a/70w-usb-c-power-adapter): $59 US reference, both M2 Air sizes listed; supported fast charging requires a suitable cable. |
| 60W cable | [Apple product listing](https://www.apple.com/shop/product/mw493am/a/60w-usb-c-charge-cable-1-m): $19 US reference, USB-C at both ends, charging up to 60W. Does not establish a 70W fast-charge configuration. |

DALE's R003 is a simulated merchant bundle of the $39 adapter and $19 cable, totaling $58. Reference prices exclude any real market tax/shipping; simulated DALE checkout explicitly uses $0 demo tax/shipping. Stock, payment and delivery in an owned engineering workspace are simulated. Selecting a real product name does not place an order with Apple or establish physical inventory. Existing P001–P040 records remain clearly labeled engineering samples.

The 40W adapter and R003 bundle are also manufacturer-listed for the M1 Air. The 70W adapter is listed for the M1 Air and 13-inch M1 Pro. The M1 Air/Pro receive normal-charging comparisons only: a product's newer-Air fast-charge marketing does not establish an M1 fast-charge claim. “MacBook M1” asks Air versus Pro; dollar amounts cannot act as screen sizes. Short clarification replies retain the unresolved device query.

Run `npx vitest run tests/research.test.ts tests/composable-agent.test.ts` for evidence mapping, ambiguity, retained clarification, cable completeness, exact-size mismatch, charging speed, freshness, budgets, source-retrieval bounds and sponsored-ranking checks. General model interpretation is contract-tested through native mocked transport; live semantic accuracy remains a separate acceptance gate.
