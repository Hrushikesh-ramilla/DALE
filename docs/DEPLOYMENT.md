# Deployment

## Existing EC2 instance

The demo uses an existing Ubuntu instance with 1 GiB RAM. Build locally with `npm run build`, then `node scripts/package-release.mjs`; the release archive excludes all environment files and unnecessary native build binaries. Native Node.js, PostgreSQL, Caddy, and systemd avoid compiling on the small host.

Install Ubuntu packages `nodejs postgresql caddy`. Copy the generated archive, private `production.env`, private `database.sql`, and `deploy/install.sh` to `/home/ubuntu`, then run `sudo bash install.sh <unique-release-id>`. The script creates a dedicated service account, database role, persistent `/var/lib/buyerguard` evidence directory, and versioned `/opt/buyerguard/releases` checkout. The environment is readable by the service account only.

Allow incoming TCP 80 and 443. Keep PostgreSQL, port 3000, and Caddy's administration API private. Caddy obtains HTTPS for the configured `APP_HOST`. The initial hostname uses the public IP through sslip.io; change it when the public IP changes or a dedicated domain is available. The hostname service and certificate authority are external dependencies.

Check `systemctl status buyerguard buyerguard-worker caddy`, `/api/health`, HTTPS, and `journalctl -u buyerguard-worker`. The app and worker restart automatically and have memory limits. Financial operations persist before provider calls; the single worker polls every 30 seconds. Seller response deadlines escalate to human review instead of automatically denying or moving money.

Buyer and operator access codes are saved locally in ignored `.data/deploy/access-codes.txt`. Do not publish the operator code. The buyer's Environment details panel provides the workspace ID for seller/reviewer login. These are test roles, not production identity or a merchant console.

Evidence is private on the existing instance's persistent disk to keep the demo cost low. Configure `STORAGE_MODE=s3` and the S3 variables for off-instance storage. Do not claim disaster recovery from a single disk. Before important tests, save a database dump and evidence archive to protected storage. No new paid AWS service is required by the current deployment.

To update, package a fresh local build, upload it, and run the installer with a new identifier. Preserve `production.env` and the database password. To roll back code, point `/opt/buyerguard/current` at a verified earlier release, then restart app and worker; check schema compatibility before reverting. Keep at least the previous release until the new release passes hosted checks.

## Local Docker alternative

Copy `.env.example` to `.env`; set a URL-safe `POSTGRES_PASSWORD`, a random `SESSION_SECRET` of at least 32 characters, and a private `OPERATOR_ACCESS_CODE`. Run `docker compose up --build`. The app binds to localhost:3000; PostgreSQL and evidence use named volumes. Modes remain configurable through `.env`.

Docker Compose configuration is validated, but a Docker build/run has not yet been tested because the local Docker daemon is unavailable. EC2 uses the native deployment above. Do not present the container runtime as verified until it passes a real build and journey test.

## PayPal webhook

Register `https://<APP_HOST>/api/paypal/webhook` on the sandbox application and set `PAYPAL_WEBHOOK_ID` in the protected server environment. Subscribe to capture-completed and refund status events. Incoming events are verified against PayPal, durably deduplicated, and used to wake reconciliation. Provider reads establish financial completion; an event payload alone cannot authorize a charge or refund. Webhook registration is separate from proving actual delivery and signature verification.
