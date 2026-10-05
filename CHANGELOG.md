# Change log

Each implementation milestone records behavior, validation, and remaining limitations. Git commits provide the corresponding source history.

## 2026-10-06 — Submission provenance and private case reports

- Added optional single-use capture codes bound to the authenticated party, order/case, checkpoint, and ten-minute expiry. Upload origin and challenge linkage are described without claiming verified capture timing or physical truth.
- Added submission timestamps, same-case repeated-file cues, analysis versions, and private JSON case exports separating submitted records, analysis, transaction state, and scoped audit. Export checks original-file integrity and reports unavailable/tampered files.
- New photo submissions keep notes and identifiers in multipart bodies rather than URLs. Ownership, state, and challenge validation precede storage writes under the workspace lock.
- Validation: 86 unit/contract/database tests and all six browser journeys pass, including challenge-linked upload and private report retrieval. Hosted verification is a separate deployment step; physical captures remain pending.

## 2026-10-06 — Container execution gate

- Added a clean, private fixture environment generator, configurable Compose environment/port, app readiness, and worker startup after database-backed readiness.
- Added a Linux CI job that builds and starts the actual app/worker/PostgreSQL containers and runs all browser journeys against the containerized production server.
- Browser journeys can target an external test URL without launching a development server. Container fixtures contain no PayPal or AI credentials.
- Validation: Compose configuration and TypeScript checks pass locally. Linux CI run 37361750645 successfully built and started app/worker/PostgreSQL containers and passed all six production-server browser journeys.

## 2026-10-06 — Isolated engineer scenarios

- Added seven reviewer-created fixture scenarios: fresh shopping, delivered returns, identifier conflicts, seller silence, rejected refunds, interrupted refunds, and partial group payment.
- Persisted workspace adapter modes and bound new quotes to their payment provider. A fixture scenario on the live/sandbox host makes no provider calls, and changing global configuration cannot relabel an existing order's provider.
- Restricted reset to designated fixture workspaces. Reset archives the old workspace and preserves its financial/evidence audit, then creates a separate replacement workspace.
- Validation: 81 unit/contract/database tests pass; five existing browser journeys and the new failed-refund/archive journey pass. Queue concurrency and lease recovery also pass against hosted PostgreSQL; session/order persistence passes after an observed service instance change.
- Live AI availability: the newest check receives HTTP 429 after bounded retries. Earlier direct text/vision smoke checks passed; current availability and the larger evaluation remain pending quota restoration. The owner requested no billing or AI spend, so hosted analysis uses labeled fixtures until usable no-spend quota returns.

## 2026-10-06 — Durable recovery jobs and truthful refund status

- Replaced blanket job completion with PostgreSQL row-lock claims, five-minute leases, bounded retries, six-attempt dead letters, and ownership-checked acknowledgments. Capture reconciliation and authorized refunds receive transactional outbox jobs.
- Serialized startup migrations between app and worker. Added restricted operator heartbeat/backlog visibility, and kept failed work isolated from unrelated jobs.
- Added explicit processing/completed/failed/unknown refund details and references. Provider amount, currency, capture, and refund reference must match the authorized remedy; failed refunds remain open for human reconciliation.
- Validation: 72 unit/contract/database tests and five Chromium journeys pass. Added a separate production-PostgreSQL concurrency/recovery verifier and a restart verifier that requires an observed server instance change. Real PayPal refund and webhook delivery remain unverified.

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
- Validation: 62 unit/contract/database tests, five Chromium journeys, production build, and GitHub CI pass. Deployed commit db70824 passes 12 hosted API checks, including changed-brief approval rejection. PayPal USD approval remains externally blocked.

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
