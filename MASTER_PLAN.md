# BuyerGuard master plan

Prepared: 5 October 2026. Updated: 6 October 2026. Status: the core application is deployed on the user's existing EC2 instance. Local checks, hosted PostgreSQL, public HTTPS, fixture shopper/return/recovery journeys, and backup/restore checks pass. Earlier direct Gemini smoke checks passed; current quota is unavailable and hosted analysis uses fixtures under the owner's no-spend instruction. Complete PayPal sandbox verification is blocked by the merchant rejecting USD approval. Work continues on all independent milestones; no capture, refund, or genuine webhook delivery is claimed. See docs/IMPLEMENTATION_STATUS.md for requirement gaps, CHANGELOG.md for milestone history, and docs/VALIDATION.md for executed evidence.

## 1. Product decision

Build a customer-first shopping agent covering discovery, compatible products, group discounts, safe payment, and recovery when an order goes wrong. Combine the selected ideas: AgentGuard (1), BuyTogether (4), ScamPause (6), Buyer's Advocate (8), ReturnShield (10), PartsMatch (15), and RescueMyOrder (16). Evidence-backed returns remain a supporting feature of the complete shopping experience.

Promise: **Find the right product, pay safely, and receive a clear, fair resolution when something goes wrong.**

Initial audience: shoppers buying electronics and replacement accessories. Initial catalog: approximately 40 products, including visually similar but incompatible parts. This narrow domain lets us establish reliable compatibility ground truth and demonstrate all seven capabilities together.

Release target: a hosted, sandbox-only application engineers can interact with, plus a reproducible Docker environment and executable test suite. A deployable sandbox product is the hackathon deliverable. Taking real payments is a separate readiness milestone.

## 2. Customer priority is an enforceable policy

| Policy | Product behavior | Acceptance evidence |
| --- | --- | --- |
| The shopper controls purchases | Show item, compatibility, merchant, full total, currency, delivery promise, and return policy before explicit approval. Any material change requires new approval. | Changed-quote and unauthorized-action tests. |
| Recommendations serve the customer | Apply required compatibility and budget constraints before ranking. Rank eligible options by shopper priorities. Sponsorship cannot improve organic rank. | Sponsorship perturbation and constraint tests. |
| Returns are easy to initiate | A short guided flow; allow photos and written descriptions. Video is optional. Do not repeatedly request information already supplied. | Browser tests for complete and incomplete submissions. |
| Suspicion cannot automatically defeat a claim | AI may request clarification or recommend review. It cannot deny refunds, accuse the customer of fraud, or close an appeal. | Policy tests against adversarial model outputs. |
| Seller delay cannot create an endless loop | A configurable response deadline triggers escalation. During the demo, use a 24-hour seller-response target with a simulated clock. | Timeout and unresponsive-seller scenarios. |
| Merchant-caused problems have a customer remedy | Under the demo merchant's published policy, verified wrong-item or damaged-item cases qualify for refund or replacement; offer return shipping at the merchant's expense where a return is required. | Remedy policy and shipping-cost tests. |
| Ambiguity receives timely support | A reviewer sees both sides. Where records remain inconclusive, apply the merchant's agreed customer-benefit policy instead of repeatedly making the buyer prove a negative. | Ambiguous-case tests with recorded reviewer decisions. |
| Refund status is truthful | Distinguish requested, processing, completed, and failed. Show reference and next step. | PayPal reconciliation and failure tests. |
| Customer rights remain visible | Show the scope of our storefront policy separately from any applicable PayPal process. Preserve the route to human review and PayPal dispute information. | UI and workflow review. |

Automatic refunds require a pre-authorized merchant policy, eligible payment state, and sufficient refundable balance. Customer priority does not create a permission to move someone else's money without authority. High-cost or contested cases escalate to an accountable reviewer; the customer receives a deadline and explanation.

Demo policy: accept eligible return requests within 30 days of recorded delivery; process a qualifying refund within 24 hours of recorded return receipt or an approved no-return remedy. These are our merchant's proposed policy targets, not PayPal guarantees. Payment settlement timing is reported from the provider.

