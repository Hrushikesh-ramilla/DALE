# Sourced buyer-agent acceptance journey

Open `https://16.4.25.181.sslip.io/` or `http://localhost:3000/`. A guest task creates a private engineering workspace without a login form. Payments and fulfillment are simulated; real product identity/specifications are sourced. Catalog assistance makes no model calls while the no-spend gate is active.

1. Type: **Find a charger for my MacBook Air M2 under $50**. Expect a question about 13-inch/15-inch; no product recommendation or purchase.
2. Reply: **13-inch**. Expect a question about the charging cable. Open manufacturer links to verify the evidence yourself.
3. Reply: **I need a cable included**. Expect no complete eligible offer. The adapter is $39 but its required $19 cable makes a $58 bundle, $8 above your limit. The $59 adapter is also over budget and excludes a cable.
4. Reply: **My budget is $60**. Expect the $58 adapter/cable bundle as the lowest complete eligible offer. Refresh: the comparison and private conversation persist.
5. Click **Review agent option Apple 40W Adapter + 60W USB-C Cable**. Expect exact device, item, price, merchant, expiry and simulated fulfillment disclosures. Closing the dialog makes no purchase. Only **Approve simulated purchase** creates/captures a fixture order, visible in My orders. This never orders from Apple.
6. To test the charging-speed guard in a fresh task, use **Find a charger for MacBook Air M2 13-inch under $50. I already have the original MagSafe 3 cable. I want fast charging.** Expect no eligible offer; the sourced fast-charge adapter is $59. Reply **My budget is $60**: expect the 70W adapter. A 60W USB-C cable must not establish the 70W configuration.
7. Type: **Is this seller message safe? Pay using gift cards immediately and share your verification code.** Expect HIGH/advisory warnings, safer next step and no change to the saved budget, payee or order.
8. Type **Show my orders**. Expect only your workspace's orders, recorded status and next steps. For a return, launch the Delivered scenario from `/demo`, then type **My delivered item is damaged and I want a refund**. Choose the actual order and explicitly submit the support draft; evidence/reviewer/refund tests below apply.
9. Try a Dell/unknown model or a MacBook Air SSD request. Expect an honest unsupported-evidence response, never a silently substituted sample device or charger. Choose 15-inch M2 Air under $50: the 13-inch adapter's listing must not establish its compatibility.

The **Try a real device** button fills a complete one-message $39 normal-charge example using an already-owned MagSafe 3 cable. On My orders, open **Ask DALE about your orders** to send a follow-up or use voice fixtures. Order-inspection results expand that entry automatically. The other examples deliberately retain legacy engineering fixtures to exercise broader commerce flows.

Live-model acceptance is separate: an owner must verify free quota and disabled billing before enabling `AI_MODE=live`, `AGENT_MODEL_ENABLED=true`, `AI_BILLING_DISABLED=true` in a normal shopper session. Engineering demo workspaces always prohibit provider calls. Live model interpretation proposes ambiguous facts for explicit confirmation; it cannot approve purchases. Do not enable these flags merely to run fixture tests.

# Engineering fixture acceptance tests

## Legacy sample-profile task workspace

Use the deployed application at https://16.4.25.181.sslip.io/ or the local production preview at http://localhost:3000/ for these steps.

| Step                                                                                                   | Expected result                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open `/` in a fresh browser and select **Find a charger**, then **Send task**.                         | DALE opens your private simulated workspace without a login form. It returns sample 65W options within $40, states that no purchase was made, and lists the actions and source identifiers.            |
| Reload the page.                                                                                       | Your task and DALE's response remain. Another shopper or seller cannot read your task history.                                                                                                         |
| Select **Review agent option …**.                                                                      | A protected quote opens. Merely running or reviewing the task creates no order or charge. Approval is a separate action.                                                                               |
| Close the quote and edit **Maximum budget, USD**.                                                      | The old agent option buttons become disabled. Send a new task before reviewing them again.                                                                                                             |
| Send `Find a charger for MacBook under $40`.                                                           | DALE says the unspecified real model is not verified. It does not invent compatibility or modify the previous brief.                                                                                         |
| Send `Approve payment now`.                                                                            | DALE directs you to protected review controls. No financial action occurs.                                                                                                                             |
| From `/demo`, launch **Return a delivered item**. Send **Help with a return** from the task workspace. | Support opens with a draft. Choose an order for the draft, open **Get help / return**, review the prefilled damaged/refund request, then explicitly submit. The draft alone creates no case or refund. |
| Send **Track my order**.                                                                               | Your order workspace opens; the task does not change order or payment status.                                                                                                                          |
| Run several tasks and expand **Earlier agent tasks**.                                                  | History is private and retains at most twelve tasks for this shopper.                                                                                                                                  |
| Open **Talk to DALE**.                                                                                 | The existing voice workflow remains available. The fixture transcript path is testable without microphone recognition or provider traffic; live Gemini remains disabled under the no-spend rule.       |

