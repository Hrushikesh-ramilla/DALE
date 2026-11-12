# DALE customer storefront: implementation contract

Version 1.0 · Updated 26 October 2026 · Status: M0, M1 and M2 complete; M3 independent buying circles is next. See the progress ledger and M0 baseline report for evidence and retained exceptions.

This is the authoritative implementation plan for the current phase. It supersedes conflicting implementation scope, seller/reviewer demo steps, dashboard ideas and refund-demo requirements in `HACKATHON-STRATEGY-2026-10-25.md`. That document remains background research. Later explicit user decisions take precedence and must be reflected here and in the progress ledger.

Progress and evidence: [CUSTOMER-STOREFRONT-PROGRESS.md](CUSTOMER-STOREFRONT-PROGRESS.md).

## 1. Objective and fixed boundaries

Complete a working customer storefront before building a seller portal. A customer must be able to discover a suitable product with AI, understand the recommendation, join an exact-product buying circle, place an order using PayPal sandbox or cash on delivery, revisit their order and submit and track an evidence-backed support request.

The main demonstration must finish within five minutes at normal speed, including model and payment-provider waits. Target 4:30 with 30 seconds reserved for variance. The submitted hackathon video remains a separate under-three-minute artifact. No feature enters this phase unless its useful outcome fits this shared story or is required to make it work correctly.

### Included

- Customer guest entry, existing registration/login, persistent ownership and independent sessions.
- Existing catalog browse/search/product detail, cart and wishlist paths: retain and qualify them; fix broken customer interactions.
- AI discovery, constraint clarification and a compact evidence-backed decision card.
- Exact-product group discovery, shareable circle links, explicit join/leave, progress and locked approved pricing.
- One unit per order in the main journey; existing cart behavior stays truthful about separate approvals.
- Customer checkout with genuine PayPal sandbox execution, plus a new explicit COD method.
- Order history/detail, accurate payment and fulfillment labels, persistence and cancellation where eligible.
- Customer support-request submission, image evidence, bounded AI findings and saved case tracking.
- Loading, error, empty, unavailable-provider, keyboard, mobile and refresh behavior for these flows.
- Deployment and evidence necessary to verify the customer experience.

### Explicitly excluded

- Seller/reviewer portal screens, merchant dashboards, AG Studio integration and merchant account switching.
- Customer or AI authority to approve returns, mark goods returned, issue refunds or mark COD cash collected.
- New refund/settlement workflows; preserve existing restricted services without exposing them to buyers.
- Real shipping, COD cash collection, carrier integrations or payouts. Fulfillment remains labeled simulation.
- Multi-product optimization, bundled-payment rewrite, multi-seller checkout, autonomous negotiation.
- New voice, multilingual, live camera or photo-shopping capabilities; preserve existing working features without expansion.
- Additional sponsor product surfaces, database/framework rewrites or deployment migrations solely for awards.
- Catalog growth, broad redesign or unrelated product features. Preserve existing listings, repairs and customer data.

“Complete customer storefront” means all included customer flows work through real application services with clear pending boundaries. It does not mean the seller has already acted. A case waiting for merchant review is a valid completed customer submission; an invented approval is not.

## 2. Fixed product decisions

| Topic | Decision |
| --- | --- |
| Customer A | Main browser, independent buyer identity, genuine PayPal sandbox purchase |
| Customer B | Incognito browser context, separate buyer identity, same storefront/circle, COD order |
| Additional customers | Separate cookie stores/profiles; multiple incognito tabs may share a session |
| Registration burden | Existing guest entry is sufficient to join and place a supported order; registration remains available for durable recovery across devices |
| PayPal account burden | Only the PayPal-paying buyer needs a sandbox buyer account; joining and COD do not require one |
| Group threshold | Explicit qualifying customer commitments under persisted merchant-approved terms, including COD only where policy permits; never describe the count as paid customers |
| Group payment | Individual orders; no pooled funds, collective payment or payment by the presenter on behalf of everyone |
| Discount | Server-owned policy and exact quote; AI cannot invent or negotiate a discount |
| COD confirmation | “Order confirmed — payment due on delivery”; no PayPal call and no paid status |
| Returns | Owned eligible PayPal-captured orders support return/refund requests. Uncollected COD supports eligible cancellation, not a financial refund |
| End of customer return flow | Request and evidence saved; AI findings visible if available; “Awaiting merchant review” |
| Seller phase | Starts only after the completion gate in section 12 and the user's instruction to proceed |

