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
| `group_partial` | Another synthetic participant declines payment; the customer's locked 10% discount remains available |

To reset, sign in as reviewer for a designated fixture workspace and choose Archive fixture and start fresh. The old workspace is retained with financial and evidence history, becomes read-only, and a new workspace receives the new shopper session. Normal provider workspaces cannot be reset. An unverified webhook cannot act as a fixture or impersonate PayPal.

## Repeatable checks

Run `npm run check`, `npm run eval`, `npm run build`, and `npm run test:e2e`. Fixture fault tests deliberately block all outbound provider calls and verify that isolation is preserved.

`npm run verify:hosted` checks the public production endpoint and records an unapproved sandbox order plus the current server instance. Restart the app service, then run `npm run verify:restart`; it requires a different instance ID and the original session/order. It does not establish a disaster restore.

For real PostgreSQL queue claims, forward a private local port over SSH to the existing host's localhost:5432, then run `npm run verify:queue` with `DATABASE_TUNNEL_PORT` if changing the default 3112. The script reads database configuration from the ignored deployment environment, claims only its own validation workspace, checks concurrent leases/crash recovery, and removes only its own non-financial validation rows. Never expose PostgreSQL publicly.

Failed or old ambiguous refunds need a reviewer to inspect the original operation and provider reference in PayPal before attempting any external remedy. Recreating an operation to bypass the original state is prohibited. Dead-letter jobs retain their reference; a retry alone does not authorize money movement.

For an issue, record build commit, requirement/scenario ID, adapter modes, workspace ID, expected/observed result, timestamp, and redacted screenshot/trace. Do not include access codes, session cookies, API keys, buyer passwords, or original customer media in a public issue.
