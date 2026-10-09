#!/usr/bin/env bash
set -euo pipefail
test "$(id -u)" = 0 || { echo "Run with sudo."; exit 1; }
release_id="${1:?Supply a release identifier}"
[[ "$release_id" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 1
getent passwd buyerguard >/dev/null || useradd --system --home /var/lib/buyerguard --shell /usr/sbin/nologin buyerguard
install -d -m 750 -o buyerguard -g buyerguard /var/lib/buyerguard /opt/buyerguard/releases
install -m 600 -o buyerguard -g buyerguard /home/ubuntu/production.env /etc/buyerguard.env
sudo -u postgres psql -v ON_ERROR_STOP=1 < /home/ubuntu/database.sql >/dev/null
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='buyerguard'" | grep -q 1; then sudo -u postgres createdb -O buyerguard buyerguard; fi
target="/opt/buyerguard/releases/$release_id"
test ! -e "$target" || { echo "Release already exists; choose a new identifier."; exit 1; }
install -d -m 750 -o buyerguard -g buyerguard "$target"
tar -xzf /home/ubuntu/release.tar.gz -C "$target"
mkdir -p "$target/.next/cache"
chown -R buyerguard:buyerguard "$target"
ln -sfn "$target" /opt/buyerguard/current
install -m 644 "$target/deploy/buyerguard.service" /etc/systemd/system/
install -m 644 "$target/deploy/buyerguard-worker.service" /etc/systemd/system/
# Prepare pinned Linux inference/speech and enforce total memory policy before
# starting the application. Disabled fixture releases do not download models.
node "$target/deploy/prepare-runtime.mjs"
# Caddy's service reads only the public hostname, never payment or model credentials.
install -d /etc/systemd/system/caddy.service.d
host=$(sed -n 's/^APP_HOST="\([^"]*\)"$/\1/p' /etc/buyerguard.env)
[[ "$host" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 1
printf '[Service]\nEnvironment=APP_HOST=%s\n' "$host" > /etc/systemd/system/caddy.service.d/buyerguard.conf
install -m 644 "$target/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable --now buyerguard buyerguard-worker
systemctl restart buyerguard buyerguard-worker caddy
for attempt in $(seq 1 20); do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null; then echo "Services installed; local production database health passed. Check public TLS before sharing the URL."; exit 0; fi
    sleep 1
done
echo "Services installed, but readiness did not pass. Inspect service logs." >&2
exit 1
