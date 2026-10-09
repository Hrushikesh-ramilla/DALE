#!/usr/bin/env bash
set -Eeuo pipefail
test "$(id -u)" = 0 || { echo "Run with sudo."; exit 1; }
release_id="${1:?Supply a release identifier}"
expected_hash="${2:?Supply the release SHA-256}"
[[ "$release_id" =~ ^[a-zA-Z0-9._-]+$ && "$expected_hash" =~ ^[a-fA-F0-9]{64}$ ]] || exit 1
test ! -e "/opt/buyerguard/releases/$release_id"
actual_hash=$(sha256sum /home/ubuntu/release.tar.gz | cut -d ' ' -f 1)
[[ "${actual_hash,,}" = "${expected_hash,,}" ]] || { echo "Release checksum mismatch."; exit 1; }
previous=$(readlink -f /opt/buyerguard/current)
[[ "$previous" == /opt/buyerguard/releases/* && -d "$previous" ]] || exit 1
backup="/var/backups/buyerguard/pre-$release_id-$(date -u +%Y%m%d%H%M%S)"
install -d -m 700 "$backup"
install -m 600 /etc/buyerguard.env "$backup/production.env"
runtime_files=(/etc/systemd/system/buyerguard-model.service /etc/buyerguard-model.env /etc/buyerguard-model.key /etc/systemd/system/buyerguard.service.d/runtime.conf /etc/systemd/system/buyerguard-model.service.d/memory.conf)
for file in "${runtime_files[@]}"; do
  if test -f "$file"; then
    install -d -m 700 "$backup/runtime$(dirname "$file")"
    cp -a -- "$file" "$backup/runtime$file"
  fi
done
model_link=$(readlink /opt/buyerguard/inference/current || true)
model_active=false
model_enabled=false
if systemctl is-active --quiet buyerguard-model; then model_active=true; fi
if systemctl is-enabled --quiet buyerguard-model; then model_enabled=true; fi
rollback() {
  trap - ERR
  systemctl disable --now buyerguard-model 2>/dev/null || true
  for file in "${runtime_files[@]}"; do
    if test -f "$backup/runtime$file"; then
      cp -a -- "$backup/runtime$file" "$file"
    else
      rm -f -- "$file"
    fi
  done
  if [[ "$model_link" == /opt/buyerguard/inference/llama-* ]]; then
    ln -sfn "$model_link" /opt/buyerguard/inference/current
  elif test -L /opt/buyerguard/inference/current; then
    unlink /opt/buyerguard/inference/current
  fi
  ln -sfn "$previous" /opt/buyerguard/current
  install -m 600 -o buyerguard -g buyerguard "$backup/production.env" /etc/buyerguard.env
  systemctl daemon-reload
  if "$model_enabled"; then systemctl enable buyerguard-model; fi
  if "$model_active"; then systemctl restart buyerguard-model; fi
  systemctl restart buyerguard buyerguard-worker
  echo "Upgrade failed; restored the previous application, environment and runtime services. Database/evidence snapshot retained at $backup." >&2
  exit 1
}
trap rollback ERR
systemctl stop buyerguard buyerguard-worker
sudo -u postgres pg_dump -Fc buyerguard > "$backup/database.dump"
tar -czf "$backup/assets.tar.gz" -C /var/lib buyerguard
bash /home/ubuntu/install.sh "$release_id"
for unit in buyerguard buyerguard-worker caddy; do systemctl is-active --quiet "$unit"; done
curl -fsS http://127.0.0.1:3000/api/health
echo
echo "Checksum verified; previous release and private pre-upgrade snapshot retained. Verify public HTTPS and application BUILD_ID."
