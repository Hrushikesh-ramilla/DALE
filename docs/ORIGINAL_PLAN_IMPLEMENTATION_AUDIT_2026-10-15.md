# Original-plan implementation audit — 15 October 2026

This is a read-only implementation assessment of the current working tree against the original seven-feature plan and the owner's requirement that functionality have repeatable evidence. It does not change application code, provider configuration, customer data or deployment. Historical percentages and release receipts are not certification of the current expanded catalog/build.

## Verdict

All seven original concepts have implementation paths. The strongest engineering is in financial authorization, stateful group purchases, evidence/case permissions and order recovery. These are meaningful backend/full-stack foundations. They do not establish production qualification of the complete shopper agent. The generality and measured quality of the AI, catalog truth, current end-to-end acceptance and research provenance remain incomplete or insufficiently verified.

There is no defensible single engineering-completion percentage from this audit. A feature's existence, a passing mocked test, historical live acceptance, current release acceptance and operational production readiness are different claims. The original managed-storefront scope is also substantially narrower than the later multi-category marketplace scope.

## Feature coverage

| Original feature | What exists in code | Assessment and practical limit |
| --- | --- | --- |
| AgentGuard | Server-owned quote fingerprint, approval/ownership checks, captured/refunded balance constraints, payment adapters and reconciliation. See `src/domain/guard.ts`, `src/server/payments.ts`, `src/server/service.ts`, `src/server/provider-adjustments.ts`. | Strong engineering foundation. Deterministic financial authorization is appropriate; an LLM should not replace it. This audit does not certify production-money operation. |
| BuyTogether | Database-backed discovery/commitments, merchant policy versions and discount terms, individual checkout, reservations and failure handling. See `src/domain/group-policy.ts`, `src/server/agent-groups.ts`, `src/server/customers.ts`. | Functional bounded group buying. It uses merchant-configured same-product terms; it is not a demonstrated learned negotiation or general collective-optimization algorithm. |
| ScamPause | Normalized text/rule warnings plus advisory model integration. See `src/domain/scams.ts`, `src/server/ai.ts`. | Partial intelligence/qualification. Rules are a useful fallback, not evidence of a research-grade fraud detector. The retained self-hosted evaluation failed its benign-warning gate. |
| Buyer's Advocate | Persistent brief, constrained eligibility, shopper weights, sponsorship separation, grounded comparison schema and tool receipts. See `src/server/agent.ts`, `src/server/agent-planner.ts`, `src/domain/research.ts`. | Implemented but bounded. Server ranking owns the recommendation, while the model proposes bounded goals/explanations. Incorrect or weakly verified catalog identities/media prevent dependable comparisons across the expanded assortment. |
| ReturnShield / evidence-backed returns | Four checkpoints, private originals, integrity checks, source-linked propositions, role restrictions, optional human-reviewed video, remedies and appeal. See `src/server/provenance.ts`, `src/server/case-report.ts`, `src/domain/claims.ts`. | Strong case-management foundation, limited physical inference. Hashes verify bytes, not the truth of a scene. Automatic determination of honesty, damage causation or fraud is not established and should not be claimed. |
| PartsMatch | Reviewed device registry, charging/cable constraints, device-label suggestions with confirmation and bounded source retrieval. See `src/domain/device-registry.ts`, `src/domain/research.ts`, `src/server/identification.ts`, `src/server/manufacturer-retrieval.ts`. | Narrow implementation. This does not establish compatibility coverage or arbitrary-device identification across thousands of catalog products. |
| RescueMyOrder | Late/cancelled order paths, replacement options, remedy permissions, recoverable background jobs and provider adjustments. See `src/server/recovery.ts`, `src/server/jobs.ts`, `src/server/order-options.ts`, `src/server/return-shipping.ts`. | Strong workflow foundation within its stated scope. Return shipping uses simulated carrier events; full commercial logistics/fulfilment is not established. |

## Checks executed for this assessment