## 3. Business model and scope

Customers use the core shopping and resolution experience without an extra BuyerGuard charge. The commercial hypothesis is merchant software subscriptions for assisted shopping and support operations. Merchant payments must not influence organic rankings or reviewer outcomes. Track customer completion, time to resolution, and avoided mistakes alongside merchant costs.

First release: one managed demo storefront and one PayPal sandbox merchant. Catalog supplier names are demo inventory sources, not independently onboarded merchants. Buyer, seller, and reviewer accounts have separate permissions. Group buying involves individual purchases of the same SKU from this storefront.

Expansion to independent sellers requires merchant onboarding and a separate payment architecture review. PayPal documents live marketplace approval requirements in its [platform overview](https://developer.paypal.com/platforms/overview).

No dependency on access to arbitrary shops, private conversations, or carrier accounts. Users share messages voluntarily. Shipping events use a documented carrier simulator. Uploaded evidence uses synthetic fixtures and a small staged physical-product test set. All simulated components are labeled in the engineering console and documentation.

## 4. One complete shopper journey

1. Shopper states a need, device model, preferences, and budget.
2. Agent asks only material clarifying questions and builds a structured purchase brief.
3. Catalog retrieval and a compatibility checker identify eligible products; the agent explains comparisons with source references.
4. Shopper selects an item or joins a matching group deal. The agent explains price, deadline, and cancellation terms.
5. ScamPause examines user-shared messages and suspicious listing content. AgentGuard checks the approved purchase against server-owned facts.
6. Shopper explicitly approves PayPal checkout. The server verifies the transaction; a browser success screen is insufficient evidence of payment.
7. Shopper sees order status, expected delivery, and an easy help action.
8. If something goes wrong, the agent offers the appropriate cancellation, return, refund, or replacement path.
9. Both parties can submit evidence. The agent organizes it; deterministic rules and authorized reviewers determine financial actions.
10. Shopper receives a clear status, financial reference where applicable, and an appeal route.

Core screens: shopping conversation with comparison cards; product details; group deal; approval and checkout; order timeline; guided return; evidence and resolution timeline. Operator screens: fulfillment, evidence submission, review queue, and restricted engineering scenarios.

## 5. Feature contracts and test gates

| ID | Feature | Bounded first implementation | Required acceptance tests |
| --- | --- | --- | --- |
| BG-01 | AgentGuard | Deterministic server checks for approval, quote version, item, payee, amount, currency, stock, and action permissions; AI explains warnings. | Malicious listing; changed payee; expired quote; changed amount; unauthorized capture/refund; repeated request; stale inventory. |
| BG-02 | BuyTogether | Same-SKU group formation with server-priced, merchant-approved discount tiers and individual checkout. | Concurrent joins; repeated join; minimum reached; timeout; buyer leaves; partial payment failure; expired offer; fair cancellation. |
| BG-03 | ScamPause | Analyze voluntarily supplied text and listing content; give specific reasons and a safer next step. | Labeled legitimate/scam conversations; escalating multi-turn scams; benign urgency; obfuscated instructions; model outage. |
| BG-04 | Buyer's Advocate | Catalog-grounded comparisons and explicit shopper preference weights. | Sponsored inferior item; unsupported claims; preference changes; missing specs; no eligible result; ties. |
| BG-05 | ReturnShield | Four evidence checkpoints, claim-level analysis, review, customer remedy, and exportable report. | Genuine damage; swapped item; dishonest seller; forged/reused evidence; missing serial; inconclusive damage timing; appeal. |
| BG-06 | PartsMatch | OCR-assisted identification, canonical model IDs, and a curated compatibility graph. | Same-looking incompatible parts; OCR mistakes; unreadable label; missing model; conflicting specs; confirmed compatible part. |
| BG-07 | RescueMyOrder | Deadline/stock/cancellation events trigger options; server executes approved refund or creates a linked replacement workflow. | Seller cancellation; late delivery; replacement unavailable; refund failure; stock race; duplicate event; buyer chooses refund instead. |

Every feature ticket must specify input, expected output, side effects, failure behavior, test fixtures, and linked result evidence. No ticket becomes release-ready from a screenshot or an unexecuted test file.

## 6. Group buying without payment surprises

Use commitments before payment. A commitment is not a PayPal authorization and does not debit money. A buyer can leave before finalization.

When the minimum commitments are reached, atomically reserve available stock and freeze the merchant-approved discounted quote for a short checkout window. Each shopper independently approves and pays the exact locked amount. The merchant agrees to honor that price for successfully paid participants even if another participant fails to pay. Unpaid reservations expire; successful customers are never repriced.

Before checkout, show this policy and window. If the merchant cancels after payment, issue individual refunds. If refund execution is pending or fails, keep the order visibly unresolved and escalate; do not label the cancellation financially complete. The prototype does not pool customer funds or claim group-wide atomic payment.

## 7. Evidence-backed returns and replacements

| Checkpoint | Evidence | What can be compared |
| --- | --- | --- |
| Seller dispatch | Order-linked item ID/serial where available, condition photos, packaging and shipping reference. | Product identity and documented pre-shipment appearance. |
| Buyer receipt | Reported issue, item identifier, photos, optional video, packaging information. | Whether the received item appears consistent with dispatch and whether the reported issue is visible. |
| Buyer return dispatch | Return authorization, item identifier, condition, packaging and return shipping reference. | Whether the documented return matches the received item. |
| Seller return receipt | Return reference, item identifier, condition and optional opening video. | Whether the documented received return matches the buyer's documented dispatch. |

Bind submissions to authenticated accounts, an order/case, and a server-issued capture session when using guided capture. Store original files with a cryptographic hash, server receipt timestamp, and an application audit record. A challenge code can discourage replay but cannot prove physical truth or prevent staged scenes. Uploaded files receive weaker origin assurance than guided captures.

Evidence report schema: claim ID; source IDs; extracted observations; verified transaction facts; exact identifier matches/conflicts; appearance-based inferences; missing facts; supported/contradicted/insufficient outcome; next action. Never present a model's self-reported confidence as a calibrated probability.

Separate three levels:

- **Verified records:** PayPal payment status, submitted-file integrity since ingestion, authenticated submission account, and exact recorded identifiers. Submission authentication does not prove honesty.
- **Corroborated observations:** condition and visual matches supported by multiple records; still open to challenge.
- **Unresolved facts:** who caused damage, whether a scene was staged, unrecorded parcel contents, or whether both parties colluded.

Cryptographic provenance describes origin/history and integrity; it does not establish that a depicted event is true. See the [C2PA explanation](https://spec.c2pa.org/specifications/specifications/2.2/explainer/_attachments/Explainer.pdf).

Do not infer fraud from a missing photo, serial number, metadata, or video. Provide an accessible alternative and review path. Image-forgery detectors are advisory experiments unless held-out testing establishes a bounded useful role; they never independently deny a claim.

Resolution order: identify requested remedy; check published policy; collect only missing material evidence; request seller response; apply eligible merchant-authorized remedy or review; execute; reconcile; notify; allow appeal. The customer can choose a refund over a proposed replacement when the policy allows.

A merchant-funded replacement is a linked fulfillment record with no additional buyer charge. If the customer chooses a different product requiring a new purchase, show the refund status and obtain fresh approval for the separate checkout. Track remedy allocation to prevent a duplicate refund and replacement from conflicting retries. Any deliberate goodwill exception requires explicit authorization.

PayPal disputes remain separate provider cases linked to our internal return. Our AI does not adjudicate PayPal disputes. Reconcile existing dispute outcomes and refunds before further financial actions. Avoid duplicate reimbursements.

## 8. Architecture

| Component | Choice | Responsibility |
| --- | --- | --- |
| Web and server API | Next.js, TypeScript | Shopper/operator UI, authentication, authorization, schema validation and domain commands. |
| Domain logic | Shared TypeScript modules | Quotes, compatibility, customer policy, payment rules and state machines. |
| Database | PostgreSQL | Catalog, accounts, orders, cases, payment journal, jobs and audit records. |
| Background processing | Node worker using a maintained PostgreSQL-backed job queue | Evidence analysis, notifications, deadlines, reconciliation and retryable tasks. |
| Evidence storage | Private S3-compatible object store; local equivalent in Docker | Original evidence, expiring authorized downloads, and retention. |
| AI | Provider adapter for structured text and vision responses | Clarification, extraction, comparisons, risk explanation and claim summaries. |
| Payments | PayPal server API and browser checkout SDK | Sandbox approval, capture, refund and provider state lookup. |
| Carrier | Deterministic simulator behind an adapter | Delivery/return events and failure injection. |
| Validation | Vitest, Playwright and a versioned evaluation runner | Rules, adapters, complete journeys, AI metrics and test reports. |

Use a modular monolith with one web process and one worker. Choose supported package/runtime versions at implementation start and lock them. AI produces typed proposals; every proposal passes server validation. The model never receives payment credentials or directly executes unrestricted financial tools.

AI extraction is fallible: product identifiers must resolve to canonical catalog records; compatibility and money checks are deterministic. Treat listings, messages, filenames and evidence text as untrusted content, not agent instructions. Validate and sanitize rendered output.

AI outage behavior: retain search/filter/manual comparison, checkout, return creation and reviewer workflows; show analysis as unavailable or queued. Payment ambiguity behavior: reconcile the original operation before making another request; never invent success.

Core data entities: User, Role, Product, DeviceModel, CompatibilityEdge, Quote, PurchaseApproval, BuyingGroup, GroupMembership, InventoryReservation, Order, Shipment, PaymentOperation, ProviderEvent, ReturnCase, Claim, EvidenceAsset, Analysis, Resolution, Appeal, Job and AuditEvent.

Store amounts as integer minor units with currency. Record quote/policy/model/prompt versions. Evidence and order access is object-level: buyers see their own records; seller staff see assigned store records; reviewers see assigned cases. Engineering fixtures live in isolated demo workspaces.

## 9. States, contracts and payment integrity

Order: DRAFT -> QUOTED -> AWAITING_APPROVAL -> PAYMENT_PENDING -> PAID -> FULFILLING -> SHIPPED -> DELIVERED. Cancellation/refund states are explicit branches.

Return: OPEN -> EVIDENCE_REQUESTED -> SELLER_RESPONSE_PENDING -> POLICY_APPROVED or HUMAN_REVIEW -> RETURN_IN_TRANSIT (if required) -> RETURN_RECEIVED -> REMEDY_PENDING -> RESOLVED. APPEALED reopens review without repeating completed money movements.

Payment operations: CREATED -> SENT -> SUCCEEDED, FAILED, or UNKNOWN. An UNKNOWN operation is reconciled; it is not blindly recreated. Refunds have their own provider status.

Contract groups to implement and document in OpenAPI: catalog search; purchase brief; versioned quote; group join/leave/finalize; checkout creation and capture; order status; return creation; evidence upload/session; analysis retrieval; resolution approval; appeal; verified PayPal webhook ingress; restricted fixture setup. All mutation endpoints validate identity, resource ownership, state, and idempotency.

Invariants:

1. Payment payee, item, total and currency match the active customer approval and server quote.
2. Expired or changed quotes require fresh customer approval.
3. Each logical capture/refund operation has a unique persisted key; retries reuse it.
4. Transaction locks/reservations prevent concurrent overselling and excess refunds.
5. Completed plus reserved pending refunds never exceed the remaining captured amount; reconcile external dispute adjustments too.
6. Verified duplicate/out-of-order provider events do not duplicate actions or regress final financial state.
7. Unverified webhooks cannot update orders or payments.
8. A changed evidence file fails integrity checks; an unchanged file is not thereby declared truthful.
9. Group participants have separate payment and resolution records.
10. A model cannot authorize money movement or deny an appeal.

Persist a command and its payment operation before sending a provider request. Use a transactional outbox/job handoff, durable results, bounded retry/backoff, and reconciliation after crashes. Endpoint-specific PayPal idempotency support and retention must be checked; local keys are still necessary. [PayPal idempotency documentation](https://developer.paypal.com/api/rest/reference/idempotency/).

Verify real PayPal webhook signatures before processing, persist verified events durably, then acknowledge and process asynchronously. Test simulator events through the documented separate verification path; they are not evidence of a real sandbox transaction. [PayPal webhook documentation](https://developer.paypal.com/api/rest/webhooks/rest/).

## 10. Deployment and engineer access

Local environment: Docker Compose starts web, worker, PostgreSQL, object storage and carrier simulator. A development profile uses deterministic payment/AI fixtures. An integration profile uses actual PayPal sandbox and live AI inference. Environment badges identify each adapter's mode separately.

Hosted target, selected by the user: the existing EC2 t3.micro runs the app, worker, private PostgreSQL, and Caddy HTTPS. Build locally and deploy versioned standalone releases with systemd memory limits. Private evidence persists on the existing disk; the S3 adapter remains an optional, separately tested migration. No new paid infrastructure is provisioned. The originally proposed Render target is superseded by this explicit hosting choice. See docs/DEPLOYMENT.md for the actual deployment and storage limitations.

Deployment sequence:

1. Build a versioned image from a locked dependency set; run CI gates.
2. Provision services/storage and inject secrets through the host's secret configuration.
3. Run backward-compatible database migrations under a deployment lock; seed only designated demo workspaces.
4. Configure PayPal sandbox app and HTTPS webhook URL, record webhook ID and verify a real sandbox event.
5. Execute post-deployment checkout/refund smoke tests and worker/storage checks.
6. Publish the URL, build ID, engineer access instructions, adapter-mode summary and latest test report.

Expected secrets/configuration: database URL; private storage endpoint/bucket/key; authentication secret; AI credentials/model ID; PayPal sandbox client ID/secret/webhook ID; public app URL; environment mode; demo policy and model/prompt versions. Keep server secrets out of browser bundles, repositories, logs, screenshots and test reports.

Engineers receive buyer, seller and reviewer demo roles, a scenario catalog, fixture IDs, expected results, API examples and a reproducible issue template. Privileged engineering actions require separate authentication and cannot impersonate real provider webhooks. Each tester gets a separate demo workspace; reset operates only on that workspace, preserves financial audit references, and never resets PayPal's external history.

Provide liveness/readiness endpoints, worker heartbeat, job backlog, structured correlation IDs, redacted logs and error monitoring. Track pending payment/refund age, analysis failures and case deadline breaches. Use database backups and private-object retention; exercise restore before release. Roll back application images with compatible schema changes rather than deleting data.

Budget must include an always-running web/worker, database, storage, AI usage and demo retention through judging. Exact host/provider plans and spend limits are selected before provisioning. Do not rely on ephemeral local disk or a sleeping process for critical refund work.

## 11. Test strategy and evidence of implementation

### Three distinct test environments

| Layer | Purpose | What it establishes |
| --- | --- | --- |
| Deterministic local tests | Seeded catalogs, frozen clock, scripted faults, known expected decisions. | Reproducible behavior and invariants in the specified scenarios. |
| Live integration tests | Actual sandbox transactions, real webhook handling, live AI responses and private storage. | Adapters genuinely integrate with external services. |
| Hosted browser tests | Independent engineer sessions against the deployed build. | The delivered product is accessible and works outside a developer's machine. |

Synthetic shipping/media tests establish behavior against known fixtures, not universal physical fraud detection. Add staged physical captures using a few actual objects: correct item, wrong lookalike, visible damage, unreadable serial, and changed return. These remain controlled evidence, with limitations recorded.

### Versioned test corpus

Start with at least 300 held-out AI evaluation cases: 100 shopping/compatibility cases, 100 legitimate/scam message cases, and 100 claims/evidence cases. Include clean, contradictory and insufficient-evidence examples, unreadable images, replayed media and injected instructions. Keep prompt-development fixtures separate. Freeze labels, provenance and scenario manifests before final evaluation; do not tune against the final holdout.

Run at least 200 seeded randomized workflow traces for concurrency, retries, deadlines and state transitions, plus explicit critical regression cases. Retain failures and replay seeds. Test worker termination after a provider succeeds but before the local result is saved, a delayed webhook, repeated refund commands, and simultaneous group/payment operations.

### Release gates: targets, not results already achieved

| Gate | Proposed release requirement |
| --- | --- |
| Money and access rules | All critical invariant and ownership tests pass; zero unauthorized or duplicate money movements in the executed corpus. |
| Compatibility | All known incompatible catalog pairs are filtered; unknown/contradictory models request clarification. Correct model extraction on at least 95% of readable held-out fixtures. |
| Scam analysis | At least 90% recall on labeled scam fixtures and at most 5% false warnings on legitimate fixtures; publish counts and uncertainty. |
| Claim analysis | At least 90% agreement with human labels on bounded supported/contradicted/insufficient cases; zero automatic AI-based denials; publish confusion matrix and error examples. |
| Grounding | All consequential product/claim assertions in the reviewed release corpus have valid source references or are explicitly marked uncertain. |
| Genuine PayPal integration | Create, approve, capture, retrieve and refund actual sandbox payments; verify corresponding real sandbox webhook processing. |
| Hosted journeys | All defined critical shopper/merchant/reviewer journeys pass against the release URL, with traces and provider references retained. |
| Recovery | Model outage, worker restart, provider timeout, duplicate events and failed refund produce safe, truthful states and recover under the documented procedure. |
| Usability | At least five independent testers complete purchase and return tasks; record assistance needed, completion and major friction. |
| Responsiveness | At 10 concurrent test sessions, target under 1 second p95 for our non-AI API work; long AI/media jobs show progress without blocking the page. Record provider latency separately. |

Threshold misses require fixing, narrowing the affected capability, or keeping it explicitly experimental. No failed critical gate can be traded for presentation polish. Run live AI evaluation multiple times on a preregistered subset to expose output variability; report model/prompt versions and raw counts, not only averages.

Test results must link requirement ID, build commit, environment, adapter modes, dataset/seed, expected result, observed result, timestamp, and failure artifact. Payment references are sandbox-only; sensitive details are redacted.

Available repository interface: README.md, .env.example, Dockerfile, compose.yaml, generated docs/openapi.json, migration/fixture seed scripts, engineering guide, and ignored private reports. The user-selected EC2 deployment uses native systemd/Caddy; Render configuration is superseded. Commands include test, test:integration (200 seeded traces), test:e2e, eval, db:migrate, db:seed, docs:api, and hosted verification scripts. Optional object storage is an adapter; local Docker and EC2 use private persistent volumes/disk, and carrier events are simulated in the application. Physical captures, independent human labels/usability, and genuine PayPal/live-AI release gates remain distinct from fixture completion.

Definition of implemented: reachable working UI/API + repeatable test + executed passing report + hosted verification + honest limitation statement. Fixture mode cannot substitute for live AI or PayPal integration validation.

## 12. Critical deployed journeys

1. Find a compatible part and complete sandbox checkout.
2. Change the device/budget mid-conversation; invalidate the previous quote and approval.
3. Form a group, leave before finalization, then pay a locked discount.
4. Fail another group member's payment; preserve the successful customer's price.
5. Surface a scam warning; preserve legitimate checkout and explain the difference.
6. Reject a malicious listing's attempted payee or amount change.
7. Open a genuine damaged-item case and complete an eligible refund.
8. Compare a swapped-return claim and route it to review without accusing the customer.
9. Handle a dishonest seller and a missed seller deadline under customer-priority policy.
10. Resolve a canceled/late order with buyer-selected refund or replacement.
11. Retry interrupted payment/refund work without repeating money movement.
12. Deny cross-account evidence access and keep reset/scenario tools restricted.

Engineering scenarios are separate from the shopper interface. The shopper sees normal statuses, progress and next actions; technical payloads and evaluation metrics belong in the restricted console.

## 13. Delivery schedule

Planning assumption: a small engineering team with frontend, backend/payments and AI/testing coverage. This is a proposed schedule, not a commitment based on known staffing. Each milestone must deliver a deployable build.

| Dates, IST | Deliverable | Exit gate |
| --- | --- | --- |
| 5-8 October | Freeze customer policy, fixtures, schemas and state machines; scaffold containers, auth and deployment; verify sandbox credentials. | Hosted skeleton, isolated roles, fresh-clone startup, real sandbox integration spike. |
| 9-15 October | Grounded shopping, compatibility, approval-bound checkout and payment journal. | First complete purchase; mismatch, ownership and retry tests pass. |
| 16-22 October | Group deals, scam analysis and unbiased comparisons. | Group failure scenarios and held-out shopping/scam evaluations execute. |
| 23-29 October | Four evidence checkpoints, review, refund and replacement flows. | Complete customer-priority resolution; real refund integration verified. |
| 30 October-5 November | Fault injection, AI evaluations, security, staged physical evidence, usability and restore rehearsal. | Critical release gates pass; errors and limitations documented. |
| 6-10 November | Independent hosted verification, deployment runbook, documentation, repository licensing and demo recording. | Release candidate and engineer acceptance report. |
| 11-12 November | Fix release blockers and submit with a margin. | Public source, working access, test evidence and video complete. |

The published deadline converts to **13 November 2026, 1:30 AM IST**. Maintain the demo through the end of judging, **15 December 2026, 9:30 PM IST**, unless the organizer updates the schedule. Source: [official rules](https://paypalaihackathon.devpost.com/rules).

If staffing is smaller or progress slips, narrow catalog size, group complexity and media processing depth while retaining all seven bounded capabilities. Keep single-store deployment, customer policy, genuine PayPal integration and test gates intact.

## 14. Risks and scope controls

| Risk | Planned handling |
| --- | --- |
| Seven features become seven disconnected products | One shopping/order/case model, one domain and one complete demo story. |
| Physical evidence does not establish truth | Explicit uncertainty, corroboration and review; no definitive liar detector claim. |
| PayPal dispute endpoints need extra access | Verify during the first integration spike. Implement internal returns and actual capture/refund regardless; mark unavailable dispute calls as unimplemented. |
| Marketplace onboarding blocks deployment | Single merchant for the hackathon; independent-seller onboarding is a later release. |
| AI latency, cost or nondeterminism | Bounded adapter calls, cached catalog retrieval, budgets, queued analysis and manual fallback. |
| Seller silence harms the shopper | Deadlines, escalations and pre-agreed customer-benefit remedies. |
| Fake payment events hide integration gaps | Separate fixture and sandbox modes; require real transaction IDs and verified events for release evidence. |
| Duplicate refunds or inconsistent external state | Durable operation records, locks, idempotency and provider reconciliation. |
| Public demo misuse | Isolated workspaces, quotas, private storage, object authorization and restricted admin tools. |

PayPal describes [sandbox dispute testing](https://developer.paypal.com/disputes/test-go-live/) and notes additional access requirements for some [sandbox dispute creation methods](https://developer.paypal.com/platforms/disputes/integrate-disputes/). Do not make those methods a prerequisite for the central shopper journey.

## 15. Demo and success criteria

Under three minutes: state a device need; avoid an incompatible sponsored option; join a group discount; stop a manipulated payment instruction; complete real sandbox checkout; raise a problem; show both-party evidence; resolve under the customer policy; show the refund reference and deployed test report. Use transparent scenario controls for shipping/time changes and do not imply simulated events occurred physically.

Success is a coherent, pleasant shopper experience with visible customer protections, meaningful live sandbox PayPal usage, genuinely evaluated AI, and a release that another engineer can run and challenge. Report exactly what was tested and where the evidence ends.
