# Independent engineer and physical-evidence acceptance

Use the hosted build at https://16.4.25.181.sslip.io. Obtain private access codes from the owner; never put them in this form or public issues. Record the actual build from `/api/health`, time, browser/device, and adapter modes. This pack is ready for testing; it is not evidence that five people have tested it.

## Five independent testers

Give at least five people separate browser profiles and isolated fixture workspaces. Do not coach the initial attempt. Record success, assistance, time, unexpected behavior and major friction in `acceptance-results.csv`; keep identities private using participant IDs. A developer replay or automated browser is not an independent human participant.

| Task | Expected visible outcome | Requirement |
| --- | --- | --- |
| Find a charger for Slate 11 within $30; compare options | Only curated compatible products within budget; source-backed facts and explicit purchase approval | BG01/BG04/BG06 |
| Put a different model/budget in the message | Clarification before candidates/approval; explicit confirmation or corrected controls required | BG04 |
| Upload readable, unknown and contradictory label fixtures | Suggestion requires confirmation; no guessing on unknown/ambiguous labels | BG06 |
| Invite a second buyer, leave before finalization, rejoin and complete a group purchase | No payment on commitment; locked 10% price; purchases remain private | BG02 |
| Open partial-group scenario and complete the remaining buyer purchase | Other participant's decline does not reprice the paid $26.10 order | BG02 |
| Paste a safety reminder, then an escalating disguised-code/payment conversation | Reminder stays low; specific warning and safer next step on the risky message | BG03 |
| Use delivered scenario, submit receipt evidence, request refund | Request remains open; originals and scoped report private; analysis separates submitted records from physical uncertainty | BG05 |
| Reviewer authorizes prepaid return, buyer records handoff, seller confirms receipt, reviewer refunds | Customer shipping cost zero; receipt/exception gate; one truthful fixture refund | BG05/BG07 |
| Inspect failed/timeout/canceled/late scenarios; choose refund over replacement | Failures remain open; timeout uses one operation; customer choice remains visible | BG07 |
| Reload, appeal and try another buyer's original/report URL | State persists; appeal route remains available; unauthorized original/report rejected | BG01/BG05 |

The owner/operator prepares fixture workspaces through Environment details. Do not perform normal sandbox payments during fixture usability tasks. The genuine PayPal gate separately requires actual sandbox approval/capture/refund and matching verified webhook receipts; fixtures do not count.

## Controlled physical evidence

Use a few inexpensive objects already available; no purchase is required. Stage five sequences: correct unchanged item, wrong lookalike, visibly damaged item, unreadable identifier, and item changed on return. Capture seller dispatch, buyer receipt, buyer return dispatch and seller return receipt where relevant. Submit originals through separate authorized profiles. Include the case-bound code if using guided capture, identifier when readable and matching parcel reference. Keep physical captures private and outside Git.

For each sequence, record an operator's setup ground truth privately, then have independent reviewers annotate the submitted evidence before seeing that setup. Label bounded observations (identifier match/conflict, visible appearance, missing facts), source IDs and supported/contradicted/insufficient claim propositions. Mark timing, causation and unseen parcel contents unresolved unless separately observed. Record disagreement and adjudication; do not infer fraud or physical truth from hashes, codes or missing media.

`physical-evidence-manifest.csv` is an empty template, not a staged-media result. Record private original paths, SHA-256, capture/checkpoint/account and proposition-level human labels there. Use the report's server integrity check as ingestion evidence, not proof the scene happened honestly. Human agreement and model agreement can be calculated only after actual independent labels exist. Keep provider evaluation disabled until no-spend quota is confirmed.

## External gate completion

1. Obtain a USD-capable sandbox merchant/buyer configuration; run an actual create/approve/capture/retrieve/refund sequence and record genuine verified webhook events.
2. Restore usable free Gemini quota without enabling billing. `EVAL_PROVIDER_MODE=live` and `AI_FREE_QUOTA_CONFIRMED=true` enable `npm run eval:models` for the fixed 60-case subset, three repetitions. Otherwise the command defaults to mock transport with no network/spend. Record model/prompt versions, latency and variability; live labels remain synthetic, not physical human truth.
3. Complete the five-person usability and staged-media exercises above. Record failures and remediation; never substitute generated labels, self-testing or automation for those human gates.

Release readiness remains partial until these gates pass. Customer-priority decisions, privacy, financial invariants, fixture journeys and recovery can be inspected now.
