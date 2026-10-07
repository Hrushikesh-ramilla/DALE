# Change log

Each implementation milestone records behavior, validation, and remaining limitations. Git commits provide the corresponding source history.

## 2026-10-07 — Teal, 3D, engineer demo and voice plan

- Added docs/EXPERIENCE_PLAN.md after reviewing the current session/scenario implementation and official Gemini Live pricing/token documentation. Planned a desaturated teal closing section, coordinated motion, genuine 3D product stage, one-click isolated engineer scenarios and voice intents through existing approval guards.
- Defined fixture/browser/native-transport checks and separate live microphone, physical-device performance and hosted gates. Google currently lists a free Live tier; project quota remains unverified and billing/spend remain disabled by policy.
- Documentation only; no runtime change or new feature-completion claim. Linked the plan from MASTER_PLAN.

## 2026-10-07 — Packaged DALE verification

- Source 5a58bc3 passes all 15 journeys against packaged standalone production (1.8 minutes), after the 15-journey development run and final four-width reduced-motion/hydration regression. Optimized build, lint/typecheck and all 135 automated checks pass.
- Repeated 200 workflow traces, 107 deterministic scenarios, 300 frozen synthetic records and 180 mock native-adapter checks after the catalog/profile changes. No provider call or spend was used.
- Prepared the source-aligned release archive and verified its inventory excludes environment files/private data. SHA-256: `0f69a6f9450fda3a41aa01df20c0105d959fe2c0d22c436687d4a2760e43d542`. GitHub run 37606847215 passes both quality and production app/worker/PostgreSQL container jobs, including all 15 browser journeys in containers.
- Updated manual steps for product/profile names and added pagination, product-stage approval, navigation and reduced-motion cases. Hosted/local access-code setup is distinguished. EC2 SSH was retried and timed out; the public redesign and hosted regression remain pending.

## 2026-10-07 — DALE wordmark and product-led redesign

- Replaced the separate D emblem with original uppercase DALE letterforms in the header, footer and browser icon. Updated customer-facing metadata, assistant labels, checkout descriptions and API title; unbranded product illustrations use functional markings.
- Added a substantial four-product stage with explicit selection, Motion transitions, restrained scroll movement, a large editorial headline, asymmetric collection mosaic and closing wordmark. Research included Electronic Materials Office and Unimatic on Awwwards; all artwork and code remain original and monochrome.
- Renamed all eight catalog families to concrete unbranded products and numbered variants to neutral finishes. Device profiles expose connector/power requirements while retaining internal fixture identifiers. Conversational aliases recognize the displayed profiles and require clarification for conflicting selections.
- Discovery starts across every eligible category with twelve-card pagination and category navigation. Search, saved briefs and restored sessions reset pagination; route navigation returns to the top. Featured products and collection previews retain existing compatibility, budget and explicit approval boundaries.
- Lint/typecheck and all 135 unit/contract/database tests pass. The 15-journey development suite passes; final reduced-motion hydration regression and packaged-production verification follow. All 200 workflow traces, 107 deterministic scenarios and 300 frozen synthetic records pass without provider calls. EC2 SSH remains unavailable; public deployment is pending.

## 2026-10-07 — Dale identity

- Renamed the customer-facing product to the owner's single-word choice, Dale. Updated the header/footer, conversation labels, policy heading, checkout merchant/PayPal descriptions, product illustration engravings, route titles and API document.
- Replaced the shield brand mark with an original serif D monogram, added a matching browser icon and paired it with a Cormorant Garamond wordmark. Existing safety/status icons retain their functional meaning.
- Lint, type checking, the optimized production build and all 134 unit/contract/database checks pass. All 14 development browser journeys pass; the four editorial journeys were repeated after the final illustration-initial update, covering 1440/820/390/320 widths and reduced motion. HTTP checks verify the Dale title/home label, icon response and API title. Screenshots are private under `.data/reports/dale-desktop.png`.
- Operational identifiers and historical records are retained to avoid a database/service migration. Public deployment remains on the previous build; the local branding change does not imply new live Gemini or PayPal verification.

## 2026-10-07 — Packaged editorial regression and release preparation

