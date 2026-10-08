9 October: Gemini billing confirmation was received and real generation/composed research succeeded before a hard daily quota was exhausted. The owner now requests self-hosting, not further cloud calls. Private configuration selects self_hosted with generation disabled and no model selected. Use SELF_HOSTED_AI.md for the current path; Google enablement below describes the former provider. The owner reports a 4 GiB EC2 resize, but its current public address is still required. INR is unsupported by the current PayPal REST currency list; the existing sandbox merchant currency acceptance remains unresolved.

# Live integration acceptance

The owner-supplied provider secrets are already configured in ignored `.env`. On 8 October a direct `gemini-3.8-flash` generation returned HTTP 200 and the expected output (16 total tokens). This verifies availability at that moment, not semantic accuracy or the live app. No billing setting was changed.

## Enable the agent deliberately

Confirm the Google project is on the Free Tier with billing disabled. Then set `AI_BILLING_DISABLED=true`, `AI_FREE_QUOTA_CONFIRMED=true`, `AI_MODE=live` and `AGENT_MODEL_ENABLED=true` in the ignored configuration. These flags record the owner's confirmation; they cannot query or alter Google billing. Do not set them merely because an API key exists. Release packaging preserves explicitly configured settings rather than resetting them.

Build and copy the production browser assets (`npm run build`, `node scripts/prepare-production-browser.mjs`), then run `npm run start:live`. This separate loopback preview serves http://localhost:3001/live with persistent private data in `.data/live-local`. `/live` shows provider readiness and starts a fresh ordinary session. Hosted entry requires the existing shopper access code. `/demo` always stays fixture-only, including on a live host. Runtime modes are captured when a workspace is created; an old fixture workspace cannot become live from a server flag change.

`VERIFY_BASE_URL=http://localhost:3001 npm run verify:agent:live` executes five real HTTP conversation cases and checks live planner acceptance, sourced complete costs, group discovery, budget/context retention, unprompted own-order wording, message safety, unsupported-device refusal and no automatic order/case creation. The final guided-fixture exercise must still use no model. The runner stops on a failed check and saves a redacted report in `.data/reports/live-agent-acceptance.json`; a catalog fallback never counts as successful model execution. Set environment variables with the shell's native syntax on Windows. This small set does not replace the planned held-out evaluation or actual microphone and vision exercises.

## Complete the PayPal journey

Current authentication and registered public webhook are valid. The fresh 8 October buyer login again reached PayPal's rejection: “This seller doesn’t accept payments in your currency.” The app uses USD. Configure a USD-capable sandbox Business merchant and distinct funded Personal buyer. If the merchant's REST app changes, replace its client ID/secret/merchant ID in `.env`, register the corresponding webhook and deploy that configuration. A key for the former app cannot configure the new app's webhook. No real-money account or payment is needed.

`npm run configure:paypal:webhook` looks up the current credential's sandbox app, reuses the matching public listener or registers one, verifies capture/refund/reversal/dispute subscriptions and saves the ID privately. It does not create a duplicate or alter another app's listener. Package/deploy the resulting configuration before checkout. No buyer payment or event simulator is used by this setup command.

The resumable runner uses the deployed `.data/deploy/production.env` access codes and optional `VERIFY_BASE_URL`:

1. `npm run verify:paypal:journey -- prepare`: checks ordinary sandbox mode and app/merchant identity, creates a protected $29 test order and saves the private session. It prints the actual sandbox approval URL. It refuses to overwrite an existing journey.
2. Approve using the distinct sandbox buyer. A CAPTCHA or account configuration requirement needs the owner; do not fabricate approval.
3. `npm run verify:paypal:journey -- capture`: reads genuine APPROVED/COMPLETED state, captures through DALE and checks repeat capture returns the original reference.
4. `npm run verify:paypal:journey -- refund`: records an explicit test seller cancellation, buyer refund request and reviewer authorization, executes through DALE, repeats the resolution and verifies the exact completed refund with a PayPal GET. Test cancellation/shipping is simulated; financial references are genuine sandbox records.
5. `npm run verify:paypal:journey -- receipts`: waits up to 25 seconds for actual signed capture/refund notifications linked to the same private order. Missing or delayed receipts remain pending. Each phase retains a redacted report; private cookies stay in ignored local files.

Signed notification receipts show origin and association, not financial authority. Actual status still requires server-owned quote checks, explicit buyer/reviewer authorization and provider GET reconciliation. The app retains the last 100 associated receipts and scopes them to the caller's accessible orders. Unrelated events and fixture workspaces do not receive them.

## Research claims

The initial ideas were described as research-inspired, not faithful reproductions. The pasted initial conversation lacks recoverable bibliographic links for each selected idea, and the current plan primarily links product/API specifications. Do not claim every feature reproduces an article or that an article supplied usable implementation code. Recover a paper's exact title, version, method and licensed source before claiming its reproduction.

[ReAct](https://arxiv.org/abs/2210.03629) is a relevant methodological reference for combining language-model planning with external actions. DALE's bounded typed workflow is an adaptation: source tools supply product facts; validation constrains actions; retained context supports follow-ups. It is not a reproduction of that paper's experiments or unrestricted reasoning/action loop. Approval checks, idempotency and reconciliation follow the actual PayPal API contracts. Evidence hashes establish integrity after ingestion; they do not implement C2PA conformity or establish physical truth. Group thresholds/discounts are explicit merchant policy, not a reproduced learned negotiation algorithm.
