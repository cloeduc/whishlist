# Wishlist

Listes de cadeaux partagées : lecture publique sans compte, édition à plusieurs avec compte, réservations anonymes (« J’offre »), catégories / « qui », archives, i18n FR/EN, enrichissement produit depuis une URL (Gemini / OpenAI).

Stack : **Next.js 15** (App Router) · **React 19** · stock JSON fichier · Docker standalone.

---

## Prérequis

- Node **≥ 20** (dev local)
- Docker (déploiement recommandé)
- Un secret de session (≥ 32 caractères aléatoires)

Optionnel :

- [Resend](https://resend.com) — mails (reset MDP, invitations)
- Clé **Gemini** ou **OpenAI** — bouton « Récupérer les infos » sur un lien produit

---

## Démarrage local

```bash
git clone https://github.com/cloeduc/whishlist.git
cd whishlist
cp .env.example .env
# Éditer .env : au minimum SESSION_SECRET=...
npm ci
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

```bash
npm test          # tests domaine
npm run build     # build prod local
```

Données locales : `data/wishlist.json` (créé au premier lancement).

---

## Variables d’environnement

| Variable | Requis | Rôle |
|---|---|---|
| `SESSION_SECRET` | **oui** | Signature des cookies de session |
| `APP_ORIGIN` | prod | URL publique (`https://wishlist.mesdamesduc.fr`) pour mails / liens de partage |
| `SUPPORT_URL` | non | Payment Link Stripe (« Soutenir le projet ») |
| `WISHLIST_DATA_PATH` | non | Chemin du JSON (défaut `data/wishlist.json`) |
| `RESEND_API_KEY` | non | Envoi d’e-mails |
| `MAIL_FROM` | non | Expéditeur Resend, ex. `Wishlist <noreply@domaine.fr>` |
| `PASSWORD_RESET_SHOW_LINK` | non | `1` = affiche le lien reset dans l’UI si mail KO (dev) |
| `GEMINI_API_KEY` | non | Enrichissement URL (prioritaire si les deux clés sont set) |
| `OPENAI_API_KEY` | non | Enrichissement URL (fallback) |
| `GEMINI_MODEL` / `OPENAI_MODEL` | non | Override modèles |

En Docker / compose, les mêmes valeurs sont souvent préfixées `WHISHLIST_*` dans le fichier env hôte (voir `deploy/compose.prod.yml`).

---

## Déploiement Docker (chemin simple)

### 1. Build

```bash
docker build -t whishlist:local .
```

### 2. Fichier env

```bash
mkdir -p ./data-prod
cat > whishlist.env <<'EOF'
WHISHLIST_SESSION_SECRET=change-moi-par-une-longue-chaine-aleatoire
WHISHLIST_APP_ORIGIN=https://wishlist.mesdamesduc.fr
# WHISHLIST_RESEND_API_KEY=re_...
# WHISHLIST_MAIL_FROM=Wishlist <noreply@exemple.fr>
# WHISHLIST_GEMINI_API_KEY=...
# WHISHLIST_OPENAI_API_KEY=...
EOF
```

### 3. Lancer

```bash
WHISHLIST_DATA_DIR=./data-prod docker compose \
  -f deploy/compose.prod.yml \
  --env-file whishlist.env \
  up -d
```

App sur **http://localhost:8740** (port hôte configurable dans `deploy/compose.prod.yml`).

Persistance : volume `WHISHLIST_DATA_DIR` → `/data/wishlist.json` dans le conteneur (`user 1000:1000`). Le JSON est écrit en mode `0600` (owner only) quand le FS le permet.

Ops Mac mini : `deploy/harden-data.sh`, `deploy/backup-whishlist.sh` (AES si `WHISHLIST_BACKUP_PASSPHRASE`), `deploy/ops-check.sh` — détails dans [`deploy/DEPLOY-RUNTIPI.md`](deploy/DEPLOY-RUNTIPI.md).

### 4. Smoke

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8740/
```

Attendu : `200`.

### Mise à jour

```bash
git pull
docker build -t whishlist:local .
WHISHLIST_DATA_DIR=./data-prod docker compose \
  -f deploy/compose.prod.yml \
  --env-file whishlist.env \
  up -d --force-recreate --pull never
```

---

## Derrière un reverse proxy / tunnel

Expose le port **8740** (ou celui que tu as choisi) en HTTPS.

Exemple Cloudflare Tunnel : hostname public → `http://127.0.0.1:8740`.

Sur le Mac mini de prod, le script tout-en-un est :

```bash
bash deploy/bootstrap-mini.sh
```

Détails Runtipi + Cloudflare : [`deploy/DEPLOY-RUNTIPI.md`](deploy/DEPLOY-RUNTIPI.md).

---

## Premiers pas après install

1. Ouvre l’URL → **Inscription**
2. Crée une liste vide, ajoute des idées
3. **Partage** : copie le lien de lecture (`/l/...`) ; invitation / e-mail pour co-éditer
4. **Réglages** : catégories et « qui » en chips ; suppression de liste
5. Langue : bouton **FR / EN** dans le header (`?lang=en` force l’anglais)

Sans Resend : les liens de reset MDP partent dans `data/password-reset.log` (ou le volume `/data`).

---

## Fonctionnalités (résumé)

| Zone | Contenu |
|---|---|
| Public `/l/[token]` | Filtres qui / budget, « J’offre », lien d’achat, réservations masquées |
| Admin | Kanban par catégorie, archives, réservations, partage, réglages |
| Enrichissement | Scraping OG/JSON-LD + LLM (nom, prix, image, type) |
| Auth | Compte, reset MDP, force changement MDP 1ʳᵉ connexion, invitations |

---

## Structure utile

```
app/                  # pages Next
components/site/      # UI métier
src/domain/           # règles métier (testées)
src/store/            # JSON + lock fichier
locales/{fr,en}/      # i18n
deploy/               # compose, bootstrap, Runtipi
data/seed.json        # fixture de test uniquement (pas d’import produit)
```

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Cloé / Mesdames Duc.
