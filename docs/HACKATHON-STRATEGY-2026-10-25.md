# DALE: PayPal AI Hackathon strategy and implementation roadmap

> Current implementation authority: [Customer storefront implementation plan](CUSTOMER-STOREFRONT-IMPLEMENTATION-PLAN.md) and [progress ledger](CUSTOMER-STOREFRONT-PROGRESS.md). The user has since required customer storefront completion before seller portal work. Customer return demos now end at submission/AI findings and awaiting merchant review; earlier seller/refund demo steps and sponsor dashboards below are deferred background proposals.

Prepared 25 October 2026. Phase one: repository inspection, external research, feature selection, and delivery planning. Proposed capabilities below are not claims that they are implemented. No prize outcome can be guaranteed.

**Final scope revision, 25 October: the entire live story must finish within five minutes.** The user has made demoability a hard requirement. This revision supersedes the earlier broad feature roadmap. The submitted video has a separate, tighter budget of under three minutes.

**Browser-session/COD clarification (supersedes earlier shopper setup):** use the main browser for Buyer A and an incognito session for Buyer B on the same hosted storefront/circle link. Keep their customer identities, carts and orders separate; do not switch personas inside a customer session. Buyer A completes the genuine PayPal sandbox purchase. Buyer B can join without payment under the existing group-commitment model; if confirming an order as requested by the user, add a narrow cash-on-delivery path with “Order confirmed — payment due on delivery.” COD must not create a PayPal transaction or paid status. Additional shoppers need separate cookie stores/browser profiles; multiple incognito tabs in the same browser generally share a session.

COD is proposed work: no COD payment-method path was found in the inspected application. Add an explicit method, unpaid financial state, stock reservation/cancellation/expiry rules and an order receipt; preserve PayPal-only capture/refund rules. No carrier or cash-collection integration is included. Delivery and collection remain simulated and labeled. Merchant policy must explicitly allow COD commitments to qualify for a circle; describe the threshold as committed orders, not paid orders. A COD order awaiting collection is not eligible for a PayPal refund. This extra work replaces optional merchant-dashboard expansion if needed to preserve the demo budget. Judge-facing instructions must identify both buyer sessions as presenter-operated demonstration customers.

“AI-assisted aftercare” means a guided post-purchase support request, not an autonomous refund decision: open an owned paid order, choose damaged/wrong item/not delivered, attach photos and a note or serial where relevant, preserve original files and source references, summarize recorded facts and bounded visual observations, and send the requested remedy to an authorized reviewer. Missing facts stay visible. The reviewer can request more evidence, require a return, or approve a reasoned no-return remedy where the merchant policy permits it. A required physical return remains pending until the merchant records receipt. Only an approved eligible PayPal-paid order can proceed to the existing provider-confirmed refund flow. For the short demo, use a clearly labeled prepared captured order and a reviewer-approved no-return scenario; do not pretend physical return shipping occurs live. COD cancellations before collection release the reservation without claiming a refund; post-collection COD refunds are outside this release.

## 0. Binding demo and scope contract

Build one memorable outcome: **DALE rescues a constrained purchase by finding a supported group offer, executes an individually approved PayPal payment, and makes the purchase accountable afterward.**

Every proposed product addition must name its user-visible result, its place in the timed demonstration, the production service it exercises, and its acceptance check. An isolated feature taking under five minutes is insufficient: all retained features together must fit the same five-minute story. If it needs a second lengthy explanation, waiting for real customers or delivery, terminal commands, or a separate tour, remove it from this hackathon build.

Required installation, payment correctness, privacy and deployment work remains essential: it directly enables the demonstrated behavior. Keep that work proportionate to the selected flow. Do not expand into new infrastructure or unrelated maintenance in pursuit of invisible sophistication.

| Decision | Scope |
| --- | --- |
| Build | Intent-to-circle matching with a compact evidence-backed decision card |
| Build | Two independent shoppers unlock one exact-product group offer |
| Qualify and polish | One live sandbox purchase, durable receipt and visible approval binding |
| Qualify and polish | A brief, clearly labeled prepared aftercare case using existing evidence/reviewer/refund services |
| Conditional sponsor addition | One merchant pulse panel with one genuine AG Studio agent interaction; strict time gate |
| Remove from this release | Study-kit optimizer, bundled checkout rewrite, autonomous negotiation, expanded voice/photo discovery, external retailer integrations, return scheduling, additional sponsor product surfaces |

The product may retain existing capabilities outside this story. Do not delete functioning features or catalog data to enforce presentation scope. Freeze their expansion.

