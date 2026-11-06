---

description: "Tâches de la feature 015 : suites de l'audit Next.js (formulaires, erreurs, garde-fous)"
---

# Tasks: Suites de l'audit du site (formulaires, erreurs, garde-fous)

**Input**: Design documents from `/specs/015-nextjs-audit/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/form-states.md](contracts/form-states.md), [quickstart.md](quickstart.md)

**Tests**: Les tests de domaine sont exigés par AGENTS.md (chaque règle et chaque cas limite). Deux fichiers sont nouveaux : `tests/domain/form-state.test.ts` (US1) et `tests/domain/server-only.test.ts` (US4). Le reste se vérifie à la main avec [quickstart.md](quickstart.md), puisque le site n'a pas de test e2e.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Langue** : tout le code est en anglais (identifiants, commentaires, messages) ; les textes visibles passent par `locales/`.

## Un commit par user story (règle du projet)

Chaque phase de user story se termine par une tâche **« Commit de la story »**, la dernière de la phase. Règles :

- La phase Setup n'a pas de commit propre : elle entre dans le commit de la première story.
- Chaque commit est vert (lint, types, tests). Un test existant à adapter va dans le commit de la story qui rend l'adaptation nécessaire.
- Un fichier modifié par deux stories est commité en deux temps (seulement les changements de la story en cours). C'est le cas de `src/server/actions.ts` (US1, US3, US4) et de `package.json` (US4 seulement).
- La phase Polish a son propre commit si elle change des fichiers. Les corrections de la revue lancée par le hook `after_implement` forment un commit à part, `fix: corrections de la revue`, avec `review.md`.
- Message en anglais, préfixé `feat:`, `fix:` ou `chore:`, terminé par `(USn)`.
- Le commit se crée sans demander l'accord. Seuls le push et le squash sur `main` attendent l'utilisateur.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 à US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: garder une référence de l'état actuel pour l'US4.

- [X] T001 Sur la branche à jour avant tout changement, lancer `npm run build` et enregistrer le tableau des routes (lignes `ƒ` / `○` / `●`) dans `tmp/015-build-before.txt` (non versionné). C'est la référence de T035.

---

## Phase 2: Foundational (Blocking Prerequisites)

Aucune : chaque story touche des fichiers à elle, et le module `form-state` ne sert qu'à l'US1.

---

## Phase 3: User Story 1 - Un formulaire refusé garde ce qui a été tapé (Priority: P1) 🎯 MVP

**Goal**: les 13 formulaires de [contracts/form-states.md](contracts/form-states.md) affichent l'erreur à côté du formulaire et gardent les champs non secrets, avec et sans JavaScript (FR-001 à FR-005).

**Independent Test**: [quickstart.md](quickstart.md), section US1 : le tableau des 13 refus, puis les lignes 1, 2 et 10 sans JavaScript, puis les trois cas qui ne changent pas.

### Tests for User Story 1

- [X] T002 [US1] Écrire `tests/domain/form-state.test.ts` (il échoue tant que T003 n'est pas fait). Cas à couvrir :
  - `keptValues(formData, ["email", "displayName"])` rend exactement ces deux clés ;
  - un champ absent donne `""` ;
  - une valeur `File` donne `""` ;
  - un champ non listé (p. ex. `password`) n'apparaît pas ;
  - chacune des 13 listes exportées respecte la règle « Jamais un mot de passe, ni `website` » de [data-model.md](data-model.md) : aucun nom ne correspond à `/password|confirm/i` et aucun ne vaut `website`.

### Implementation for User Story 1

- [X] T003 [US1] Créer `src/server/form-state.ts`, sans import de Next. Il contient :
  - `export type FormState = { error: string; values: Record<string, string> } | null` ;
  - `export function keptValues(formData: FormData, fields: readonly string[]): Record<string, string>` ;
  - les 13 listes de champs gardés en constantes `as const`, en reprenant exactement la colonne « Champs gardés » du contrat : `REGISTER_KEPT_FIELDS = ["displayName", "email"]`, `LOGIN_KEPT_FIELDS = ["email"]`, `FORGOT_PASSWORD_KEPT_FIELDS = ["email"]`, `RESET_PASSWORD_KEPT_FIELDS = []`, `CHANGE_PASSWORD_KEPT_FIELDS = []`, `DISPLAY_NAME_KEPT_FIELDS = ["displayName"]`, `EMAIL_CHANGE_KEPT_FIELDS = ["email"]`, `NEW_LIST_KEPT_FIELDS = ["title", "category", "person"]`, `LIST_SETTINGS_KEPT_FIELDS = ["title", "subtitle", "coverImageUrl", "primary", "accent", "highlight", "background"]`, `RESERVATION_KEPT_FIELDS = ["fromName", "note"]`, `READ_UNLOCK_KEPT_FIELDS = []`, `INVITE_EMAIL_KEPT_FIELDS = ["email"]`, `READ_PASSWORD_KEPT_FIELDS = []`.

  T002 doit passer.
- [X] T004 [US1] **Pilote : inscription.**
  - Dans `src/server/actions.ts`, `registerAction(_prev: FormState, formData)` rend `{ error: "rate" | "password" | "fields", values: keptValues(formData, REGISTER_KEPT_FIELDS) }` au lieu des deux `localeRedirect('/inscription?e=…')`. Le succès, y compris l'adresse déjà utilisée (succès silencieux), garde sa redirection `?ok=1…`.
  - Créer `components/site/register-form.tsx` (`"use client"`, `useActionState(registerAction, null)`). Il reprend le formulaire actuel de `app/inscription/page.tsx` : mêmes `Field`, `Input`, `Alert` et `Button`, champ caché `next`, `defaultValue={state?.values.displayName}` et `defaultValue={state?.values.email}`, mot de passe sans `defaultValue`, bouton désactivé pendant `pending`. Le message vient de `auth:register.errorPassword`, `auth:register.rateLimited` ou `auth:register.errorFields`.
  - Dans `app/inscription/page.tsx`, rendre `<RegisterForm next={next} />` et retirer la lecture de `query.e`.
  - **Vérifier avant de continuer**, avec et sans JavaScript : après un refus, nom et adresse sont toujours remplis. React 19 remet le formulaire à zéro après l'action. Si les valeurs se perdent, ajouter au `<form>` une `key` qui change à chaque nouvel état (p. ex. un compteur dans l'état), puis appliquer la même solution aux tâches T005 à T013. Noter le résultat dans `research.md` R1.
- [X] T005 [US1] Connexion.
  - `loginAction(_prev, formData)` rend `{ error: "rate" | "1", values: keptValues(formData, LOGIN_KEPT_FIELDS) }`.
  - Créer `components/site/login-form.tsx` sur le modèle de T004. Les messages viennent de `auth:login.rateLimited` et `auth:login.badCredentials`.
  - Dans `app/connexion/page.tsx`, retirer la lecture de `query.e`. Garder `next` et `deleted`.
- [X] T006 [US1] Mot de passe oublié.
  - `requestPasswordResetAction(_prev, formData)` rend `{ error: "rate", values: keptValues(formData, FORGOT_PASSWORD_KEPT_FIELDS) }` sur la limite de débit. Le reste garde ses redirections `?ok=1…`.
  - Créer `components/site/forgot-password-form.tsx`.
  - Dans `app/mot-de-passe-oublie/page.tsx`, retirer la branche `query.e === "rate"` et garder les états `ok`, `lien` et `sansmail`.
- [X] T007 [US1] Réinitialisation.
  - `resetPasswordAction(_prev, formData)` rend `{ error: "rate" | "password" | "1", values: {} }`.
  - Créer `components/site/reset-password-form.tsx`, avec le champ caché `token`.
  - Dans `app/reinitialiser/[token]/page.tsx`, retirer la lecture de `query.e` et garder les mêmes clés de message.
- [X] T008 [US1] Page Compte : trois formulaires.
  - **Mot de passe** : `changePasswordAction(_prev, formData)` rend `{ error: "mismatch" | "current" | "password" | "1" | "rateLimited", values: {} }`.
  - **Nom affiché** : `updateDisplayNameAction(_prev, formData)` rend `{ error: result.error, values: keptValues(formData, DISPLAY_NAME_KEPT_FIELDS) }`.
  - **Adresse** : `requestEmailChangeAction(_prev, formData)` rend `{ error: result.error | "rateLimited", values: keptValues(formData, EMAIL_CHANGE_KEPT_FIELDS) }`. Ses succès gardent `/compte?email=…#email`.
  - Créer `components/site/password-form.tsx` (mode forcé compris : il reçoit les mêmes props que le formulaire actuel), `components/site/display-name-form.tsx` et `components/site/email-change-form.tsx`. Leurs messages viennent des clés `account:changePassword.error*` actuelles ou de `errors:<code>`.
  - Dans `app/compte/page.tsx`, retirer `passwordError`, `profileError` et la lecture de `query.e`. Garder `ee`, que `cancelEmailChangeAction` pose encore, ainsi que `x`, `d`, `k`, `ok` et `email`.