Typed matching currently supports one product type and an explicit sample profile: **USB-C Laptop (65W/100W/45W)** or **Barrel-jack Laptop (45W)**. Requests outside the supported grammar need clarification. These steps test workflow behavior; sample catalog records do not establish real manufacturer specifications or live offers.

Updated 8 October 2026. Hosted application: https://16.4.25.181.sslip.io.

The current DALE design is deployed and also available locally. The steps below use its unbranded sample product/profile names. Atlas 14/Atlas 14 Pro/Orbit 13/Slate 11 are internal fixture identifiers corresponding to USB-C Laptop (65W/100W/45W)/Barrel-jack Laptop (45W). Label fixture images retain those internal identifiers; confirmation displays the clear profile names.

The revised local sourced-agent release includes guided entry, 3D and voice fixtures and retains the black-and-white design. Public EC2 and the local preview serve application `2c9b845`, including the sourced agent and these additions. Genuine PayPal capture/refund/webhook verification, current live Gemini accuracy, controlled physical captures and independent human acceptance remain open. Documentation commits do not change either running application build. Check `/api/health` and Environment details when recording results.

These are instructions and expected results, not a claim that a human has executed them. Existing automated and hosted evidence is in [VALIDATION.md](VALIDATION.md). Record your actual observations, including failures.

## 1. Set up a complete, no-spend test

### Recommended: guided entry

On the revised release, open `/demo`, choose **Start shopping**, and use the **Demo persona** selector for Shopper, Second shopper, Seller and Reviewer. No access codes are required. Each browser's launcher owns only its private fixture workspace; another browser cannot assume its roles. **Steps and expected outcomes** explains the selected scenario. **Export test report** downloads its redacted snapshot/audit. **Reset this scenario** creates a new workspace and preserves the prior history. The public site must serve the revised release before these controls are available.

For groups, switch between Shopper and Second shopper in this owned workspace. For shipping/evidence/remedies, switch to Seller/Reviewer, then back to Shopper. The same identity and records return when you switch back. Existing tests below apply within the guided workspace. Separate profiles and access codes below are for ordinary protected test workspaces, not guided demo personas.

| ID       | Steps                                                                                                                                                                               | Expected result                                                                                                                                                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEMO-01  | Start shopping, Find my match, review a product, close the review, then reopen and explicitly approve simulated purchase.                                                           | Closing creates no order. Explicit approval creates one fixture order; no provider calls or real money.                                                                                                                                                                                    |
| DEMO-02  | Switch to Seller, simulate shipment/delivery, switch back to Shopper and open My orders.                                                                                            | The same shopper sees the delivered order. Second shopper cannot see the first shopper's private order.                                                                                                                                                                                    |
| DEMO-03  | Launch each of the nine scenario buttons, inspect the expected state, then reload.                                                                                                  | Scenario kind, fixture modes and private workspace survive reload. Conflict/failed refund remains open or truthfully failed; synthetic completion is never a live provider claim.                                                                                                          |
| DEMO-04  | Export the report, then Reset this scenario.                                                                                                                                        | JSON contains this fixture's snapshot and redacted audit, no owner token/hash or credentials. New workspace ID; prior records retained.                                                                                                                                                    |
| GLASS-01 | Open `/shop`, rotate the featured 3D product, select SSD/dock/mouse, and open details.                                                                                              | Genuine geometry turns; name, catalog price and details match the selected product. Original proportions are illustrative. No purchase occurs from viewing.                                                                                                                                |
| GLASS-02 | Inspect shop/groups/orders/support, key dialogs and full footer at 320/390/820/1440px. Use Tab/Escape and reduced-motion OS/browser preference.                                     | Readable monochrome controls, visible focus, teal confined to the closing wordmark, no horizontal page overflow. Reduced motion avoids opening/rotation animation. Record human comfort separately from automated checks.                                                                  |
| GLASS-03 | Use a browser without WebGL, or an engineer's renderer/context-loss test. Scroll the stage out of view and back.                                                                    | Illustration/details remain usable after failure. Offscreen scene is suspended and returns when visible. A fallback is not a rendered-3D success.                                                                                                                                          |
| VOICE-01 | In guided shopping, Talk to DALE → Play synthetic request.                                                                                                                          | Editable transcript sets chargers, $40 and 65W; actual catalog matching runs. Label says no speech recognition/provider call. No order is created.                                                                                                                                         |
| VOICE-02 | Edit transcript to `Find headphones under forty dollars`, then Use this request. Try `charger under $40 or under $60`.                                                              | Correction changes actual category/budget. Conflicting budgets require clarification rather than silent selection. Grammar is bounded English with USD.                                                                                                                                    |
| VOICE-03 | Submit `Approve payment now` or `Execute this code`; then `Show my orders`.                                                                                                         | Protected financial/code commands are rejected. Own-orders navigation works. No charge, refund or replacement occurs.                                                                                                                                                                      |
| VOICE-04 | On support, submit `My item is damaged and I want a refund`.                                                                                                                        | Draft prepares a support request; choose the order and review it. It does not automatically authorize a refund.                                                                                                                                                                            |
| VOICE-05 | Stop the synthetic request and navigate; reload the ordinary protected storefront.                                                                                                  | No delayed request from the stopped session. Ordinary live voice remains explicitly disabled under the no-spend gate; typed shopping remains usable.                                                                                                                                       |
| VOICE-06 | Only after available free quota and disabled billing are independently confirmed: enable the documented live flags, open HTTPS/localhost, and choose Start microphone conversation. | Microphone requested only on that action, visible status/transcript, grounded catalog tool result and spoken response. Stop microphone remains reachable after scrolling and halts capture/playback. This real microphone/provider test is pending; fixture success does not establish it. |
| VOICE-07 | During an authorized live session, deny microphone access, stop, navigate/logout, let the token expire, or interrupt the provider connection.                                       | Clear stopped/unavailable state, closed tracks/socket/playback, typed correction still works. Restart requests a fresh constrained token; no automatic paid fallback. Automated versions intercept provider traffic and use synthetic browser audio.                                       |

