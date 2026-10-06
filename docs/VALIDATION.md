# Validation status

The implementation currently passes 81 unit, provider-contract, and embedded PostgreSQL integration tests, six Chromium browser journeys, and 107 deterministic evaluation scenarios. Each new milestone is built and checked before deployment. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for remaining master-plan gates.

| Capability | Executable evidence | Limit |
| --- | --- | --- |
| Compatibility, ranking, spending guard | `tests/policy.test.ts`, `tests/money.test.ts`, `npm run eval` | Synthetic catalog; curated compatibility only |
| Group pricing and private checkout | Service concurrency tests and two-browser journey | Inventory is isolated per demo workspace; no cross-merchant pool |
| Customer approval and payment safety | Forged approval, modified payee, duplicate capture/refund tests | Real sandbox buyer approval/capture/refund still pending |
| Returns, replacements, appeals | Service integration and purchase-to-refund browser journey | No carrier pickup integration; replacement shipping simulated |
| Both-party evidence | Checkpoint authorization, hash/tamper/type checks, identifier conflicts | Hashes prove file integrity, not physical contents or damage timing |
| Recovery | Persisted refund interruption, completed capture reconciliation, deadline/expiry, leases/concurrency, retries and dead-letter tests; three claim/recovery checks pass against hosted PostgreSQL | Old ambiguous or provider-failed refunds require manual provider reconciliation |
| Gemini text and vision | Earlier `npm run verify:ai` passed three direct native API smoke checks; native request/response and retry contracts pass | Latest live check returns HTTP 429. Owner requested no AI spend; hosted analysis uses fixtures while quota is unavailable. No held-out model accuracy claim |
| Engineer scenarios | Seven isolated no-provider-call scenario tests; failed-refund/archive browser journey | Hosted scenario verification follows deployment; reset preserves the previous audit |
| PayPal adapter | `npm run verify:paypal` passed OAuth/create/retrieve against sandbox | Actual webhook delivery and financial completion pending |
| Restart persistence | `npm run verify:restart` passes after deployment restarted the services | Session and unapproved order persistence; no disaster restore claim |
| EC2 production deployment | Public HTTPS health and 12 hosted API checks pass, including PostgreSQL, secure cookies, CSRF rejection, direct Gemini, changed-brief approval renewal, group pricing, sandbox order creation, and order privacy | Unapproved sandbox orders; financial completion remains a separate check |

Fixture and mocked provider tests are labeled separately from live checks. Raw reports live in ignored `.data/reports`; no credentials belong in test artifacts or Git history.

Before a demo release: test the hosted production database, persistent evidence across a restart, sandbox approval/capture/refund, and actual signed webhook delivery. Production database access, HTTPS, browser access, session/order restart persistence, and rejection of forged events have passed. Before real commerce: replace demo identity with individual accounts, add global inventory, carrier integration, durable off-instance backups, policy eligibility controls, operational monitoring, and an independent security review.
