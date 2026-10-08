# Current operating status

Updated 8 October 2026. The local application was found stopped: no Node process and no listener on port 3000. Its previous launch had no retained exit log, so the precise termination cause is unknown. No source changes or database reset were required to recover it.

DALE is a customer-first shopping agent: sourced product comparison and optional group savings, explicit purchase approval, protected checkout, own-order assistance and customer-selected return/refund/replacement with evidence and human review. The managed storefront is its test merchant. Supported real-device coverage is a reviewed M1/M2 MacBook charging registry, not unrestricted shopping across the internet.

| Area | Current status |
| --- | --- |
| Local product | Ready at http://localhost:3000/demo, compiled application source a980d79 (includes 6f85fc4 integration changes). Persistent data remains in `.data/local-final`. |
| Local process | Hidden supervisor independent of the launching terminal; bounded restart after unexpected child exit, retained logs and start/status/stop commands. No Windows boot service was installed. |
| Public product | HTTPS is ready at https://16.4.25.181.sslip.io/ and still serves 69ac213. New integration release is not deployed. |
| Guided demo | Private fixture payments, shipping and analysis; no model calls. Scenario roles, exports and reset remain available. |
| Live AI | Implemented and mock-tested. Existing key/model are present; owner confirmation of disabled billing/free quota is absent. Current preview keeps generation and microphone transport disabled. |
| PayPal | Existing credentials authenticate. Actual buyer checkout rejected the merchant's USD currency. Genuine capture/refund and signed receipts remain unverified. |
| Deployment access | Stable SSM tooling exists, but no authenticated local AWS profile or confirmed instance-role connection is available. |
| Acceptance | 16/20 checkpoints closed: **80% complete / 20% pending**. This counts acceptance gates, not remaining code or engineering hours. |

## Operate the local preview

From the repository in PowerShell:

```powershell
npm run build
npm run preview:start
npm run preview:status
npm run preview:stop
```

Build automatically copies browser assets and records source identity. Stop before rebuilding on Windows to avoid locked standalone files. Start reuses the database and secret; calling start twice reuses the running supervisor. Logs/state are in ignored `.data/local-preview`. A persistent startup error stops after three retries within a minute. Recovery handles process exit, not a still-running but hung process or a computer reboot.

`npm run verify:preview` deliberately interrupts only the recorded local fixture child once. It checks automatic recovery, authenticated state and original-image integrity. It never resets the database or sends a provider request. The redacted result is `.data/reports/local-preview-recovery.json`.

Owner-dependent gates remain: USD-capable sandbox merchant and buyer for financial acceptance; disabled-billing/free-quota confirmation for live AI evaluation; instance ID and authorized AWS profile/SSM role for deployment; staged physical originals with independent labels and five human usability records. Existing API secrets do not substitute for those executions. No new AI spend, billing or infrastructure was enabled during recovery.

[CURRENT_ACCEPTANCE.md](CURRENT_ACCEPTANCE.md) gives composed shopper-agent tests; [MANUAL_TESTS.md](MANUAL_TESTS.md) covers all seven feature lifecycles. [LIVE_INTEGRATION.md](LIVE_INTEGRATION.md) documents genuine provider phases. [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) is the checkpoint ledger; [VALIDATION.md](VALIDATION.md) records execution results.
