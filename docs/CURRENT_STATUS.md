# Current operating status

11 October 2026: application `13d90bc308cbe8bf73c1531bcffc763d85bf532d` is ready locally and on https://65.0.19.200.sslip.io. The new shared-store customer/group milestone is deployed; authenticated PostgreSQL, actual PayPal sandbox order creation and app/worker restart persistence pass. Registration/sign-in/guest conversion and two independent browser contexts are verified. No payment capture or model call was performed by this milestone, and existing provider configuration was preserved. See [MULTI_CUSTOMER.md](MULTI_CUSTOMER.md) for scope, limitations, release evidence and two-laptop instructions. The former 16.4.25.181 address is stale.

## Historical operating status — 9 October

Updated 9 October 2026. The local application was found stopped: no Node process and no listener on port 3000. Its previous launch had no retained exit log, so the precise termination cause is unknown. No source changes or database reset were required to recover it.

The local preview uses a persistent supervisor, retained embedded PostgreSQL and the guided scenario engine; its compiled identity is reported by health/status. The independent background worker is validated in Docker/EC2 PostgreSQL, not run concurrently against the local embedded database. Local OCR passes eleven actual isolated packaged HTTP checks. Local Whisper passes two CPU recordings and ten HTTP checks. The latest Linux inference gate passes capped text/image/auth/restart; full frozen v3 quality fails. The 9d3a7e7 quality job caught two citation regressions, now corrected and awaiting fresh CI. Public installation remains blocked by current instance access.

DALE is a customer-first shopping agent: sourced product comparison and optional group savings, explicit purchase approval, protected checkout, own-order assistance and customer-selected return/refund/replacement with evidence and human review. The managed storefront is its test merchant. Supported real-device coverage is a reviewed M1/M2 MacBook charging registry, not unrestricted shopping across the internet.

| Area | Current status |
| --- | --- |
| Local product | Ready at http://localhost:3000/demo; current compiled identity is reported by `/api/health` and `npm run preview:status`. Persistent data remains in `.data/local-final`. Guided scenarios retain fixture analysis. |
| Local process | Hidden supervisor independent of the launching terminal; bounded restart after unexpected child exit, retained logs and start/status/stop commands. No Windows boot service was installed. |
| Public product | The old address 16.4.25.181 times out on SSH and HTTPS after the owner resized to t3.medium. Current instance address/access is pending; no current public health or new deployment is claimed. Last observed public source was 69ac213. |
| Guided demo | Private fixture payments, shipping and analysis; no model calls. Scenario roles, exports and reset remain available. |
| Live AI | Entirely self-hosted is confirmed. Native LFM3 v2 failed (89/180); revised compact-goal/Tesseract v3 completed 151/180 and still failed qualification. Linux inference/auth/restart passes under a hard 2 GiB cap, with no spare-headroom or EC2 joint-load claim. Actual isolated OCR HTTP passes 11 checks. Production selection remains null. No cloud generation or further AI key is required. See SELF_HOSTED_AI.md. |
| PayPal | Existing credentials authenticate. Actual buyer checkout rejected the merchant's USD currency. Genuine capture/refund and signed receipts remain unverified. |
| Deployment access | Owner chose restricted SSH and reports t3.medium, 2 vCPU/4 GiB. The new address has been requested. SSM tooling remains optional, with no authorized AWS profile configured. |
| Release acceptance | 15/20 checkpoints closed: **75% passed / 25% pending**. Deployment checkpoint 20 is reopened for the new runtime/resized host. This is an acceptance-gate count, not engineering completion. The progress ledger now lists engineering and acceptance separately. |

## Operate the local preview

The launcher preserves `OPERATOR_ACCESS_CODE` from the owner's `.env` or existing ignored deployment configuration. If neither supplies one, it retains an ignored local `.data/local-final/operator-access-code` file. Existing `.data/deploy/access-codes.txt` applies when reusing the deployment configuration. Do not share operator codes publicly. Guided scenarios support their owned role switch without entering these codes.

From the repository in PowerShell:

```powershell
npm run build
npm run preview:start
npm run preview:status
npm run preview:stop
```

Build automatically copies browser assets and records source identity. Stop before rebuilding on Windows to avoid locked standalone files. Start reuses the database and secret; calling start twice reuses the running supervisor. Logs/state are in ignored `.data/local-preview`. A persistent startup error stops after three retries within a minute. Recovery handles process exit, not a still-running but hung process or a computer reboot.

`npm run verify:preview` deliberately interrupts only the recorded local fixture child once. It checks automatic recovery, authenticated state and original-image integrity. It never resets the database or sends a provider request. The redacted result is `.data/reports/local-preview-recovery.json`.

Owner-dependent gates remain: a sandbox merchant accepting a supported currency; working restricted deployment access; a qualified model and joint workload verification on the now-resized host; staged physical originals with independent labels and five human usability records. Owner confirmed disabled Google billing, then requested replacement of Gemini rather than a model switch or quota wait. No new AI spend, billing or infrastructure was enabled. INR is absent from PayPal's current REST currency list; changing a quote's label cannot repair the account rejection.

[CURRENT_ACCEPTANCE.md](CURRENT_ACCEPTANCE.md) gives composed shopper-agent tests; [MANUAL_TESTS.md](MANUAL_TESTS.md) covers all seven feature lifecycles. [LIVE_INTEGRATION.md](LIVE_INTEGRATION.md) documents genuine provider phases. [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) is the checkpoint ledger; [VALIDATION.md](VALIDATION.md) records execution results.
