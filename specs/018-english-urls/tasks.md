---

description: "Tasks: adresses du site en anglais"
---

# Tasks: Adresses du site en anglais

**Input**: Design documents from `specs/018-english-urls/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/addresses.md, quickstart.md

**Tests**: demandés par le plan et par AGENTS.md (chaque règle et cas limite a un test de domaine ; une story de l'app a son parcours Maestro).

**Organization**: une phase par user story ; la table des adresses (Phase 2) sert aux deux.

## Un commit par user story (règle du projet)

Chaque phase de user story se termine par une tâche **« Commit de la story »**, la dernière de la phase. Règles :

- Les phases Setup et Foundational n'ont pas de commit propre : elles entrent dans le commit de la première story.
- Chaque commit est vert (lint, types, tests). Un test existant à adapter va dans le commit de la story qui rend l'adaptation nécessaire.
- Un fichier modifié par deux stories est commité en deux temps (seulement les changements de la story en cours).
- La phase Polish a son propre commit (`chore:` ou `feat:` selon le contenu). Les corrections de la revue lancée par le hook `after_implement` forment un commit à part, `fix: corrections de la revue`, avec `review.md`.
- Message en anglais, préfixé `feat:`, `fix:` ou `chore:`, terminé par `(USn)`.
- Le commit se crée sans demander l'accord : une fois la story verte, on commite et on passe à la suivante. Si une vérification échoue, on corrige avant de commiter ; on ne commite jamais un état rouge. Le commit Polish suit la même règle. Seuls le push et le squash sur `main` attendent l'utilisateur.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallélisable (fichiers différents, pas de dépendance en cours)
- **[Story]**: US1 (site), US2 (app)

## Repères

- Table des adresses : `spec.md` § « Nouvelles adresses », `data-model.md` (format JSON et règles), `contracts/addresses.md` (comportement HTTP et exemples).
- Toute commande `node --import tsx` qui charge `src/server/` prend `--conditions=react-server` (AGENTS.md).
- Avant de toucher `proxy.ts` ou les dossiers de `app/`, lire le guide concerné dans `node_modules/next/dist/docs/` (Next 16 : `proxy`, routage par dossiers).
- Code, commentaires et descriptions de tests en anglais ; documentation en français.

---

## Phase 1: Setup

**Purpose**: rien à installer ; vérifier la base de départ.

- [X] T001 Dans le worktree `/Users/tatiana/Workspace/perso/whishlist-018-english-urls`, lancer `npm ci` et `npm --prefix mobile ci`, puis `npm run lint && npm run typecheck && npm test` et `npm --prefix mobile test` pour noter l'état vert de départ

---

## Phase 2: Foundational (table des anciennes adresses)

**Purpose**: la table et la fonction pure qui la lit, utilisées par l'US1 (redirections, `next`) et l'US2 (liens de l'app).

**⚠️ CRITICAL**: bloque les deux stories.

- [X] T002 Créer `src/site/legacy-paths.json` exactement comme dans `data-model.md` : `paths` (13 lignes, de `{ "from": "/listes", "to": "/lists" }` à `{ "from": "/projet", "to": "/about" }`, dont `{ "from": "/l/:readToken/reserver", "to": "/l/:readToken/reserve" }`) et `params` (`onglet` → `tab` avec `values` `{ "idees": "ideas", "archives": "archive", "reservations": "reservations", "partage": "sharing", "reglages": "settings" }` ; `suite` → `next` avec `"path": true` ; `next` → `next` avec `"path": true` ; `lien` → `link` ; `envoi` → `mail` avec `values` `{ "echec": "failed" }` ; `sansmail` → `nomail` ; `compte` → `own`)
- [X] T003 Écrire `src/site/legacy-paths.ts` (module pur, sans `server-only`, importable par l'app) : `canonicalSitePath(path, search): { path: string; search: string; changed: boolean }` selon les règles de `data-model.md` — `path` sans préfixe de langue ; `from` comparé segment par segment comme préfixe (`/listes` couvre `/listes/new` et `/listes/<id>`, pas `/listesX`) ; `:param` accepte un segment non vide et se recopie ; première ligne qui correspond ; paramètre `from` renommé en `to` (si `to` existe déjà, l'ancien est retiré) ; `values` traduit une valeur connue, garde une valeur inconnue ; `path: true` traduit la valeur si `internalPath()` (`src/i18n/locale-path.ts`) l'accepte, en gardant son propre préfixe `/en` et sa requête, sinon la laisse telle quelle ; autres paramètres et leur ordre gardés ; `search` rendu avec `?` ou vide. Exporter aussi `canonicalInternalPath(value: string | null): string | null` (adresse interne complète, avec `/en` et requête → forme canonique ; `null` si `internalPath` la refuse)
- [X] T004 [P] Écrire `tests/domain/legacy-paths.test.ts` : une assertion par ligne de `paths` (avec reste de chemin : `/compte/export` → `/account/export`, `/listes/abc` → `/lists/abc`, `/l/R/reserver` → `/l/R/reserve`) ; `/listesX`, `/lists/abc`, `/l/R`, `/l/R/types`, `/faq` inchangés (`changed: false`) ; paramètres : `onglet=partage` → `tab=sharing`, `onglet=inconnu` → `tab=inconnu`, `onglet` + `tab` présents → `onglet` retiré, `suite=/inviter/I` → `next=/invite/I`, `next=/en/listes/abc?onglet=partage` → `next=/en/lists/abc?tab=sharing`, `next=https://evil.test` et `next=//evil.test` laissés tels quels, `envoi=echec` → `mail=failed`, `e=forbidden` gardé, ordre gardé ; invariants : aucun `to` n'est le `from` d'une ligne, aucun mot d'un `from` n'apparaît dans un `to`, chaque `to` (premier segment, `:param` → `[…]`) correspond à un dossier de `app/` après la Phase 3 (test écrit maintenant, attendu rouge jusqu'à T009), aucun `from` n'est un dossier de `app/`