Feature gate: a complete five-minute rehearsal at normal speed, including actual AI and provider waiting, must pass **three consecutive times on the hosted release**. Target 4:30, reserve 30 seconds for variance. A prerecorded clip, hidden model answer, fabricated second shopper, fake payment success, or accelerated playback does not pass this live gate. Record actual timing; the budgets below are targets, not measured performance.

## 1. The product to build

Position DALE as **an AI buying-circle assistant that helps students choose suitable electronics, unlock merchant-approved group savings, pay individually through PayPal, and resolve purchase problems afterward.**

Pitch: **“Tell DALE what you need. Understand the tradeoffs. Buy together. Stay in control of your payment and your return.”**

The primary user is a student buying study or work equipment on a limited budget. The secondary user is the participating merchant managing group demand and aftercare. This is a proposed audience; validate it with actual students before making impact claims.

The signature journey is one exact product selected by two independent shoppers, with a supported requirement where appropriate. One shopper completes the visible purchase; the other has an independent commitment and approval path. Do not claim both paid if only one did. Study-kit optimization and multi-item checkout are excluded from this release. Keep the existing departments and catalog; focus the demonstration without removing legitimate listings.

DALE already has the pieces for this story. Connecting and qualifying them is more valuable than adding unrelated AI features. Group buying itself is established; the proposed differentiation is grounded matching, transparent conditional savings, individual payment control, and evidence-linked aftercare in one experience.

## 2. Competition facts that change the strategy