A public circle link identifies a shared offer, not another buyer's session or order. A presenter may operate both demonstration customers, which must be disclosed; this does not demonstrate independent market adoption or resistance to fake accounts.

## 3. Starting evidence and implementation map

The earlier October 25 inspection recorded TypeScript passing and the full unit suite at 369 passed, 182 failed, 116 skipped across 99 files. Many failures cascaded from fresh catalog bootstrap rejection; independent taxonomy/catalog/evidence issues also appeared. These are historical baseline results, not results for future changes. Rerun after baseline repairs.

Confirmed design facts from source inspection:

- `src/server/customers.ts` uses a shared primary storefront workspace, with separate customer identities and private record ownership. Guest conversion preserves the guest ID.
- `src/server/service.ts` implements group commitments, quote/checkout/capture, returns and evidence. Current group readiness is based on membership, not completed payment.
- `src/domain/group-policy.ts` owns approved thresholds, discounts and expiry. Changes must preserve frozen terms and version guards.
- `src/server/payments.ts` has sandbox order/capture/refund checks and signature verification; adapters alone do not establish a working hosted journey.
- `src/server/state.ts` currently mixes order/payment/fulfillment statuses and has no explicit COD method. Adding a COD button alone would be incomplete.
- `src/server/concierge/shopping.ts` prepares per-unit approvals. Preserve this contract for the selected one-unit flow.
- `openReturn` currently requires an owned captured payment. Preserve this financial boundary for COD.
- The store layout mounts `src/components/storefront.tsx`; some page modules return `null` because the shared storefront may own their rendering. Inspect the complete route/layout/component chain before treating a page as unimplemented.

| Area | Starting files; inspect callers before editing |
| --- | --- |
| Customer UI | `src/app/(store)`, `src/components/storefront.tsx`, `concierge-pages.tsx`, `customer-entry.tsx` |
| Customer identity | `src/server/customers.ts`, `auth.ts`, `src/app/api/account/route.ts` |
| AI and decision record | `src/server/concierge/{engine,tools,retrieval,shopping,store,compatibility}.ts`, `src/components/copilot` |
| Groups and policy | `src/server/{agent-groups,service,state}.ts`, `src/domain/group-policy.ts` |
| Checkout and order contract | `src/domain/{actions,guard,money}.ts`, `src/server/{service,state,payments,order-options,recovery}.ts`, `src/components/paypal-checkout.tsx` |
| API boundaries | `src/app/api/{actions,evidence,shopping,paypal/webhook}`, copilot confirm/action routes |
| Evidence and AI findings | `src/server/{storage,ai,case-report,provenance}.ts`, `src/domain/claims.ts` |
| Persistence | `src/server/database.ts`, `src/server/db/schema.ts`, existing migration/bootstrap paths |
| Qualification | `tests`, `e2e`, existing verification scripts, `docs/DEVELOPMENT.md`, `docs/VALIDATION.md` |

File names are integration starting points, not instructions to replace those modules. Reuse shared domain services and extend their typed contracts.

## 4. Execution rules: how we avoid partial implementation

