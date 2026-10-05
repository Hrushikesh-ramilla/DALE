# Validation status

The implementation currently passes 115 unit, provider-contract, and embedded PostgreSQL integration tests, nine Chromium browser journeys, 200 seeded workflow traces, and 107 deterministic evaluation scenarios. The newly expanded mobile comparison check also passes. Each milestone is built and checked before deployment. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for remaining master-plan gates.

| Capability | Executable evidence | Limit |
| --- | --- | --- |
| Compatibility, ranking, spending guard | `tests/policy.test.ts`, `tests/money.test.ts`, `npm run eval` | Synthetic catalog; curated compatibility only |
| Group pricing and private checkout | Service concurrency tests and two-browser journey | Inventory is isolated per demo workspace; no cross-merchant pool |
| Customer approval and payment safety | Forged approval, modified payee, duplicate capture/refund tests | Real sandbox buyer approval/capture/refund still pending |
| Returns, replacements, appeals | Service integration and purchase-to-refund browser journey | Merchant-paid return handoff/receipt and no-return exception tests pass; no live carrier pickup integration; replacement shipping simulated |
| Both-party evidence | Checkpoint and capture-code authorization/expiry/reuse, hash/tamper/type checks, identifier conflicts, private case exports | Hashes prove file integrity, not physical contents or damage timing |
| Recovery | Persisted refund interruption, completed capture reconciliation, deadline/expiry, leases/concurrency, retries and dead-letter tests; three claim/recovery checks pass against hosted PostgreSQL | Old ambiguous or provider-failed refunds require manual provider reconciliation |
| Gemini text and vision | Earlier `npm run verify:ai` passed three direct native API smoke checks; native request/response and retry contracts pass | Latest live check returns HTTP 429. Owner requested no AI spend; hosted analysis uses fixtures while quota is unavailable. No held-out model accuracy claim |
| Engineer scenarios | Nine isolated no-provider-call scenario tests; failed-refund/archive browser journey | 14 hosted checks pass, including all nine scenarios, private photos/reports, prepaid handoff/receipt, early-refund rejection, and one fixture refund; reset preserves the previous audit |
| Seeded workflow traces | `npm run test:integration`: 200/200 across eight fault profiles; repeated/unauthorized commands, prepaid returns, interruptions, failures, appeals, groups and replacements | Synthetic adapters; no external request is permitted |
| Backup/restore | Separate hosted scratch database/path: state hash and row counts match; three original-file hashes match. Off-instance DPAPI copy decrypts to the same archive hash | Requires the owner Windows account for local decryption; separate configuration recovery remains necessary |
| Engineering contracts/seed | Generated OpenAPI matches shared action/brief schemas; nine privately seeded scenarios; hosted OpenAPI 3.1.0 and 100 authenticated reads across ten sessions pass, p95 43.42ms application and 206.45ms network inclusive | Read-workload measurement only; no sustained capacity or model-latency claim |
| Production containers | Linux CI run 37368576177 passes checks, 200 traces, and app/worker/PostgreSQL containers with eight browser journeys at commit 37857e0 | Fixture provider adapters; subsequent changes require their own checks |
| PayPal adapter | `npm run verify:paypal` passed OAuth/create/retrieve against sandbox | Actual webhook delivery and financial completion pending |
| Restart persistence | `npm run verify:restart` passes after deployment restarted the services | Session/order and private original photo SHA-256 survived an observed restart on d0b9ed1; no disaster restore claim |
| EC2 production deployment | Public HTTPS health and 12 hosted API checks pass, including PostgreSQL, secure cookies, CSRF rejection, direct Gemini, changed-brief approval renewal, group pricing, sandbox order creation, and order privacy | Unapproved sandbox orders; financial completion remains a separate check |

Fixture and mocked provider tests are labeled separately from live checks. Raw reports live in ignored `.data/reports`; no credentials belong in test artifacts or Git history.

Before a demo release: test the hosted production database, persistent evidence across a restart, sandbox approval/capture/refund, and actual signed webhook delivery. Production database access, HTTPS, browser access, session/order restart persistence, and rejection of forged events have passed. Before real commerce: replace demo identity with individual accounts, add global inventory, carrier integration, durable off-instance backups, policy eligibility controls, operational monitoring, and an independent security review.
