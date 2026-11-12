#!/usr/bin/env bash
# Daily backup of the Oh, You Shouldn't! SQLite database.
# - Consistent hot copy, made inside the container (scripts/db-backup.mjs), without stopping the service
# - Dated copy with mode 600, AES-encrypted if WHISHLIST_BACKUP_PASSPHRASE is set (openssl)
# - Keeps WHISHLIST_BACKUP_KEEP days (default 14), old JSON backups included
# - A failure sends an ntfy notification (deploy/notify.sh, if WHISHLIST_NTFY_TOPIC is set)
set -euo pipefail

DATA_DIR="${WHISHLIST_DATA_DIR:-$HOME/webserver/data/whishlist}"
BACKUP_ROOT="${WHISHLIST_BACKUP_DIR:-$HOME/webserver/backups/whishlist}"
KEEP="${WHISHLIST_BACKUP_KEEP:-14}"
# The running container named whishlist (compose), otherwise the running task of the whishlist Swarm service: Dokploy names
# the service whishlist-<suffix> and its task whishlist-<suffix>.1.<id>.
CONTAINER="${WHISHLIST_CONTAINER:-}"
if [[ -z "$CONTAINER" ]]; then
  if [[ -n "$(docker ps -q --filter 'name=^whishlist$')" ]]; then
    CONTAINER=whishlist
  else
    CONTAINER="$(docker ps --format '{{.Names}}' | grep -E '^whishlist(-[a-z0-9]+)?\.[0-9]+\.' | head -n 1 || true)"
  fi
fi
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_NAME=".backup-$STAMP.db"
SRC="$DATA_DIR/$TMP_NAME"

NOTIFY="$(cd "$(dirname "$0")" && pwd)/notify.sh"
step="database check"

on_exit() {
  local status=$?
  rm -f "$SRC"
  if [[ $status -ne 0 ]]; then
    bash "$NOTIFY" "whishlist backup failed" \
      "Step: $step (code $status), $(hostname) at $(date '+%d/%m %H:%M'). Details in the backups cron.log." high
  fi
  exit "$status"
}
trap on_exit EXIT

if [[ ! -f "$DATA_DIR/wishlist.db" ]]; then
  echo "missing $DATA_DIR/wishlist.db" >&2
  exit 1
fi

step="hot copy in container ${CONTAINER:-whishlist (none running)}"
[[ -n "$CONTAINER" ]]
docker exec "$CONTAINER" node scripts/db-backup.mjs "/data/$TMP_NAME"

step="encryption and copy to $BACKUP_ROOT"

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"

if [[ -n "${WHISHLIST_BACKUP_PASSPHRASE:-}" ]]; then
  OUT="$BACKUP_ROOT/wishlist-$STAMP.db.enc"
  openssl enc -aes-256-cbc -pbkdf2 -salt \
    -pass env:WHISHLIST_BACKUP_PASSPHRASE \
    -in "$SRC" -out "$OUT"
  chmod 600 "$OUT"
  echo "encrypted backup: $OUT"
else
  OUT="$BACKUP_ROOT/wishlist-$STAMP.db"
  cp "$SRC" "$OUT"
  chmod 600 "$OUT"
  echo "plain backup: $OUT (set WHISHLIST_BACKUP_PASSPHRASE to encrypt)"
fi

# Retention
step="retention"
find "$BACKUP_ROOT" -type f \( -name 'wishlist-*.json' -o -name 'wishlist-*.json.enc' \
  -o -name 'wishlist-*.db' -o -name 'wishlist-*.db.enc' \) -mtime +"$KEEP" -delete

echo "keep=${KEEP}d — $(find "$BACKUP_ROOT" -type f | wc -l) file(s)"