1. Before each work block, read this plan and the progress ledger, inspect the current worktree, and identify the next unmet milestone and acceptance IDs.
2. Work through the milestone dependencies below. Within a milestone, complete one end-to-end slice: persisted contract → domain operation → authorized API → actual UI → relevant verification.
3. An endpoint without a usable screen, a button without a real service, or an animation without committed state is not a completed feature.
4. Existing code is “existing, unverified” until its acceptance evidence is captured. Do not mark it done because a function or test file exists.
5. Record exact commands, outcomes, build/source identity, test mode and meaningful limitations in the ledger. Keep credentials, customer originals and private provider receipts out of public docs.
6. Fix implementation defects and legitimately stale contracts explicitly. Never weaken validation, bypass authorization, remove legitimate products, falsify reviews or skip tests simply to obtain passes.
7. Preserve existing user modifications and customer/payment history. Use isolated disposable databases for destructive test setup, never the user's preview database.
8. A routine implementation decision inside scope does not require new permission. A new product capability must map to this plan; otherwise defer it. Reflect later explicit user scope changes before working on them.
9. At the end of a work block, update milestone status, evidence, remaining acceptance IDs and the exact next step. Report completion at the level actually verified: local fixture, local live service or hosted.
10. Do not begin seller UI work to make a customer action appear complete. Keep the real pending state and document the later integration contract.
11. Complete each milestone in one continuous work session, as explicitly requested by the user. Do not end the turn merely because a work block or partial verification finished; continue until the milestone's acceptance gate is met or a specific external dependency genuinely prevents further progress.

Milestone states: `not_started`, `in_progress`, `verification_needed`, `complete`. A milestone is `complete` only when every applicable acceptance criterion passes; record a dependency issue separately. Reopen a completed milestone if a later change invalidates its evidence.

## 5. M0 — Recover a trustworthy baseline

**Dependencies:** none. **Deliverable:** reproducible startup and an honest failure inventory.

Work:

- Capture source/worktree identity without changing existing work. Record configured modes without printing secrets.
- Reproduce clean catalog bootstrap failures on an isolated database. Review phone-manifest source-origin declarations against actual recorded sources; repair evidence and policy consistently. Do not disable source review.
- Reconcile the storage-leaf mismatch and remaining invalid manifest leaf values; triage missing manifest/repair-evidence and historical count expectations individually.
- Run the current typecheck, unit suite and relevant lint/build checks. Classify remaining failures as shared setup, current product defect or outdated test expectation with evidence.
- Establish clean installation instructions, web/worker/inference dependencies and the test configuration used for the rest of this plan.

Acceptance:

- **B01:** Fresh installation/database can start, load the catalog and create a buyer session without private local database history.
- **B02:** Existing customer data and reviewed catalog repair history survive an ordinary restart.
- **B03:** Baseline failures are itemized; all shared setup blockers and defects preventing the selected journey are repaired.
- **B04:** Current verification results replace the earlier baseline in the ledger; unrelated unresolved failures remain explicitly listed.

Gate: do not implement new COD or decision features on top of a non-starting baseline.

## 6. M1 — Customer entry and usable storefront foundation

**Dependencies:** M0. **Deliverable:** existing customer paths work manually before AI automation is layered on them.

Work:

- Qualify guest entry, register, login, logout, guest conversion and session expiry using current customer services.
- Qualify browse/search, product details, filter/sort, cart quantity, wishlist and empty/unavailable states. Keep catalog facts separate from simulated merchant offers.
- Route orders, groups and support to real customer views, whether rendered by the shared shell or page component; avoid duplicate implementations.
- Keep existing design language. Add clear loading/error feedback, accessible labels/focus and responsive layout only where the selected experience requires it.
- Establish normal-browser and isolated-context identities in the same storefront. Only the circle and aggregate stock are shared; carts, chat, orders and evidence are private.

Acceptance:

- **C01:** A new guest can browse and add a valid item; refresh preserves their cart and session.
- **C02:** Guest registration and later login recover that customer's state; a new guest receives a different identity.
- **C03:** The second browser context can browse the same store without seeing the first customer's private records.
- **C04:** Product details and prices match server records; comparison-only/unavailable items cannot be purchased through direct API calls.
- **C05:** Main navigation, cart, wishlist and account entry work on desktop and mobile widths; keyboard operation has visible focus and usable errors.

## 7. M2 — AI discovery and persisted decision card

**Dependencies:** M1. **Deliverable:** one real request leads to a supported, explainable candidate and circle option.

Work:

- Extend the current concierge tool loop to retain the purpose, exact product constraints, budget and explicit interest in group savings. Ask only necessary clarification.
- Retrieve eligible published variants using the existing catalog services. Code enforces hard numeric/category/stock constraints; unknown compatibility stays unknown.
- When authorized by the request, expose an otherwise suitable solo offer above budget as a clearly labeled conditional group option only if approved group terms bring it within budget. Never present it as an in-budget solo recommendation or create a purchase automatically.
- Save a versioned decision record owned by the buyer: brief/version, product/variant, supported reasons and source IDs/links, observation dates, unknowns, current merchant terms, solo/group amounts and status. Link to quote/order when created.
- Render a compact card on the current shopping surface. A changed brief/offer makes the previous decision stale and requires fresh review. Avoid a separate explanation dashboard.
- Preserve draft input/history during provider failure. Show meaningful stage progress; local fallback or fixture responses must not be labeled live AI.

Acceptance:

- **A01:** A live-model request visibly invokes actual retrieval and returns facts matching server records.
- **A02:** Exact variant, budget and supported requirements are respected; impossible requirements produce a useful no-match/clarification result.
- **A03:** Conditional group price is labeled conditional until threshold/stock/policy conditions are met. Savings arithmetic uses the same base offer and currency.
- **A04:** Decision and conversation survive refresh; another buyer cannot retrieve them by ID.
- **A05:** Requirement, price or variant changes invalidate affected review/approval; old terms cannot authorize a new purchase.
- **A06:** Model outage/timeout leaves a recoverable UI and no invented cart mutation, membership, payment or refund.

## 8. M3 — Real independent buying circles

**Dependencies:** M1 and M2. **Deliverable:** normal and incognito customers join the same exact offer without persona switching.

Work:

- Add or qualify a shareable group link using server-owned circle identity. Preserve storefront scope and exclude private member/session data from the URL.
- A new guest opening the link sees exact product, threshold, committed count, approved conditional price, relevant deadline and a Join action. Authentication/guest entry returns them to that circle.
- Reuse approved policy versions and membership operations. Validate eligibility and explicit consent server-side; the same identity cannot count twice.
- Make progress updates visible via the existing refresh/event mechanism, with bounded polling only if needed. Show failures/reconnect state rather than fictitious real-time success.
- Define and persist whether COD commitments qualify. For this demonstration use approved terms that explicitly permit them. Threshold counts qualifying commitments, not captures.
- Reserve exact units atomically at readiness; freeze approved terms. Preserve existing successful buyers' locked prices when another buyer later cancels or expires. Release only the abandoning buyer's unused reservation, under server-owned rules, with a truthful remaining count/status.
- Keep leave-before-readiness and decline-checkout behavior explicit. Do not auto-charge after a join.

Acceptance:

- **G01:** Two isolated contexts with different customer IDs join the same product/circle; the first view updates without database edits.
- **G02:** Duplicate joins and concurrent final-member joins cannot inflate membership or overreserve stock.
- **G03:** Policy/brief changes, expired links, wrong variants and insufficient stock produce consistent server/UI results.
- **G04:** Readiness locks the correct amount for each eligible customer; joining alone never creates a paid order.
- **G05:** One buyer cannot view another's identity, budget, cart, order or evidence through a circle link/API.
- **G06:** Expiry/cancellation releases only eligible reservations and does not alter completed purchases. Record the exact qualification/release policy in the ledger.

## 9. M4 — Complete COD order path

**Dependencies:** M3. **Deliverable:** Customer B confirms an unpaid COD order through real persisted services.

Work:

