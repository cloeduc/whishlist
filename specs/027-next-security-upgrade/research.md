# Recherche : montée de Next.js en 16.4.6 (027)

Faite le 2026-11-18, sur `staging` (next 16.4.2), à partir du registre npm, des notes de version GitHub de `vercel/next.js` (v16.4.3 à v16.4.6) et des avis de sécurité publiés.

## R1. Avis corrigés et exposition du site

16.4.5 (2026-11-03) est la version de sécurité de novembre. Elle corrige sept avis, tous de sévérité modérée. `npm audit --omit=dev` n'en remonte que deux, ceux du ticket : il annonce une plage touchée de 16.2.0 à 16.4.4.

| Avis | Sujet | Exposition du site |
|------|-------|--------------------|
| GHSA-mfr8-8qww-v76h | `'use cache'` appelé via `unstable_cache()` : fuite entre root params | Aucune : ni `'use cache'` ni `unstable_cache` dans le code. |
| GHSA-vc7v-qv4w-wrv8 | `'use cache'` imbriqués : fuite entre root params | Aucune : pas de Cache Components. |
| GHSA-vvgp-ww4w-46vf | Empoisonnement des coquilles de repli (Cache Components) | Aucune : pas de Cache Components. |
| GHSA-rhh4-g77r-r9qj | `use cache` avec arguments binaires | Aucune. |
| GHSA-pc58-hwjq-p385 | Route handler qui renvoie tel quel une réponse récupérée par `fetch`, derrière un proxy HTTP/1.1 : désynchronisation des réponses | **Faible.** `app/u/[...path]/route.ts` relaie Umami (variable optionnelle), mais il reconstruit les en-têtes (`content-type`, `cache-control`, `etag` seulement) : la réponse ne garde pas le cadrage de l'amont. L'amont est choisi par l'exploitant, pas par un visiteur. |
| GHSA-7qx7-33qx-rqx2 | Contournement du refus des SVG dans l'optimisation d'images | Aucune en pratique : `next/image` ne sert que des images locales (`app/guide`, `app/about`), sans `remotePatterns` ni `dangerouslyAllowSVG`. |
| GHSA-f3mh-rxg3-f5g2 | Cookie HttpOnly exposé par un en-tête interne sur le runtime Edge | Aucune : aucune route en `runtime = "edge"`. |

- **Decision** : monter quand même, sans urgence (priorité moyenne du ticket). Le relais Umami ne change pas : la montée suffit à fermer GHSA-pc58.
- **Rationale** : exposition nulle ou faible, mais l'avertissement de `next dev` bloque le premier lancement, et l'audit doit repasser au propre pour qu'une vraie alerte ne soit pas noyée.
- **Alternatives considered** : rester en 16.4.2 en ignorant l'avis (rejeté : l'avertissement revient à chaque lancement, et la feature 015 envisage le cache).

## R2. Version cible : 16.4.6 plutôt que 16.4.5