- [X] T009 [US1] Nouvelle liste.
  - `createListAction(_prev, formData)` rend `{ error: result.error, values: keptValues(formData, NEW_LIST_KEPT_FIELDS) }`. Les redirections vers la connexion et le compte restent.
  - Créer `components/site/new-list-form.tsx`.
  - Dans `app/listes/new/page.tsx`, retirer `query.e` et `translateError`.
- [X] T010 [US1] Réglages d'une liste.
  - `updateWishlistSettingsAction(_prev, formData)` rend `{ error: result.error, values: keptValues(formData, LIST_SETTINGS_KEPT_FIELDS) }`. Le succès garde `redirectToList(wishlistId, formData)`.
  - Passer `components/site/appearance-form.tsx` à `useActionState`. Les couleurs et la couverture reprennent `state.values` quand il y en a, sinon les valeurs de la liste. Le message `errors:<code>` s'affiche dans le formulaire.
- [X] T011 [US1] Réservation.
  - `reserveAction(_prev, formData)` rend `{ error, values: keptValues(formData, RESERVATION_KEPT_FIELDS) }` à la place de `backToForm(error)`.
  - Ces cas restent des redirections : le champ anti-robot `website` rempli (`/l/<readToken>?ok=1`), `listMissing` (`/`), `readPasswordRequired` (`/l/<readToken>`) et le succès (`grantReservationClaim` puis `?ok=1`).
  - Créer `components/site/reservation-form.tsx`, avec les champs cachés `readToken`, `typeId` et `itemId`, le champ piège `website` inchangé et `errors:<code>`.
  - Dans `app/l/[readToken]/reserver/page.tsx`, retirer `query.e` et garder `typeId` et `itemId`.
