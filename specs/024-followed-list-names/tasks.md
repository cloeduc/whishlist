---

description: "Task list for feature 024-followed-list-names"
---

# Tasks: Renommer une liste suivie et nommer la personne qui l'a créée

**Input**: Design documents from `specs/024-followed-list-names/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/screens.md, quickstart.md

**Tests**: oui (guide des agents : un test de domaine par règle et cas limite ; parcours Maestro pour la story de l'app).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

Branche : `024-followed-list-names`, déjà créée depuis `staging`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

- [X] T001 Vérifier la branche `024-followed-list-names` et l'arbre : seuls les fichiers de `specs/024-followed-list-names/` en plus de `next-env.d.ts` (laissé hors des commits) ; lire `node_modules/next/dist/docs/` sur les server functions et les formulaires avant d'écrire du code du site

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: stockage, règle de domaine, contrat et vues de l'API, communs aux deux stories.

- [X] T002 `src/domain/types.ts` : `Subscription` gagne `customTitle: string | null` et `customOwnerName: string | null` ; `src/store/schema.ts` : colonnes `custom_title` et `custom_owner_name` (texte, `NULL` par défaut) sur `subscriptions` ; `src/store/rows.ts` : lecture et écriture des deux champs ; `src/store/legacy-json.ts` : champs facultatifs, `null` si absents ; `subscribeWishlist` (`src/domain/subscription.ts`) crée l'abonnement avec les deux à `null`
- [X] T003 `npm run db:generate` : relire et versionner `drizzle/0007_*.sql` (deux `ALTER TABLE subscriptions ADD …`) ; `npm run db:check -- data/seed.json` reste vert
- [X] T004 [P] `tests/domain/subscription.test.ts` : `renameSubscription` — noms enregistrés après `trim()` ; chaîne vide ou faite d'espaces → `null` ; 80 caractères acceptés, 81 → `followedNameTooLong` (aucun changement) ; compte non abonné ou membre → `listMissing` ; se réabonner (« déjà abonné ») garde les noms ; se désabonner puis se réabonner → noms à `null` ; adhésion à la liste → abonnement et noms supprimés. `ownerName` : nom d'affichage du membre `owner` ; après transmission, celui du nouveau propriétaire ; nom vide → `null`
- [X] T005 `src/domain/subscription.ts` : `renameSubscription(doc, { wishlistId, userId, customTitle, customOwnerName })` → `{ ok: true, doc } | { ok: false, error: "listMissing" | "followedNameTooLong" }` (chaque nom : `trim()`, vide → `null`, « 80 caractères au plus ») ; `ownerName(doc, wishlistId)` : `displayName` du membre de rôle `owner`, sinon du premier membre par `joinedAt`, `null` si vide ; constante exportée `MAX_FOLLOWED_NAME = 80`
- [X] T006 [P] `src/domain/followed-display.ts` (pur, sans import serveur) : `followedDisplay({ title, customTitle, ownerName, customOwnerName })` → `{ title: customTitle ?? title, person: customOwnerName ?? ownerName }` ; test `tests/domain/followed-display.test.ts`
- [X] T007 `locales/{fr,en}/errors.json` : `followedNameTooLong` (« Ce nom est trop long (80 caractères au plus). » / « This name is too long (80 characters at most). »)
- [X] T008 Reporter contracts/api.md dans `specs/004-mobile-api/contracts/openapi.yaml` : ligne d'historique 1.10.0, `SubscribedListSummary` (+ `customTitle`, `customOwnerName`, `ownerName`, requis), schéma `FollowNames`, `PublicList.follow` (requis, `FollowNames` ou `null`), `PUT /subscriptions/{readToken}` ; puis `npm --prefix mobile run api:types`
- [X] T009 `src/server/api/views.ts` : `SubscribedListSummaryView` et `toSubscribedListSummary` avec les trois champs ; `toPublicListView` reçoit les noms de l'abonné et rend `follow` non nul seulement si le compte connecté suit la liste (jamais pour un visiteur, un membre ou sans compte) ; compléter `tests/domain/api-views.test.ts` (visiteur et membre : `follow: null`, aucun `ownerName` dans la réponse ; abonné : les trois valeurs)
- [X] T010 `src/server/commands/public-list.ts` (à côté de `unsubscribeFromList`) : commande `renameFollowedList(ctx, { readToken, customTitle, customOwnerName })` (compte actif, liste par `readToken`, limite de débit des actions d'abonnement, `renameSubscription` via `updateDocument`) → `{ ok: true, summary }` ou `{ ok: false, error }` ; `app/api/v1/subscriptions/[readToken]/route.ts` : `PUT` (`withApi`, corps JSON validé, `apiJson` 200 / `apiError`) ; `tests/domain/api-contract.test.ts` vert
- [X] T011 `src/domain/account.ts` : `ExportedSubscription` gagne `customTitle` et `customOwnerName` ; compléter le test d'export dans `tests/domain/`

**Checkpoint**: l'API enregistre et rend les noms ; rien de visible encore.

---

## Phase 3: User Story 1 - Donner son propre nom à une liste suivie (Priority: P1) 🎯 MVP

**Goal**: l'abonné renomme une liste suivie ; le nom s'affiche sur la carte de « Mes listes » et en tête de la liste, sur le site et dans l'app.

**Independent Test**: quickstart.md, section US1 ; jest (T013, T016) ; Maestro `024-us1`.

### Site

- [X] T012 [US1] Textes `locales/{fr,en}/home.json` (`followed.rename`, `followed.renameAria`) et `locales/{fr,en}/public.json` (`subscription.rename`, `followNames.title`, `followNames.body`, `followNames.listName`, `followNames.listNameHint`, `followNames.save`, `followNames.reset`, `followNames.saved`), textes de contracts/screens.md ; `src/server/actions.ts` : `renameFollowedListAction` (adaptateur de `renameFollowedList`, rend `{ ok } | { ok: false, error }`) ; `components/site/follow-names-dialog.tsx` (`Dialog`, `Field` + `Input` « Nom de la liste » prérempli avec `customTitle`, placeholder = titre de la liste, aide `listNameHint` ; « Enregistrer » ; « Revenir aux noms de la liste » envoie `null` ; `FormRefusal`) ; `app/page.tsx` : bouton « Renommer » à côté de « Ne plus suivre », titre affiché par `followedDisplay` ; `app/l/[readToken]/page.tsx` : titre affiché par `followedDisplay` quand le compte suit la liste
- [X] T013 [US1] Vérifier à la main quickstart.md US1, étapes 1 à 7, sur la base de démo (site)

### App

- [X] T014 [P] [US1] `mobile/src/data/subscriptions.ts` : `renameFollowedList(readToken, { customTitle, customOwnerName })` (`PUT /subscriptions/{readToken}`, puis `refreshLists()`), rend `{ ok: true } | { ok: false, error }`
- [X] T015 [US1] `mobile/app/(app)/index.tsx` (carte : titre par `followedDisplay`) ; `mobile/src/features/guest/GuestListHeader.tsx` (titre par `followedDisplay` quand `list.follow`) ; `mobile/src/features/guest/GuestFollow.tsx` : bouton « Renommer » (`guest.rename`, `variant="neutral"`) quand la liste est suivie, désactivé hors ligne avec `mobile:offline.needsNetwork` ; nouvel écran `mobile/app/guest/[readToken]/names.tsx` (champ `guest-names.list-name`, « Enregistrer » `guest-names.save`, « Revenir aux noms de la liste » `guest-names.reset`, `Alert` `guest-names.error`), composé des composants de `mobile/src/ui/`, sans style en dur ; succès → retour à la liste rechargée
- [X] T016 [US1] Tests jest `mobile/__tests__/` : carte de « Mes listes » avec `customTitle` ; en-tête de la liste suivie ; écran des noms (enregistrer, revenir, `followedNameTooLong` affiché, saisie gardée) ; « Renommer » désactivé hors ligne avec l'explication ; liste non suivie : pas de bouton
- [X] T017 [US1] `mobile/.maestro/flows/024-us1-rename-followed.yaml` (tag `024-us1`, `name:` en anglais) : connexion de Sam (compte de démo non membre ; pas d'inscription, la confirmation d'adresse dans Safari bloque en local), suivre la liste de démo, ouvrir la liste suivie, `guest.rename`, saisir un nom, `guest-names.save` ; `guest.title` affiche le nom ; retour à « Mes listes » : la carte l'affiche ; `guest-names.reset` rétablit le titre ; lancer le parcours (prérequis `mobile/.maestro/README.md`) et vérifier à la main quickstart.md US1 étape 8
- [X] T018 [US1] Commit de la story : contrôles verts, puis `feat: rename a followed list (US1)` (avec Setup et Foundational), sans demander

**Checkpoint**: renommer une liste suivie marche sur le site et dans l'app.

---

## Phase 4: User Story 2 - Voir et nommer à qui est la liste (Priority: P2)

**Goal**: sous le titre, la personne à qui est la liste : le nom choisi par l'abonné, sinon le nom d'affichage du propriétaire ; modifiable au même endroit que le nom de la liste.

**Independent Test**: quickstart.md, section US2 ; jest (T021).

- [ ] T019 [US2] Textes `public:followNames.person` et `public:followNames.personHint` (FR, EN) ; `components/site/follow-names-dialog.tsx` : second champ « À qui est cette liste » prérempli avec `customOwnerName`, placeholder et aide = `ownerName` (aide masquée sans `ownerName`) ; `app/page.tsx` et `app/l/[readToken]/page.tsx` : personne (`followedDisplay().person`) sous le titre quand elle existe, pour un abonné seulement
- [ ] T020 [US2] App : `mobile/app/(app)/index.tsx` (personne sous le titre, `lists.shared-person-<readToken>`), `GuestListHeader.tsx` (`guest.person`), `mobile/app/guest/[readToken]/names.tsx` (champ `guest-names.person`, placeholder = `ownerName`)
- [ ] T021 [US2] Tests jest : personne par défaut = `ownerName` ; `customOwnerName` la remplace ; effacée → `ownerName` revient ; liste ouverte sans la suivre (`follow: null`) → aucune personne ; compléter le parcours Maestro `024-us1` si un `id` de la personne est utile (sinon tag inchangé)
- [ ] T022 [US2] Vérifier à la main quickstart.md US2, étapes 1 à 6 (site et app)
- [ ] T023 [US2] Commit de la story : contrôles verts, puis `feat: show and name whose followed list it is (US2)`, sans demander

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T024 [P] `mobile/__tests__/e2e/coverage.test.ts` : `"024": "specs/024-followed-list-names/spec.md"` ; ligne `024-us2` dans `mobile/.maestro/exclusions.md` si US2 n'a pas de parcours propre (couverte par jest et quickstart)
- [ ] T025 [P] FAQ ou guide du site (`locales/*/` des pages de contenu) : une phrase sur « Renommer » dans la partie des listes suivies, si cette partie existe
- [ ] T026 Commit Polish : contrôles verts, puis `chore: record the 024 e2e coverage`, sans demander

---

## Dependencies & Execution Order

- **Setup → Foundational → US1 → US2 → Polish.**
- US2 dépend de la fondation seulement ; elle vient après US1 parce qu'elle complète le même dialogue et le même écran (fichiers commités en deux temps).
- Dans la fondation : T002 → T003 ; T004 et T006 en parallèle ; T005 après T004 ; T008 avant T009 et T010.

### Parallel Opportunities

- T004 et T006 ; T014 avec T012 ; T024 et T025.

## Implementation Strategy

1. Fondation + US1 → commit (MVP : distinguer les listes suivies au même titre).
2. US2 → commit.
3. Polish → commit ; revue `wishlist-feature-review`.
4. Push et squash : à l'utilisatrice.