- Final lint/typecheck and all 134 unit/contract/database tests pass. All 14 browser journeys pass in development and again against packaged standalone production, including routed history, approval guards, dialogs and responsive layouts.
- Added an explicit production-mode browser harness using only loopback, fixture adapters and separate private data outside the release tree. The release archive excludes environment files and private data; verified SHA-256 is recorded in docs/VALIDATION.md.
- Updated design/manual/implementation evidence and prepared application release 76bf622. EC2 SSH timed out, so public code remains 5b393c0 and redesigned hosted regression remains pending. No paid resource or live AI call was used.

## 2026-10-07 — Routed collection and product experience

- Added shared-layout shop/group/order/support routes with direct links, browser history and saved-session restoration. Five collection selectors and matched-product text search provide discovery without bypassing device, budget or saved-brief approval checks.
- Added grounded product-detail dialogs, sponsorship/source disclosure and existing-guard purchase review, plus order/support overviews, customer-policy explanations and functional service navigation.
- Motion transitions, readable mobile cards, background inertness/scroll locking, Escape, focus return and viewport-visible feedback complete the interaction layer. Sign-in tests now wait for session completion before editing; background-value assertions explicitly inspect hidden controls while dialogs are active.
- Optimized production build and all 14 Chromium journeys pass, including four new routed/discovery/guard/responsive journeys. Existing 134 unit/contract/database checks passed before the final routing build; final production browser verification follows. EC2 SSH currently times out, so the public app remains on 5b393c0.

## 2026-10-07 — Editorial design foundation

- Replaced the small green interface with a charcoal/off-white design system, larger responsive type/controls, and monochrome catalog illustrations. Self-hosted DM Sans/Cormorant Garamond fonts avoid a runtime font service.
- Added pinned Motion for React and a global configuration respecting reduced-motion preferences. Styled the full shopping, approval, group, fulfillment and support surfaces around the existing product policy.
- Lint, type checking and all 134 existing unit/contract/database tests pass in the working redesign. New collection/detail interactions and browser verification follow as a separate milestone; no live provider completion claim changes.

## 2026-10-07 — Manual acceptance guide and CI sign-off

- Added complete role/fixture setup and manual steps with expected outcomes for shopping, labels, approvals, groups, warnings, fulfillment, both-party evidence, prepaid returns, refunds, replacements, appeals, recovery and privacy. Distinguished browser tests from clock/concurrency/API/operational checks and genuine provider gates.
- Rechecked public health: deployed application 5b393c0 is ready. Retried the GitHub container job canceled before steps by hosted runner allocation; run 37373916879 at 53c284b now passes both jobs, including all ten production-container browser journeys.
- Linked the guide from the README and refreshed implementation/validation status. No application behavior changed; genuine PayPal completion, no-spend live model accuracy, independent testers and physical captures remain open.

## 2026-10-06 — Final hosted regression and current-state recovery

- Deployed application commit 5b393c0 on the existing EC2 instance; 12 hosted shopping/message/label checks and 14 scenario/evidence/return/group checks pass. The declined-group participant scenario now completes the customer's original $26.10 fixture payment.
- A 100-read/10-session HTTPS workload passes with application p95 30.68ms and network-inclusive p95 175.35ms. Runtime dependency audit reports zero findings.
- Added protected restart preparation for saved brief/conversation. After an observed restart, session/order, original photo SHA-256, brief and conversation all persist.
- Fresh isolated restore verifies 92 workspaces, 158 sessions, 46 jobs and all five original files. Transferred backup SHA-256 and DPAPI decrypt round-trip match; newest and earlier encrypted snapshots are retained.
- Existing SSH session supported temporary bounded HTTPS transfers when new connections failed. All transfer routes/helpers were removed. Latest GitHub jobs await hosted runners; genuine PayPal completion, no-spend live model accuracy and independent human/physical acceptance remain explicit gates.

## 2026-10-06 — Evaluation execution and independent acceptance pack

- Frozen v1 evaluation passes all 300 protocol cases: 100 shopping/normalization, 100 messages and 100 submitted-record claim cases. Published counts and descriptive uncertainty remain separate from learned accuracy and physical truth.
- Froze 20 separate release-label graphics; the preregistered 60-case/three-repeat runner passes 180 mocked native Gemini requests, with no network/spend. Live mode requires explicit confirmation of free quota.
- Completed the partial-group browser journey: another participant declines, the customer approves and pays the original $26.10, and reload preserves it. All ten browser journeys now have executed passing results; 134 unit/contract/database checks pass.
- Added independent five-tester and controlled physical-capture procedures with empty recording templates. No human, physical or live model results are fabricated.
- Deployed 221ccad passes all 10 new shopping/identification and 14 existing scenario checks. Final message/evaluation milestone deployment and hosted regression follow the production build.

