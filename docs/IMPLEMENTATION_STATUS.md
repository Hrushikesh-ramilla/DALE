# Plan coverage and remaining work

Updated 6 October 2026. A row marked partial is not a completed release gate. The master plan's acceptance targets remain unchanged except for the user's selection of existing EC2 hosting instead of Render.

| Requirement | Current behavior and executed evidence | Remaining milestone |
| --- | --- | --- |
| BG01 approval guard | Exact payee/amount/item/currency, expiry, private sessions, duplicate money operation tests; saved brief versions invalidate unpaid approvals | Hosted changed-brief check; actual approved sandbox payment |
| BG02 group buying | Two-buyer locked discount, stock reservations, private purchases, repeat and concurrent checkout tests | Leave/finalize/partial-failure browser coverage and randomized traces |
| BG03 scam analysis | Rule fallback, direct Gemini smoke check, coercion and benign-message tests | Frozen held-out corpus, obfuscation/multi-turn coverage, recall and false-warning counts |
| BG04 buyer advocate | Compatibility/budget constraints, sponsorship-independent ranking, explicit price/feature priority, source labels and persisted brief | Bounded conversation/clarification, source-grounded comparison, held-out assertion review |
| BG05 claims evidence | Four authorized checkpoints, original bytes, private retrieval, hashes, conflict review, customer-selected remedy | Capture challenges/provenance, return authorization and receipt lifecycle, exportable case report, hosted photo restart check |
| BG06 parts match | Curated compatibility for 40 synthetic products, unknown model produces no guesses | Canonical model extraction/OCR, contradictions, held-out readable fixtures |
| BG07 recovery | Durable operations; provider-read capture recovery, authorized refund recovery, deadline escalation, appeal and replacement tests | Leased durable jobs/backoff/dead letters, truthful failed-refund UI, cancellation/late-order choice, operational visibility |
| Financial integration | Actual sandbox OAuth/create/retrieve, registered webhook endpoint, forged-event rejection | USD-capable merchant approval, capture, refund, corresponding genuine verified webhook receipts |
| Engineer delivery | Public HTTPS, production PostgreSQL, systemd restart persistence, CI and native release packaging | Restricted isolated fixture scenarios/reset, OpenAPI, scenario manifest/seed, backup/restore, container execution, 10-session performance report |
| Evaluation | 107 deterministic scenarios; direct Gemini text/vision smoke checks | 300 frozen held-out cases; repeated live subset; 200 seeded workflow traces; staged physical evidence; five independent human testers |

Dependency policy: the merchant configuration blocks only real PayPal approval/capture/refund/webhook validation. It does not block fixture workflows, recovery, evidence, documentation, evaluations, or deployment checks. A successful fixture result must never relabel a sandbox transaction or count as genuine provider completion.

Each next milestone must have working UI/API where applicable, meaningful repeatable tests, a changelog entry, its own commit, and hosted verification. `docs/VALIDATION.md` records achieved results separately from these remaining requirements.