Demo ceilings bound the small server: 200 retained workspaces, 300 actions and 50 analyses per workspace, 8 uploaded originals per workspace and 128 total demo uploads (at most 512 MiB). Per-minute budgets also apply. An exhausted global storage limit requires operator review; records are not silently deleted. Start fresh after a per-workspace activity limit.

### Ordinary protected workspaces

Use four separate browser profiles or different browsers. Ordinary tabs in one profile share the login cookie and cannot reliably represent different roles. Private windows in the same browser may also share a session.

| Profile | Purpose                                   |
| ------- | ----------------------------------------- |
| A       | Main shopper                              |
| B       | Seller                                    |
| C       | Reviewer                                  |
| D       | Second shopper, groups and privacy checks |

Access codes are in the owner's local ignored `.data/deploy/access-codes.txt`. Use the shopper/demo code for shoppers and the operator code for seller/reviewer. Never put codes, cookies or keys in screenshots or test reports.

Those are hosted access codes. For localhost, use the demo/operator codes configured in the ignored `.env`; do not assume the hosted and local codes match. Local adapters default to fixtures. If already in a fixture shopper workspace, skip the hosted conversion steps below and connect operator profiles to its workspace ID.

Normal hosted shopper sessions use **PayPal sandbox**. Merchant USD approval is currently blocked, so use an **engineering fixture workspace** for the full workflow:

1. In A, open the app, click **Start shopping**, select **Shopper**, enter the **Demo access code (if configured)** and click **Enter workspace**.
2. Expand **Environment details** and record this initial workspace ID. Sign out.
3. In A, click **Operator workspace**, select **Reviewer**, enter that ID in **Customer workspace ID** and the **Operator access code**. Click **Enter workspace**.
4. Expand **Environment details**. Under **Engineering scenario**, select **Fresh shopper workspace**, then click **Open new fixture scenario as shopper**.
5. Wait for **Shopper · Sign out** to appear. This creates a new workspace and changes A into its shopper. Record the **new** workspace ID. Confirm payment and analysis modes are fixture; shipping is simulated.
6. In B and C, use **Operator workspace** with the new ID and operator code; choose **Seller** in B and **Reviewer** in C.

Every new scenario creates another workspace and switches the profile that opened it to a shopper. Reconnect seller/reviewer profiles using its new ID. Reload other profiles after a different role changes an order or case.

Fixture approval never moves real money. Fixture labels, carrier records and refunds must remain visibly labeled. No AI billing or live model calls are needed for this guide.

Prepare two ordinary PNG/JPEG/WebP pictures of a test object for evidence, and the six supplied files in `fixtures/device-labels/`. Use harmless test objects and identifiers such as `SER-101`. Device-label fixtures are intentionally synthetic; arbitrary photographs are not recognized by the fixture label adapter.

## 2. Shopping, compatibility and approval

Start with fresh A. Tests that change filters should finish by clicking **Find my match**. Clear **Anything else** before unrelated tests.

