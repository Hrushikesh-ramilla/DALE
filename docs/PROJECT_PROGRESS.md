# Project progress

Updated 9 October 2026. **Release acceptance is 15/20 (75% passed / 25% pending). This is not engineering completion.** Deployment checkpoint 20 reopened when the owner replaced Gemini and resized EC2. Existing code was not removed. Historical 80% described the previously accepted deployment. It must not be presented as an estimate of remaining code or time.

## Engineering versus acceptance

| Work | Engineering | Acceptance |
| --- | --- | --- |
| Shopper agent tools, product grounding, group approval, payments and customer remedy/evidence workflows | Implemented and verified with unit/browser/container/fixture checks | Genuine AI/provider and independent evidence checks remain separate |
| Private self-hosted text/vision adapter and protected configuration | Implemented; native read-only tool selection, locked facts, validated OCR and no cloud fallback | LFM2.5-VL-3B passes five development checks; full quality/resource qualification remains engineering work, not a missing key |
| Local speech capture, transcript review, CPU recognition and cancellation | Implemented; real Windows and Linux recognition, HTTP and browser recovery checks pass | Target workload and human microphone checks are distinct |
| Linux model/speech installation, systemd restart policy, combined-memory guard and upgrade rollback | Implemented; focused policy tests, actual Linux speech reinstallation, pinned model executable loading and unit validation pass | Actual selected-model/EC2 joint-load/restart execution required; unit validation is not an observed model restart |
| Genuine PayPal journey and signed receipt capture | Implemented; resumable verifier and provider contracts pass | Existing merchant rejects checkout currency; usable account configuration and actual capture/refund remain required |
| Physical evidence labels and five independent users | Test protocols implemented | Actual people/captures have not supplied records; these are acceptance activities, not unimplemented feature code |

The owner's goal is a product requiring only deployment/provider configuration. That goal is not yet achieved: the self-hosted agent has no qualified model. Human/physical gates must not be used to imply code is missing, and completed adapters must not be used to claim a failed model works. [CURRENT_STATUS.md](CURRENT_STATUS.md) and [SELF_HOSTED_AI.md](SELF_HOSTED_AI.md) identify current source/runtime evidence.

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
| 11 | Genuine sandbox approval/capture/refund and verified webhooks | Open | Fresh 8 October OAuth, webhook registration lookup, order creation and buyer login passed; PayPal again rejected the merchant's USD currency before approval. No capture/refund was issued. Resumable application acceptance and signed own-order receipt recording are implemented. |
| 12 | Four evidence checkpoints, scoped originals, hashes and capture provenance | Closed | Provenance/privacy/report/browser/restart checks. |
| 13 | Planned claim-level sourced report and optional media scope | Closed | Sourced per-proposition reports, uncertainty/integrity receipts, optional private MP4/WebM and explicit manual video review; 59 focused contracts and production original/privacy/report/reload journey. Physical labels remain checkpoint 18. |
| 14 | Customer remedy choice, paid return shipping, reviewer authority and appeal | Closed | Return-shipping/remedy/appeal fixture journeys. |
| 15 | Late/canceled order choices, replacement links, deadline and job recovery | Closed | Order-options/recovery/queue/seeded trace checks. |
| 16 | External dispute and provider-adjustment reconciliation | Closed | Typed sandbox reads, signature-verified wake-ups, bounded worker/pre-remedy discovery, exact capture/currency/immutable refund credit, partial remaining-balance guards and reviewer refresh; 39 focused contracts and production receipt/permission browser test. Genuine provider execution remains checkpoint 11. |
| 17 | Genuine text/vision/voice acceptance and measured semantic/OCR performance | Open | Entirely self-hosted is confirmed. Seven CPU candidates tested; LFM2.5-VL-3B passes five development checks, but is not qualified from this smoke. Local Whisper recognized two frozen synthesized requests; microphone review/cancel/failure transport passes browser mocks. Full model evaluation, real human speech and target memory/latency remain open. |
| 18 | Staged physical evidence and independent claim labels/accuracy | Open | Manifest has no captured/labeled cases. |
| 19 | Five independent testers and recorded usability acceptance | Open | Result template has no participant records. |
| 20 | Deployable app/worker/database, production checks, backup/restore and restart persistence | Open again | Earlier app/worker/database release passed CI/HTTPS/restart. Replacement model/speech runtime is not installed or jointly verified on resized EC2; old address times out. New deployment/restart/memory evidence is required. |

After each implementation milestone, update this table, the count and pending percentage; record executed evidence, commit identity and release status in CHANGELOG/VALIDATION. An implementation can improve while its acceptance checkpoint stays open. Do not claim code deployment, provider success or human acceptance from credentials being supplied.

No additional API key is needed for the requested self-hosted implementation. Existing configured secrets stay ignored. External deployment/payment acceptance needs current restricted EC2 connectivity and a merchant accepting a PayPal-supported currency. Selection/evaluation requires actual working inference, while physical/human acceptance requires recorded exercises.

The detailed requirement audit is [PLAN_AUDIT.md](PLAN_AUDIT.md). The original product and release gates remain in [MASTER_PLAN.md](../MASTER_PLAN.md).

## Historical milestones

Audit baseline `fb50d0a` closed 10/20 (50%); application `ee4e5d8` plus hosted verification closed checkpoint 7, reaching 11/20 (55%). Live semantic/OCR/provider and physical/human gates remained open rather than receiving credit for mocks.

Original released milestone closed checkpoints 3, 4, 5, 13 and 16: 251 unit/contract/database tests, 38 production browser journeys in each CI job, 72 public fixture checks and four actual upgrade/restart persistence checks passed. Full release evidence, archive and commit identities are recorded in VALIDATION.md. These original-release results do not establish completion of the later self-hosted runtime migration.
