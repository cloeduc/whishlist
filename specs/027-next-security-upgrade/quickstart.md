# Quickstart : vérifier la montée de Next.js en 16.4.6 (027)

Chaque étape se fait après la montée, sur la branche `027-next-security-upgrade`. Les étapes 1 et 2 valident l'US1, les étapes 3 à 7 l'US2. Le site n'a pas de tests e2e : les parcours se font à la main sur la base de démo (principe IV).

## Prérequis

- Node 22, dépendances installées avec `npm ci`.
- Docker lancé (étape 3).
- `DEMO_PASSWORD` défini dans le shell.

## 1. Dépendances et audit (US1, scénarios 1 et 4)

```sh
npm ls next @next/env eslint-config-next   # tous trois en 16.4.6, sans doublon
npm audit --omit=dev                        # aucun avis sur next
npx npm@10 ci --dry-run                     # le lockfile s'installe avec npm 10
```

Attendu : plus de GHSA-mfr8-8qww-v76h ni de GHSA-vc7v-qv4w-wrv8. Si l'audit signale d'autres paquets, on les note dans le compte rendu sans les traiter.

## 2. Contrôles du dépôt et serveur de dev (US1, scénarios 2 et 3)

```sh
npm run lint && npm run typecheck && npm test && npm run build
npm --prefix mobile run test
npm run dev   # 3 fois de suite, en arrêtant entre chaque
```

Attendu : tout est vert. `next build` n'affiche aucune nouvelle dépréciation. `next dev` démarre du premier coup, sans s'arrêter et sans avertissement de vulnérabilité.

## 3. Image Docker (US2, scénario 1)

```sh
docker build -t whishlist:027 .
npm run demo:data -- tmp/demo-wishlist.json
docker run --rm -p 3011:3000 -v "$PWD/tmp:/data" \
  -e WISHLIST_DATA_PATH=/data/demo-wishlist.json -e DEMO_PASSWORD whishlist:027
```

Attendu : le conteneur démarre, `http://localhost:3011` répond, et les données de démo s'affichent. Adapter les variables au tableau du `README.md` si l'image en demande d'autres.

## 4. Parcours visiteur sans compte (US2, scénario 2)

Sur l'image (ou sur `WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev`) :

1. Ouvrir une liste publique de démo sans être connecté : même contenu et même apparence qu'avant.
2. Réserver une idée (« J'offre »), avec un nom et un petit mot : la réservation est enregistrée.
3. Ouvrir une ancienne adresse française (par exemple `/listes`) : redirection vers l'adresse anglaise.
4. Dans les outils du navigateur, vérifier l'en-tête `Content-Security-Policy` avec son nonce, et vérifier que la console ne signale aucun script bloqué.

## 5. Parcours membre (US2, scénario 3)

1. Se connecter avec `alex@example.test` / `DEMO_PASSWORD`.
2. Créer une liste, puis une idée avec un lien.
3. Passer en anglais, puis revenir en français : les pages et les adresses suivent la langue.
4. Ouvrir `/guide` et `/about` : les images s'affichent (optimisation d'images).

## 6. API, MCP et compression (US2, scénario 4 ; R4 de `research.md`)

```sh
curl -si -H 'Accept-Encoding: gzip' http://localhost:3011/api/v1/capabilities | head -20
curl -s --compressed http://localhost:3011/api/v1/capabilities
```

Attendu : la réponse JSON est la même qu'avant. Elle peut maintenant arriver compressée (`Content-Encoding: gzip`), et elle se décompresse correctement.

- App mobile : la pointer sur le serveur (`EXPO_PUBLIC_API_URL=http://localhost:3011`), se connecter, ouvrir une liste et ajouter une idée.
- MCP : avec une clé d'API de démo créée dans `/account`, envoyer `initialize` à `/api/mcp` (en-tête `Authorization: Bearer oys_…`, `Accept: application/json, text/event-stream`). Vérifier que la réponse arrive entière et sans blocage.

## 7. Relais Umami (si configuré)

Avec la variable Umami du `README.md` définie, ouvrir une page du site et vérifier que `/u/script.js` se charge et que `/u/api/send` répond `2xx`. Sans la variable, ces routes répondent `404`, comme avant.
