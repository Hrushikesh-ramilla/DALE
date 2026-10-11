# Independent customers and shared group buying

DALE remains a customer-first shopping agent with protected individual PayPal
checkout. Ordinary shoppers now enter one persisted store through `/api/account`;
they do not need a demo persona or workspace invitation to find the same group.
Guided fixtures and legacy isolated integration workspaces remain separate.

## Customer identity and persistence

Guest entry records an opaque customer identity in PostgreSQL and issues a
private HttpOnly session. Registration stores a normalized unique email, display
name and salted scrypt password hash. Converting a guest preserves its ID, orders
and commitments. A new-device sign-in restores that ID. Session cookies expire
after 24 hours; an account can sign in again. Guests need to register before losing
their cookie to recover access. Email ownership verification and password recovery
are not implemented; do not claim either or use a valuable reused password.

The database migration is additive. Existing customers, orders, evidence and
isolated workspaces are retained. The shared store uses existing locked workspace
transactions for group thresholds, stock reservations and duplicate commitments.
This is a working bounded merchant implementation, not an Amazon-scale storage
benchmark; normalized order/group tables are a later scaling milestone.

## Two-laptop exercise

1. Open the same deployed `/shop` URL on laptop A. Start shopping and choose
   **Continue as guest**, or create an account. Sending the first DALE task also
   starts an ordinary guest session.
2. Select a compatible product and commit to its group. Open `/groups`.
3. On laptop B, enter independently as another guest/account. Open `/groups`, find
   the same product/model and choose **Join this group**. Do not switch personas.
4. Laptop A shows the updated count and unlocked discount within approximately
   three seconds while the tab is visible. Both commitments are persisted. No
   payment is taken by joining.
5. Each participant reviews its own locked quote and explicitly approves its own
   PayPal sandbox checkout. One participant cannot capture the other's order.
6. Register laptop A's guest through **Account / sign in** on `/groups`, then sign
   in from a new browser/device. The same customer retains its commitment/orders.
7. Inspect **My orders** on B: A's order, messages and evidence must be absent.

Live updates use bounded three-second polling of the authenticated snapshot,
pause in hidden tabs and while foreground actions are running, and retain the
screen on transient network errors. This is near-real-time polling, not WebSocket
push. Group payments remain individual, never pooled or group-wide atomic.

## Executed and pending verification

Two new database workflows pass: independent guests share a group and protected
order ownership; guest conversion/new-session sign-in retains commitments, rejects
invalid credentials and does not store plaintext passwords. The complete local
unit/contract suite passes 340 checks. The new browser journey passes using two
independent browser contexts, actual HTTP calls and UI group joining, automatic
updates, registration, third-context sign-in and foreign-origin rejection.
Payment in those tests is explicitly fixture mode. Hosted acceptance and the
current release identity must be recorded after deployment; these local results
do not establish another actual PayPal capture/refund.

The manual Customer release verification workflow builds and tests a Linux
artifact with the full unit suite, packaged OCR and new production customer
browser journey. The broader historical UI suite remains a separate workflow;
its old persona/removed-page assumptions need to be evaluated against the revised
ordinary entry rather than silently counted as passing.

## Hosted release — 11 October 2026

Application `13d90bc308cbe8bf73c1531bcffc763d85bf532d` is deployed at
https://65.0.19.200.sslip.io with checksum-verified Linux artifact
`9bffa8ff56e9b1bf9f3b205e6efa34802b5c3161c23ba03d6db8711e4b568bb1`.
[Linux release verification](https://github.com/Hrushikesh-ramilla/DALE/actions/runs/38096983290)
passes lint, typecheck, all 340 unit/contract checks, production build, isolated
packaged OCR and the production independent-browser journey. The local preview
also runs this application with retained local data.

Actual public PostgreSQL acceptance passes 17 checks: independent ordinary guest
identities, shared group discovery/threshold/idempotency, preserved registration,
fresh-device sign-in, wrong-password/origin rejection, private member identities,
locked quote, genuine PayPal sandbox order creation, and other-buyer order/capture
rejection. No PayPal payment was captured. After an actual app/worker restart,
five additional checks pass for build identity, retained sessions, both group
commitments, fresh account sign-in and private retained order ownership.
Sanitized receipts are in `docs/evaluations/customers-13d90bc-*.json`; passwords
and cookies remain ignored. This preserves the currently configured inference
provider; it does not qualify self-hosted models, enable billing, or establish a
physical two-laptop exercise. Broader catalog expansion remains planned.