## 2026-10-06 — Message safeguards and frozen release corpus

- Normalized selected Unicode/zero-width/leet/dotted warning terms, kept safety reminders and ordinary catalog/delivery messages distinct, and checked voluntarily pasted conversations by instruction clauses.
- Native scam responses use advisory categories. Models cannot suppress deterministic warnings or display free-text accusations; outages preserve local checks.
- Added browser coverage for leaving/rejoining before group finalization and keeping the locked price after another participant declines.
- Froze 300 synthetic cases and content hashes before running the release evaluator. Labels are protocol expectations, not physical or independent human truth; live OCR/model gates remain pending under the no-spend instruction.
- Development validation: 134 unit/contract/database checks and nine browser journeys pass; the added partial-group browser check is undergoing final verification. Frozen-corpus evaluation has not yet been executed at this commit.

## 2026-10-06 — Confirmed shopping and device-label suggestions

- Conflicting device/budget statements require explicit shopper confirmation; unresolved briefs cannot produce quotes. Private conversation history is bounded and stale provider responses cannot overwrite changed constraints.
- Catalog comparisons and summaries use recorded facts; provider prose cannot invent product specifications. Native vision accepts bounded appearance categories with actual image-source IDs, preserving human claim review.
- Added exact canonical model extraction, six owned label fixtures, native OCR contracts and an upload/confirmation interface. Ambiguous labels produce no compatibility guess; extraction never changes a brief by itself.
- Fixture refund references recover without contacting the real provider. Live AI verification requires explicit confirmation of free quota under the owner's no-spend instruction.
- Validation: 115 unit/contract/database tests, nine browser journeys including corrected identification and expanded mobile comparisons, 200 traces, lint/typecheck pass. Hosted shopping checks follow the production build and deployment.

## 2026-10-06 — Engineer contracts, trace gates, and restore rehearsal

- Added 200 replayable workflow traces, stratified across eight fault profiles, with external requests prohibited. Added provider-success/lost-response recovery coverage and preserved pending financial work while an appeal is open; reaffirming an already-completed refund never creates another operation.
- Published a generated OpenAPI contract from the same action/brief schemas used by routes. Added private, isolated nine-scenario seeding and orderly CLI database shutdown.
- Added atomic per-actor request budgets, redacted error references, and measured application timing for authenticated session reads. Added a ten-session hosted performance verifier.
- Executed an EC2 backup/restore rehearsal in a separate database/directory: workspace state and financial/audit references matched the snapshot, row counts matched, and all three originals matched SHA-256. Saved an owner-only, DPAPI-encrypted off-instance copy and verified its decrypt round-trip.
- Validation: 99 unit/contract/database tests, 200 traces, isolated seeding, API generation, and production build pass. Hosted performance follows deployment. Containers already pass the seven return-stage journeys; queued/canceled GitHub runner allocation is tracked separately from code failures.

## 2026-10-06 — Cancellation and late-delivery choices

- Bound new delivery promises and merchant-policy versions to purchase fingerprints. Changed terms require fresh customer approval.
- Seller cancellation preserves captured payment status and creates a support choice; unpaid orders cancel without capture. Unresolved capture outcomes must be reconciled first. Canceled fulfillment cannot silently ship.
- Added one-time late-delivery help events, customer-controlled remedy changes before execution, and no-charge replacements with fresh delivery promises. Added isolated cancellation and late-order scenarios.
- Validation: 97 unit/contract/database tests pass; seven existing browser journeys and the new cancellation-to-customer-choice journey pass. Production build passes. The preceding deployed return milestone passes 12 hosted scenario/evidence/return checks and original photo/session/order restart persistence. New cancellation deployment verification follows its production build.

## 2026-10-06 — Customer-first return arrangements