| ID      | Steps                                                                                                                                                | Expected result                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SHOP-01 | Select Barrel-jack Laptop (45W), chargers and a $30 budget; Find my match.                                                                           | Only compatible options within budget. 45W Barrel Power Adapter variants at $24/$29 can appear; incompatible 65W USB-C Wall Charger does not.                                                                                      |
| SHOP-02 | Keep chargers; lower budget to $10; Find my match.                                                                                                   | No matching candidates. No incompatible or over-budget purchase is offered to fill the gap.                                                                                                                                        |
| SHOP-03 | Select USB-C Laptop (65W), $80, chargers; request `100W` in preferences. Compare lowest-price ranking with **Matching features, then lowest price**. | Price ranking starts with 65W USB-C Wall Charger; feature ranking promotes 100W USB-C Wall Charger. Sponsored status does not override compatibility, budget or the chosen ranking.                                                |
| SHOP-04 | Expand **Compare catalog facts** for recommendations.                                                                                                | Recorded price, compatibility and specifications have catalog source IDs. No invented performance or unsupported product claims.                                                                                                   |
| SHOP-05 | With USB-C Laptop (65W)/$80 selected, put `A charger for USB-C Laptop (45W) under $20` in Anything else; Find my match.                              | Device/budget clarification, no candidates until confirmed. **Use selected device and budget** accepts the controls; it does not silently change them to the 45W profile/$20. Alternatively correct the controls and search again. |
| SHOP-06 | Complete a search, view the shopping conversation, then reload.                                                                                      | Saved brief and private conversation survive. History is bounded to the last 20 turns; it is not shared with another shopper.                                                                                                      |
| SHOP-07 | Review a purchase but close it without approval. Change device/budget, then Find my match.                                                           | No purchase from closing the review. The new saved brief invalidates old unpaid approvals. Changed unsaved controls require saving before another purchase review. Paid orders remain recorded.                                    |
| BUY-01  | Restore USB-C Laptop (65W)/$80/chargers. Review the $29 65W USB-C Wall Charger.                                                                      | Dialog shows the exact item, model, merchant/payee, USD amount, delivery promise, policy/30-day return window, shipping/taxes and expiry before approval.                                                                          |
| BUY-02  | Close the dialog; check My orders. Reopen it and click **Approve simulated purchase** once.                                                          | Closing creates no paid order. Approval records one paid fixture order with a fixture reference and **Fixture payment recorded** notice.                                                                                           |
| BUY-03  | Reload My orders; repeat the same checkout request using the engineering test tools in section 8.                                                    | The same approved command does not create another charge/order. A newly reviewed and separately approved purchase is a different purchase and may create another order.                                                            |
| BUY-04  | Try forged fingerprints, an incompatible model, an expired quote and an old brief version using section 8.                                           | Rejected without money movement. The browser normally prevents these requests; they need API/automated verification.                                                                                                               |
| UX-01   | At a 390-pixel browser viewport, search, expand comparisons, review and open support. Use keyboard Tab/Escape in dialogs.                            | Main flows remain readable and operable, no horizontal page overflow in expanded comparisons; dialogs can be closed. Record any inaccessible control rather than assuming accessibility is complete.                               |

## 3. Device identification and scam warnings

For the updated editorial storefront, also test the following in a fresh local fixture workspace:

| ID    | Steps                                                                                                                | Expected result                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-02 | Open `/shop` with the default 65W profile and $80 budget. Use Show more products twice.                              | Every category is initially eligible; twelve cards expand to twenty-four, then all twenty-nine eligible offers. No incompatible or over-budget item is added. Search/category changes reset pagination. |
| UX-03 | Use the product-stage arrows and four selectors. Open the SSD detail, then Review purchase; close without approving. | Product illustration, title and price change together. Detail cites `catalog:5:v1` and $79.00. Neither browsing nor opening/reviewing creates an order.                                                 |
| UX-04 | Lower budget to $20; open the featured headphones.                                                                   | Direct purchase review is unavailable. Match this collection to my device previews the category within budget; Find my match is still required to save changed terms.                                   |
| UX-05 | Move down the catalog, then use My orders, Support and Discover. Reload and use browser Back.                        | Each new screen opens at the top. The selected brief survives route changes/reload; browser history returns to the correct screen.                                                                      |
| UX-06 | Turn on the operating system's reduced-motion preference. Reload at desktop, tablet and 320px mobile widths.         | Decorative scroll/entry movement and smooth scrolling are disabled; browsing, explicit product selection and dialog controls remain usable without overflow or hydration errors.                        |

The header/footer use the uppercase custom DALE wordmark alone. The catalog and selector use unbranded product names and explicit demo device profiles; no manufacturer compatibility is implied.

