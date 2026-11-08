#!/usr/bin/env bash
# ntfy notification for the Oh, You Shouldn't! ops scripts: notify.sh <title> <message> [priority]
# Optional: without WHISHLIST_NTFY_TOPIC, does nothing. A send failure never makes the caller fail.
# Title and options passed as URL parameters (UTF-8 safe, unlike HTTP headers).
set -uo pipefail

TOPIC="${WHISHLIST_NTFY_TOPIC:-}"
[[ -n "$TOPIC" ]] || exit 0
URL="${WHISHLIST_NTFY_URL:-http://127.0.0.1:8166}"
TOKEN_FILE="${WHISHLIST_NTFY_TOKEN_FILE:-$HOME/webserver/data/whishlist.ntfy-token}"

auth=()
if [[ -r "$TOKEN_FILE" ]]; then
  auth=(-H "Authorization: Bearer $(<"$TOKEN_FILE")")
fi

curl -fsS --max-time 10 ${auth[@]+"${auth[@]}"} \
  --url-query "title=🎁 ${1:-whishlist}" \
  --url-query "priority=${3:-default}" \
  --data-binary "${2:-}" \
  "$URL/$TOPIC" >/dev/null || echo "ntfy: notification not sent ($URL/$TOPIC)" >&2
exit 0