- Added the recorded-delivery 30-day merchant-policy check. Missing timing, late requests, and cancellation/non-delivery claims remain open for human review.
- Added reviewer-authorized merchant-paid return references, buyer handoff, matching seller receipt, no-return exceptions with reasons, and preserved prior arrangements. Return shipping cost to the customer is zero; carrier events are explicitly simulated.
- Required receipt or an authorized waiver before remedy execution, and added a 24-hour merchant remedy target with one follow-up escalation. Deadline handling preserves an already-authorized financial operation.
- Validation: 90 unit/contract/database tests pass; six existing journeys and the new prepaid-return-to-refund browser journey pass. Deployed d0b9ed1 passes 12 hosted checks including prepaid receipt-gated refund. Private original photo, session, and order survive an observed restart. No live carrier label purchase or physical-truth claim is made.

## 2026-10-06 — Submission provenance and private case reports

- Added optional single-use capture codes bound to the authenticated party, order/case, checkpoint, and ten-minute expiry. Upload origin and challenge linkage are described without claiming verified capture timing or physical truth.
- Added submission timestamps, same-case repeated-file cues, analysis versions, and private JSON case exports separating submitted records, analysis, transaction state, and scoped audit. Export checks original-file integrity and reports unavailable/tampered files.
- New photo submissions keep notes and identifiers in multipart bodies rather than URLs. Ownership, state, and challenge validation precede storage writes under the workspace lock.
- Validation: 86 unit/contract/database tests and all six browser journeys pass, including challenge-linked upload and private report retrieval. Hosted verification is a separate deployment step; physical captures remain pending.

## 2026-10-06 — Container execution gate

- Added a clean, private fixture environment generator, configurable Compose environment/port, app readiness, and worker startup after database-backed readiness.
- Added a Linux CI job that builds and starts the actual app/worker/PostgreSQL containers and runs all browser journeys against the containerized production server.
- Browser journeys can target an external test URL without launching a development server. Container fixtures contain no PayPal or AI credentials.
- Validation: Compose configuration and TypeScript checks pass locally. Linux CI run 37361750645 successfully built and started app/worker/PostgreSQL containers and passed all six production-server browser journeys.

## 2026-10-06 — Isolated engineer scenarios

- Added seven reviewer-created fixture scenarios: fresh shopping, delivered returns, identifier conflicts, seller silence, rejected refunds, interrupted refunds, and partial group payment.
- Persisted workspace adapter modes and bound new quotes to their payment provider. A fixture scenario on the live/sandbox host makes no provider calls, and changing global configuration cannot relabel an existing order's provider.
- Restricted reset to designated fixture workspaces. Reset archives the old workspace and preserves its financial/evidence audit, then creates a separate replacement workspace.
- Validation: 81 unit/contract/database tests pass; five existing browser journeys and the new failed-refund/archive journey pass. Queue concurrency and lease recovery also pass against hosted PostgreSQL; session/order persistence passes after an observed service instance change.
- Live AI availability: the newest check receives HTTP 429 after bounded retries. Earlier direct text/vision smoke checks passed; current availability and the larger evaluation remain pending quota restoration. The owner requested no billing or AI spend, so hosted analysis uses labeled fixtures until usable no-spend quota returns.

## 2026-10-06 — Durable recovery jobs and truthful refund status

- Replaced blanket job completion with PostgreSQL row-lock claims, five-minute leases, bounded retries, six-attempt dead letters, and ownership-checked acknowledgments. Capture reconciliation and authorized refunds receive transactional outbox jobs.
- Serialized startup migrations between app and worker. Added restricted operator heartbeat/backlog visibility, and kept failed work isolated from unrelated jobs.
- Added explicit processing/completed/failed/unknown refund details and references. Provider amount, currency, capture, and refund reference must match the authorized remedy; failed refunds remain open for human reconciliation.
- Validation: 72 unit/contract/database tests and five Chromium journeys pass. Added a separate production-PostgreSQL concurrency/recovery verifier and a restart verifier that requires an observed server instance change. Real PayPal refund and webhook delivery remain unverified.

## 2026-10-05 — Reservation and interruption boundaries

- Finalized group commitments now reserve inventory during the checkout window, convert one commitment to one purchase per customer, and release unused reservations after expiry.
- Recovery now also resumes an approved refund when a crash occurred before its provider operation was created.
- Bounded vision input to four checkpoint samples to keep memory predictable on the small host. Every original stays available for human review; partial model coverage is disclosed.
- Added boundary tests and standardized source formatting with a pinned formatter. No customer funds are moved without prior customer purchase approval or reviewer remedy authorization.
- Validation: 59 tests pass, including real original-photo storage, cross-customer access rejection, stored-file tamper detection, and vision sample coverage. Four browser journeys pass with an uploaded synthetic receipt photo.

