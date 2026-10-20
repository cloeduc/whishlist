#!/bin/bash
# Bootstrap Wishlist sur le Mac mini (image + compose + tunnel DNS/ingress).
set -euo pipefail

REPO="${HOME}/webserver/repos/whishlist"
DATA_DIR="${HOME}/webserver/data/whishlist"
ENV_FILE="${HOME}/webserver/data/whishlist.env"
DOMAIN="${WHISHLIST_DOMAIN:-wishlist.mesdamesduc.fr}"
PORT="${WHISHLIST_PORT:-8740}"
TUNNEL_NAME="${WHISHLIST_TUNNEL:-immich-tunnel}"

mkdir -p "$DATA_DIR" "$(dirname "$ENV_FILE")" "$REPO"

if [[ ! -d "$REPO/.git" ]]; then
  git clone https://github.com/cloeduc/whishlist.git "$REPO"
fi

cd "$REPO"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "== docker build =="
DOCKER_BUILDKIT=0 docker build --pull -t whishlist:local .

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (WHISHLIST_SESSION_SECRET, optional RESEND)"
  exit 1
fi

echo "== compose up =="
WHISHLIST_DATA_DIR="$DATA_DIR" docker compose \
  -f deploy/compose.prod.yml \
  --env-file "$ENV_FILE" \
  up -d --force-recreate --pull never

echo "== cloudflared DNS =="
cloudflared tunnel route dns -f "$TUNNEL_NAME" "$DOMAIN" || true

echo "== patch cloudflared ingress =="
docker run --rm \
  -v "$REPO/deploy/patch-cloudflared.py":/patch.py:ro \
  -v /etc/cloudflared:/cf \
  python:3.12-alpine python /patch.py /cf/config.yml "$DOMAIN" "http://127.0.0.1:${PORT}"

echo "== restart cloudflared =="
docker run --rm --privileged --pid=host alpine:3.21 \
  nsenter -t 1 -m -u -i -n sh -c 'systemctl restart cloudflared && systemctl is-active cloudflared'

ok=0
for i in $(seq 1 20); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" -H "Host: ${DOMAIN}" "http://127.0.0.1:${PORT}/" || true)
  echo "try $i -> $code"
  if [[ "$code" == "200" ]]; then ok=1; break; fi
  sleep 3
done
test "$ok" = "1"
echo "OK local. Public: https://${DOMAIN}"