The live submission deadline is **13 November 2026 at 01:30 IST**, corresponding to 12 November at noon PST. The five judging criteria have equal weight. Prize stacking allows one grand prize OR one honorable mention, plus one sponsor prize. Judging ends 15 December, so preserve judge access through that period. These details were checked against the [official rules](https://paypalaihackathon.devpost.com/rules).

The requirements checklist in chapter 10 follows the user-supplied hackathon brief. Sponsor use is optional. A long list of integrations does not establish a competitive product.

Recommended category strategy:

| Category | DALE's proposed evidence | Priority |
| --- | --- | --- |
| Best Use of Agentic Commerce | AI selects tools, finds suitable offers and circles, prepares approved transactions, follows actual outcomes | Primary |
| Best Use of PayPal + AI | Purchase reasoning connected to actual sandbox capture, provider confirmation, and approved refund | Primary |
| Overall prizes | Coherent product, reliable installation, strong implementation, specific audience, clear video | Primary |
| Best Demo Delivery | One understandable journey with visible decisions and outcomes | Primary |
| Most Impactful | Observed student task completion, actual sandbox savings arithmetic, user feedback | Conditional on validation |
| Most Creative | A memorable combination of cooperative buying and accountable aftercare | Secondary; originality must be demonstrated |
| AG Grid | One compact merchant pulse panel powered by AG Studio, with one useful agent interaction | Conditional on timed demo gate |
| APIMatic | Documented actual use of its PayPal context tooling during integration work | Alternative sponsor path |
| Channel3 | External discovery/enrichment | Excluded from this build |
| Bryntum | Return/dispute work scheduling | Excluded from this build |
| Render | Hosted application, persistent database, and useful background execution | Operational option |

These are fit assessments, not estimates of winning probability. Do not claim sponsor eligibility from an installed dependency or a logo alone.

## 3. What the repository actually contains

Inspection covered package scripts, documentation, application routes, payment adapters, checkout UI, concierge tools and shopping execution, compatibility, group offers, sessions, database setup, workers, evidence analysis, and selected tests and deployment configuration. This was not an exhaustive line-by-line security audit or a fresh hosted UI certification.

| Area | Source evidence | Assessment |
| --- | --- | --- |
| Full-stack foundation | `src/app`, `src/server/database.ts`, `src/server/db/schema.ts`, `src/server/customers.ts` | Next.js/React/TypeScript application with PostgreSQL/PGlite persistence, customer identities, and domain services already exists |
| AI conversation | `src/server/concierge/engine.ts`, `model.ts`, `memory.ts`, `tools.ts` | Native function-call architecture and persisted conversation support; retain and extend |
| Retrieval | `src/server/concierge/retrieval.ts`, `catalog-rag.ts`, `compatibility.ts` | Identity, lexical and semantic retrieval; compatibility is limited to recorded profiles and evidence |
| Storefront actions | `src/server/concierge/website-execution.ts`, `shopping.ts` | Cart/wishlist changes, browser receipts, prepared confirmations, and stale-state guards |
| Group buying | `src/server/agent-groups.ts`, `src/domain/group-policy.ts`, `src/server/service.ts` | Same-product groups, policy versions, conditional discounts, expiry, and individual checkout infrastructure |
| Payments | `src/server/payments.ts`, `src/components/paypal-checkout.tsx` | Orders v2 creation/capture, exact merchant/amount/currency checks, request IDs, refunds, signature verification |
| Recovery | `src/server/jobs.ts`, `recovery.ts`, `provider-adjustments.ts` | Durable jobs, leases, bounded retry and provider reconciliation mechanisms |
| Aftercare | `src/server/case-report.ts`, `src/server/ai.ts`, `src/domain/return-policy.ts` | Return cases, original evidence, bounded image observations, exportable reports, reviewer decisions |
| Multimodal input | `src/server/photo-discovery.ts`, voice routes | Photo discovery and speech infrastructure already exist; configuration and device quality need verification |
| Release tooling | `.github/workflows/ci.yml`, `deploy`, `compose.yaml` | Significant tooling exists; configuration presence does not establish deployed correctness |
| Open source | Root `LICENSE` | MIT license exists; verify public repository and rights to included assets separately |

The project does not need a new backend framework, a separate vector-database service, or a multi-agent rewrite to become full stack.

### Fresh verification and release blockers

`npm run typecheck` completed successfully during this inspection. The fresh full `npm test` run completed with **369 passed, 182 failed, and 116 skipped tests across 99 files** (54 files passed, 45 failed). Runtime was about 227 seconds. The older README baseline is not the current result.

A separate run of `npx vitest run tests/catalog-navigation.test.ts --reporter=verbose` reproduced two failures:

1. The test expects `internal-ssds` under storage, while the current category map returns `portable-ssds` without that leaf. Decide the correct taxonomy and bring implementation and tests into agreement.
2. Fresh database setup fails in `bootstrapReviewedCatalog` because the phone manifest contains source origins that the manifest's reviewed-origin policy rejects. Examples include OPPO, HONOR, Sony and ASUS records. The stack reaches `src/domain/catalog-manifest.ts:226`, `src/server/bundled-catalog.ts:131`, and `src/server/catalog-bootstrap.ts:59`.

Many broad-suite failures and skipped tests appear downstream of bootstrap failures. Do not interpret every reported failure as a separate broken payment or AI feature. Repair the shared cause and rerun before classifying remaining failures. Verify origins against actual evidence and update the reviewed manifest correctly; do not disable validation, invent a review, or remove products merely to obtain green tests.

Other observed full-suite failures include a missing `memory-cards` manifest expected by the electronics-depth test, legacy catalog-count assertions, invalid leaf-type values in a media-batch manifest, and missing expected repair evidence in an image-review test. These need individual triage after bootstrap repair; neither implementation defects nor obsolete tests should be assumed away.

Other material gaps:

- **Cart checkout is per unit.** `prepareCheckout` in `src/server/concierge/shopping.ts` explicitly creates individual quotes and separate PayPal approvals. A three-unit cart can require three approvals. This is an application contract, not an unavoidable PayPal limitation.
- **Fresh live payment proof is missing from this inspection.** The repository includes real sandbox adapters and journey scripts, but those are not proof of a successful current browser approval/capture/refund/webhook sequence. `verify-paypal.ts` itself explicitly does not test capture.
- **Compatibility is bounded.** The general lifestyle profile does not perform a device-fit assessment. Unknown does not mean compatible or incompatible.
- **Latency remains material.** `docs/VALIDATION.md` records two October 21 responses around 15 seconds. Those are historical measurements, not a new benchmark.
- **Shipping and merchant offers are simulated.** Preserve that distinction from sourced manufacturer facts. Do not imply real retail fulfillment, retailer participation, or verified current street prices.
- **Several AI configuration paths coexist.** Concierge generation and auxiliary vision/evidence services require separate configuration checks; verify both before promising a complete multimodal journey.
- **The worktree has extensive existing changes.** Do not overwrite catalog repair work or use a reset to prepare the demo. Freeze an explicit release after repairs.

## 4. What to learn from other projects

### Confirmed winners

| Example and evidence | Useful pattern | DALE adaptation |
| --- | --- | --- |
| [VoxSurf, first place in the 2025 DEI accessibility hackathon](https://deihackathon2025.com/winners/) | Voice-driven agentic navigation aimed at a specific accessibility need | Make voice requests produce understandable storefront changes, with keyboard equivalents and readable status |
| [BLINDERs, winner of Microsoft's 2024 AI for Accessibility Hackathon](https://news.microsoft.com/th-th/2024/06/26/microsoft-announces-winners-of-ai-for-accessibility-hackathon-2024/) | University team connected voice input to practical transportation assistance | Show a complete useful task and reduce the interaction burden; avoid claiming accessibility impact without testing |
| [ATTI and Spoon Share, Google 2024 Solution Challenge winners](https://blog.google/innovation-and-ai/technology/developers-tools/meet-the-students-that-are-changing-the-world-through-technology/) | Clear audience; ATTI supports daily routines and Spoon Share connects donors and recipients with verification | Use real customer/merchant roles, confirm shared demand, and prove the outcome instead of presenting a generic assistant |

These are observed patterns, not evidence that copying their feature lists causes wins. Borrow interaction principles and independently implement DALE's product.

### Current PayPal submissions: competitors, not established winners

[Pulse Safe Commerce Agent](https://devpost.com/software/pulse-safe-commerce-agent) describes policy-bound approvals, replay protection, receipts and reconciliation. [ShopVoice Pay](https://devpost.com/software/shopvoice-pay) describes voice-driven supplier purchasing, spending controls and delivery matching. [UA Market](https://devpost.com/software/ua-market-ai-concierge-paypal-checkout) describes a shopping concierge with PayPal checkout. Their submission pages are self-reports; their runtimes were not independently audited here.

Implication: chat checkout, voice, and payment guards are already represented. DALE needs a stronger specific outcome. The proposed buying circle plus aftercare journey is a better use of its existing code than a generic chatbot or a second payment-policy layer.

## 5. Prioritized feature specification

### P0. Restore judge-installable reliability

Repair fresh bootstrap and category contracts, rerun the complete suite, and classify any remaining failures. Start from a fresh disposable database and prove installation from the repository. Preserve existing customer data and catalog repair history. Qualify the deployed release, not just the development workspace.

Prioritize shared startup failures and failures affecting the demonstrated flow, authorization, money, or submission reproducibility. Record unrelated unresolved failures honestly; do not turn the hackathon into a broad catalog-expansion or architecture project. A clean full suite is desirable; never imply it passed if only the selected journey passed.

Success: clean install, published catalog query, customer session, AI search, and checkout preparation work without private local database history.

### P1. Intent-to-circle matching: the signature AI feature

Example: “I need a webcam for classes under $80. Can buying together make one affordable?”

Use a truthful budget-rescue example: a documented sandbox merchant offer exceeds the customer's budget alone but fits it under the approved group terms. Illustrative arithmetic only: $85 solo, 10% conditional group discount, $76.50 group price. Select actual qualified catalog terms during implementation; never force these example numbers into a model answer. The exact task, supported attributes and prices must come from current tool results. Show a rejected cheap candidate only when its failure is established by recorded facts.

The model extracts the purpose, hard constraints, budget, and willingness to wait. Ask only necessary clarification. Retrieve exact candidates and real open circles. Deterministic code checks price, variant, stock, supported compatibility, timing and approved group policy. Present **buy now**, **join a circle**, and **no suitable verified offer**, as applicable.

Show why the chosen option meets the request, what remains unknown, the required member count, conditional price and expiry. Reuse group membership and policy versioning. Require explicit opt-in before exposing a buyer's demand to matching; show aggregate counts without private identities or budgets.

Success: two independent customer sessions can join the same eligible exact product, reach the approved threshold, and receive the correct locked terms. The system handles expiry and a shopper declining checkout. It never invents members, enrollment or completed payments.

This is policy-based cooperative purchasing. Do not describe a fixed discount tier as AI price negotiation. Autonomous negotiation is excluded from this release.

### P1. A decision record that updates with the purchase

Create a compact, structured card beside the conversation, within the matching step rather than as a separate feature tour:

- Request and confirmed hard constraints.
- Selected exact product/variant and evidence links.
- Rejected alternatives with short, supported reasons.
- Solo price, conditional group price, and realized savings only after eligibility and payment are established.
- Missing facts, source observation dates, merchant, currency and approval status.
- References linking the decision to quote, PayPal order, capture, and any return case.

Generate explanations from validated tool results. Save decision versions server-side so refresh and later claims refer to the actual approved terms. Present observable reasons and evidence, not hidden model reasoning.

Success: “Why this?” and “What changed?” can be answered from the saved record. A changed price, variant or group policy cannot silently inherit old approval. An unsupported constraint produces an honest no-match result.

### P1. Verified PayPal execution and recovery

Prove one real sandbox journey: approved quote → buyer PayPal approval → server capture → provider-verified receipt → persisted order → approved refund → provider-confirmed refund. Verify signed webhook delivery separately and test duplicate/reordered events with fixtures.

Use the existing payment service, ownership checks, idempotency IDs and reconciliation. Show pending and unknown outcomes clearly. A timeout must not become a paid receipt or a blind second charge.

The demo buys one unit for one shopper, with a separate independent shopper committing to the group. The existing per-unit approval contract is acceptable for this scope. A basket checkout rewrite is excluded. Retain the known limitation in documentation. PayPal's [Orders purchase-unit model](https://developer.paypal.com/api/orders/v2/definitions/purchase_unit) can support a future itemized basket, but it is not needed to demonstrate this product.

Include a brief visible control check: change the proposed purchase after review and show that the old confirmation is invalidated before any provider write. Then review the correct terms and complete approval. Keep deeper timeout, replay and webhook fault injection in verification; those mechanisms support the visible outcome without needing a live technical tour.

External retailer discovery does not grant merchant payment authority. Do not create DALE sandbox charges that are presented as purchases from those retailers. Multi-seller settlement is outside the first release.

### P1. Guided purchase aftercare

Example: “The webcam arrived damaged. What should I do?”

Resolve the customer's owned paid order, offer the applicable merchant return path, guide evidence capture, collect the requested remedy, and create a readable evidence-linked draft for the reviewer. Preserve originals and source IDs. AI can describe visible appearance, flag missing information and summarize the case; reviewer authority and deterministic balances govern refunds.

Reuse current return, evidence-analysis, report and refund services. Add concise conversational guidance and an order-linked aftercare panel. Show that a refund is requested, approved, pending, or provider-confirmed as distinct states.

This step has a 45-second live budget. Prepare a distinct owned case backed by a genuine sandbox-captured order, with simulated delivery clearly labeled. Existing evidence may be prepared and labeled; run the case summary and authorized remedy through real services. The reviewer must act through an authorized session. If a new image review makes this exceed the budget, use the existing evidence and a fresh summary; do not add a new upload/vision experience. If the minimal existing workflow still cannot fit reliably, remove aftercare from the main demo and corresponding feature pitch. Show actual provider state and never rename pending to refunded.

Success: a buyer can complete the request, a reviewer can inspect the original evidence and approve an eligible remedy, and a refund completes once. AI does not infer authenticity, causation, legal entitlement, or an official PayPal dispute ruling from an image. Shipment simulation and pre-seeded delivered-order scenarios must be visibly labeled.

### Conditional sponsor feature: one merchant pulse panel with AG Studio

Give the merchant a single view of this circle's progress and confirmed payment/refund totals. Keep commitments separate from revenue. Keep the panel on the same demonstration surface; do not add a separate operations tour, configurable report suite, anomaly detector or finance assistant.

One useful prompt: “Show confirmed payments and refunds for this circle.” The agent should query authorized aggregates and build or adjust the visible widget through the supported Studio framework. The payment/refund should update that same view without a manual database action.

The sponsor page emphasizes customized dashboards and agent-driven analytics, including the Studio Agent Framework. A plain product table is a weaker interpretation of that brief. Use a themed workspace, a circle-progress widget, linked charts and an actual supported agent interaction. See the [AG Grid sponsor brief](https://paypalaihackathon.devpost.com/details/aggrid).

Success: a verified capture or refund changes the correct metric once, the merchant cannot see another workspace's records, and an AI-generated dashboard action produces a visible useful result. Validate trial-license duration for the judging window.

Time gate: the complete action must be understandable and visible in 20 seconds during the five-minute rehearsal and fit a 10-second slot in the edited submission video. Do not promise AG Grid award competitiveness before qualifying that implementation. If this cannot fit, drop the dashboard work and use an already useful, truthfully documented APIMatic integration workflow as the sponsor alternative. Do not build two sponsor features.

### Frozen existing capabilities: voice and photo discovery

No expansion of voice or photo discovery in this release. The main demo uses typed input to minimize device permissions and transcription variance. Existing voice can replace typing only if it adds no time or new interaction path and passes the same rehearsal gate. Retain keyboard operation, readable feedback and basic accessibility for the demonstrated flow. A photo alone cannot prove compatibility or authenticity.

Do not spend time on new live voice sessions, multilingual support, camera workflows or transcript polish outside what the existing chosen input requires.

### Removed from this release: study-kit optimization

A multi-product optimizer adds compatibility, combined-cost and basket-order work beyond the selected story. Remove it entirely from the hackathon implementation backlog and pitch. Reconsider after the event, not as spare-time scope during this build.

## 6. Sponsor scope and tradeoffs

| Tool | Meaningful DALE use | Decision |
| --- | --- | --- |
| AG Studio | One circle pulse panel, confirmed totals, one supported agent interaction | Conditional on the strict demo time gate |
| APIMatic | Use PayPal context tooling while building and documenting the actual integration | Good alternative; retain truthful usage evidence, never retrofit a claim. [Brief](https://paypalaihackathon.devpost.com/details/apimatic) |
| Channel3 | External candidate discovery or enrichment | Excluded from this release. [Brief](https://paypalaihackathon.devpost.com/details/channel3) |
| Bryntum | Case assignment and workload scheduling | Excluded from this release. [Brief](https://paypalaihackathon.devpost.com/details/bryntum) |
| Render | Web service, PostgreSQL and existing recovery worker | Hosting option only if needed; no new workflow platform for this release. [Brief](https://paypalaihackathon.devpost.com/details/render) |
| Elastic, KERNEL, Postman, Zapier, Astropods | Potential infrastructure/integration helpers | No concrete product need established in this inspection; do not add solely for logos |

A valid product can use more than one sponsor, but delivery effort is capped at one sponsor story. Hosting is an operational choice; do not add Render Workflows or migrate a working deployment solely for another award. AG Studio remains conditional. Render credits listed as prizes are credits, not cash.

## 7. Full-stack implementation design

Keep the modular monolith. Browser UI → authenticated routes → concierge tool executor → typed domain services → PostgreSQL, payment adapter, evidence storage and existing recovery worker. AI proposes and explains; code validates and commits.

Suggested additive contracts:

| Contract | Core data | Integration |
| --- | --- | --- |
| Purchase intent | Owner, need, hard constraints, budget cents, deadline, version, matching consent | Extend confirmed brief and concierge tools |
| Circle match | Exact product, policy version, aggregate membership, stock and eligibility reasons | Extend existing group discovery; do not duplicate membership state |
| Decision record | Intent version, candidate IDs, sources, selected offer, unknowns, quote and order links | New persisted record linked to the current owner |
| Merchant pulse, only if retained | Aggregate progress, confirmed captures and refunds for this circle | Read existing authoritative state; scoped by workspace; add a projection only if necessary |

Expose narrow tools such as `compare_circle_options`, `save_purchase_decision`, and `summarize_owned_case` through the current discovery/execution framework. Do not give the model arbitrary SQL or a free-form money-transfer tool. Reuse `prepare_customer_action` where it already fits.

The current database includes workspace JSON state and relational catalog/jobs/session tables. Avoid a rushed wholesale data migration. Use additive storage only where the decision record needs it, link existing IDs and versions, and keep writes transactional. Derive the tiny merchant pulse directly from authoritative state where practical. If a projection is needed, make it idempotent so webhook duplicates do not inflate savings or revenue. Do not build a generalized analytics/event platform.

Deployment needs a working web process, persistent PostgreSQL, recovery worker, private evidence storage if aftercare is retained, HTTPS/webhook endpoint and configured inference. Keep permanent provider credentials on the server. Existing local BGE embeddings need a supported hosted configuration and retrieval qualification. The typed hero journey does not require adding a speech host. Hosting a Next.js container alone does not host its auxiliary dependencies.

### Missing product work to include: demo access and visible outcomes

1. **Judge entry and prepared sessions.** A clear entry link opens the actual storefront with concise steps. Prepare two independent buyer accounts/browser contexts and a separately authorized reviewer context. Setup occurs before the timed demo; the timed segment must include the live request, second buyer's actual join, approval and actual payment. Provide documented access for judges to reproduce the journey without developer assistance.
2. **A compact outcome view.** Keep product choice, constraint evidence, circle progress, approval and payment receipt easy to follow on the existing shopping surface. Show human-readable stages such as “Offer found,” “Waiting for another shopper,” “Ready for your approval,” and “Payment confirmed.” Status must come from persisted domain/provider state. Avoid a second navigation-heavy dashboard.
3. **Honest scenario preparation and restart.** Prepare the specific valid product and circle policy, sufficient stock, sandbox buyer/merchant access and any historical aftercare order. Label the latter as a separate prepared scenario with simulated delivery. Start new isolated sessions/circles for rehearsal; archive history through existing supported mechanisms. Never erase provider transactions or change paid/refunded state to make a demo repeatable.
4. **Provider preflight and rehearsal timing.** Check deployed build identity, catalog startup, inference availability, sandbox mode, webhook connectivity, worker health and optional evidence access before recording. Keep the demo sessions warm. Capture per-step time and total time; include actual model/provider waits. Preflight confirms availability and must not precompute the customer's answer or skip payment authorization.
5. **One visible boundary check.** After a prepared offer changes, demonstrate old approval invalidation in 20 seconds or less. Link the visible state to the existing validated confirmation service; a static warning or arbitrary animation is insufficient.
6. **A specific payoff.** Display the budget gap before matching and the exact supported discounted amount afterward. Show realized savings only for completed qualifying purchases, and distinguish the second buyer's commitment from payment. Add a short measured user observation to the pitch only when obtained.

These additions reduce explanation and operational friction. They are directly tied to existing domain behavior and are not separate product modules.

## 8. Proposed delivery calendar

Dates are a proposed schedule from 25 October, not a guarantee of effort. The checkpoint after each stage controls scope.

| Dates, IST | Deliverable | Exit condition |
| --- | --- | --- |
| Oct 25–27 | Shared bootstrap/taxonomy repairs, fresh-install qualification, baseline triage, sandbox configuration audit | Fresh database and core services work; failures categorized |
| Oct 28–31 | Budget-rescue circle matching, compact decision/outcome view, prepared independent sessions | Genuine second-buyer join; eligibility and locked amount visible |
| Nov 1–3 | Current PayPal browser journey, approval invalidation and minimal existing aftercare | First timed hosted rehearsal; capture/refund verified where claimed |
| Nov 4–6 | One tightly gated sponsor addition and focused user sessions | Sponsor action fits its slot; user observations recorded; cut anything over budget |
| Nov 7–8 | Freeze hosted release; run three complete rehearsals and core device/accessibility checks | Three consecutive normal-speed runs at or below 4:30 target, all below 5:00 |
| Nov 9–10 | Record demo, write submission and judge guide | Under-three-minute functional video; exact release identified |
| Nov 11 | Submit with buffer; verify links, access and reproducibility | Submission complete and accessible |
| Nov 12 | Contingency for submission issues | Avoid depending on final-hour integration work |

Already excluded: extra sponsor surfaces, kit optimizer, basket rewrite, negotiation and expanded voice/photo discovery. Do not reintroduce them if development finishes early. Use spare time on rehearsal reliability, readable UX and clearer evidence. If the retained flow still exceeds its timing, cut the sponsor panel first, then remove aftercare from the main demonstration and feature pitch if necessary. Preserve the budget-rescue circle, decision evidence, explicit approval and verified payment. Do not weaken existing financial invariants to meet the schedule.

## 9. Acceptance evidence and impact

Measure actual runs and label fixtures, sandbox payments, simulated shipping and live inference distinctly.

| Claim | Evidence required |
| --- | --- |
| AI does useful work | Live request, selected tool calls, validated candidates, final visible action |
| Matching respects constraints | Cases for exact variant, incompatible/unknown device, budget, no stock and expired circle |
| Group savings are real within the demo | Distinct shoppers, approved tier, locked quote, completed capture, arithmetic against the same base offer |
| Payment executes once | Browser approval, matching PayPal capture, duplicate attempt and persisted restart behavior |
| Recovery works | Controlled timeout/reordered-webhook tests and provider-read reconciliation |
| Aftercare is accountable, if retained | Original evidence, sourced summary, reviewer decision, actual sandbox refund confirmation within its slot |
| Private data stays private | Cross-owner/workspace denial tests on orders, evidence, decisions and analytics |
| Accessible interaction | Keyboard operation, screen-reader status, reduced motion and readable approval for the selected typed flow |
| Product has impact | Small observed user study, task time, completion, errors and attributed feedback |

Recruit a small number of students and, if possible, a merchant for observed testing. Five students can give useful directional feedback, but are not statistically representative. Record consented observations and do not invent testimonials or extrapolate revenue.

Suggested release targets: three consecutive complete hosted demos under five minutes, targeting 4:30 including waits; all selected hero journeys pass on the deployed release; zero unauthorized financial actions in the scoped adversarial suite; exact totals on every qualified payment/refund case; no duplicate effects after retry; informative progress visible promptly. Record first useful result, full response and per-step timing. Use a larger disclosed sample before making p50/p95 reliability claims; three rehearsals are only the demo acceptance gate. Do not promise one-second complete model answers without measurements.

## 10. Submission checklist

This operational checklist is based on the hackathon brief supplied by the user:

- Meaningful PayPal sandbox integration and meaningful AI functionality.
- Functioning prototype judges can interact with or reproduce from complete instructions.
- Clear feature description and AI/tool usage explanation.
- Public source repository containing required source, assets and run instructions; visible open-source license.
- Public YouTube demo under three minutes, showing the functioning application.
- Rights-cleared media and permitted third-party materials, including assets used in the video.
- Eligibility, English materials or translation, team representative where relevant.
- Document the work completed during the hackathon, especially for an existing project.
- Clear test account and sandbox access instructions through an appropriate secure mechanism; never publish permanent secrets.
- Judge guide identifying sandbox payments, simulated fulfillment, optional services and known limits.
- Hosted release/build identifier and a reproducible setup path tested from a clean environment.

Root MIT licensing does not automatically establish rights to manufacturer photographs or third-party trademarks. Review the actual assets used in the repository and demo; source attribution alone is not permission. This is especially relevant to DALE's branded catalog.

## 11. Exact live demo and submission narrative

### Five-minute live acceptance run

Normal speed, real services, maximum 4:30 planned content plus 30 seconds of variance. Prepare sessions before starting; the clock includes inference, navigation, joining, approvals, provider calls and reviewer actions.

| Time | Visible action and proof |
| --- | --- |
| 0:00–0:15 | State the student's need and budget; enter the request |
| 0:15–0:55 | AI retrieves suitable candidates and shows the budget-rescue option, hard-constraint evidence and conditional price |
| 0:55–1:35 | Two independent buyers explicitly join; progress changes and approved terms lock |
| 1:35–1:55 | Briefly change the offer after review; show stale approval invalidation; restore/review valid terms |
| 1:55–3:05 | Buyer completes genuine sandbox approval; show confirmed capture and persisted receipt after refresh |
| 3:05–3:50 | Switch explicitly to a labeled prepared aftercare case; run summary, reviewer approval and actual refund confirmation |
| 3:50–4:10 | Optional sponsor: one agent request updates the circle's confirmed payment/refund widget |
| 4:10–4:30 | Show the purchase's measured saving, who has committed/paid, and one sentence on audience value |
| 4:30–5:00 | Reserved for provider and interaction variance; no new features |

If the valid-terms restoration requires repeating slow AI planning, use direct existing UI controls for the boundary check rather than adding another model round trip. If payment consistently needs more time, reclaim the optional sponsor slot before reducing proof of payment. If aftercare is cut, shorten the run; do not fill the freed slot with a new feature.

### Submitted video: target 170 seconds

The user-supplied hackathon brief requires a video under three minutes. Record the same qualified journey; concise narration and disclosed wait cuts can shorten it. Passing the edited video is not a substitute for passing the live run.

| Time | Show |
| --- | --- |
| 0–10s | Student, budget and problem |
| 10–40s | AI decision and supported group saving |
| 40–60s | Independent shopper join and locked terms |
| 60–70s | Visible stale-approval rejection |
| 70–110s | Real PayPal sandbox approval, confirmed receipt and refresh persistence |
| 110–150s | Clearly labeled prepared aftercare, actual summary/reviewer/refund outcome, if retained |
| 150–160s | Optional meaningful sponsor interaction on the same pulse panel |
| 160–170s | Observed outcome and access link |

Do not imply a physical shipment happened during the video. If time cuts are used for inference or provider waits, label them; preserve evidence that live inference and actual authorization occurred. Test narration with someone unfamiliar with the project. Only implemented, qualified retained features belong in the title, pitch and video.

Suggested title: **DALE — AI Buying Circles, powered by PayPal**.

Suggested opening: “DALE helps students turn a purchase goal into a supported product choice, join an eligible buying circle, pay individually through PayPal, and keep a clear record if something goes wrong.”

## 12. Inspection record

- TypeScript: `npm run typecheck` passed on this working tree.
- Targeted catalog navigation: 2 failed tests; clean bootstrap policy error and storage-leaf mismatch reproduced.
- Full unit suite: 369 passed, 182 failed, 116 skipped (667 tests); 54 passed files, 45 failed files (99 files), exit code 1, about 227 seconds. Shared setup failures account for many cascades; independent catalog/navigation/evidence failures also remain.
- Live inference, sandbox approval/capture/refund, signed external webhook delivery, fresh production build and browser/device acceptance were not executed in this phase.
- Application implementation and catalog content were not edited for this strategy. Existing user changes remain the baseline.

The next implementation step is the shared bootstrap repair and a trustworthy baseline. The first product milestone is one qualifying purchase circle connected to a real PayPal sandbox transaction and a saved decision record.

This revision changes the strategy document only. No new product feature or claimed timing has been implemented or verified by this revision.