| ID       | Steps                                                                                                                                                            | Expected result                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LABEL-01 | Open **Identify device from label**. Upload `label-4.png` through **Device label photo**; click **Read model label**.                                            | Barrel-jack Laptop (45W) is suggested, but the selected profile remains unchanged. **Use Barrel-jack Laptop (45W)** explicitly changes it; Find my match saves the new brief.   |
| LABEL-02 | Repeat with `label-1.png`, `label-2.png`, `label-3.png`.                                                                                                         | Suggestions are USB-C Laptop (65W), USB-C Laptop (100W), USB-C Laptop (45W) respectively; each requires confirmation.                                                           |
| LABEL-03 | Upload `label-5.png`, then `label-6.png`, then an unrelated ordinary photo.                                                                                      | No confident model selection: unreadable, conflicting or unrecognized fixture input. No compatibility guess or automatic purchase. This does not test live OCR accuracy.        |
| LABEL-04 | Submit an unsupported file or an image over 4 MiB.                                                                                                               | Rejected with an error; no brief change. Private label uploads are used for identification without retaining the image. Evidence originals have a different retention flow.     |
| SCAM-01  | In **Something feel off?**, paste `Never share your password. Do not pay by gift card; use the store checkout.` into **Seller message**; **Check this message**. | Low warning level / **No listed warning signals found**. Safety advice itself is not treated as an instruction to pay or reveal credentials. This is not a guarantee of safety. |
| SCAM-02  | Check `Send your verification code and pay with gift cards immediately or your account will be suspended`.                                                       | **Pause and verify**, with relevant credential/off-platform/urgency reasons. Warning is advisory; no payment, refund or accusation is automatically executed.                   |
| SCAM-03  | Check the multi-line text below.                                                                                                                                 | Obfuscated instructions still raise warnings; ordinary parcel text does not suppress them.                                                                                      |
| SCAM-04  | Check a normal delivery update and then reload.                                                                                                                  | No listed warning signals for ordinary text. Testing uses fixture/local rules; native model outage and response validation are separately covered by contracts.                 |

SCAM-03 input:

```text
Seller: Your parcel is ready.
Seller: s.e.n.d your verification c0de.
Seller: p4y with g1ft c4rds right now.
```

## 4. Group purchases

Use a new fresh fixture workspace if A has already bought the same item. D needs its own browser profile.

| ID       | Steps                                                                                                                                         | Expected result                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GROUP-01 | A finds the $29 65W USB-C Wall Charger and clicks **Join group deal**. Open Group deals.                                                      | One of two required commitments; no charge merely for joining.                                                                                                                 |
| GROUP-02 | While forming, **Leave commitment**, then join again.                                                                                         | Commitment removed then restored, with no payment.                                                                                                                             |
| GROUP-03 | **Copy invitation**. D signs in as Shopper using the demo code and **Group invitation (optional)**, then joins the same item/model.           | Group becomes **DISCOUNT UNLOCKED**. Review group purchase shows $26.10, a locked 10% discount and a 30-minute checkout window.                                                |
| GROUP-04 | A approves its group fixture purchase; D does not approve. Reload both.                                                                       | Only A has a paid order. D has no automatic charge/order. Each participant must approve individually.                                                                          |
| GROUP-05 | Open the **Group discount after another participant declines payment** scenario (`group_partial`); complete the remaining shopper's purchase. | The other participant's decline does not remove A's locked $26.10 price. Reload preserves the paid order.                                                                      |
| GROUP-06 | Exercise expiry, scarce stock and concurrent checkout with section 8.                                                                         | Expired reservations cannot be used; stock is not oversold; repeat commands do not repeat payment. These clock/race cases are not reliably created by casual browser clicking. |

## 5. Fulfillment, evidence and customer-first remedies

Use the paid order from BUY-02, with B/C connected to its workspace. For a shortcut, the `delivered` scenario supplies a delivered fixture order.