**Checkpoint**: `node --conditions=react-server --import tsx --test tests/domain/legacy-paths.test.ts` vert, sauf l'invariant des dossiers.

---

## Phase 3: User Story 1 - Le site a des adresses en anglais, et les anciennes y mènent (Priority: P1) 🎯 MVP

**Goal**: toutes les pages sous leur nouvelle adresse, tous les liens produits à jour, toute ancienne adresse redirigée en un seul saut.

**Independent Test**: `quickstart.md` § US1 (parcours FR/EN, e-mails, boucle `curl` des anciennes adresses, plan du site). L'app n'est pas touchée : `app-link-routes.json` garde les anciennes formes.

### Tests for User Story 1

- [X] T005 [P] [US1] Compléter `tests/domain/locale-path.test.ts` pour `decideLocaleRoute({ pathname, search, nextUrl, method })` : `GET /compte` → redirect 301 `/account` ; `GET /en/compte/export` → 301 `/en/account/export` ; `GET /fr/listes/abc?onglet=partage` → 301 `/lists/abc?tab=sharing` (un seul saut) ; `GET /connexion?next=%2Flistes%2Fabc&lang=en` → 301 `/en/login?next=%2Flists%2Fabc` ; `GET /lists/abc?onglet=partage` → 301 `/lists/abc?tab=sharing` ; `POST /listes/abc` → `rewrite` vers `/lists/abc` (locale `fr`), `POST /en/compte` → `rewrite` `/account` (locale `en`) ; `HEAD` comme `GET` ; `/`, `/faq`, `/l/R`, `/lists/abc` → pas de redirection ; les cas existants (`?lang=`, `/fr`, navigation depuis `/en`) restent verts ; `method` absent = `GET`

### Implementation for User Story 1