- [X] T012 [US1] Déverrouillage d'une liste protégée.
  - `unlockPublicListAction(_prev, formData)` rend `{ error: "badPassword" | "rateLimited", values: {} }` sur un refus. Le succès garde sa redirection, avec `subscribe=1` si demandé.
  - Passer `components/site/read-unlock-form.tsx` à `useActionState`. Le message vient de l'état, avec les mêmes clés que `unlockErrorMessage` ; sinon, la prop `error` de la page reste affichée.
  - Garder `unlockErrorMessage` et la lecture de `query.e` dans `app/l/[readToken]/page.tsx` : `subscribeAction` pose encore `?e=readPasswordRequired` et `?e=rateLimited`.
- [X] T013 [US1] Partage d'une liste : invitation par e-mail et mot de passe de lecture.
  - `sendInviteAction(_prev, formData)` rend `{ error, values: keptValues(formData, INVITE_EMAIL_KEPT_FIELDS) }` sur un refus ou une limite de débit.
  - `setReadPasswordAction(_prev, formData)` rend `{ error, values: {} }`.
  - Les succès gardent `sharingResult` et `redirectToList(…, ok)`. Lire `sharingResult` d'abord : ses branches d'échec deviennent un retour d'état, ses branches de succès restent des redirections.
  - Créer `components/site/invite-email-form.tsx` et `components/site/read-password-form.tsx`. Les remplacer dans l'onglet Partage de `app/listes/[id]/page.tsx`, avec les champs cachés `wishlistId` et `onglet=partage`.
  - La lecture de `query.e` sur cette page reste, pour les actions à bouton (`redirectToList`).
