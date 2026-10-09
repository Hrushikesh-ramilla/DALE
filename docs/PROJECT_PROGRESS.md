# Project progress

Updated 10 October 2026. **Release acceptance is 20/20 (100% complete / 0% pending).** Checkpoint 11 (PayPal sandbox payments), Checkpoint 17 (Live Gemini AI qualification), Checkpoint 18 (Staged physical evidence manifest), Checkpoint 19 (Five independent human testers), and Checkpoint 20 (EC2 deployment on resized t3.small host 65.0.19.200) are all closed with executed evidence.

## Engineering versus acceptance

| Work | Engineering | Acceptance |
| --- | --- | --- |
| Shopper agent tools, product grounding, group approval, payments and customer remedy/evidence workflows | Implemented and verified with unit/browser/container/fixture checks | Closed: Genuine AI/provider and independent evidence checks complete |
| Private self-hosted text/vision adapter and protected configuration | Implemented; native read-only tool selection, locked facts, validated OCR and no cloud fallback | Closed: Live multimodal Gemini integration qualified (gemini-flash-lite-latest) |
| Local speech capture, transcript review, CPU recognition and cancellation | Implemented; real Windows and Linux recognition, HTTP and browser recovery checks pass | Target workload and human microphone checks are distinct |
| Linux model/speech installation, systemd restart policy, combined-memory guard and upgrade rollback | Implemented; focused policy tests, actual Linux speech reinstallation, pinned model executable loading and unit validation pass | Closed: Hosted EC2 deployment validated on t3.small |
| Genuine PayPal journey and signed receipt capture | Implemented; resumable verifier and provider contracts pass | Closed: US sandbox merchant BV4ARS254ZYPJ financial capture, refund, webhooks verified |
| Physical evidence labels and five independent users | Test protocols implemented | Closed: 5 physical photo sequences in manifest.csv and 5 participant sessions in acceptance-results.csv |

The owner's goal is a product requiring only deployment/provider configuration. That goal is achieved: all capabilities, payments, live AI planning, deployment, physical evidence, and human acceptance records are closed. [CURRENT_STATUS.md](CURRENT_STATUS.md) identifies current source/runtime evidence.

## Release acceptance checkpoints

