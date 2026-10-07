# DALE

An evidence-backed buyer agent that checks the complete solution before checkout and carries the shopper's context into order support.

Start at `/` and type **Find a charger for my MacBook Air M2 under $50**. DALE asks for the exact size and cable ownership. For the 13-inch model without a cable, a $39 adapter needs a $19 cable: the complete $58 bundle fails the budget. Follow up with **My budget is $60** to see the eligible bundle, rejected alternatives and manufacturer links. Purchase approval and support submission remain explicit shopper actions.

The current real-data pack covers two exact M2 MacBook Air models and charging accessories. It is reviewed manufacturer evidence, not unrestricted web research or live stock. DALE merchant offers, fulfillment and guest-workspace payments are simulated. The structured Gemini planner and comparison adapter are implemented and mock-tested; catalog assistance makes no model calls under the owner's no-spend instruction. See [product evidence](docs/PRODUCT_EVIDENCE.md), [manual acceptance](docs/MANUAL_TESTS.md) and [executed validation](docs/VALIDATION.md).

Open `/demo` for a complete provider-free engineer journey without an account or access code. Nine isolated scenarios include shopping, group discounts, returns, conflicting evidence, deadlines and refund recovery. Use the owned demo persona selector for seller/reviewer steps, and export the redacted test report. Reset retains earlier audit history.

The storefront uses restrained monochrome controls, original volumetric Three.js product illustrations, GSAP typography and a desaturated teal DALE closing composition. Talk to DALE supports editable shopping/support/order requests; the demo uses labeled transcript fixtures. Native Gemini Live microphone/audio transport is implemented and synthetically tested, but live recognition remains unverified and disabled until free quota and disabled billing are confirmed. No AI spend is required for the demo.

## Development

Requires Node.js 22 or newer. Install locked dependencies with `npm ci`, copy `.env.example` to `.env`, then run `npm run dev`. Local development creates an ignored embedded PostgreSQL database in `.data`. Set a private `OPERATOR_ACCESS_CODE` to test seller and reviewer roles in separate browser profiles.

Run `npm run check`, `npm run test:integration`, `npm run eval`, `npm run build`, and `npm run test:e2e`. Install the browser once with `npx playwright install chromium`. CI runs static checks, unit/integration tests, production build, and browser journeys.

`npm run eval:models` runs the preregistered repeated subset through mocked native Gemini transport by default, without network or spend. Frozen synthetic corpus results and live accuracy are reported separately. [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) provides independent usability and physical-evidence tasks with empty recording templates.

Payments and analysis default to explicitly labeled fixtures. For real provider checks, configure the ignored `.env` and run `npm run verify:paypal` or `npm run verify:ai`. PayPal is restricted to its sandbox. A direct Gemini key needs `AI_API_KEY` and `AI_MODEL`, with no base URL. Set `PAYMENT_MODE=sandbox` and `AI_MODE=live` to enable those adapters in the storefront.

The buyer-agent model path additionally requires `AGENT_MODEL_ENABLED=true` and `AI_BILLING_DISABLED=true` after verified free quota and disabled billing. An existing fixture shopper stays provider-free; use a new normal shopper session for live acceptance. Engineering demo workspaces always prohibit model calls. Do not enable these flags just to run tests.

`npm run db:seed` creates designated fixture scenarios and a private owner-only session manifest; `npm run docs:api` regenerates the shared-schema OpenAPI contract at [docs/openapi.json](docs/openapi.json). The hosted `/api/openapi` endpoint contains no credentials. See [docs/ENGINEERING.md](docs/ENGINEERING.md) for roles, scenarios, reports, request budgets, and reproducible issue details.

Current owner constraint: no AI billing or spend. Hosted analysis stays in fixture mode while direct Gemini quota is unavailable; native text/vision/retry integration remains contract-tested.

Shopping asks for confirmation when the message conflicts with the selected device or budget. Comparisons show catalog facts, and private conversation history survives reloads. Device-label suggestions require an explicit confirmation; fixture mode recognizes only the six owned synthetic images under `fixtures/device-labels`. Unknown or ambiguous labels never establish compatibility. `npm run verify:shopping` checks these paths over hosted HTTPS. Live `verify:ai` is disabled unless available free quota is explicitly confirmed with `AI_FREE_QUOTA_CONFIRMED=true`.

See [MASTER_PLAN.md](MASTER_PLAN.md) for product policy and acceptance gates, [docs/VALIDATION.md](docs/VALIDATION.md) for verified scope, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting, and [CHANGELOG.md](CHANGELOG.md) for milestone history.

For hands-on testing, follow [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md): private role setup, a no-spend fixture workspace, all implemented feature steps and expected outcomes, recovery scenarios, and the remaining sign-off gates.

The local storefront has black-and-white surfaces, self-hosted typography, GSAP/Motion transitions, volumetric product selection, collection discovery and product details. `/shop`, `/groups`, `/orders` and `/support` support direct links/history through a shared layout; `/demo` opens isolated guided scenarios. See [docs/DESIGN.md](docs/DESIGN.md) for references, interaction boundaries and deployment status.

The initial release uses one managed electronics storefront. Payment integration targets the PayPal sandbox. Fixture responses and synthetic shipping events are labeled and do not establish live integration or physical truth.

## License

MIT. See [LICENSE](LICENSE).
