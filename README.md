# BuyerGuard

Customer-first shopping, safe checkout, group discounts, and evidence-backed order resolution.

## Development

Requires Node.js 22 or newer. Install locked dependencies with `npm ci`, copy `.env.example` to `.env`, then run `npm run dev`. Local development creates an ignored embedded PostgreSQL database in `.data`. Set a private `OPERATOR_ACCESS_CODE` to test seller and reviewer roles in separate browser profiles.

Run `npm run check`, `npm run eval`, `npm run build`, and `npm run test:e2e`. Install the browser once with `npx playwright install chromium`. CI runs static checks, unit/integration tests, production build, and browser journeys.

Payments and analysis default to explicitly labeled fixtures. For real provider checks, configure the ignored `.env` and run `npm run verify:paypal` or `npm run verify:ai`. PayPal is restricted to its sandbox. A direct Gemini key needs `AI_API_KEY` and `AI_MODEL`, with no base URL. Set `PAYMENT_MODE=sandbox` and `AI_MODE=live` to enable those adapters in the storefront.

See [MASTER_PLAN.md](MASTER_PLAN.md) for product policy and acceptance gates, [docs/VALIDATION.md](docs/VALIDATION.md) for verified scope, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting, and [CHANGELOG.md](CHANGELOG.md) for milestone history.

The initial release uses one managed electronics storefront. Payment integration targets the PayPal sandbox. Fixture responses and synthetic shipping events are labeled and do not establish live integration or physical truth.

## License

MIT. See [LICENSE](LICENSE).
