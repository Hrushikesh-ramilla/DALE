# Plan coverage and remaining work

Updated 6 October 2026. A row marked partial is not a completed release gate. The master plan's acceptance targets remain unchanged except for the user's selection of existing EC2 hosting instead of Render.

| Requirement | Current behavior and executed evidence | Remaining milestone |
| --- | --- | --- |
| BG01 approval guard | Exact payee/amount/item/currency, expiry, private sessions, duplicate money operation tests; saved brief versions invalidate unpaid approvals, including hosted rejection check | Actual approved sandbox payment |
| BG02 group buying | Two-buyer locked discount, stock reservations, private purchases, repeat and concurrent checkout tests | Leave/finalize/partial-failure browser coverage and randomized traces |
| BG03 scam analysis | Rule fallback, direct Gemini smoke check, coercion and benign-message tests | Frozen held-out corpus, obfuscation/multi-turn coverage, recall and false-warning counts |
| BG04 buyer advocate | Compatibility/budget constraints, sponsorship-independent ranking, explicit priorities, private bounded conversation, conflict clarification, confirmation-bound quotes and source-grounded comparison | Frozen corpus assertion review and independent human acceptance |
| BG05 claims evidence | Four authorized checkpoints, private originals/hashes, bound capture codes, provenance/replay cues, private case report, merchant-paid return handoff/receipt, manual policy exceptions and remedy targets; unit/browser/hosted checks plus photo restart persistence pass | Staged physical captures and human-labeled claim evaluation |
| BG06 parts match | Curated compatibility, exact canonical labels, native OCR schema/ambiguity contracts and six owned synthetic label fixtures; explicit confirmation before brief changes | Live OCR accuracy and independent label review when no-spend quota is available |
| BG07 recovery | Leased durable jobs, provider-read capture recovery, authorized refunds, truthful failures, appeals/deadlines, cancellation/late-order choices and approval-bound delivery terms; hosted PostgreSQL/scenario checks and 200 traces pass; manual provider reconciliation procedure documented | Genuine sandbox refund/recovery verification |
| Financial integration | Actual sandbox OAuth/create/retrieve, registered webhook endpoint, forged-event rejection | USD-capable merchant approval, capture, refund, corresponding genuine verified webhook receipts |
| Engineer delivery | Public HTTPS/PostgreSQL, observed photo/session/order restart persistence, production containers, restricted fixtures, OpenAPI and private seeding, 200 traces and isolated backup/restore; hosted 100-read/10-session performance p95 43ms application and 206ms network inclusive | Each subsequent milestone's hosted regression and final acceptance pack |
| Evaluation | 107 deterministic scenarios and 200 replayable workflow traces; earlier direct Gemini text/vision smoke checks | 300 frozen held-out cases; repeated live subset; staged physical evidence; five independent human testers |

Dependency policy: the merchant configuration blocks only real PayPal approval/capture/refund/webhook validation. It does not block fixture workflows, recovery, evidence, documentation, evaluations, or deployment checks. A successful fixture result must never relabel a sandbox transaction or count as genuine provider completion.

Each next milestone must have working UI/API where applicable, meaningful repeatable tests, a changelog entry, its own commit, and hosted verification. `docs/VALIDATION.md` records achieved results separately from these remaining requirements.