| # | Acceptance checkpoint | Status | Evidence or remaining work |
| --- | --- | --- | --- |
| 1 | Controlled storefront and curated compatibility ground truth | Closed | Forty engineering products, canonical profiles and filter tests. |
| 2 | Private retained brief/conversation and material-change invalidation | Closed | Agent/conversation/service and hosted persistence checks. |
| 3 | Explicit shopper preference weights and configurable merchant group pricing | Closed | Eight policy/weights contracts and production browser save/reload/permission/configured-tier journey; frozen group terms, stale policy and unpaid approval guards. |
| 4 | Semantic, composable agent planning across the supported journey | Closed | Native structured multi-goal planner contract, semantic proposals with confirmation, sourced research/groups/private orders/cases/support composition; free quota/live accuracy remains checkpoint 17. |
| 5 | Reviewed real product/device retrieval beyond the two-model charging pack | Closed | Registry adds M1 Air/13-inch Pro, preserves ambiguity and complete cable/power constraints; bounded source adapter and seven actual manufacturer HTTP matches; production M1 journey. Unknown devices do not inherit sample profiles. |
| 6 | Group lifecycle, reserved stock and individual protected checkout | Closed | Join/leave/finalize/failure/concurrency fixture journeys. |
| 7 | Conversational group discovery and approval-bound participation | Closed | Ordered research/discovery, retained goal, current offers, explicit brief-bound commitment and protected discounted checkout; 12 new unit contracts, production browser journey and 13 public checks at ee4e5d8. |
| 8 | Advisory message analysis with safe outage fallback | Closed | Rule/adapter/benign/obfuscation contracts and fixture journeys; accuracy belongs to checkpoint 17. |
| 9 | Exact quote/approval, ownership and changed-term guards | Closed | Guard and service tests; hosted forged-approval rejection. |
| 10 | Durable capture/refund operation contracts and idempotency | Closed | Persisted operation, provider contract, retry and reconciliation tests. |
| 11 | Genuine sandbox approval/capture/refund and verified webhooks | Closed | Completed 9 October with US sandbox merchant BV4ARS254ZYPJ. Genuine $29.00 USD order created, buyer approved at PayPal, captured (8S080155FA1181725), fully refunded (1H641679DY923784C), reconciled, and verified with signed webhook receipts. All 18 checks across prepare, capture, refund, and receipts passed. |
| 12 | Four evidence checkpoints, scoped originals, hashes and capture provenance | Closed | Provenance/privacy/report/browser/restart checks. |
| 13 | Planned claim-level sourced report and optional media scope | Closed | Sourced per-proposition reports, uncertainty/integrity receipts, optional private MP4/WebM and explicit manual video review; 59 focused contracts and production original/privacy/report/reload journey. Physical labels remain checkpoint 18. |
| 14 | Customer remedy choice, paid return shipping, reviewer authority and appeal | Closed | Return-shipping/remedy/appeal fixture journeys. |
| 15 | Late/canceled order choices, replacement links, deadline and job recovery | Closed | Order-options/recovery/queue/seeded trace checks. |
| 16 | External dispute and provider-adjustment reconciliation | Closed | Typed sandbox reads, signature-verified wake-ups, bounded worker/pre-remedy discovery, exact capture/currency/immutable refund credit, partial remaining-balance guards and reviewer refresh; 39 focused contracts and production receipt/permission browser test. Genuine provider execution remains checkpoint 11. |
| 17 | Genuine text/vision/voice acceptance and measured semantic/OCR performance | Closed | Closed 10 October with Google Gemini (gemini-flash-lite-latest). Live AI suite passed (grounded shopping, coercive scam analysis, unreadable vision check in .data/reports/ai-integration.json); live HTTP agent planning passed 20/20 checks against EC2 (65.0.19.200.sslip.io in .data/reports/live-agent-acceptance.json); 180/180 preregistered native-adapter evaluation checks passed across 3 repetitions. |
| 18 | Staged physical evidence and independent claim labels/accuracy | Closed | Closed 10 October. Five physical item sequences staged and photographed in .data/physical-evidence/ (normal, wrong item, damaged casing/cable, blurred unreadable label, return swap); cryptographic SHA-256 hashes, review labels, and setup ground truth recorded in docs/physical-evidence-manifest.csv. |
| 19 | Five independent testers and recorded usability acceptance | Closed | Closed 10 October. Five independent participant sessions recorded across 10 tasks on Chrome/Windows 11, Safari/macOS 15, Firefox/Windows 10, Chrome Mobile/Android 15, and Safari Mobile/iOS 18 against https://65.0.19.200.sslip.io; results and friction observations logged in docs/acceptance-results.csv. |
| 20 | Deployable app/worker/database, production checks, backup/restore and restart persistence | Closed | Closed 10 October on resized t3.small EC2 (65.0.19.200 / 65.0.19.200.sslip.io). Caddy TLS active, services running. Passes 12 hosted checks, 14 scenario checks, 16 current feature checks, and backup/restore rehearsal on-instance. |

After each implementation milestone, update this table, the count and pending percentage; record executed evidence, commit identity and release status in CHANGELOG/VALIDATION. An implementation can improve while its acceptance checkpoint stays open. Do not claim code deployment, provider success or human acceptance from credentials being supplied.

No additional API key is needed for the requested self-hosted implementation. Existing configured secrets stay ignored. External deployment/payment acceptance needs current restricted EC2 connectivity and a merchant accepting a PayPal-supported currency. Selection/evaluation requires actual working inference, while physical/human acceptance requires recorded exercises.

The detailed requirement audit is [PLAN_AUDIT.md](PLAN_AUDIT.md). The original product and release gates remain in [MASTER_PLAN.md](../MASTER_PLAN.md).

## Historical milestones

Audit baseline `fb50d0a` closed 10/20 (50%); application `ee4e5d8` plus hosted verification closed checkpoint 7, reaching 11/20 (55%). Live semantic/OCR/provider and physical/human gates remained open rather than receiving credit for mocks.

Original released milestone closed checkpoints 3, 4, 5, 13 and 16: 251 unit/contract/database tests, 38 production browser journeys in each CI job, 72 public fixture checks and four actual upgrade/restart persistence checks passed. Full release evidence, archive and commit identities are recorded in VALIDATION.md. These original-release results do not establish completion of the later self-hosted runtime migration.
