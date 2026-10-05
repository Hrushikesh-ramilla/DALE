# Engineer verification

The hosted demo is https://16.4.25.181.sslip.io. Access codes are in the owner's ignored `.data/deploy/access-codes.txt`; credentials are never included in reports or screenshots. Each shopper starts a separate workspace unless entering a group invitation. Use separate browser profiles for shoppers and seller/reviewer roles. A buyer's Environment details shows the workspace ID required for operator login.

## Provider and fixture workspaces

Normal hosted workspaces use PayPal sandbox. AI runs labeled fixtures while direct Gemini quota is unavailable, following the owner's no-spend instruction; the native adapter remains implemented and contract-tested. A successful fixture workflow is separate evidence; it cannot establish real provider completion. Current PayPal approval is blocked because the merchant rejects USD. The most recent Gemini request returned HTTP 429. Live verification will resume only when usable no-spend quota is available.

Sign in as reviewer, open Environment details, select Engineering scenario, and choose Open new fixture scenario as shopper. This changes the current profile into a new isolated synthetic shopper session. Record its workspace ID, then use another profile to sign in as seller or reviewer for that workspace. Both payment and analysis adapters in that workspace remain fixture mode even on the sandbox/live host.

| Scenario ID | Expected behavior |
| --- | --- |
| `fresh` | Empty shopper workspace; complete the usual explicit approval, order, and return flows |
| `delivered` | One synthetic delivered order; customer can open a refund or replacement request and upload original evidence |
| `identifier_conflict` | Conflicting return identifiers; claim remains open for human review, without accusing the customer |
| `seller_silence` | Synthetic response deadline advanced; one human-review escalation with no automatic refund or denial |
| `refund_failure` | Refund failed, zero refunded balance, visible provider fixture reference and human-review next step |
| `refund_timeout` | Authorized refund initially has an unknown outcome; worker recovers using the same operation, with one refund total |
| `canceled_order` | Seller cancellation leaves the captured payment recorded and offers customer-selected refund/replacement |
| `late_order` | Simulated clock passes the delivery promise; one help event, with no automatic money movement |
| `group_partial` | Another synthetic participant declines payment; the customer's locked 10% discount remains available |

To reset, sign in as reviewer for a designated fixture workspace and choose Archive fixture and start fresh. The old workspace is retained with financial and evidence history, becomes read-only, and a new workspace receives the new shopper session. Normal provider workspaces cannot be reset. An unverified webhook cannot act as a fixture or impersonate PayPal.

## Repeatable checks

Run `npm run check`, `npm run eval`, `npm run build`, and `npm run test:e2e`. Fixture fault tests deliberately block all outbound provider calls and verify that isolation is preserved.

`npm run verify:hosted` checks the public production endpoint and records an unapproved sandbox order plus the current server instance. Restart the app service, then run `npm run verify:restart`; it requires a different instance ID and the original session/order. It does not establish a disaster restore.

For the no-spend fixture workflow, run `npm run verify:scenarios` to save a protected session/order/original-photo baseline, then `npm run prepare:restart` to include a saved brief/private conversation. Actually restart app/worker or run the documented backup rehearsal, then `npm run verify:restart`. This compares the changed instance and all baseline records; a simple reload is insufficient.

For real PostgreSQL queue claims, forward a private local port over SSH to the existing host's localhost:5432, then run `npm run verify:queue` with `DATABASE_TUNNEL_PORT` if changing the default 3112. The script reads database configuration from the ignored deployment environment, claims only its own validation workspace, checks concurrent leases/crash recovery, and removes only its own non-financial validation rows. Never expose PostgreSQL publicly.

Failed or old ambiguous refunds need a reviewer to inspect the original operation and provider reference in PayPal before attempting any external remedy. Recreating an operation to bypass the original state is prohibited. Dead-letter jobs retain their reference; a retry alone does not authorize money movement.

For an issue, record build commit, requirement/scenario ID, adapter modes, workspace ID, expected/observed result, timestamp, and redacted screenshot/trace. Do not include access codes, session cookies, API keys, buyer passwords, or original customer media in a public issue.

## Evidence and case reports

In an evidence form, optionally request a capture code, include it with the item and its identifier in a photo, and submit within ten minutes. The code is single-use and bound to that account, checkpoint, and case/order. Changing the checkpoint clears the form's code. A code links an upload to a challenge; visibility in the image, capture timing, parcel contents, and honesty are not established. Plain descriptions and ordinary uploads remain available.

Download private case report from an owned support case. It separates submitted identifiers/descriptions and provenance from model analysis and financial records, verifies original bytes at export, and includes only the case/order's audit references. Repeated images are a review cue, never an automatic denial. Missing or mismatched original files are reported rather than described as intact.