- **Decision** : `next` 16.4.6, la dist-tag `latest` du 2026-11-09.
- **Rationale** : 16.4.6 ajoute trois correctifs de backport sans nouvelle fonctionnalité (voir R4). C'est la version demandée par le ticket.
- **Alternatives considered** : 16.4.5, la plus petite version qui corrige (rejetée : pas de raison de s'arrêter avant le dernier correctif de la même branche) ; la canary 16.5 (rejetée : pas de changement de branche mineure dans une feature de sécurité).

## R3. Paquets à aligner

`package.json` épingle trois paquets en 16.4.2 :

- `next` (dependencies)
- `@next/env` (dependencies, utilisé par les scripts pour lire `.env`)
- `eslint-config-next` (devDependencies)

Tous trois existent en 16.4.6 sur le registre.

- **Decision** : épingler les trois exactement en `16.4.6`, sans `^`, comme aujourd'hui.
- **Rationale** : garder des versions identiques évite que `@next/env` soit dupliqué dans l'arbre et que les règles de lint divergent du cadre.
- **Alternatives considered** : ne monter que `next` (rejeté : laisse deux versions de `@next/env` dans le lockfile).

Peer dependencies de 16.4.6 : `react`/`react-dom` `^18.2.0 || ^19.0.0`, déjà satisfaites par `^19.1.1`. `engines.node` `>=20.9.0` est déjà le minimum du projet, et l'image part de `node:22`. React ne change pas.

## R4. Changements entre 16.4.2 et 16.4.6 qui touchent le site

| Version | Changement | Effet sur le site | Décision |
|---------|------------|-------------------|----------|
| 16.4.3 | Ne plus charger le runtime app-page dans `proxy.ts` | Le site a un `proxy.ts` (CSP par nonce, redirections des anciennes adresses). Démarrage plus léger, comportement identique attendu. | Vérifier la CSP et les redirections (quickstart, étapes 4 et 5). |
| 16.4.3 | Traces OpenTelemetry regroupées | Pas d'OpenTelemetry. | Rien. |
| 16.4.3 | Ne plus charger React autonome au démarrage du serveur | Concerne le serveur `standalone`, celui de l'image et de `npm start`. | Vérifier le démarrage de l'image (quickstart, étape 3). |
| 16.4.3 | URLs Google Fonts sans extension | `next/font` éventuel : rien à faire. | Rien. |
| 16.4.4 | Le bootstrap Turbopack du resume PPR reçoit le nonce CSP | Pas de PPR. | Rien. |
| 16.4.4 | `fast-jwt` remplace `jsonwebtoken` (outillage interne) | Aucun. | Rien. |
| 16.4.4 | Rechargement si une mise à jour CSS de démarrage Turbopack est manquée | Dev seulement, mieux. | Rien. |
| 16.4.5 | Sept correctifs de sécurité (R1) | Voir R1. | Rien d'autre. |
| 16.4.6 | **Compression automatique des réponses des route handlers non compressées** | Touche l'API `app/api/v1/`, le serveur MCP `app/api/mcp/` (Streamable HTTP, flux possible), le relais Umami et les routes `.well-known`/robots/sitemap. | Vérifier que les réponses JSON restent lisibles par l'app mobile et que le flux MCP n'est pas bloqué par la compression (quickstart, étape 6). Si le MCP casse, le noter et marquer sa réponse comme non compressible. Cette adaptation, prévue par l'Edge Case de la spec, reste dans la feature. |
| 16.4.6 | Correctifs du GC de Turbopack en dev | Dev seulement. | Rien. |

Avant de coder, lire la documentation livrée avec le paquet (`node_modules/next/dist/docs/`, AGENTS.md) une fois en 16.4.6, et repérer toute nouvelle dépréciation affichée par `next build` et `next dev`.

## R5. Lockfile et npm 10

- **Decision** : `npm install --save-exact next@16.4.6 @next/env@16.4.6 eslint-config-next@16.4.6` (ou modification de `package.json` à la main), puis régénérer le lockfile avec `npx npm@10 install --package-lock-only`, et vérifier avec `npx npm@10 ci --dry-run`.
- **Rationale** : la CI (`actions/setup-node`) et l'image Docker (`node:22-bookworm-slim`) utilisent npm 10. Un lockfile écrit par un npm plus récent a déjà fait échouer `npm ci` (mémoire du projet).
- **Alternatives considered** : `npm audit fix --force` (rejeté : il réécrit la plage sans épinglage exact et ne touche ni `@next/env` ni `eslint-config-next`).

## R6. Ce qui ne change pas

- App mobile (`mobile/`) : aucune dépendance à `next`. Ses tests tournent quand même, parce qu'ils lisent `locales/` et des modules du site.
- `next-env.d.ts` : réécrit par `next dev` (`.next/dev/types/…`) et par `next build` (`.next/types/…`). On n'en commite que la version de `next build`, ou on le laisse hors du commit, comme dans les features précédentes.
- Autres vulnérabilités de l'audit (`npm audit` complet, dépendances de dev) : listées dans le compte rendu si elles apparaissent, pas traitées (spec, Edge Cases).

## Constat après montée

### Avant (T001, 2026-11-18)

- `npm ls` : `next`, `@next/env`, `eslint-config-next` en 16.4.2.
- `npm audit --omit=dev` : 1 avis modéré, `next` 16.2.0 – 16.4.4 (GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8).
- `npm audit` complet : 30 avis (15 modérés, 15 élevés), tous sur des dépendances de développement. Non traités ici (spec, Edge Cases) :
  - `shadcn` et ses dépendances (`@dotenvx/dotenvx`, `@shadcn/registry`, `ts-morph`, `fast-glob`, `micromatch`, `picomatch`, `minimatch`) ;
  - `drizzle-kit` (`@esbuild-kit/*`, `esbuild`) ;
  - la chaîne de lint (`@typescript-eslint/*`, `typescript-eslint`, `eslint-import-resolver-typescript`, `tinyglobby`, `fdir`, et `@next/eslint-plugin-next`, que `npm audit` propose de « corriger » en redescendant `eslint-config-next` en 14.2.35) ;
  - `hono`, `@hono/node-server`, `body-parser`, `fast-uri`, `systeminformation`.

  À reprendre dans un ticket à part.

### Montée (T002, T003)

- `package.json` : les trois paquets en `16.4.6` exact.
- Lockfile régénéré avec npm 10.9.11 : seules les 12 entrées `next` / `@next/*` passent de 16.4.2 à 16.4.6, sans autre paquet touché. `npx npm@10 ci --dry-run` passe.

### Documentation et dépréciations (T004, T005)

- `node_modules/next/dist/docs/` : rien de nouveau qui touche le site. Le bloc de `AGENTS.md` n'est pas réécrit.
- Compression (16.4.6) : elle passe par le middleware `compression` de `router-server.js`, actif tant que `compress` n'est pas `false` (le site ne le règle pas). La nouveauté de 16.4.6 est de l'appliquer aussi aux réponses des route handlers. `pipe-readable.js` appelle `res.flush()` après chaque morceau, donc un flux (MCP) n'est pas retenu par la compression. `send-response.js` ne recopie jamais `content-length`, `content-encoding` ni `transfer-encoding` d'une réponse de route handler : c'est le correctif de GHSA-pc58, et le relais Umami en profite.
- `next build` : aucun avertissement ni dépréciation. Lint, types, 465 tests du site, 415 tests de l'app : verts, sans aucune correction de code.

### Audit et serveur de dev (T006)

- `npm audit --omit=dev` : « found 0 vulnerabilities » (FR-003, SC-001).
- `next dev` lancé 3 fois de suite : « Ready » en 160 à 400 ms, `GET /` 200, aucun avertissement de vulnérabilité ni arrêt (SC-002).