| ID         | Steps                                                                                                                                                                                             | Expected result                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER-01   | B: My orders → **Record dispatch**. Enter `SER-101`, a condition description and optionally a photo; **Record evidence**. Then **Simulate shipment**, **Simulate delivery**. A reloads My orders. | Separate dispatch/shipped/delivered records; A sees delivered. These buttons simulate shipping, not a real carrier movement.                                                                                                                    |
| CASE-01    | A: **Get help / return** → product arrived damaged → Refund → **Open my request**.                                                                                                                | Open support case, preferred remedy and seller response target. No automatic refund or denial; analysis alone cannot deny the customer.                                                                                                         |
| CASE-02    | A: **Add your evidence**, choose receipt checkpoint, enter `SER-101`, describe damage, upload a test photo; **Record evidence**.                                                                  | Authorized buyer receipt record and private original. **View original image** returns the original; **Download private case report** records sources, integrity/provenance, unresolved facts and financial references.                          |
| CASE-03    | Add another description with no identifier or photograph.                                                                                                                                         | Description accepted; missing evidence does not automatically deny the request or accuse the shopper. A note is still required.                                                                                                                 |
| CASE-04    | Request **Get capture code (optional)**, include the code/item/identifier in a photo, submit within ten minutes. Change checkpoint in another attempt.                                            | Bound, single-use challenge recorded; changing checkpoint clears the form's code. Expiry/reuse/other-user attempts are rejected. The challenge does not prove the code is visible, when the photo was taken or what was physically in a parcel. |
| CASE-05    | Submit matching IDs; click **Review evidence**. Then test `identifier_conflict` separately.                                                                                                       | Matching records cannot establish physical cause/timing. Conflicting identifiers require human review. Neither result labels either party a fraudster or auto-denies a remedy.                                                                  |
| CASE-06    | Add buyer-return evidence as A and seller-return evidence as B. Try the other party's checkpoint through API tools.                                                                               | Four separate checkpoints: seller dispatch, buyer receipt, buyer return dispatch, seller return receipt. Only the authorized party can add each.                                                                                                |
| CASE-07    | Reuse the same image in evidence; download the report.                                                                                                                                            | Reuse/provenance can be a review cue; it is not proof of fraud or grounds for automatic denial. Originals and report stay private.                                                                                                              |
| RETURN-01  | C: Support → **Approve requested refund**. Select **Arrange a merchant-paid return first**, label `DEMO-LABEL-100`, reason of at least ten characters, **Authorize refund**.                      | Only the return is arranged at this step. Case stays open; no completed refund. Customer return shipping cost is $0. The label is a simulated reference, not a purchased postage label.                                                         |
| RETURN-02  | A reloads Support → **Record return handoff** → tracking `DEMO-TRACK-100` → **Save return checkpoint**.                                                                                           | Return is in transit; case still open, no final refund.                                                                                                                                                                                         |
| RETURN-03  | B reloads Support → **Record return receipt**. First try a different tracking reference, then save `DEMO-TRACK-100`.                                                                              | Mismatched tracking rejected. Matching receipt recorded by seller. Tracking alone does not prove the parcel's contents.                                                                                                                         |
| RETURN-04  | C reloads, approves requested refund with a policy reason after receipt. A reloads order/report.                                                                                                  | One completed fixture refund, resolved case, refunded financial status and reference. Reload/reconciliation never creates another refund.                                                                                                       |
| RETURN-05  | In a separate case, C selects **Approve a no-return remedy** and gives a reason.                                                                                                                  | Recorded waiver permits the requested remedy without requiring a parcel return. This customer-benefit exception is allowed even while a prepaid return is pending; previous arrangement history remains.                                        |
| RETURN-06  | Attempt direct resolution before prepaid receipt without a waiver using section 8.                                                                                                                | Rejected. Do not count RETURN-05 as a bypass defect: the UI deliberately offers an authorized no-return exception.                                                                                                                              |
| REPLACE-01 | In a new delivered scenario, A requests Replacement. C authorizes a no-return replacement with reason, or completes prepaid stages first. B dispatches the linked replacement.                    | Linked replacement fulfillment, no extra buyer charge. Replacement shipping is simulated and separately recorded.                                                                                                                               |
| CHOICE-01  | Before remedy execution, A changes between refund/replacement through **Choose … instead**. Try changing after execution.                                                                         | Customer choice updates before execution. After an executed remedy, another review is required; no duplicate replacement/refund is automatically allocated.                                                                                     |
| APPEAL-01  | On a resolved or failed-refund case, A uses **Request another review** and records a reason.                                                                                                      | Appeal retained for human review. Completed refund remains completed; failed refund does not become successful just because an appeal was opened.                                                                                               |
| POLICY-01  | Review delivery/window/deadline information; use seeded deadlines and automated date tests.                                                                                                       | Demo window is 30 days from recorded delivery. Missing/late timing goes to review, not automatic denial. Remedy target is 24 hours from return receipt or waiver; missing it escalates once, not an unauthorized automatic refund.              |

## 6. Recovery and engineering scenarios

From C's reviewer session, Environment details → Engineering scenario → Open new fixture scenario as shopper. Wait for the shopper header, record the new ID and reconnect B/C as needed. Each scenario is isolated; opening one does not change another workspace's orders.

