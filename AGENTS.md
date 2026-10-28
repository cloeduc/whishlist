# Guide des agents

> **Avant une nouvelle fonctionnalité, lancer `/speckit-specify <description>`.** Pour un bug, commencer par `/speckit-bug-assess`. La constitution (`.specify/memory/constitution.md`) prime sur ce guide quand ils divergent.

## Commandes

- Installation : `npm ci`
- Dev : `npm run dev` (http://localhost:3000, données dans `data/wishlist.json`)
- Lint : `npm run lint`
- Types : `npm run typecheck`
- Tests : `npm test` (tous les fichiers `tests/domain/*.test.ts`)
- Build prod : `npm run build`
- Données de démo : `npm run demo:data -- tmp/demo-wishlist.json` puis `WISHLIST_DATA_PATH=tmp/demo-wishlist.json npm run dev` (`DEMO_PASSWORD` obligatoire)
- Captures du guide : `DEMO_BASE_URL=http://localhost:3010 npm run demo:capture` (écrit `public/guide/{fr,en}`)
- Image Docker : `docker build -t whishlist:local .` (déploiement : `README.md` et `deploy/DEPLOY-RUNTIPI.md`)

## Fichiers générés

La revue de code les ignore :

- `next-env.d.ts`, `package-lock.json`, `.next/`
- `public/guide/**` (captures produites par `demo:capture`)
- `.claude/skills/speckit-*`, `.specify/scripts/`, `.specify/templates/`, `.specify/extensions/` (installés par Spec Kit)

## Conventions

- **Couches** :
  - `src/domain/` : règles métier en fonctions pures sur `Database`, testées.
  - `src/store/db.ts` : seul accès au fichier JSON. Une écriture passe par `updateDocument` (verrou fichier), jamais par un `writeFile` direct.
  - `src/server/commands/` : orchestration partagée par les server actions et l'API, sans dépendance à Next (ni `cookies()`, ni `headers()`, ni `redirect()`). Chaque commande reçoit un `CommandContext` (compte, IP, langue, origine), vérifie le compte (`activeUser`), l'appartenance à la liste (`findMembership`) ou l'accès public (`canAccessPublicListWith`), limite le débit des actions sensibles (`rateLimitForIp`), et rend `{ ok, … } | { ok: false, error }`.
  - `src/server/actions.ts` : server actions, adaptateurs du site : FormData → commande → redirection et cookies.
  - `app/api/v1/` et `src/server/api/` : API JSON, adaptateurs : `withApi` → corps JSON → commande → `apiJson` / `apiError`. Une route se décrit d'abord dans le contrat `specs/004-mobile-api/contracts/openapi.yaml` ; `tests/domain/api-contract.test.ts` vérifie que chaque opération a sa route.
  - `src/auth/` : session, cookies, accès aux listes publiques.
  - `app/` : pages App Router, sans règle métier.
- **HTTP sortant** : toujours via `safeHttpGet` / `assertSafeFetchUrl` (`src/domain/safe-http.ts`), jamais un `fetch` direct sur une URL fournie par l'utilisateur.
- **UI** : primitives dans `components/ui/` (shadcn, Base UI) ; composants métier dans `components/site/`. Réutiliser l'existant avant d'en créer.
- **i18n** :
  - Toute chaîne visible passe par i18next : `useTranslation` côté client, `getTranslations` côté serveur, `translateError` pour les codes d'erreur.
  - Les fichiers `locales/fr/<ns>.json` et `locales/en/<ns>.json` ont les mêmes clés. Les namespaces sont dans `src/i18n/config.ts`.
  - Le français vouvoie et garde le lexique du produit (« J'offre », « qui », « idée », « liste »).
  - Les liens internes passent par `withLocale` (une URL par langue).
- **Langue du code** : identifiants en anglais. Les commentaires peuvent être en français ou en anglais.
- **Variables d'environnement** : une nouvelle variable est ajoutée au tableau du `README.md`, à `.env.example` et à `deploy/compose.prod.yml` (préfixe `WHISHLIST_`). Un service externe reste optionnel : sans sa variable, l'app marche sans lui.
- **Données** : aucune donnée personnelle ni identifiant réel dans le dépôt. `data/seed.json` et la démo n'utilisent que des comptes fictifs (`@example.test`).
- **Commits** : en français, préfixés `feat:`, `fix:` ou `chore:`.

## Tests

- `node:test` + `tsx`, dans `tests/domain/<module>.test.ts`. Un test qui touche le store travaille sur un fichier temporaire (`mkdtemp`), jamais sur `data/wishlist.json`.
- Chaque règle métier et chaque cas limite (validation, erreur, limite, droit d'accès) a un test de domaine.
- Il n'y a pas de test e2e : un parcours utilisateur se vérifie à la main sur la base de démo, décrit dans le `quickstart.md` de la feature (principe IV : une tranche n'est faite que si un parcours réel la confirme).

## Workflow

- Fonctionnalités : `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` → revue de code (`wishlist-feature-review`, lancée par le hook `after_implement`).
- Bugs : `/speckit-bug-assess` → `/speckit-bug-fix` → `/speckit-bug-test` (rapports dans `.specify/bugs/<slug>/`).
- Le `review.md` de la feature est commité avec le code ; `.specify/feature.json` reste local (ignoré par Spec Kit).

Hooks Spec Kit (`.specify/extensions.yml`) : lancer `wishlist.feature-review` (le skill `wishlist-feature-review`) sans demander, car il ne fait que rapporter et ne change rien avant que l'utilisateur choisisse les points à corriger. Ne lancer aucun autre hook sans l'accord explicite de l'utilisateur : montrer la commande exacte et attendre un oui. Cette règle prime sur les skills speckit, qui demandent de lancer les hooks obligatoires automatiquement.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