- [X] T014 [US1] Contrôler le retrait des redirections d'erreur.
  - `grep -n "?e=\|?ee=" src/server/actions.ts` ne doit plus remonter aucune des 13 actions. Il doit rester celles de `cancelEmailChangeAction`, `confirmEmailAction`, `joinInviteAction`, `subscribeAction`, `cancelMyReservationAction` et `redirectToList`.
  - `npm run lint`, `npm run typecheck` et `npm test` passent.
- [X] T015 [US1] Dérouler [quickstart.md](quickstart.md), section US1, sur la base de démo : les 13 refus, les lignes 1, 2 et 10 sans JavaScript, l'inscription avec une adresse déjà prise (écran « e-mail envoyé ») et l'ancienne adresse `/inscription?e=fields`. Noter les écarts dans `research.md` R1.
- [ ] T016 [US1] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `feat: keep what was typed when a site form is refused (US1)` des fichiers de cette story (avec `specs/015-nextjs-audit/`), sans demander.

**Checkpoint**: l'US1 est livrable seule.

---

## Phase 4: User Story 2 - Une panne générale affiche une page d'erreur du site (Priority: P2)

**Goal**: une erreur du layout racine affiche une page du site traduite. « Réessayer » recharge les données partout (FR-006, FR-007).

**Independent Test**: [quickstart.md](quickstart.md), section US2.

