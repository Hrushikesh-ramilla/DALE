# Validation status

The implementation currently passes 62 unit, provider-contract, and embedded PostgreSQL integration tests, five Chromium browser journeys, and 107 deterministic evaluation scenarios. The previous deployed production build and GitHub CI pass; each new milestone is built and checked before deployment. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for remaining master-plan gates.

| Capability | Executable evidence | Limit |
| --- | --- | --- |
| Compatibility, ranking, spending guard | `tests/policy.test.ts`, `tests/money.test.ts`, `npm run eval` | Synthetic catalog; curated compatibility only |
| Group pricing and private checkout | Service concurrency tests and two-browser journey | Inventory is isolated per demo workspace; no cross-merchant pool |
| Customer approval and payment safety | Forged approval, modified payee, duplicate capture/refund tests | Real sandbox buyer approval/capture/refund still pending |
| Returns, replacements, appeals | Service integration and purchase-to-refund browser journey | No carrier pickup integration; replacement shipping simulated |
| Both-party evidence | Checkpoint authorization, hash/tamper/type checks, identifier conflicts | Hashes prove file integrity, not physical contents or damage timing |
| Recovery | Persisted refund interruption, completed capture reconciliation, deadline and expiry tests | Single polling worker; old ambiguous refunds require manual provider reconciliation |
| Gemini text and vision | `npm run verify:ai` passed three direct native API smoke checks | No held-out model accuracy claim |
| PayPal adapter | `npm run verify:paypal` passed OAuth/create/retrieve against sandbox | Actual webhook delivery and financial completion pending |
| Restart persistence | `npm run verify:restart` passes after deployment restarted the services | Session and unapproved order persistence; no disaster restore claim |
| EC2 production deployment | Public HTTPS health and 11 hosted API checks pass, including PostgreSQL, secure cookies, CSRF rejection, direct Gemini, group pricing, sandbox order creation, and order privacy | Unapproved sandbox orders; financial completion remains a separate check |

Fixture and mocked provider tests are labeled separately from live checks. Raw reports live in ignored `.data/reports`; no credentials belong in test artifacts or Git history.

Before a demo release: test the hosted production database, persistent evidence across a restart, sandbox approval/capture/refund, and actual signed webhook delivery. Production database access, HTTPS, browser access, session/order restart persistence, and rejection of forged events have passed. Before real commerce: replace demo identity with individual accounts, add global inventory, carrier integration, durable off-instance backups, policy eligibility controls, operational monitoring, and an independent security review.