`npm run verify:scenarios` tests all nine isolated scenarios against public HTTPS without contacting AI or moving real sandbox money. It also exercises a browser, challenge-linked multipart photo, private report, and cross-customer denial. It saves a protected photo/session/order baseline. After actually restarting the app, `npm run verify:restart` checks the changed server instance and original image hash alongside session/order persistence.

## Prepaid returns and exceptions

A reviewer can select a merchant-paid return in the remedy form and record a demo prepaid label reference plus policy reason. The shopper records the handoff reference, and seller staff record matching receipt in a separate profile. Only after receipt can the reviewer process the requested remedy; customer return shipping cost stays zero. These are simulated carrier records, not a purchased label or confirmed physical parcel.

A reviewer can instead approve a no-return remedy with a recorded reason, including a customer-benefit exception while receipt is pending. Prior arrangements remain in the private case report. Recorded delivery within 30 days meets the demo merchant window; missing timing or a late request goes to review without automatic denial. The 24-hour merchant remedy target starts at return receipt or waiver, triggers one human follow-up if missed, and is distinct from provider settlement timing.

## Canceled and late orders

Seller staff can record an inventory/fulfillment cancellation with a reason. Captured payment state remains visible until an approved refund actually completes. An unpaid order is canceled without capture; an unresolved capture is reconciled first. Shoppers can open support and change between refund/replacement before execution. An executed remedy requires human review before changing it, preventing duplicate reimbursement.

New purchase reviews include a delivery promise and merchant policy version bound to the quote. Passing the delivery promise without recorded delivery offers help once; it does not automatically purchase another item or refund without authority. Use `late_order` to test the clock transition and `canceled_order` for the seller-cancellation flow. Replacement fulfillment carries no additional customer charge.

## API, fixture seeds, traces, and request budgets

The public `/api/openapi` document describes typed actions, private evidence/report access, role requirements, and provider webhook verification. Regenerate `docs/openapi.json` with `npm run docs:api` after changing shared schemas. Mutations require the configured Origin and session. Per-actor minute budgets are 120 actions, 20 uploads, 10 shopping analyses, and 20 engineering scenario requests; exhaustion returns 429 and Retry-After, without authorizing any work.

`npm run db:seed` creates nine designated fixture workspaces in the configured local database; append one scenario ID to seed a single case. It blocks every outbound provider call. The owner-only `.data/deploy/seed-manifest.json` contains IDs and private shopper tokens for browser/API automation; never publish it. Use the web scenario controls for normal manual testing so the correct shopper cookie is set automatically. Seeds do not reset existing data or provider history.

`npm run test:integration` executes 200 traces with replay seeds starting at 730100, 25 traces per fault profile. Set TRACE_SEED to replay a different deterministic sequence. The ignored workflow-traces report records seed/actions, expected invariants, observed counts, commit, environment, and failures. CI preserves this sanitized report. No provider request is permitted in that runner.

`npm run verify:performance` creates ten distinct hosted shopper sessions and measures ten waves of authenticated session reads. Server-Timing reports application duration including response serialization; network-inclusive duration is recorded separately. This establishes the measured endpoint workload, not sustained production capacity or AI latency.

`npm run eval` checks the original 107 regressions and 300 hashed release records. `npm run eval:models` defaults to mocked native transport and executes the preregistered 60-case subset three times. It makes no network request in mock mode. A separate 20-image manifest covers owned release label graphics, not real photographs. Live mode requires both EVAL_PROVIDER_MODE=live and AI_FREE_QUOTA_CONFIRMED=true; do not enable billing. Record any failure without altering frozen labels or tuning on the final holdout. See [ACCEPTANCE.md](ACCEPTANCE.md) for human and physical gates.

## Clarification, comparison and device labels

Enter a device or budget in Anything else that conflicts with the selected controls. Find my match asks for confirmation and returns no purchase candidates until the shopper explicitly confirms the selected constraints or corrects them. Unresolved clarification also blocks direct quote requests. Your shopping conversation retains the last 20 private turns; an invited buyer receives their own history. Compare catalog facts shows specifications and source IDs; unsupported provider prose is not displayed as a product assertion.

Identify device from label accepts a private PNG/JPEG/WebP up to 4 MiB without retaining the uploaded image. Fixture mode recognizes only the exact six synthetic fixtures in `fixtures/device-labels`; label-1 through label-4 name known devices, label-5 is unreadable, and label-6 is contradictory. Use the proposed model explicitly, then Find my match to save it and renew older approvals. Native vision output is schema-validated but still requires confirmation. This fixture workflow and mocked native extraction do not measure live OCR accuracy. `npm run verify:shopping` checks clarification, quote rejection, confirmation, comparison, label ambiguity, conversation privacy, mobile layout and the public API contract.