- Add an explicit `paymentMethod` distinction and server-owned financial state. Choose the smallest additive schema/version change that separates COD confirmation from PayPal capture and existing fulfillment status; preserve existing order reads.
- Include the chosen method in new approval bindings. A method change requires fresh confirmation. Preserve valid legacy fingerprints through explicit versioning/normalization.
- Normalize legacy records only from reliable evidence. Existing fixture records remain fixture; never infer a real PayPal payment from a generic `paid` label. Ambiguous records require review and must not acquire payment authority.
- Add a typed COD create operation to the existing domain/API layer. Validate ownership, exact quote, method eligibility, price, expiry, group membership and stock in a transaction. Give repeated submissions a stable operation identity and return the same order.
- Confirm the order as `unpaid_cod` (or an equally explicit typed state), with no provider order/capture/refund IDs and no calls to PayPal. The UI displays “Order confirmed — payment due on delivery.”
- Store the merchant-approved COD reservation/acceptance expiry rule with the order. An accepted COD order retains its reservation beyond the original short payment-approval timer according to that rule; stale payment jobs must not silently cancel it or convert it to paid. No automatic cash-collection behavior.
- Permit customer cancellation only while server-known fulfillment state allows it; release the order's reservation once. No refund record for uncollected cash.
- Update snapshots, AI order lookup, events, recovery and customer order views to understand COD consistently. Code paths requiring captures must reject COD, including forged requests.

Acceptance:

- **D01:** Incognito buyer places a COD order without PayPal credentials; order/amount/method survive refresh and server restart.
- **D02:** Double-click, timeout retry and concurrent submissions create one order and one reservation.
- **D03:** COD creation and cancellation make zero provider calls, produce no capture/refund IDs and never appear as paid revenue.
- **D04:** Method/quote tampering, expired terms, wrong owner and insufficient stock are rejected before committing effects.
- **D05:** Cancellation/expiry/recovery follow the recorded COD rule, with no duplicate stock release and no damage to another buyer's paid order.
- **D06:** Existing PayPal/fixture records retain their original meanings and authorization boundaries after additive migration/normalization.

## 10. M5 — PayPal purchase, order history and status recovery

**Dependencies:** M4, so both payment methods have a settled contract. **Deliverable:** Customer A completes an actual sandbox payment and sees accurate persisted status.

Work:

- Keep the existing SDK approval and server-side create/capture integration. Reuse exact payee, amount, currency, internal order, request-ID and quote-fingerprint checks.
- Revalidate stock and approved terms before the first financial operation. Preserve stable operation IDs for retries and reconcile ambiguous outcomes before issuing new writes.
- Distinguish internal order creation, awaiting PayPal approval, processing, paid, unknown/needs-check and failure. COD confirmation must not share the paid presentation.
- Handle canceling the PayPal window, blocked SDK/network, refresh while pending, completed capture with lost response and server/worker restart.
- Qualify signed webhook receipt and existing provider-read reconciliation; a webhook payload alone cannot override merchant/amount/ownership checks.
- Complete order list/detail and receipt views for both methods, linking owned support cases and the decision record. Customer APIs expose no other buyer's records or permanent credentials.

Acceptance:

- **P01:** Hosted browser approval yields a genuine sandbox capture matching the reviewed merchant, exact amount, currency and order.
- **P02:** Refresh/restart and repeated capture requests retain the same provider reference and one financial effect.
- **P03:** Window cancellation/SDK failure/unknown provider response never render as paid; recovery shows the actual outcome.
- **P04:** Changed approved terms, cross-buyer IDs, forged COD capture and mismatched provider data fail closed.
- **P05:** Signed external webhook delivery is observed; duplicate/reordered/invalid events are covered by controlled tests without duplicate effects.
- **P06:** Order history and details show correct method, price, group terms, payment and fulfillment separately; no simulated shipping promise is labeled live delivery.

Basic token/order-creation verification is not sufficient for P01. Preserve private capture evidence with redacted public summaries.

## 11. M6 — Customer returns, evidence and bounded AI findings

**Dependencies:** M5. **Deliverable:** customer support request submitted end to end, stopping at authorized-review boundaries.

Work:

- From an owned eligible PayPal-captured order, expose Report a problem. Collect reason, description and requested refund/replacement; serial/reference is optional when not applicable. Reuse the merchant policy assessment; uncertain/late timing requires review, not fabricated eligibility or automatic denial.
- Reuse case creation with repeat-request protection. A customer must be able to reopen their saved request after refresh and see which order it belongs to.
- Support PNG/JPEG/WebP evidence in the customer flow using existing validation and storage, with clear limits (currently 4 MB per image). Validate actual file content and decoder bounds; never trust MIME or extension alone. Retain existing video support without adding video-AI claims or a new demo video workflow.
- Keep private original bytes, hashes, ownership/checkpoint, provenance and received timestamps. Hash integrity establishes byte consistency, not the truth/timing/cause of damage. Use existing storage access controls and verify server-bound inputs.
- Run existing bounded appearance analysis and recorded-evidence comparisons. Show visible observations, relevant recorded inconsistencies, missing information and source references. Do not infer fraud, authenticity, causation or legal entitlement. Do not invent seller evidence when none exists.
- Label findings as AI-assisted, allow the customer to correct their description/add evidence, invalidate stale analysis when evidence changes, and prevent duplicate submission on retry. Facts from submitted photos are untrusted model input, not instructions.
- Make submission independent of AI availability: persist the support request and evidence even if analysis fails. Show “AI analysis unavailable” with retry, while the case remains submitted for review.
- Render customer timeline: request received, evidence received, analysis available/unavailable, awaiting merchant review. Read later authorized events when they exist; do not generate seller replies or approval buttons.
- For unpaid COD, offer eligible cancellation and explain that no payment was collected. Do not route it through PayPal return/refund services. Post-collection COD financial remedies remain outside this phase.

Acceptance:

- **R01:** An owned eligible paid order opens one saved request; repeated requests do not duplicate cases.
- **R02:** Valid original images and notes survive refresh/restart; wrong-owner evidence reads/writes, invalid/oversized files and unsupported checkpoints are rejected.
- **R03:** Live AI findings cite supplied evidence, disclose uncertainty and distinguish recorded inconsistencies from visual suggestions. Text-only/unavailable analysis is labeled accurately.
- **R04:** Adding evidence invalidates stale findings without losing existing originals. Upload/analysis failure is recoverable and does not falsely claim submission success.
- **R05:** A submitted case remains “Awaiting merchant review”; buyer requests cannot approve, authorize return receipt, replace goods or trigger a refund.
- **R06:** COD cancellation is available where eligible, never offers a PayPal refund and releases stock once.
- **R07:** Missing seller dispatch evidence does not block a legitimate customer request or become fabricated corroboration.

For this phase's demo use a clearly labeled prepared sandbox-captured order with simulated delivery to exercise return submission. No reviewer login, return shipment or refund completion is part of the customer storefront demonstration.

## 12. M7 — Integrated release qualification and customer-phase completion

**Dependencies:** M0–M6. **Deliverable:** verified hosted customer experience and a precise handoff for later seller work.

### Test layers

- Unit/domain contracts: arithmetic, ownership, quote/method binding, COD accounting, group reservations and evidence boundaries.
- Service/database integration: transaction rollback, concurrent joins/orders, restart persistence and recovery.
- Browser journeys: actual forms, normal/incognito context isolation, circle updates, COD receipt, SDK approval and returns screens.
- Live-service checks: real AI retrieval/findings and actual PayPal sandbox buyer approval/capture; separate external signed-webhook evidence.

Fixtures are useful for failure injection and application contracts, but cannot substitute for live integration evidence. Prioritize meaningful failure modes, not tests that merely repeat a function's implementation.

### Commands and evidence

Use existing npm scripts and documented prerequisites. Run targeted checks while changing code, then typecheck, lint, the full unit suite and production build at integration. Run relevant Playwright suites under the current supported configuration, including customer flows, groups, actions, order options and evidence. Inspect each suite before execution: older whole-commerce journeys may require privileged steps that are outside this phase, and must remain labeled regression checks rather than customer-demo steps.

Useful existing entry points: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, `npm run verify:paypal`, `npm run verify:paypal:journey`, `npm run verify:agent:live`, `npm run verify:hosted`. Inspect scripts and supported arguments first; do not assume every script is side-effect-free, fully configured or adequate for this release. No need to repeat earlier research or unchanged passing checks without a reason.

