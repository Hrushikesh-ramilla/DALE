# Development

Use Node.js 22+ and npm. Install dependencies with `npm ci`.

## Private configuration

Create a local `.env`; configuration files containing credentials are ignored. No credential is supplied by the repository.

| Setting                | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `APP_URL`              | Local application origin, normally `http://localhost:3000`                       |
| `SESSION_SECRET`       | A private random value of at least 32 characters                                 |
| `OPERATOR_ACCESS_CODE` | Private access code for operator functions                                       |
| `PAYMENT_MODE`         | `fixture` for local simulated commerce; `sandbox` for configured PayPal testing  |
| `DATABASE_URL`         | PostgreSQL connection; omit for the supported embedded development database      |
| `LOCAL_DATA_DIR`       | Private data directory; never share a PGlite directory between running processes |

Run `npm run dev`, then open `http://localhost:3000`.

For basic customer/manual-commerce qualification without external credentials,
set `PAYMENT_MODE=fixture`, `AI_MODE=fixture`, `STORAGE_MODE=local` and use a
new private `LOCAL_DATA_DIR`. Catalog/customer state is real and persistent;
payments and fulfillment remain simulated. These flags do not supply a
conversational model. Configure the separate Gemini/embedding settings below
before expecting live conversation or visual analysis.

For a local standalone fixture build, run `npm run build`, then start
`.next/standalone/server.js` with `APP_URL` matching the chosen origin,
`SESSION_SECRET` set to a private random value, `ALLOW_EMBEDDED_DATABASE=true`,
`ALLOW_LOCAL_STORAGE=true`, the fixture settings above and a new data directory.
Wait for server readiness before making startup requests. Do not share one
embedded database directory between web and worker processes; use PostgreSQL
for a deployment with a separate persistent recovery worker (`npm run worker`).

## Gemini

For actual conversational inference, configure `CONCIERGE_PROVIDER=gemini`, `CONCIERGE_ALLOW_CLOUD=true`, `AI_API_KEY`, `AI_MODEL` and `CONCIERGE_MODEL`. The configured model must be available to the account. The application requires confirmed `AI_BILLING_DISABLED=true` and `AI_FREE_QUOTA_CONFIRMED=true`; these flags do not change the provider account's billing settings. Provider limits still apply. `AI_MODE=live` selects live analysis for the corresponding services.

Semantic catalog search additionally needs the prepared local embedding runtime, `CONCIERGE_EMBEDDING_BASE_URL`, `CONCIERGE_EMBEDDING_MODEL` and private embedding authentication. The setup, indexing and launch utilities are in `scripts`. Gemini generation does not require a local text-generation model. Voice transcription is separately configured.

For an already prepared local profile, `scripts/configure-concierge-local.mjs` and `scripts/start-concierge-local.mjs` remain available. They require their prepared private runtime files; they are not a fresh-install shortcut.

## Production artifact

`npm run build` prepares standalone output. Supply private runtime configuration when starting `.next/standalone/server.js`. Docker Compose and the generic deployment scripts are also provided. Set deployment host variables explicitly; no personal server is selected by default.

For PayPal sandbox testing, configure the merchant REST application, merchant identity and webhook settings. Use separate buyer sandbox credentials. Fixture checkout does not prove external approval or capture.

## Verification

```sh
npm run typecheck
npm test
npm run rehearse:customer
npm run verify:paypal
npm run verify:ai
npx playwright test --config playwright.chat-memory.config.ts
```

### Customer Storefront 5-Minute Timed Rehearsal

Run the automated 7-step customer rehearsal sequence covering all storefront milestones:
```sh
npm run rehearse:customer
```
This executes 3 consecutive runs verifying:
1. Shopping need and budget formulation.
2. AI retrieval and shopping decision card showing conditional group savings.
3. Incognito buyer joining a shared buying circle and unlocking group discount terms.
4. Independent buyer placing an unpaid Cash-on-Delivery (`unpaid_cod`) order.
5. Primary buyer reviewing and capturing a PayPal payment with itemized receipt breakdown.
6. Return request submission with photo evidence, bounded findings, and an awaiting merchant review timeline.
7. Verification of paid vs committed payment states and demonstrated group savings.

Results and timestamps are logged to `.data/rehearsals/customer-rehearsal-runs.json`.

Browser tests use an isolated fixture server. Live-provider scripts require explicit configuration and must be run separately. See [validation](VALIDATION.md) for the evidence boundary and known gaps.

The [M0 baseline](M0-BASELINE.md) records clean-install/build/browser evidence
and every remaining historical assertion. On a resource-constrained Windows
host, run full regression, production compilation and browser verification
sequentially. Cold catalog import is setup, separately bounded from functional
test deadlines. Do not alter assertions or suppress failures to compensate for
resource contention. Keep new temporary browser/build artifacts outside synced
folders when possible, without moving or deleting user data. The existing
`LOCAL_PREVIEW_LINK_PUBLIC=true` build option links local immutable assets for
preview; release packaging normally copies them.
