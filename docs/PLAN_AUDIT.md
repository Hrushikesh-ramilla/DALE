# Original master-plan audit

Audited 8 October 2026 against application `2c9b845` and documentation revision `5ed42b1`. The original plan is preserved in commit `68f6740` (5 October). Sources include that baseline, the owner's pasted initial conversation, current code, test definitions and recorded execution evidence. This audit makes no application change, provider call or spend.

## Intended product and verdict

DALE is a customer-first shopping agent combining AgentGuard, BuyTogether, ScamPause, Buyer's Advocate, ReturnShield, PartsMatch and RescueMyOrder. Its promise is: **find the right product, pay safely, and receive a clear, fair resolution when something goes wrong.** Returns evidence supports that shopper journey; it is not the main product.

The original first release deliberately uses one managed storefront, one PayPal sandbox merchant and approximately 40 curated electronics/accessory products. The storefront supplies a controlled environment for demonstrating the agent and its protections. Arbitrary external-shop access was explicitly not an original prerequisite. Subsequent owner requests for real products and natural customer wording remain requirements; a synthetic catalog or a two-model pack cannot establish that broader experience.

The intended connected journey is need and budget → material clarification → sourced compatible comparison → optional group savings → scam/payment protection → explicitly approved checkout → order monitoring → customer-selected return/refund/replacement with both-party evidence and an appeal route.

**The original master plan is not fully implemented or accepted.** Substantial bounded services and a deployed engineering environment exist. The central conversational agent does not yet connect those services into the intended journey, and several original acceptance gates have not passed. Completing the later two-model recovery milestones 1–4 does not complete the original project. The master plan and implementation status now state this distinction at the top.

## Seven selected capabilities

| Contract | Implemented and tested within the current boundary | Remaining work or verification |
| --- | --- | --- |
| BG-01 AgentGuard | Server-owned quote/item/payee/amount/currency/version/expiry checks; renewed approval after material changes; ownership, stock and duplicate-operation protections. | Genuine buyer-approved sandbox payment and complete financial acceptance. Fixture guards do not establish genuine settlement. |
| BG-02 BuyTogether | Same-SKU/model commitments, reservations, leave/finalize, separate checkouts and preservation of the successful buyer's discounted price. | No conversational group tool or research-to-group orchestration. Policy is hardcoded to two participants, 10% discount and 30-minute window; configurable merchant-approved tiers are absent. Genuine group payment acceptance remains open. |
| BG-03 ScamPause | Voluntary text analysis, rule-based reasons, optional structured model advisory categories, benign-message/obfuscation/outage tests. | Live model performance and independent labels. Synthetic warning counts do not establish real-world scam accuracy. |
| BG-04 Buyer's Advocate | Curated compatibility/budget filters, sponsorship-independent ranking, private retained constraints, sources and complete cable costs for the reviewed charging pack. | Flexible combined requests and explicit shopper preference weights. The real-device agent always uses price priority. Broader verified product coverage and retrieval are absent. |
| BG-05 ReturnShield | Four authorized checkpoints, private originals/hashes, capture-code binding, replay cues, scoped report, human review, authorized remedies and appeals. | Staged physical captures and human-labeled claim accuracy. Aggregate serial/appearance analysis is narrower than the planned claim-level, source-linked corroborated observation report. Uploads support images/notes; optional video described in the plan is unsupported. |
| BG-06 PartsMatch | Canonical model confirmation, curated compatibility and ambiguity guards; native text/vision adapter contracts. | Fixture label identification uses exact known-image hashes. Live readable-label OCR accuracy and arbitrary real-device coverage are unverified or unsupported. |
| BG-07 RescueMyOrder | Cancellation/late-order choices, buyer-selected remedies, linked merchant-funded replacement, deadline escalation, durable refund work and provider-read reconciliation contracts. | Genuine refund/recovery acceptance. External PayPal dispute outcomes and financial adjustments are not ingested/reconciled before further remedies, despite the original reimbursement invariant. |

## Central agent gap

`src/domain/agent-plan.ts` selects one tool and restricts research to `deviceFamily: "m2air"` and two model IDs. Its active fallback is a keyword router; model proposals are also constrained by recognized rule results. `src/server/agent-planner.ts` explicitly requests one read-only tool and has no group tool. `src/server/agent.ts` branches between research, message analysis, own-order inspection and support drafting rather than composing the complete lifecycle.

`src/domain/research.ts` contains two M2 Air models, two manufacturer adapters and one simulated bundle. The 40 products generated in `src/domain/catalog.ts` are engineering sample variants. There is no general manufacturer ingestion, online product retrieval or live inventory connection. The original bounded test catalog exists; the later requirement for naturally requested real devices is only narrowly met.

“Find a charger for my MacBook M1 and use grouping to reduce the cost” is not an accepted current capability. It requires identifying both goals, material model clarification, verified compatible products, actual eligible group offers, full costs/terms and separate approval for commitments/payment. A keyword patch for M1 would not supply those capabilities. Discounts and group partners must never be invented.