- `npm run typecheck`: passed, exit code 0.
- Focused Vitest run across 14 core files: 148 passed, 1 failed, 149 total; 13 files passed and 1 failed. Files cover policy, scams, service, groups, composable planning, evidence reports, recovery, refunds, provider adjustments, provenance, customers, research, vision and retail.
- The failure is `tests/retail.test.ts:115`: catalog total expected 142, received 5655. The test is stale relative to expansion. This alone does not establish a broken query, but the current quality gate is not green.
- Current local `/api/health` returned ready. Health readiness does not prove feature correctness, model qualification or production capacity.
- This audit did not run a fresh full browser suite, live model benchmark, external PayPal verification, hosted deployment check, security assessment or workload test.

## What the retained evidence actually establishes

- `docs/evaluations/self-hosted-v3-9d3a7e7.json` is a completed, failed self-hosted holdout: 151/180. Semantic goals: 45/60; readable OCR: 51/54; benign warning checks: 7/18. This is historical evidence for that configuration, not a measurement of a fresh model. It does not qualify the owner's requested self-hosted runtime.
- `.data/reports/mock-model-evaluation.json` records 180 passes with mode explicitly `mock native Gemini transport; no network/spend` and model `gemini-contract-fixture`. These are adapter/contract checks, not live model accuracy. They cannot close held-out native-model qualification.
- `.data/reports/ai-integration.json` contains three passing live smoke checks and explicitly says they do not establish held-out accuracy or real-world fraud detection.
- `.data/reports/live-agent-acceptance.json` contains 20 passing checks over five model runs and explicitly says this small set is not a held-out semantic benchmark or speech/vision verification.
- Historical PayPal capture/refund/receipt reports exist with passing recorded checks. They were inspected as local evidence, not reauthenticated with the provider during this audit. Existing sandbox evidence should be preserved, but it is not a current production-money certificate.
- All five originals referenced in `docs/physical-evidence-manifest.csv` exist and match their listed hashes. This establishes file integrity against the manifest. It does not independently establish physical-capture provenance, real-world accuracy or independence of human reviewers. Human acceptance rows also exist; the independent sessions were not authenticated in this audit.
- The latest separate image audit found 14 concrete product/image contradictions and 45 local API records with omitted media bindings. See `.data/image-verification-2026-10-15-recheck-3/recheck-results.json` and `runtime-missing-media.json`. Those are specific observed findings, not certification of every other model/variant.

## Research-method provenance

The supplied original conversation identifies seven research-inspired ideas but does not recover the exact paper titles, versions, datasets and method links for each idea. `docs/LIVE_INTEGRATION.md` explicitly documents this gap. The repository does not currently provide a complete paper-to-method-to-code-to-benchmark mapping for the seven capabilities.

It is therefore not supportable to claim faithful replication of seven research implementations. The current artifacts demonstrate original application engineering and bounded agent/workflow adaptations. In particular, configured group discounts are not a reproduced learned negotiation algorithm, advisory rule warnings are not a trained fraud classifier, and SHA-256 evidence handling is not physical-truth verification or C2PA conformity.

For each future research-reproduction claim, retain the exact paper/version, licensed implementation if any, implemented method, deviations, dataset/split, baselines, metrics and reproducible results. Do not invent bibliography or infer that a conceptual similarity proves replication.

## Acceptance-document consistency

`docs/PROJECT_PROGRESS.md` claims 20/20 and 100% acceptance, including cloud Gemini qualification. Other status/evaluation files retain failed self-hosted qualification and pending gates. The same progress document also references 180 checks that the underlying report labels mocked. These documents do not currently form a consistent, current release scorecard.

Do not use an older narrow-scope completion statement or test count as whole-product production readiness. A professional release claim needs source/build/configuration identity, qualified runtime, reliable catalog data, current end-to-end evidence, target-host resource/latency measurements, and independently supported acceptance records.

## Defensible portfolio description

A customer-first commerce agent prototype with durable workflows, explicit financial authorization, multi-customer group purchases, evidence-backed case management and provider reconciliation. Its backend foundations are substantial. General agent quality, broad catalog reliability, research replication and whole-product production qualification remain work to prove, rather than completed claims.
