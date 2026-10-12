# Deployment

## Persistent local preview on Windows

Run `npm run build`, then `npm run preview:start`. Build copies production browser assets automatically. The hidden supervisor serves http://localhost:3000/demo, preserves `.data/local-final` and restarts an unexpectedly exited child with bounded retries. `npm run preview:status` reports readiness and restart history; `npm run preview:stop` stops the owned preview and retains data. Stop before rebuilding on Windows. Logs live in ignored `.data/local-preview`; this is a fixture preview, not a Windows boot service or EC2 deployment. `npm run verify:preview` tests one child interruption and retained state. See [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Existing EC2 instance

For stable management access, use [Systems Manager instead of changing local-IP SSH rules](DEPLOYMENT_ACCESS.md). The connection script is prepared; activating the instance role/agent and an authenticated AWS identity is still required.

For an existing installation, upload `deploy/upgrade.sh` alongside the installer and run `sudo bash upgrade.sh <release-id> <expected-sha256>`. It checks the transferred archive before changing services, retains a private database/evidence/environment snapshot and the previous release, and restores the previous code/environment on installation failure. It does not automatically overwrite a database with a backup. Schema compatibility must be reviewed before code rollback. Use the ignored restricted local SSH key copy documented in DEPLOYMENT_ACCESS.md.

The owner reports resizing the existing Ubuntu instance to t3.medium with 4 GiB RAM. Its current public address and restricted SSH access remain pending. Build locally with `npm run build`, then `node scripts/package-release.mjs`; the release archive excludes all environment files and unnecessary native build binaries. Native Node.js, PostgreSQL, Caddy, and systemd avoid compiling on the host. Packaging rejects live self-hosted inference without a qualified manifest selection and rejects Windows local-speech paths. No local model is qualified; production inference service installation and joint memory/restart acceptance remain open. Existing app/worker limits were sized for the earlier fixture release; the 380 MB app limit must be reassessed before enabling child-process Whisper recognition. Do not infer deployment readiness from artifact download or fixture CI alone.

Install Ubuntu packages `nodejs postgresql caddy`. Copy the generated archive, private `production.env`, private `database.sql`, and `deploy/install.sh` to `/home/ubuntu`, then run `sudo bash install.sh <unique-release-id>`. The script creates a dedicated service account, database role, persistent `/var/lib/buyerguard` evidence directory, and versioned `/opt/buyerguard/releases` checkout. The environment is readable by the service account only.

Allow incoming TCP 80 and 443. Keep PostgreSQL, port 3000, and Caddy's administration API private. Caddy obtains HTTPS for the configured `APP_HOST`. The initial hostname uses the public IP through sslip.io; change it when the public IP changes or a dedicated domain is available. The hostname service and certificate authority are external dependencies.

Check `systemctl status buyerguard buyerguard-worker caddy`, `/api/health`, HTTPS, and `journalctl -u buyerguard-worker`. The app and worker restart automatically and have memory limits. Financial operations and outbox jobs persist before provider calls; the worker polls every 30 seconds. Jobs use row-lock claims, five-minute leases, six bounded attempts, and dead-letter status. Only the current lease holder can complete a job. Reviewer Environment details shows worker heartbeat and workspace backlog. Dead jobs need operational review and never authorize a new charge or refund by themselves. Seller response deadlines escalate to human review instead of automatically denying or moving money.

Buyer and operator access codes are saved locally in ignored `.data/deploy/access-codes.txt`. Do not publish the operator code. The buyer's Environment details panel provides the workspace ID for seller/reviewer login. These are test roles, not production identity or a merchant console.

Evidence is private on the existing instance's persistent disk to keep the demo cost low. Configure `STORAGE_MODE=s3` and the S3 variables for off-instance storage. Do not claim disaster recovery from a single disk. Before important tests, save a database dump and evidence archive to protected storage. No new paid AWS service is required by the current deployment.

To update, package a fresh local build, upload it, and run the installer with a new identifier. Preserve `production.env` and the database password. To roll back code, point `/opt/buyerguard/current` at a verified earlier release, then restart app and worker; check schema compatibility before reverting. Keep at least the previous release until the new release passes hosted checks.

## Private CPU runtime installation

The installer now invokes `deploy/prepare-runtime.mjs` before starting the app. Fixture/disabled settings download no inference artifacts. Explicit local speech installs the pinned Linux Whisper runtime/model and writes Linux paths into the private environment; the app cgroup grows from 380 to 768 MiB to include its recognizer child. Live self-hosting requires a qualified manifest selection matching AI_MODEL. The manifest remains unselected; downloading a candidate cannot enable a live release.

