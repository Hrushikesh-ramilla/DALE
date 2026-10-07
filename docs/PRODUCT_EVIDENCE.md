# Manufacturer evidence pack

Reviewed 7 October 2026. Version `apple:2026-10-07`; source URLs, titles, checked dates and exact model links are executable records in `src/domain/research.ts`. Reverification is required after 30 days; expired evidence cannot create a new purchase quote. This manually reviewed pack is not an unrestricted web search or a live inventory feed.

| Record | Evidence and scope |
| --- | --- |
| 13-inch MacBook Air M2 (2022) | [Apple technical specifications](https://support.apple.com/en-us/111867): USB-C charging and MagSafe 3; distinguishes normal charging from the supported fast-charge configuration. |
| 15-inch MacBook Air M2 (2023) | [Apple technical specifications](https://support.apple.com/en-us/111346): separate exact model. Never infer compatibility from the similar product name. |
| 40W Dynamic adapter | [Apple product listing](https://www.apple.com/shop/product/mgkn4am/a/40w-dynamic-power-adapter-with-60w-max): $39 US reference, USB-C, peak output differs from continuous rating, cable separate; lists the 13-inch M2 Air. No MacBook fast-charge claim. The 15-inch M2 Air is not established by this pack. |
| 70W adapter | [Apple product listing](https://www.apple.com/shop/product/mxn53am/a/70w-usb-c-power-adapter): $59 US reference, both M2 Air sizes listed; supported fast charging requires a suitable cable. |
| 60W cable | [Apple product listing](https://www.apple.com/shop/product/mw493am/a/60w-usb-c-charge-cable-1-m): $19 US reference, USB-C at both ends, charging up to 60W. Does not establish a 70W fast-charge configuration. |

DALE's R003 is a simulated merchant bundle of the $39 adapter and $19 cable, totaling $58. Reference prices exclude any real market tax/shipping; simulated DALE checkout explicitly uses $0 demo tax/shipping. Stock, payment and delivery in an owned engineering workspace are simulated. Selecting a real product name does not place an order with Apple or establish physical inventory. Existing P001–P040 records remain clearly labeled engineering samples.

Run `npx vitest run tests/research.test.ts` for evidence mapping, cable completeness, exact-size mismatch, charging speed, freshness, budget and sponsored-ranking checks.
