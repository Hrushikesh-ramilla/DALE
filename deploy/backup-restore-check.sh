#!/usr/bin/env bash
set -euo pipefail
umask 077
test "$(id -u)" = 0 || { echo "Run with sudo."; exit 1; }
stamp=$(date -u +%Y%m%d%H%M%S)
backup_dir="/var/backups/buyerguard/$stamp"
scratch_db="buyerguard_restore_$stamp"
[[ "$scratch_db" =~ ^buyerguard_restore_[0-9]{14}$ ]] || exit 1
install -d -m 700 "$backup_dir" "$backup_dir/restored"
cleanup() {
  systemctl start buyerguard buyerguard-worker
  sudo -u postgres dropdb --if-exists "$scratch_db" >/dev/null
}
trap cleanup EXIT
# Pause writes only while producing a consistent database + original-file snapshot.
systemctl stop buyerguard buyerguard-worker
sudo -u postgres pg_dump --format=custom buyerguard > "$backup_dir/database.dump"
tar -czf "$backup_dir/assets.tar.gz" -C /var/lib/buyerguard assets
sudo -u postgres psql -X -tA -d buyerguard -c "SELECT json_build_object('workspaces',(SELECT count(*) FROM workspaces),'sessions',(SELECT count(*) FROM sessions),'assets',(SELECT count(*) FROM assets),'jobs',(SELECT count(*) FROM jobs),'webhooks',(SELECT count(*) FROM webhook_receipts));" > "$backup_dir/expected-counts.json"
sudo -u postgres psql -X -tA -d buyerguard -c "SELECT id || state::text FROM workspaces ORDER BY id;" | sha256sum | cut -d' ' -f1 > "$backup_dir/expected-state.sha256"
systemctl start buyerguard buyerguard-worker
# Restore to a distinct database and private path. No production rows/files are replaced.
sudo -u postgres createdb "$scratch_db"
cat "$backup_dir/database.dump" | sudo -u postgres pg_restore --no-owner --no-privileges -d "$scratch_db"
tar -xzf "$backup_dir/assets.tar.gz" -C "$backup_dir/restored"
sudo -u postgres psql -X -tA -d "$scratch_db" -c "SELECT id || state::text FROM workspaces ORDER BY id;" | sha256sum | cut -d' ' -f1 > "$backup_dir/restored-state.sha256"
cmp "$backup_dir/expected-state.sha256" "$backup_dir/restored-state.sha256"
python3 - "$backup_dir" "$scratch_db" <<'PY'
import csv, hashlib, io, json, pathlib, subprocess, sys, datetime
root = pathlib.Path(sys.argv[1]).resolve()
database = sys.argv[2]
def sql(query, csv_output=False):
    flags = ['--csv', '-t'] if csv_output else ['-tA']
    return subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-X', *flags, '-d', database, '-c', query], text=True)
counts = json.loads(sql("SELECT json_build_object('workspaces',(SELECT count(*) FROM workspaces),'sessions',(SELECT count(*) FROM sessions),'assets',(SELECT count(*) FROM assets),'jobs',(SELECT count(*) FROM jobs),'webhooks',(SELECT count(*) FROM webhook_receipts));"))
assert counts == json.loads((root/'expected-counts.json').read_text()), 'Restored row counts differ.'
files = 0
for key, expected in csv.reader(io.StringIO(sql('SELECT storage_key,hash FROM assets ORDER BY id;', True))):
    target = (root/'restored'/'assets'/key).resolve()
    assert target.is_relative_to(root/'restored'/'assets'), 'Unsafe restored asset key.'
    assert hashlib.sha256(target.read_bytes()).hexdigest() == expected, 'Restored original image hash differs.'
    files += 1
report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'passed': True, 'environment': 'existing EC2 PostgreSQL and private local evidence', 'checks': ['Separate scratch database restore', 'Workspace state including financial/audit references matches snapshot SHA-256', 'Session/asset/job/webhook row counts', 'Every restored original matches its database SHA-256'], 'counts': counts, 'verifiedOriginalFiles': files, 'backupDirectory': str(root), 'limitations': 'An on-instance restore rehearsal; off-instance retention and protected configuration remain separate responsibilities.'}
(root/'restore-report.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
PY
echo "Backup and isolated restore check passed. Private snapshots retained at $backup_dir."
