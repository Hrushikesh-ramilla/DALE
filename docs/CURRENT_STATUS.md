# Current operating status

Updated 9 October 2026. The local application was found stopped: no Node process and no listener on port 3000. Its previous launch had no retained exit log, so the precise termination cause is unknown. No source changes or database reset were required to recover it.

Current implementation is committed at adc0aeb. Its CI passes quality and production app/worker/PostgreSQL containers, including all 41 browser journeys in each. Local Whisper passes two actual CPU recognition cases and ten actual HTTP integration checks. Public installation remains blocked. Local preview uses embedded PostgreSQL and the guided scenario engine; the independent background worker is validated in the Docker/EC2 PostgreSQL runtime, not launched concurrently against the local embedded database.

DALE is a customer-first shopping agent: sourced product comparison and optional group savings, explicit purchase approval, protected checkout, own-order assistance and customer-selected return/refund/replacement with evidence and human review. The managed storefront is its test merchant. Supported real-device coverage is a reviewed M1/M2 MacBook charging registry, not unrestricted shopping across the internet.

| Area | Current status |
| --- | --- |
| Local product | Ready at http://localhost:3000/demo, compiled application source adc0aeb. Persistent data remains in `.data/local-final`. |
| Local process | Hidden supervisor independent of the launching terminal; bounded restart after unexpected child exit, retained logs and start/status/stop commands. No Windows boot service was installed. |
| Public product | The old address 16.4.25.181 times out on SSH and HTTPS after the owner resized to t3.medium. Current instance address/access is pending; no current public health or new deployment is claimed. Last observed public source was 69ac213. |
| Guided demo | Private fixture payments, shipping and analysis; no model calls. Scenario roles, exports and reset remain available. |
| Live AI | Owner requested a self-hosted replacement after Gemini exhausted free quota. Private adapter passes contracts. Five local candidates failed selection. The latest Qwen3-VL-4B also used 5.8 GB resident memory on the laptop, exceeding the entire 4 GiB target. It is stopped and unselected; qualified selection, evaluation and deployment remain engineering work. See SELF_HOSTED_AI.md. |
| PayPal | Existing credentials authenticate. Actual buyer checkout rejected the merchant's USD currency. Genuine capture/refund and signed receipts remain unverified. |
| Deployment access | Owner chose restricted SSH and reports t3.medium, 2 vCPU/4 GiB. The new address has been requested. SSM tooling remains optional, with no authorized AWS profile configured. |
| Acceptance | 15/20 checkpoints closed: **75% complete / 25% pending**. Deployment checkpoint 20 is reopened for the new runtime/resized host. This is an acceptance-gate count, not a remaining-code estimate. |

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
