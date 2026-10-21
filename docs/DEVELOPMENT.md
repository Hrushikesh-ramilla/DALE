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
npx playwright test --config playwright.chat-memory.config.ts
```

Browser tests use an isolated fixture server. Live-provider scripts require explicit configuration and must be run separately. See [validation](VALIDATION.md) for the evidence boundary and known gaps.