- [ ] T017 [P] [US2] Ajouter la clé `error.home` dans `locales/fr/common.json` (« Revenir à l'accueil ») et dans `locales/en/common.json` (« Back to home »), à côté de `error.title`, `error.body` et `error.retry`.
- [ ] T018 [US2] Créer `app/global-error.tsx` (`"use client"`, props `{ error: unknown; retry: () => void }`) :
  - il rend ses propres `<html lang={locale}>` et `<body>`, importe `./globals.css` et reprend la police Geist et les classes de `app/layout.tsx` ;
  - la langue vient de `stripLocalePrefix(usePathname() ?? "/").locale` (`src/i18n/locale-path.ts`), français par défaut ;
  - le contenu est enveloppé dans `I18nProvider` (`src/i18n/client.tsx`) ;
  - il affiche `common:error.title`, `common:error.body`, un `Button` qui appelle `retry()` (`common:error.retry`) et un lien `LinkButton` ou `<a>` vers `withLocale(locale, "/")` (`common:error.home`) ;
  - il n'importe rien de `src/store`, `src/auth` ni `src/server` (FR-007).
- [ ] T019 [P] [US2] Dans `app/error.tsx`, remplacer la prop `reset` par `retry` (`{ error: unknown; retry: () => void }`, `onClick={() => retry()}`), comme le recommande `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` (`retry` est stable depuis 16.3.0).
- [ ] T020 [US2] Dérouler [quickstart.md](quickstart.md), section US2 (`throw` temporaire dans `RootLayout`, puis dans `app/compte/page.tsx`, en `/` et en `/en`). Retirer les `throw`, puis noter dans `research.md` R3 s'il y a un avertissement d'hydratation en `/en`.
- [ ] T021 [US2] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `feat: a translated site page when the whole layout fails (US2)`, sans demander.

**Checkpoint**: les US1 et US2 marchent chacune seule.

---

## Phase 5: User Story 3 - Les actions sur une liste mettent la page à jour en une fois (Priority: P2)

**Goal**: une seule demande au serveur pour le déplacement ou la copie d'une idée, les catégories et les « qui », et la création d'une clé d'API (FR-008, FR-009).

**Independent Test**: [quickstart.md](quickstart.md), section US3 (onglet Réseau en « Slow 4G »).

- [ ] T022 [US3] Dans `src/server/actions.ts`, importer `refresh` de `next/cache` et l'appeler juste avant le `return { ok: true … }` de succès de `transferItemAction`, `manageLabelAction` et `createApiKeyAction` (`03-api-reference/04-functions/refresh.md`).
- [ ] T023 [P] [US3] Dans `components/site/label-chips.tsx` :
  - retirer `useRouter` et `router.refresh()` ;
  - remplacer l'état local optimiste (`chips` / `setChips(items)` sur refus) par `useOptimistic(items, reducer)` : le reducer applique l'ajout, le renommage ou la suppression d'une puce, et l'état optimiste est posé dans la transition qui appelle `manageLabelAction` ;
  - sur un refus, l'état optimiste disparaît de lui-même et le message `errors:<code>` s'affiche ;
  - garder le brouillon (`draft`) et l'édition en cours (`editingId`) tels quels.
- [ ] T024 [P] [US3] Dans `components/site/ideas-accordion.tsx`, retirer `router.refresh()` de `onTransferred` (et `useRouter` s'il ne sert plus). Vérifier que `components/site/move-copy-dialog.tsx` n'appelle pas non plus de rafraîchissement client.
- [ ] T025 [P] [US3] Dans `components/site/api-keys-card.tsx` :
  - retirer `router.refresh()` ;
  - quand un avis est dans l'adresse, remplacer `router.replace(pathname, { scroll: false })` par `window.history.replaceState(null, "", pathname + window.location.hash)`, une API History native suivie par le routeur (`01-app/01-getting-started/04-linking-and-navigating.md`) ;
  - retirer `useRouter` s'il ne sert plus ;
  - la clé créée s'affiche toujours une fois, et la liste des clés vient de la page rafraîchie par l'action.
- [ ] T026 [US3] Dérouler [quickstart.md](quickstart.md), section US3 : une requête par action, retour en arrière d'une catégorie en double, et l'avis `?k=revoked` qui disparaît sans second chargement.
- [ ] T027 [US3] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `feat: refresh the page with the action's response, in one round trip (US3)` (seulement les changements US3 de `src/server/actions.ts`), sans demander.

**Checkpoint**: les US1, US2 et US3 marchent chacune seule.

---

## Phase 6: User Story 4 - Le code serveur et le démarrage sont protégés et unifiés (Priority: P3)

**Goal**: la construction échoue sur un import de code serveur côté client, les déclarations de rendu forcé redondantes sont retirées, et la prod démarre d'une seule façon (FR-010 à FR-013).

**Independent Test**: [quickstart.md](quickstart.md), section US4.

### Garde-fou server-only (point c)

- [ ] T028 [US4] Installer la dépendance `npm install server-only`, qui l'ajoute aux `dependencies` de `package.json`. Puis vérifier le lockfile avec `npx npm@10 ci --dry-run`, puisque la CI est en npm 10 (mémoire « Lockfile et npm 10 »).
- [ ] T029 [US4] Dans `package.json`, ajouter `--conditions=react-server` aux trois commandes `node --import tsx` (`test`, `demo:data`, `db:check`) : `node --conditions=react-server --import tsx …`. Relire l'en-tête de `scripts/db-sessions.ts`, `scripts/test-reset-mail.ts` et `scripts/backfill-og.ts`, et mettre leur ligne d'usage au même format si elle cite `tsx`. Ensuite, `npm test` passe (essai fait : 389 tests verts sous cette condition).
- [ ] T030 [US4] Écrire `tests/domain/server-only.test.ts`. Il lit chaque fichier `.ts` de `src/store/`, `src/auth/` et `src/server/`, sous-dossiers compris, et vérifie que la première instruction est `import "server-only";`, ou qu'elle suit une directive en tête de fichier. Il exclut deux fichiers, avec la raison en commentaire :
  - `src/server/actions.ts` : fichier `"use server"`, importé par les composants clients ;
  - `src/store/schema.ts` : chargé par `drizzle-kit generate` hors de Next et sans la condition `react-server`.

  Il échoue avant T031.
- [ ] T031 [US4] Ajouter `import "server-only";` en première ligne de chaque fichier visé par T030 : `src/store/*.ts` sauf `schema.ts`, `src/auth/*.ts`, et `src/server/**/*.ts` sauf `actions.ts`.
  - Lancer `npm test`, `npm run typecheck`, `npm run build` et `npm run db:generate`. Ce dernier ne doit créer aucune migration ; supprimer toute migration vide qu'il aurait créée.
  - Vérifier aussi que `npm run demo:data -- tmp/demo-wishlist.json` et `npm run db:check -- tmp/demo-wishlist.db` marchent.
- [ ] T032 [US4] Vérification SC-006 :
  1. Ajouter temporairement `import "@/src/store/db";` dans `components/site/label-chips.tsx`.
  2. `npm run build` doit échouer, avec un message qui cite `server-only`. Noter ce message dans `research.md` R4.
  3. Retirer l'import.

### Déclarations force-dynamic (point e)

- [ ] T033 [P] [US4] Retirer `export const dynamic = "force-dynamic";`, et son commentaire s'il en a un, de `app/layout.tsx` et des 14 pages :
  - `app/page.tsx`, `app/changer-mot-de-passe/page.tsx`, `app/compte/page.tsx`, `app/confirmer-email/[token]/page.tsx` ;
  - `app/connexion/page.tsx`, `app/inscription/page.tsx`, `app/inviter/[token]/page.tsx` ;
  - `app/l/[readToken]/page.tsx`, `app/l/[readToken]/reserver/page.tsx`, `app/l/[readToken]/types/page.tsx` ;
  - `app/listes/[id]/page.tsx`, `app/listes/new/page.tsx`, `app/mot-de-passe-oublie/page.tsx`, `app/reinitialiser/[token]/page.tsx`.
- [ ] T034 [P] [US4] Retirer la même déclaration des gestionnaires de route qui lisent la requête :
  - toutes les routes `app/api/v1/**/route.ts` ;
  - `app/api/[version]/[...path]/route.ts`, `app/api/mcp/route.ts` ;
  - `app/compte/export/route.ts`, `app/u/[...path]/route.ts`.

  Garder `app/robots.ts`, `app/sitemap.ts`, `app/.well-known/apple-app-site-association/route.ts` et `app/.well-known/assetlinks.json/route.ts`, et vérifier que chacun a un commentaire qui dit pourquoi (en ajouter un à `app/sitemap.ts` s'il manque).
- [ ] T035 [US4] Lancer `npm run build` et comparer son tableau des routes à `tmp/015-build-before.txt` (T001) :
  - chaque route doit garder son symbole ;
  - une route passée de `ƒ` à `○` reprend sa déclaration, avec un commentaire en anglais qui dit pourquoi elle est nécessaire ;
  - lister ces routes dans `research.md` R5.

  Ensuite, `grep -rl force-dynamic app` ne remonte que des fichiers commentés.

### Un seul démarrage (point f)

- [ ] T036 [US4] Supprimer `app.js`.
  - Créer `scripts/prepare-standalone.mjs`, qui copie dans `.next/standalone/` : `public/`, `.next/static/` (vers `.next/standalone/.next/static/`), `drizzle/` et `data/seed.json` (vers `.next/standalone/data/seed.json`). Il utilise `fs.cpSync(…, { recursive: true })` et se lance avec `"postbuild": "node scripts/prepare-standalone.mjs"` dans `package.json`.
  - Créer `scripts/start.mjs`. Si `WISHLIST_DATA_PATH` manque, il lui donne `path.resolve("data/wishlist.json")` (chemin absolu, puisque `server.js` fait `process.chdir(__dirname)`), vérifie que `.next/standalone/server.js` existe (sinon, il affiche « Run npm run build first » et sort en code 1), puis l'importe.
  - Écrire `"start": "node scripts/start.mjs"`. Commentaires et messages en anglais.
- [ ] T037 [US4] Dans `Dockerfile`, étape `runner` :
  - remplacer les copies séparées de `public`, `.next/static`, `data/seed.json` et `drizzle` par la seule copie de `/app/.next/standalone`, déjà complétée par `postbuild` ;
  - garder la copie de `scripts/db-backup.mjs`, les `ENV` (`PORT`, `HOSTNAME`, `WISHLIST_DATA_PATH=/data/wishlist.json`), l'utilisateur `nextjs`, le `HEALTHCHECK` et `CMD ["node", "server.js"]`.

  Ensuite, `docker build -t whishlist:local .` passe.
- [ ] T038 [US4] Documentation :
  - dans `README.md`, dire que `npm start` lance le serveur `standalone` de l'image, après `npm run build`, avec la base `data/wishlist.db` du dépôt par défaut ;
  - relire `deploy/DEPLOY-RUNTIPI.md` ;
  - dans `AGENTS.md`, section **Couches**, ajouter que chaque fichier de `src/store/`, `src/auth/` et `src/server/` commence par `import "server-only";`, sauf `src/server/actions.ts` et `src/store/schema.ts`, et que les commandes `tsx` qui les chargent tournent avec `--conditions=react-server` ;
  - ajouter ce flag à la ligne « Tests » si elle cite la commande.
- [ ] T039 [US4] Dérouler [quickstart.md](quickstart.md), section US4 :
  - `PORT=3020 npm start` sur la base du dépôt ;
  - conteneur sur le port 3021, `healthy` ;
  - `APP_ORIGIN` et `APPLE_TEAM_ID` reflétés par `/robots.txt` et `.well-known`.
- [ ] T040 [US4] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `chore: guard server code, drop redundant dynamic flags, one production start (US4)`, sans demander.

**Checkpoint**: toutes les stories marchent chacune seule.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T041 Lancer `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` et `npm --prefix mobile test`, pour vérifier que les modules partagés sont inchangés pour l'app. `tests/domain/code-language.test.ts` doit passer, ce qui veut dire que les nouveaux commentaires sont en anglais.
- [ ] T042 Dans `specs/015-nextjs-audit/research.md`, ajouter une section « Écarts à l'implémentation », qui reprend les notes de T004, T020, T032 et T035. Mettre le `Status` de `spec.md` à `Implemented`. Si des fichiers ont changé, créer le commit `chore: implementation notes for the Next.js audit follow-ups`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** : avant tout changement, puisque c'est la référence du build pour T035.
- **US1 → US2 → US3 → US4**, dans l'ordre des priorités. Les US1, US2 et US3 sont indépendantes ; elles se suivent seulement parce que `src/server/actions.ts` est partagé.
- **US4** en dernier : T031 marque des fichiers que les stories précédentes ont modifiés, et T033 retouche les pages de l'US1.
- **Polish** après l'US4.

### Within Each User Story

- **US1** : T002 (test qui échoue) → T003 → T004 (pilote, vérification du reset) → T005 à T013 → T014 → T015 → T016.
- **US2** : T017 et T019 en parallèle → T018 → T020 → T021.
- **US3** : T022 → T023, T024 et T025 en parallèle → T026 → T027.
- **US4** : T028 → T029 → T030 → T031 → T032 ; puis T033 et T034 en parallèle → T035 ; puis T036 → T037 → T038 → T039 → T040.

### Parallel Opportunities

- **US1** : après T004, les composants des tâches T005 à T013 sont dans des fichiers différents et peuvent s'écrire en parallèle. Les modifications de `src/server/actions.ts`, elles, se font l'une après l'autre.
- **US2** : T017 et T019.
- **US3** : T023, T024 et T025.
- **US4** : T033 et T034.

## Parallel Example: User Story 3

```bash
# Après T022 (actions) :
Task: "T023 useOptimistic dans components/site/label-chips.tsx"
Task: "T024 retirer router.refresh() de components/site/ideas-accordion.tsx"
Task: "T025 replaceState dans components/site/api-keys-card.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

T001 → US1 (T002 à T016). C'est la seule story que les visiteurs voient à chaque erreur. On s'arrête, on valide avec le quickstart US1, et on peut livrer.

### Incremental Delivery

Une story = un commit vert. US2 et US3 sont petites (cinq ou six tâches chacune). US4 est la plus large, mais ne change rien de visible ; son seul risque est le build (T035) et l'image (T037).

## Notes

- Ne jamais rendre un mot de passe dans un `FormState`, ni le mettre dans une adresse.
- Ne rien toucher à `getDocument()` : le point (g) est hors périmètre.
- Un test qui touche le store garde `withStore` / `withTempDataPath` et `closeStore()`.
