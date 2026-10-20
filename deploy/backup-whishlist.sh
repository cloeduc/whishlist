#!/usr/bin/env bash
# Backup quotidien du JSON Wishlist.
# - Copie datée mode 600
# - Chiffrement AES si WHISHLIST_BACKUP_PASSPHRASE est set (openssl)
# - Conserve WHISHLIST_BACKUP_KEEP jours (défaut 14)
set -euo pipefail

DATA_DIR="${WHISHLIST_DATA_DIR:-$HOME/webserver/data/whishlist}"
BACKUP_ROOT="${WHISHLIST_BACKUP_DIR:-$HOME/webserver/backups/whishlist}"
KEEP="${WHISHLIST_BACKUP_KEEP:-14}"
SRC="$DATA_DIR/wishlist.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ ! -f "$SRC" ]]; then
  echo "missing $SRC" >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"

if [[ -n "${WHISHLIST_BACKUP_PASSPHRASE:-}" ]]; then
  OUT="$BACKUP_ROOT/wishlist-$STAMP.json.enc"
  openssl enc -aes-256-cbc -pbkdf2 -salt \
    -pass env:WHISHLIST_BACKUP_PASSPHRASE \
    -in "$SRC" -out "$OUT"
  chmod 600 "$OUT"
  echo "encrypted backup: $OUT"
else
  OUT="$BACKUP_ROOT/wishlist-$STAMP.json"
  cp -a "$SRC" "$OUT"
  chmod 600 "$OUT"
  echo "plain backup: $OUT (set WHISHLIST_BACKUP_PASSPHRASE to encrypt)"
fi

# Rétention
find "$BACKUP_ROOT" -type f \( -name 'wishlist-*.json' -o -name 'wishlist-*.json.enc' \) -mtime +"$KEEP" -delete

echo "keep=${KEEP}d — $(find "$BACKUP_ROOT" -type f | wc -l) file(s)"