## 2026-10-06 — Versioned shopping briefs and approval renewal

- Persisted individual shopping briefs and explicit price/feature priorities. Catalog source labels explain ranking, and sponsored placement cannot improve rank.
- Changed briefs invalidate earlier unpaid quotes and cancel unpaid approvals. Confirmed payments and already-sent capture operations retain their original financial records for reconciliation.
- Added budget/device/category checks against the saved brief, browser reload coverage, cross-customer regression coverage, and a hosted build identifier. Documented remaining master-plan gates without treating partial features as complete.
- Validation: 62 unit/contract/database tests, five Chromium journeys, production build, and GitHub CI pass. Deployed commit db70824 passes 12 hosted API checks, including changed-brief approval rejection. PayPal USD approval remains externally blocked.

## 2026-10-05 — Existing-instance deployment

- Added local release packaging, a dedicated service user, private PostgreSQL, memory-limited app and recovery services, persistent private evidence, and Caddy HTTPS configuration.
- Added environment-free release archives, separate protected server configuration, and deployment/rollback instructions. Added a Docker alternative without introducing additional paid AWS resources.
- Validation: native EC2 service startup and production database health are checked separately from public HTTPS. Docker Compose configuration validates; container build/run remains unverified because the local daemon is stopped.
- Public HTTPS and 11 hosted API checks pass against production PostgreSQL, direct Gemini, sandbox PayPal order creation, and private customer sessions. Buyer approval/capture/refund and actual webhook delivery remain separate release gates.
- Published validation scope and setup instructions. Deterministic catalog/message/evidence evaluation passes 107 synthetic scenarios; this does not establish model accuracy.

## 2026-10-05 — Shopper interface and recovery

- Added responsive shopping, explicit checkout review, group invitations, order timelines, evidence uploads, and customer-selected remedies. Reviewer authorization requires a recorded policy reason.
- Added durable webhook duplicate detection, provider-read capture recovery, bounded refund recovery, expired unpaid orders/groups, and overdue seller escalation. Automated analysis cannot deny a claim.
- Added bounded model retries with exponential backoff, jitter, and Retry-After handling. Direct Gemini uses native text/image requests; compatible custom endpoints remain configurable.
- Validation: 54 unit/contract/database tests and four Chromium journeys pass, including the complete fixture purchase-to-refund journey and mobile layout. Production build passes.
- Live verification: direct Gemini shopping, scam-message, and vision smoke checks pass; PayPal sandbox authentication, order creation, and retrieval pass. PayPal buyer approval, capture, refund, and actual webhook delivery are not yet verified.

## 2026-10-05 — Persistent commerce and resolution workflows

- Added authenticated, isolated shopper workspaces; PostgreSQL persistence; approval-bound checkout; stable capture/refund operations; and individual group purchases.
- Added seller dispatch records, both-party case evidence, private image storage, customer-selected remedies, replacement fulfillment, and appeals.
- Added PayPal sandbox and configurable text/vision adapters with response validation. Live integration is not yet verified.
- Validation: 45 unit, provider-contract, and embedded PostgreSQL integration tests pass, including concurrent checkout, duplicate capture/refund, role restrictions, and cross-customer access.

## 2026-10-05 — Application scaffold

- Added the Next.js/TypeScript application, locked dependencies, environment template, and CI quality checks.
- Added strict money conversion boundaries and credential-safe repository configuration.
- Validation: TypeScript check and initial unit tests pass; runtime dependency audit has no findings. Live payment and model credentials remain unconfigured.

## 2026-10-05 — Customer policy and catalog

- Added a 40-item synthetic electronics catalog with explicit device compatibility and source references.
- Added approval fingerprints, payment mismatch checks, refund balance rules, message warnings, and evidence comparisons that preserve uncertainty.
- Validation: 24 tests pass across money, purchase policy, rankings, compatibility, scam patterns, and customer claim handling. Message rules are a deterministic fallback, not a validated learned scam detector.

## 2026-10-05 — Repository foundation

- Recorded the product plan, customer-priority policies, deployment approach, and acceptance requirements.
- Added repository documentation, MIT license, and ignore rules for credentials and generated files.
- Validation: inspected the empty repository and verified existing GitHub authentication. No application behavior exists at this milestone.