| Scenario ID           | What to do after opening                                                            | Expected result                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fresh`               | Search and buy.                                                                     | Empty workspace with fixture payment and analysis; ordinary explicit approval path.                                                                                  |
| `delivered`           | My orders → Get help / return.                                                      | One delivered order ready for a customer-selected remedy/evidence.                                                                                                   |
| `identifier_conflict` | Open Support, review evidence/report.                                               | Conflicting submitted identifiers; open human review, no accusation or automatic denial.                                                                             |
| `seller_silence`      | Inspect Support and reload.                                                         | Synthetic seller deadline passed; one human-review escalation. No automatic denial/refund.                                                                           |
| `refund_failure`      | Inspect Support, order and report; request another review.                          | Truthful failed refund, zero refunded amount, retained fixture provider reference, human-review next step. Do not create a new refund operation to bypass failure.   |
| `refund_timeout`      | Inspect pending/unknown refund; allow the worker time and reload, up to 60 seconds. | Recovery uses the original operation and completes one fixture refund. It may already be recovered when the browser opens; financial records must remain consistent. |
| `group_partial`       | Review and approve remaining group purchase.                                        | Other participant declined; A still pays the locked $26.10 once.                                                                                                     |
| `canceled_order`      | Inspect paid order, open support and choose a remedy.                               | Fulfillment canceled while captured payment stays recorded. Refund/replacement needs authorization.                                                                  |
| `late_order`          | Inspect order and help options.                                                     | Synthetic delivery promise passed; one help event, customer choice, no automatic money movement.                                                                     |

Additional cases:

- **CANCEL-01:** In a purchased fixture, B uses **Cancel fulfillment**, enters **Cancellation reason**, then **Record cancellation**. A sees cancellation and can choose support/refund/replacement. Cancellation alone must not mark the captured money refunded. Unpaid/ambiguous-capture cases are covered by the engineering suite.
- **RESET-01:** As reviewer of a designated fixture, choose **Archive fixture and start fresh**. A new shopper workspace opens. The old one retains its audit/financial/evidence history and becomes read-only. Normal provider workspaces cannot be reset.

## 7. Privacy, permissions and validation

| ID         | Steps                                                                                                                            | Expected result                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRIV-01    | D signs in without an invitation.                                                                                                | New workspace, no A orders/cases/conversation/photos.                                                                                                                                              |
| PRIV-02    | D joins A's group invitation.                                                                                                    | Shared group visible, but A's purchases, support cases and shopping conversation remain private to A and authorized staff.                                                                         |
| PRIV-03    | Copy A's original-image/report URL into D or a signed-out profile.                                                               | Access denied; no original or case report disclosed. An authenticated wrong owner can receive 404 to avoid revealing existence.                                                                    |
| ROLE-01    | Sign in as operator with a wrong code.                                                                                           | Login rejected; no seller/reviewer session.                                                                                                                                                        |
| ROLE-02    | In A, attempt a reviewer resolve action; in B, attempt buyer receipt/handoff; in C, attempt another party's shipping checkpoint. | Server rejects unauthorized role/party actions even if a browser request is forged. Hidden buttons alone are not the security boundary.                                                            |
| INPUT-01   | Omit required fields, use an invalid enum, oversized image or malformed approval.                                                | Clear rejection and no state/payment change. Required description/reason fields cannot be silently discarded.                                                                                      |
| HTTP-01    | Check API without authentication, wrong Origin and request-budget exhaustion using an isolated engineering session.              | Private unauthenticated access rejected; missing/wrong mutation Origin rejected; exhausted budgets return 429 and Retry-After without performing the action. Do not flood other testers' sessions. |
| WEBHOOK-01 | Run forged webhook tests, then separately schedule real provider verification.                                                   | Unverified events cannot mutate payment state or impersonate a fixture. Passing forged-event tests does not establish genuine PayPal webhook delivery.                                             |

Budget limits per workspace/actor per minute: 120 actions, 20 uploads, 10 shared shopping/identification/analysis requests, 20 engineering scenario requests. A 429 means wait/retry after the indicated interval; it is not a failed payment or permission to issue a replacement money operation.

## 8. Engineer checks that supplement manual clicking

From the repository, with Node 22 and installed dependencies:

```powershell
npm run check
npm run eval
npm run eval:models
npm run test:integration
npm run build
npm run test:e2e
```

`eval:models` defaults to mock transport. Keep that default. These checks cover tampered approvals/payees, expiry/clock transitions, native Gemini contracts and transient retries, stock/concurrent commands, capture/refund interruptions, leases/dead letters, upload integrity, checkpoint permissions and 200 seeded workflow traces that manual clicks cannot reliably reproduce. Browser tests use their own isolated fixture setup. Install Playwright Chromium if the machine has not been prepared. See [ENGINEERING.md](ENGINEERING.md) and the generated [OpenAPI contract](openapi.json) for request schemas.

On the owner's configured checkout, the following use the ignored deployment configuration and create isolated hosted test sessions:

```powershell
npm run verify:shopping
npm run verify:scenarios
npm run verify:performance
```

They validate shopping/label/message behavior, all nine scenarios plus evidence/returns/groups, and authenticated read performance. Under the current hosted fixture analysis configuration they make no live AI calls and do not complete real PayPal payments. Do not switch provider modes for these checks.

For API negatives, use an isolated fixture session and requests matching OpenAPI; capture its valid IDs from your own browser's Network panel. Test one condition at a time and compare state before/after. Do not publish cookies or imitate another tester's account. The automated suite is the preferred repeatable route for expiry, concurrency, forbidden Origin headers and integrity tampering. Never alter production originals/database files just to demonstrate a negative test.

Persistence/recovery needs an owner-operated service restart, not merely a browser reload:

1. `npm run verify:scenarios` saves a protected session/order/photo baseline.
2. `npm run prepare:restart` adds saved brief/conversation.
3. Actually restart the app/worker on EC2 through the deployment runbook.
4. `npm run verify:restart` must observe a changed instance ID and unchanged session/order, original SHA-256, brief and conversation.

Backup restore is a separate owner-run rehearsal in a scratch database/directory; it must match snapshot state/counts and original hashes without replacing production. See [DEPLOYMENT.md](DEPLOYMENT.md) for operations and [VALIDATION.md](VALIDATION.md) for the completed rehearsal. Copying an archive alone is not a restore test.

Do not run `verify:ai` or live model evaluations while free quota is unavailable. Do not enable billing. Genuine sandbox approval/capture/refund/webhook checks remain a separate provider milestone.

## 9. Remaining sign-off

| Gate              | What is still needed                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PayPal            | USD-capable sandbox merchant approval; actual approved capture, actual refund, recovery/reconciliation and genuine signed webhook receipts. OAuth/create/retrieve and forged-event rejection already passed. |
| Gemini            | When free quota is available, run the fixed live text/vision subset and record actual accuracy/latency/failures. Earlier smoke checks and current mocks do not establish this gate.                          |
| Human acceptance  | Five independent testers execute the acceptance tasks and record outcomes, including mistakes and uncertainty.                                                                                               |
| Physical evidence | Controlled both-party object/capture exercises with independent labels. Photos, hashes and identifiers cannot alone prove what happened physically.                                                          |
| Submission        | Complete the release/demo video and organizer submission after genuine provider and acceptance gates. A working fixture demo is not a submitted hackathon entry.                                             |

[ACCEPTANCE.md](ACCEPTANCE.md) contains human/physical protocols and empty recording templates. Real commerce additionally needs individual identity, global inventory, carrier integration, operational hardening and security review; the current release is a bounded hackathon demo.

The CI allocation gap is closed: [run 37373916879](https://github.com/Hrushikesh-ramilla/buyerguard/actions/runs/37373916879) passes both jobs at `53c284b` after the 7 October retry, including ten production-container browser journeys. The earlier cancellation happened before steps because GitHub could not allocate a hosted runner.

## 10. Record each result

### Editorial preview additions

These cases apply to the local redesigned preview until it is deployed; the hosted 5b393c0 interface has the original presentation. Start at `http://localhost:3000/shop` with the same private role setup.