Record acceptance IDs, exact command, source/build identity, environment, fixture/live distinction, outcome and redacted evidence location. Logs and screenshots must exclude permanent keys, raw customer originals and session secrets.

### Five-minute customer-only rehearsal

Prepare browser sessions and verified sandbox access before the clock. No precomputed AI answer, fabricated join or fake payment success. The total includes real waits.

| Time budget | Action |
| --- | --- |
| 0:00–0:15 | State need and budget; enter request |
| 0:15–1:00 | AI retrieval and decision card show a supported conditional saving |
| 1:00–1:45 | Open shared circle in incognito; independent buyer joins; threshold/price update |
| 1:45–2:20 | Incognito buyer confirms COD; show payment due and saved order |
| 2:20–3:30 | Main buyer reviews valid terms, approves PayPal and sees confirmed receipt after refresh |
| 3:30–4:15 | Open prepared eligible order, submit customer evidence/request and show bounded findings plus awaiting-review status |
| 4:15–4:30 | Show committed versus paid status and the demonstrated saving |
| 4:30–5:00 | Variance buffer; no additional feature |

If input setup is already prepared for the demonstration, label it. AI findings may use clearly labeled existing uploaded evidence with a live analysis, while a separate browser acceptance run proves fresh upload. Do not use this allowance to omit R02 or R04. Keep the stale-approval boundary check in acceptance verification; include it in the live demo only if the core journey already fits with buffer.

Three consecutive hosted runs must finish below five minutes at normal speed, targeting 4:30. Record actual per-step times and failures. If slow, reduce round trips/navigation and improve the selected flow; defer seller features and decorative work. Do not silently remove an included customer acceptance criterion to pass the timing gate. The edited submission video targets 170 seconds, with disclosed wait cuts; it does not establish live timing.

### Completion gate

- Every B/C/A/G/D/P/R acceptance criterion has current evidence and no unresolved defect in the included flow.
- New/modified code passes typecheck and relevant lint/build checks; full-suite results are documented honestly. Any unrelated pre-existing failure is individually explained, with evidence that it does not compromise included flows or clean setup. Do not report universal readiness with unresolved failures.
- Manual and AI paths use shared services; no product placeholders, mock successes or silent fixture fallbacks masquerade as live execution.
- Normal and incognito customers remain isolated except for authorized shared circle information.
- Hosted restart retains chats, decisions, memberships, both order methods and submitted support evidence.
- Actual PayPal capture, COD no-provider behavior and live AI findings are qualified separately.
- Three successful timed rehearsals, desktop/mobile/keyboard checks and fresh-browser access are recorded.
- README/development/judge instructions identify the exact build, setup, supported flows and pending seller boundary.
- Progress ledger contains the final acceptance checklist, known limitations and next-phase handoff.

Only then describe the customer storefront as complete. Seller portal work is a later phase requiring the user's instruction to start it.

## 13. Future seller handoff; no implementation in this phase

Document the existing shared contracts so seller work can consume orders/cases without duplicating them: owned product/order and payment references, COD unpaid state, committed circle terms, original evidence IDs, bounded analysis versions, requested remedy, eligibility explanation and authorized case events.

Later merchant/reviewer actions include responding, requesting additional evidence, approving/waiving return shipping, acknowledging receipt and authorizing an eligible remedy. Do not grant those capabilities to customers to bridge the gap. Preserve and regression-test existing role restrictions while deferring new seller interfaces.

## 14. Change control and stop conditions

The default is to finish the next unmet criterion, not add features. Proposals outside this contract go to a deferred list with a reason, not into active implementation. Explicit user scope changes update both plan and ledger and identify affected milestones/tests/demo timing.

When a selected provider or credential is unavailable, continue independent work, record exactly what is unverified and request the specific missing access only if needed. Do not replace actual payment/model execution with an unlabeled fake. A waiting-for-access milestone cannot be marked complete.

Customer functionality and source evidence are the unit of progress. A convincing screenshot, number of files changed, successful typecheck or existence of a test suite is never sufficient by itself.