## Original release gates

| Gate | Evidence boundary and status |
| --- | --- |
| Money/access invariants | Executed fixture/contract/database/browser checks cover specified unauthorized, duplicate and ownership scenarios. Genuine financial completion remains open. |
| Compatibility/label extraction | Curated incompatible pairs and ambiguity guards are tested. Required ≥95% model extraction on readable held-out fixtures has not been established by actual OCR/model execution; exact-image hash lookup is not OCR. |
| Scam metrics | Frozen synthetic records pass fixture expectations. Independent live-model performance, generalization and variability are not established. |
| Claim agreement with human labels | Not accepted. Physical-evidence manifest contains only a header; independent labels and the required agreement/confusion matrix are absent. |
| Grounding | Reviewed static product evidence and source validation exist. Broad catalog grounding and physical damage/parcel-content claims are not established. |
| Genuine PayPal | OAuth/create/retrieve recorded. Actual buyer approval, capture, refund and corresponding genuine verified webhooks remain open. The smoke script records these as not tested. |
| Hosted critical journeys | Deployed fixture journeys and observed restart persistence pass. Genuine-provider journeys and independent engineer acceptance are incomplete. |
| Recovery | Fixture/mocked outages, interruptions, duplicates, truthful failures and restore checks recorded. Genuine provider recovery and automatic release rollback acceptance are not established. |
| Usability | Not accepted. Five independent tester records are absent; the results CSV contains only a header. |
| Responsiveness | A recorded ten-session read workload exists for an earlier release. It is not sustained workload, model-latency or physical-device acceptance. |

## Supporting delivery and execution evidence

Next.js/TypeScript UI/API, PostgreSQL persistence, worker jobs, private storage, carrier simulator, restricted engineering scenarios, API contracts, Docker/production CI, EC2 release and backup/restore procedures exist. The existing-instance/disk deployment is the owner's authorized replacement for the originally proposed hosting/storage setup. Permanent Systems Manager access is prepared but not configured.

During this audit, local and public `/api/health` returned `ready` for application `2c9b845d10bfbb6707def137e66c5a4e0bddedb7`. This confirms availability/build identity, not feature or provider acceptance. Prior recorded execution includes 182 unit/contract/database tests, 32 production browser journeys, 107 deterministic scenarios, 300 frozen synthetic records, 180 mocked native-adapter checks, 200 seeded workflow traces and 47 hosted fixture checks. Suites were reviewed, not rerun for this documentation audit. Counts are not proof of general intelligence or completed release gates.

## Remaining milestones in scope

1. Connect the seven services through a composable conversational planner: retained goals/preferences, material clarification, actual tool results, group offer discovery and approval-bound actions. Keep financial/customer-policy authority in server code.
2. Expand reviewed real product/device evidence and controlled retrieval with source dates, completeness and unknown-model handling. Preserve reliable engineering fixtures without presenting them as real inventory.
3. Complete preference weighting, merchant group policy configuration and external dispute-adjustment reconciliation. Close evidence report/media differences or obtain an explicit scope revision rather than marking them complete.
4. Validate unseen paraphrases, reordered follow-ups, combined shopping/group requests, conflicting preferences, unavailable deals and outages through the same UI/tools. Mock transport verifies contracts; semantic accuracy needs live evaluation when no-spend quota is available.
5. Complete genuine sandbox approval/capture/refund/webhooks and provider recovery, staged physical evidence, human labels and five-person acceptance. No billing or spend is authorized by this audit.

Each milestone requires working UI/API, meaningful executed tests, recorded limitations, a commit and release verification. A blocked external gate does not justify abandoning independent implementation work, and passed fixture tests do not close external gates.

## Evidence locations

- Original baseline: `git show 68f6740:MASTER_PLAN.md`; current `MASTER_PLAN.md` sections 1–15.
- Agent/planner/data: `src/domain/agent-plan.ts`, `src/server/agent-planner.ts`, `src/server/agent.ts`, `src/domain/catalog.ts`, `src/domain/research.ts`.
- Guards/groups/remedies: `src/domain/guard.ts`, `src/server/service.ts`, `src/server/order-options.ts`, `src/server/recovery.ts`.
- Evidence/vision: `src/domain/claims.ts`, `src/server/provenance.ts`, `src/server/case-report.ts`, `src/server/ai.ts`, `src/server/identification.ts`.
- Tests: `tests/agent-research.test.ts`, `tests/service.test.ts`, `tests/policy.test.ts`, `tests/recovery.test.ts`, `tests/refunds.test.ts`, `tests/provenance.test.ts`, `tests/return-shipping.test.ts`, `e2e/journey.spec.ts`.
- Provider boundary: `scripts/verify-paypal.ts`, `docs/VALIDATION.md`, `docs/PRODUCT_EVIDENCE.md`.
- Unexecuted acceptance: `docs/ACCEPTANCE.md`, `docs/acceptance-results.csv`, `docs/physical-evidence-manifest.csv`.