| ID        | Steps                                                                                                                                           | Expected result                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| DESIGN-01 | Open shop, orders, groups and support through navigation; use browser Back, reload and direct URLs.                                             | Correct screen/URL, saved session and shopping brief preserved; no cross-account change.                                                   |
| DESIGN-02 | Click Sound & focus in collections. Attempt purchase before saving, then Find my match.                                                         | Collection preview updates; purchase requires saving the brief first. Confirmed audio matches follow device/budget constraints.            |
| DESIGN-03 | Search matched products for Bluetooth, then an absent phrase, then clear.                                                                       | Filters current candidates only; clear empty-result message; clearing restores the selection.                                              |
| DESIGN-04 | Open headphone details. Inspect price/specifications/compatible models/source/sponsorship. Close with Escape, then review a confirmed purchase. | Grounded facts, opener focus restored, exact-price approval through the existing guard. No extra order on merely viewing details.          |
| DESIGN-05 | Set $20 budget, open featured headphones, choose Match this collection to my device.                                                            | No direct approval for the $59 item. The audio preview stays within $20 and is empty until constraints permit a match.                     |
| DESIGN-06 | Test 1440/820/390/320px widths and reduced-motion preference. Open product details and navigate screens.                                        | No page/dialog horizontal overflow; readable mobile cards; no background interaction/scroll through a dialog; motion preference respected. |

Use `PASS`, `FAIL`, or `BLOCKED`; a blocked/unexecuted test is not a pass.

```text
Test ID:
Date/time and browser/profile:
Build and workspace ID:
Payment/analysis/shipping modes:
Input and steps:
Expected:
Observed:
PASS / FAIL / BLOCKED:
Redacted screenshot or private report reference:
Follow-up:
```

Keep actual customer images, original reports and access credentials private. For a failure, preserve the original workspace and references before opening a new isolated scenario; do not reset away the evidence needed to investigate.