- [X] T006 [US1] Dans `src/i18n/locale-path.ts`, ajouter `method?: string` à l'entrée de `decideLocaleRoute` et appliquer `canonicalSitePath()` au chemin sans préfixe et à la requête (après retrait de `lang`) avant les autres décisions : si `changed` ou `lang` ou `/fr`, une seule décision `redirect` 301 vers `withLocale(langue, nouveau chemin)` + nouvelle requête pour `GET`/`HEAD` ; pour une autre méthode et un chemin changé, décision `rewrite` vers le nouveau chemin (requête traduite), avec la langue de l'adresse (research R1, R3)
- [X] T007 [US1] Dans `proxy.ts`, passer `method: request.method` à `decideLocaleRoute` ; vérifier que la branche `rewrite` couvre aussi le français sans préfixe (aujourd'hui elle ne sert qu'à `/en`)
- [X] T008 [US1] Renommer les dossiers de pages avec `git mv` : `app/listes` → `app/lists`, `app/compte` → `app/account`, `app/inscription` → `app/register`, `app/connexion` → `app/login`, `app/mot-de-passe-oublie` → `app/forgot-password`, `app/changer-mot-de-passe` → `app/change-password`, `app/reinitialiser` → `app/reset-password`, `app/confirmer-email` → `app/confirm-email`, `app/inviter` → `app/invite`, `app/mentions-legales` → `app/legal-notice`, `app/donnees-personnelles` → `app/privacy`, `app/projet` → `app/about`, `app/l/[readToken]/reserver` → `app/l/[readToken]/reserve` ; corriger les imports relatifs cassés ; vérifier qu'aucun nouveau nom ne recouvre un dossier existant (`app/api`, `app/u`, `app/l`)
- [X] T009 [US1] Dans les pages renommées, remplacer chaque adresse française par la nouvelle (liens, `redirect()`, `href`, `withLocale`, métadonnées canoniques/alternates) : `app/lists/[id]/page.tsx` (`onglet` → `tab` dans `searchParams`, `parseTab` et l'URL d'onglet, valeurs `ideas`/`archive`/`reservations`/`sharing`/`settings`, `fields={{ …, tab: "sharing" }}` etc.), `app/lists/new/page.tsx`, `app/account/page.tsx` (ancres `id="keys"`, `"data"`, `"delete"`), `app/account/export/route.ts`, `app/register/page.tsx` (`lien` → `link`, `envoi=echec` → `mail=failed`), `app/login/page.tsx`, `app/forgot-password/page.tsx` (`lien` → `link`, `sansmail` → `nomail`), `app/change-password/page.tsx`, `app/reset-password/[token]/page.tsx`, `app/confirm-email/[token]/page.tsx` (`suite` → `next`, `compte` → `own`, test d'invitation sur `/invite/`), `app/invite/[token]/page.tsx`, `app/legal-notice/page.tsx`, `app/privacy/page.tsx`, `app/about/page.tsx`, `app/l/[readToken]/page.tsx`, `app/guide/page.tsx`, `app/page.tsx` (ancre `#following`), `app/layout.tsx` (`#contenu` → `#content`)
- [X] T010 [P] [US1] Mettre à jour les composants du site : `components/site/site-nav.tsx`, `site-footer.tsx`, `email-verification-banner.tsx`, `guest-hero.tsx`, `public-item-card.tsx` (`/l/<jeton>/reserve`), `dev-link-alert.tsx`, `ideas-accordion.tsx`, `item-form.tsx` (prop et champ caché `onglet` → `tab`, défaut `"ideas"`), `invite-email-form.tsx`, `read-password-form.tsx`, `appearance-form.tsx` (champ caché `tab`, valeurs `sharing`/`settings`)
- [X] T011 [US1] Dans `src/server/actions.ts` : toutes les adresses de redirection en anglais (`/account`, `/login`, `/register`, `/forgot-password`, `/lists/…`, `/change-password`…), ancres `#keys`/`#delete`, paramètres `link`, `mail=failed`, `nomail=1`, `own=1` ; remplacer `ADMIN_ONGLETS` par l'ensemble `ideas`, `archive`, `reservations`, `sharing`, `settings`, lire le champ `tab` puis `onglet` à défaut, et traduire la valeur par la table (`legacy-paths.json`, `params[onglet].values`) ; `confirmEmailAction` lit `next` puis `suite` ; `nextPath()` passe par `canonicalInternalPath()` (une ancienne adresse de renvoi mène à la nouvelle page, une adresse externe reste refusée) (R4)
- [X] T012 [P] [US1] Mettre à jour les adresses produites côté serveur : `src/auth/guard.ts` (`/login`, `/account`), `src/server/commands/auth.ts` (`loginUrl` → `/login`, `resetUrl` → `/reset-password/…`), `src/server/commands/email.ts` (`/confirm-email/…?next=`, valeur `suite` d'entrée passée par `canonicalInternalPath()` ; le champ `suite` de l'API reste nommé ainsi, contrat inchangé), `src/server/commands/sharing.ts` et `src/server/api/views.ts` (`/invite/…`), `src/server/mail.ts`, `app/api/v1/auth/email-confirmation/route.ts` (commentaires seulement si besoin), `src/domain/read-link.ts` (reconnaît `/l/<jeton>/reserve` et l'ancien `reserver`)
- [X] T013 [P] [US1] `app/sitemap.ts` : `PATHS = ["/", "/about", "/faq", "/guide", "/legal-notice", "/privacy"]` ; `app/robots.ts` : interdire les nouveaux préfixes privés (`/invite/`, `/reset-password/`, `/confirm-email/`, `/account`, `/lists/`, `/login`, `/register`… avec `/en`) et garder les anciens (R7) ; `src/site/analytics-public.ts` : nouveaux préfixes à masquer
- [X] T014 [US1] Adapter les tests existants qui citent les anciennes adresses ou `onglet`/`suite` : `tests/domain/commands-email.test.ts`, `commands-sharing.test.ts`, `commands-lists.test.ts`, `commands-subscription.test.ts`, `subscription.test.ts`, `analytics.test.ts`, `dev-link.test.ts`, `form-state.test.ts`, `mail-config.test.ts`, `helpers/api-fixtures.ts` ; ajouter à `tests/domain/` un test de `nextPath`/`canonicalInternalPath` côté action si `actions.ts` n'est pas testable directement (sinon le couvrir dans `legacy-paths.test.ts`) ; `app-links.test.ts` reste inchangé (US2)
- [X] T015 [P] [US1] Scripts : `scripts/capture-demo.mjs` (adresses parcourues pour les captures) et `scripts/test-reset-mail.ts` ; ne pas refaire les captures (`public/guide/**` ne montre pas d'adresse)
- [X] T016 [US1] Vérifier qu'il ne reste aucune adresse française produite : `grep -rnE "/(listes|compte|inscription|connexion|inviter|reinitialiser|confirmer-email|mot-de-passe-oublie|changer-mot-de-passe|mentions-legales|donnees-personnelles|projet|reserver)\b|onglet|[?&](suite|lien|envoi|sansmail|compte)=" app components src scripts proxy.ts` ne doit plus trouver que `src/site/legacy-paths.json`, `src/site/app-link-routes.json` et `src/site/app-links.ts` (US2) et des commentaires qui citent l'ancienne forme exprès
- [X] T017 [US1] Parcours `quickstart.md` § US1 sur la base de démo (port 3010), en français et en anglais : parcours de navigation, e-mails en mode développement, boucle `curl` des anciennes adresses (301 en un saut vers l'adresse du contrat), lien généré sur `main` puis ouvert sur la branche, formulaire de l'onglet Partage envoyé depuis une page ouverte avant le redémarrage, `sitemap.xml` et `robots.txt` ; noter tout écart et le corriger
- [X] T018 [US1] Commit de la story : `npm run lint`, `npm run typecheck`, `npm test` et `npm --prefix mobile test` verts, puis créer le commit `feat: serve the website under English addresses and redirect the old ones (US1)` des fichiers des Phases 1-3, sans demander

**Checkpoint**: le site est livrable seul ; l'app ouvre toujours les anciennes adresses, les nouvelles ouvrent le site.

---

## Phase 4: User Story 2 - L'app ouvre les nouveaux liens, et toujours les anciens (Priority: P2)

**Goal**: l'app reconnaît les deux formes de chaque lien, les déclare à iOS et Android, et ouvre le site sur les nouvelles adresses.

**Independent Test**: `quickstart.md` § US2 (liens des deux formes sur le simulateur, liens de l'app vers le site, parcours Maestro).

### Tests for User Story 2

- [X] T019 [P] [US2] Compléter `tests/domain/app-links.test.ts` : chaque route sous sa nouvelle forme et son ancienne (`/confirmer-email/T?suite=%2Finviter%2FI` → `/links/confirm-email/T?next=%2Finvite%2FI`, `/reinitialiser/T`, `/inviter/T`, `/connexion?next=/inviter/I`, `/inscription`, `/l/R/reserver?itemId=X`, avec et sans `/en`, par `https://<hôte>`, `ohyoushouldnt://` et chemin nu) → même écran ; `/lists/abc` et `/listes/abc` → `null` ; `appleAssociation()` contient les composants des deux formes, avec et sans `/en` ; `androidPathPrefixes()` contient les anciens et les nouveaux préfixes
- [X] T020 [P] [US2] Compléter `mobile/__tests__/links/native-intent.test.ts` (deux formes de chaque lien) et adapter `mobile/__tests__/screens/links-confirm-email.test.tsx` (paramètre `next`), `login.test.tsx`, `guest-reserve.test.tsx`, `mobile/__tests__/features/incoming-share.test.tsx` ; le test de `app.config.ts` compare toujours `APP_LINK_PREFIXES` à `androidPathPrefixes()`

### Implementation for User Story 2

- [X] T021 [US2] `src/site/app-link-routes.json` aux nouvelles adresses, comme `data-model.md` § « Table des liens de l'app » : `/confirm-email/:token` (`keepQuery` `["next"]`), `/reset-password/:token`, `/invite/:token`, `/login` (`["next"]`), `/register` (`["next"]`), `/l/:readToken` (`["typeId"]`), `/l/:readToken/reserve` (`["itemId", "typeId"]`), `/l/:readToken/types` (`["typeId"]`)
- [X] T022 [US2] Dans `src/site/app-links.ts` : `appPathForSiteUrl` passe le chemin (sans `/en`) et la requête par `canonicalSitePath()` avant de chercher la route ; ajouter à `src/site/legacy-paths.ts` `legacySitePatterns(sitePatterns)` (anciens motifs des lignes de `paths` dont le `to` est le début d'une route de l'app), utilisée par `claimedSitePatterns()` de `app-links.ts` (`:param` → partie fixe pour Android, `*` pour Apple) ; `appleAssociation()` et `androidPathPrefixes()` déclarent les deux formes, chacune avec et sans `/en` (R5)
- [X] T023 [US2] `mobile/app.config.ts` : `APP_LINK_PREFIXES` = préfixes des nouvelles routes + anciens préfixes, lus depuis `../src/site/app-link-routes.json` et `../src/site/legacy-paths.json` (JSON seulement, R2), avec et sans `/en` ; le résultat doit égaler `androidPathPrefixes()`
- [X] T024 [P] [US2] Écrans et modules de l'app : `mobile/app/links/confirm-email/[token].tsx` lit `next` (envoie toujours le champ `suite` de l'API, contrat inchangé) et reconnaît l'invitation sur `/invite/` ; `mobile/src/links/pending.ts` reconnaît l'invitation dans `next` après `canonicalInternalPath()` ; `mobile/app/(app)/lists/[listId]/share.tsx` ouvre `/lists/<id>?tab=sharing` ; `mobile/app/legal/mentions.tsx` → `sitePath="/legal-notice"`, `mobile/app/legal/privacy.tsx` → `sitePath="/privacy"` ; `mobile/app/(auth)/forgot-password.tsx` et `mobile/app/+native-intent.tsx` (commentaires)
- [X] T025 [US2] Maestro : remplacer les anciennes adresses dans `mobile/.maestro/flows/011-us1-email-links.yaml`, `011-us2-invite-link.yaml`, `mobile/.maestro/subflows/dismiss-safari-tip.yaml` et `mobile/.maestro/README.md` ; créer `mobile/.maestro/flows/018-us2-legacy-links.yaml` (tag `018-us2`, `name:` en anglais) qui ouvre par le schéma de l'app une ancienne adresse de confirmation, d'invitation et de réservation (`/confirmer-email/…`, `/inviter/…`, `/l/<readToken>/reserver`) et vérifie l'écran par ses `testID` existants (`<écran>.<élément>`) ; ajouter `"018": "specs/018-english-urls/spec.md"` à `mobile/__tests__/e2e/coverage.test.ts` et une ligne `| 018-us1 | Story entière : adresses du site | Sort de l'app (site) | [018 quickstart, US1](../../specs/018-english-urls/quickstart.md#us1--site) |` à `mobile/.maestro/exclusions.md`
- [x] T026 [US2] Parcours `quickstart.md` § US2 sur le simulateur de référence avec le serveur de la feature : chaque lien sous ses deux formes, liens de l'app vers le site sans redirection, puis `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/<fichier>.yaml` pour `011-us1-email-links`, `011-us2-invite-link`, `011-us4-guest-list` et `018-us2-legacy-links` — 2026-11-09 : 16 liens (6 paires, plus `/en`) ouvrent le même écran sous les deux formes ; l'app ouvre `/legal-notice` et `/privacy` en 200, sans redirection (le lien « Gérer le partage sur le site » n'existe plus depuis la 017) ; les 4 parcours passent (`018-us2` corrigé : l'ancienne adresse de réservation ouvre l'écran de réservation, `guest-reserve.screen`)
  - **En attente (2026-11-06)** : non joué. Le simulateur, MailDev (1026/1081) et le serveur du port 3010 servaient aux parcours Maestro de la 017 au même moment ; le parcours `018-us2-legacy-links.yaml` est écrit, et les tests de l'app couvrent les deux formes de chaque lien.
- [X] T027 [US2] Commit de la story : `npm run lint`, `npm run typecheck`, `npm test`, puis `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis créer le commit `feat: open both old and new website addresses in the app (US2)`, sans demander

**Checkpoint**: les deux formes de chaque lien ouvrent l'app ; le build de store peut partir.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T028 [P] `AGENTS.md` : retirer l'« Exception temporaire » des segments d'URL et dossiers de pages en français (§ Langue du code) ; `README.md` : adresses citées (pages, liens d'e-mail, liens de l'app)
- [X] T029 [P] `specs/004-mobile-api/contracts/openapi.yaml` : exemples et descriptions d'adresses de site (`inviteUrl`, liens d'e-mail, `suite` décrit comme le `next` du lien) sans changer de route ni de champ ; si le contrat change, `npm --prefix mobile run api:types`
- [X] T030 [P] Noter dans `specs/011-app-deep-links/contracts/links.md`, en tête, que les chemins sont remplacés par `specs/018-english-urls/contracts/addresses.md`
- [x] T031 Relire `research.md` R6 avant le build : vérifier qu'aucune version 1.1.x construite avant cette feature n'a été publiée (App Store Connect, Play Console) ; décider avec l'utilisatrice du numéro de version de l'app (`mobile/app.config.ts`, `version`) — 2026-11-09 : aucune 1.1.x publiée (confirmé par l'utilisatrice) ; version gardée à 1.1.0
  - **À trancher par l'utilisatrice** : d'après la mémoire du projet, seule la 1.0.0 (sans liens universels) a été envoyée aux stores ; `mobile/app.config.ts` est en 1.1.0. Vérifier dans App Store Connect et Play Console qu'aucune 1.1.x n'est publiée, et choisir le numéro du prochain build.
- [X] T032 Commit Polish : lint, types et tests (site et app) verts, puis `chore: document the English addresses`, sans demander

Hors code, à faire par l'utilisatrice au moment de la mise en production (`quickstart.md` § Mise en production) : publier le build de l'app, déployer le site, remplacer l'adresse de politique de confidentialité par `/privacy` dans App Store Connect et Play Console.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **US1 (Phase 3)** → **US2 (Phase 4)** → **Polish (Phase 5)**.
- US2 dépend de la table (Phase 2) et des dossiers renommés de l'US1 (`/lists/<id>`, `/legal-notice`, `/privacy` doivent exister pour les liens de l'app vers le site).

### Within Each User Story

- US1 : T005 (tests) avant T006-T007 ; T008 (renommage) avant T009-T010 ; T011-T013 indépendants de T009-T010 ; T014-T016 après le code ; T017 avant le commit T018.
- US2 : T019-T020 (tests) avant T021-T024 ; T021 avant T022 avant T023 ; T025 après T024 ; T026 avant le commit T027.

### Parallel Opportunities

- Phase 2 : T004 en parallèle de T003 (tests écrits d'après `data-model.md`).
- US1 : T005 en parallèle de T008 ; après T008, T010, T012, T013 et T015 en parallèle (fichiers distincts).
- US2 : T019 et T020 en parallèle ; T024 en parallèle de T022-T023.
- Polish : T028, T029, T030 en parallèle.

## Parallel Example: User Story 1

```bash
# Après le renommage des dossiers (T008) :
Task: "T010 Mettre à jour les composants de components/site/"
Task: "T012 Adresses produites dans src/auth, src/server/commands, src/server/api, src/domain/read-link.ts"
Task: "T013 sitemap, robots, analytics-public"
Task: "T015 scripts/capture-demo.mjs et scripts/test-reset-mail.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phases 1-2 : table et fonction pure, testées.
2. Phase 3 : site en anglais, anciennes adresses redirigées.
3. **STOP and VALIDATE** : `quickstart.md` § US1. Le site peut partir seul en prod : les nouveaux liens ouvrent le site, les anciens ouvrent l'app comme avant.

### Incremental Delivery

1. US1 → déploiement possible du site.
2. US2 → build de l'app, publication, puis déploiement du site qui contient l'US2 (fichier Apple avec les deux formes), dans cet ordre (research R6).
3. Polish → documentation.

## Notes

- La table `legacy-paths.json` ne perd jamais de ligne (FR-006).
- Les parcours Maestro `011-us1/us2` échouent entre les commits US1 et US2 (attendu, plan § Ordre de livraison) ; ils ne font pas partie de la porte de commit.
- Ne pas toucher aux routes de l'API ni aux fichiers `.well-known` autres que leur contenu calculé.
