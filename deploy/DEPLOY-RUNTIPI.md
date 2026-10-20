# Déployer Wishlist — Mac mini + Runtipi + Cloudflare

> Déploiement générique (Docker, env, smoke) : voir le [README racine](../README.md).

Domaine : `wishlist.mesdamesduc.fr`  
Port hôte : `8740`

## 0. Avant le Mac mini

Le dépôt Git doit contenir la version à déployer.

Synchroniser aussi `deploy/runtipi/whishlist/` vers `apps/whishlist/` du store
`cloeduc/mesdamesduc-tipi-store`, puis pousser ce store.

## 1. Construire l’image sur le Mac mini

```bash
mkdir -p ~/webserver/repos ~/webserver/data/whishlist
cd ~/webserver/repos
git clone https://github.com/cloeduc/whishlist.git
cd whishlist
docker build --pull -t whishlist:local .
```

## 2. Installer via Runtipi (UI)

Settings → App Stores → `mesdamesduc` → Update → Wishlist → Install :

- image : `whishlist:local`
- URL : `https://wishlist.mesdamesduc.fr`
- secrets session : générés par Runtipi
- Resend / MAIL_FROM : optionnels

## 3. Ou démarrage direct (compose)

```bash
cd ~/webserver/repos/whishlist
cp deploy/compose.prod.yml ~/webserver/repos/whishlist/
# écrire ~/webserver/data/whishlist.env (SESSION + Resend)
export $(grep -v '^#' ~/webserver/data/whishlist.env | xargs)
WHISHLIST_DATA_DIR=$HOME/webserver/data/whishlist \
  docker compose -f deploy/compose.prod.yml --env-file ~/webserver/data/whishlist.env up -d
```

## 4. Cloudflare tunnel

```bash
cloudflared tunnel route dns immich-tunnel wishlist.mesdamesduc.fr
# puis ajouter dans /etc/cloudflared/config.yml :
#   - hostname: wishlist.mesdamesduc.fr
#     service: http://127.0.0.1:8740
# restart cloudflared
```

## 5. Smoke

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: wishlist.mesdamesduc.fr" http://127.0.0.1:8740/
curl -sSI https://wishlist.mesdamesduc.fr
```