The private model service uses authenticated 127.0.0.1:8081, one slot/two CPU threads, context 4096, batch/ubatch 128, bounded restarts and no GPU/offload. Its default cgroup limit is 2048 MiB; LOCAL_MODEL_MEMORY_MAX_MIB can preserve a measured, explicitly configured limit. The installer checks app plus model plus 240 MiB worker and 640 MiB OS/PostgreSQL/Caddy reserve against OS-visible RAM. This capacity check is not proof of adequacy; measure peak joint load and latency on EC2 before acceptance. Runtime artifacts are pinned/checksummed, root-owned, and readable through the service group. Cloud keys are not sent to the local service.

Upgrade snapshots now include model service/key/environment, app/model resource overrides and the previous runtime link; failure restores them alongside application configuration. Artifacts are retained. The model must return the selected alias on an authenticated models request before app installation proceeds. That startup check establishes service identity, not inference quality. Fresh Linux CI downloads real pinned binaries, recognizes owned synthesized audio as the service account, validates model unit syntax and speech reinstallation without model generation. Target EC2/model inference remains separately required.

## Local Docker alternative

Copy `.env.example` to `.env`; set a URL-safe `POSTGRES_PASSWORD`, a random `SESSION_SECRET` of at least 32 characters, and a private `OPERATOR_ACCESS_CODE`. Run `docker compose up --build`. The app binds to localhost:3000; PostgreSQL and evidence use named volumes. Modes remain configurable through `.env`.

For a provider-free fixture run, use `node scripts/prepare-fixture-environment.mjs`, then `docker compose --env-file .data/deploy/docker.env -p buyerguard-verify up --build --wait`. The environment generator contains no provider credentials. Browser tests can target the production container by setting `E2E_BASE_URL=http://127.0.0.1:3000`.

Docker Compose configuration validates. The local Windows engine failed to become available after startup, so the Linux CI container job performs the actual build/run and browser verification. EC2 continues using the native deployment above. A successful container-job result is required before claiming the container runtime verified.

## PayPal webhook

Register `https://<APP_HOST>/api/paypal/webhook` on the sandbox application and set `PAYPAL_WEBHOOK_ID` in the protected server environment. Subscribe to capture-completed and refund status events. Incoming events are verified against PayPal, durably deduplicated, and used to wake reconciliation. Provider reads establish financial completion; an event payload alone cannot authorize a charge or refund. Webhook registration is separate from proving actual delivery and signature verification.

## Backups and restore rehearsal

Run `sudo bash /home/ubuntu/backup-restore-check.sh` after transferring `deploy/backup-restore-check.sh`. It briefly pauses app/worker writes for a consistent database/original-file snapshot, restarts services, restores to a distinct timestamped scratch database/private directory, compares workspace-state SHA-256 and row counts, and checks every original against its database hash. A cleanup trap restarts services and removes only the specifically named scratch database. It never restores over the production database or evidence directory.

Private snapshots remain under `/var/backups/buyerguard/<timestamp>` with owner-only permissions. Copy database.dump, assets.tar.gz, expected counts/state hash and restore report to protected off-instance storage; provider/session configuration stays in the owner's separate protected environment. The executed 20261005195836 rehearsal preserved 50 workspaces, 88 sessions, 25 jobs and three originals. Zero genuine webhook receipts is recorded, not claimed as integration success.

The local `.data/backups/buyerguard-backup-20261005195836.dpapi` archive is encrypted for the owner's Windows account. `scripts/protect-backup.ps1` verifies a DPAPI decrypt round-trip before deleting only its checked plaintext source. Recovery requires the same Windows account/profile; decrypt with ProtectedData.Unprotect using CurrentUser, write to a protected temporary path, then use the separate-database restore procedure. Keep that account's recovery arrangements and protected production.env separately. Retain at least the newest verified snapshot and one earlier snapshot; do not delete an older recoverable snapshot before verifying its replacement.

The final 20261005210337 snapshot/restore also passes for 92 workspaces, 158 sessions, 46 jobs and five originals, including current brief/conversation state. Its verified off-instance copy is `.data/backups/buyerguard-backup-20261005210337.dpapi`; the earlier snapshot remains retained. Production serves code commit 5b393c0 with fixtures for AI and sandbox for ordinary payments. Temporary checksum-bound/one-time HTTPS transfers were used while new SSH/SCP connections timed out; the helper services, routes and scripts were removed and the normal Caddy configuration restored. No deployment-transfer endpoint remains installed.
