# BuyerGuard

Customer-first shopping, safe checkout, group discounts, and evidence-backed order resolution.

## Development

Requires Node.js 22 or newer. Install locked dependencies with `npm ci`, copy `.env.example` to `.env`, then run `npm run dev`. Local development creates an ignored embedded PostgreSQL database in `.data`. Set a private `OPERATOR_ACCESS_CODE` to test seller and reviewer roles in separate browser profiles.

Run `npm run check`, `npm run test:integration`, `npm run eval`, `npm run build`, and `npm run test:e2e`. Install the browser once with `npx playwright install chromium`. CI runs static checks, unit/integration tests, production build, and browser journeys.

`npm run eval:models` runs the preregistered repeated subset through mocked native Gemini transport by default, without network or spend. Frozen synthetic corpus results and live accuracy are reported separately. [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) provides independent usability and physical-evidence tasks with empty recording templates.

Payments and analysis default to explicitly labeled fixtures. For real provider checks, configure the ignored `.env` and run `npm run verify:paypal` or `npm run verify:ai`. PayPal is restricted to its sandbox. A direct Gemini key needs `AI_API_KEY` and `AI_MODEL`, with no base URL. Set `PAYMENT_MODE=sandbox` and `AI_MODE=live` to enable those adapters in the storefront.

`npm run db:seed` creates designated fixture scenarios and a private owner-only session manifest; `npm run docs:api` regenerates the shared-schema OpenAPI contract at [docs/openapi.json](docs/openapi.json). The hosted `/api/openapi` endpoint contains no credentials. See [docs/ENGINEERING.md](docs/ENGINEERING.md) for roles, scenarios, reports, request budgets, and reproducible issue details.

Current owner constraint: no AI billing or spend. Hosted analysis stays in fixture mode while direct Gemini quota is unavailable; native text/vision/retry integration remains contract-tested.

Shopping asks for confirmation when the message conflicts with the selected device or budget. Comparisons show catalog facts, and private conversation history survives reloads. Device-label suggestions require an explicit confirmation; fixture mode recognizes only the six owned synthetic images under `fixtures/device-labels`. Unknown or ambiguous labels never establish compatibility. `npm run verify:shopping` checks these paths over hosted HTTPS. Live `verify:ai` is disabled unless available free quota is explicitly confirmed with `AI_FREE_QUOTA_CONFIRMED=true`.

See [MASTER_PLAN.md](MASTER_PLAN.md) for product policy and acceptance gates, [docs/VALIDATION.md](docs/VALIDATION.md) for verified scope, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting, and [CHANGELOG.md](CHANGELOG.md) for milestone history.

The initial release uses one managed electronics storefront. Payment integration targets the PayPal sandbox. Fixture responses and synthetic shipping events are labeled and do not establish live integration or physical truth.

## License

MIT. See [LICENSE](LICENSE).
