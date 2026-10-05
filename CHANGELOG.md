# Change log

Each implementation milestone records behavior, validation, and remaining limitations. Git commits provide the corresponding source history.

## 2026-10-05 — Reservation and interruption boundaries

- Finalized group commitments now reserve inventory during the checkout window, convert one commitment to one purchase per customer, and release unused reservations after expiry.
- Recovery now also resumes an approved refund when a crash occurred before its provider operation was created.
- Bounded vision input to four checkpoint samples to keep memory predictable on the small host. Every original stays available for human review; partial model coverage is disclosed.
- Added boundary tests and standardized source formatting with a pinned formatter. No customer funds are moved without prior customer purchase approval or reviewer remedy authorization.
- Validation: 59 tests pass, including real original-photo storage, cross-customer access rejection, stored-file tamper detection, and vision sample coverage. Four browser journeys pass with an uploaded synthetic receipt photo.

## 2026-10-06 — Versioned shopping briefs and approval renewal

- Persisted individual shopping briefs and explicit price/feature priorities. Catalog source labels explain ranking, and sponsored placement cannot improve rank.
- Changed briefs invalidate earlier unpaid quotes and cancel unpaid approvals. Confirmed payments and already-sent capture operations retain their original financial records for reconciliation.
- Added budget/device/category checks against the saved brief, browser reload coverage, cross-customer regression coverage, and a hosted build identifier. Documented remaining master-plan gates without treating partial features as complete.
- Validation: 62 unit/contract/database tests and five Chromium journeys pass. Hosted verification follows the versioned release deployment; PayPal USD approval remains externally blocked.

## 2026-10-05 — Existing-instance deployment

- Added local release packaging, a dedicated service user, private PostgreSQL, memory-limited app and recovery services, persistent private evidence, and Caddy HTTPS configuration.
- Added environment-free release archives, separate protected server configuration, and deployment/rollback instructions. Added a Docker alternative without introducing additional paid AWS resources.
- Validation: native EC2 service startup and production database health are checked separately from public HTTPS. Docker Compose configuration validates; container build/run remains unverified because the local daemon is stopped.
- Public HTTPS and 11 hosted API checks pass against production PostgreSQL, direct Gemini, sandbox PayPal order creation, and private customer sessions. Buyer approval/capture/refund and actual webhook delivery remain separate release gates.
- Published validation scope and setup instructions. Deterministic catalog/message/evidence evaluation passes 107 synthetic scenarios; this does not establish model accuracy.

## 2026-10-05 — Shopper interface and recovery

- Added responsive shopping, explicit checkout review, group invitations, order timelines, evidence uploads, and customer-selected remedies. Reviewer authorization requires a recorded policy reason.
- Added durable webhook duplicate detection, provider-read capture recovery, bounded refund recovery, expired unpaid orders/groups, and overdue seller escalation. Automated analysis cannot deny a claim.
- Added bounded model retries with exponential backoff, jitter, and Retry-After handling. Direct Gemini uses native text/image requests; compatible custom endpoints remain configurable.
- Validation: 54 unit/contract/database tests and four Chromium journeys pass, including the complete fixture purchase-to-refund journey and mobile layout. Production build passes.
- Live verification: direct Gemini shopping, scam-message, and vision smoke checks pass; PayPal sandbox authentication, order creation, and retrieval pass. PayPal buyer approval, capture, refund, and actual webhook delivery are not yet verified.

## 2026-10-05 — Persistent commerce and resolution workflows

- Added authenticated, isolated shopper workspaces; PostgreSQL persistence; approval-bound checkout; stable capture/refund operations; and individual group purchases.
- Added seller dispatch records, both-party case evidence, private image storage, customer-selected remedies, replacement fulfillment, and appeals.
- Added PayPal sandbox and configurable text/vision adapters with response validation. Live integration is not yet verified.
- Validation: 45 unit, provider-contract, and embedded PostgreSQL integration tests pass, including concurrent checkout, duplicate capture/refund, role restrictions, and cross-customer access.

## 2026-10-05 — Application scaffold

- Added the Next.js/TypeScript application, locked dependencies, environment template, and CI quality checks.
- Added strict money conversion boundaries and credential-safe repository configuration.
- Validation: TypeScript check and initial unit tests pass; runtime dependency audit has no findings. Live payment and model credentials remain unconfigured.

## 2026-10-05 — Customer policy and catalog

- Added a 40-item synthetic electronics catalog with explicit device compatibility and source references.
- Added approval fingerprints, payment mismatch checks, refund balance rules, message warnings, and evidence comparisons that preserve uncertainty.
- Validation: 24 tests pass across money, purchase policy, rankings, compatibility, scam patterns, and customer claim handling. Message rules are a deterministic fallback, not a validated learned scam detector.

## 2026-10-05 — Repository foundation

- Recorded the product plan, customer-priority policies, deployment approach, and acceptance requirements.
- Added repository documentation, MIT license, and ignore rules for credentials and generated files.
- Validation: inspected the empty repository and verified existing GitHub authentication. No application behavior exists at this milestone.
