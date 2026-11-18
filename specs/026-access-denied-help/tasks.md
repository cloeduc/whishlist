---
description: "Tasks for 026-access-denied-help"
---

# Tasks: Aide sur la page « Accès refusé » d'une liste

**Input**: Design documents from `specs/026-access-denied-help/` (plan.md, spec.md, research.md, data-model.md, contracts/screens.md, quickstart.md). Ticket WISH-30.

**Tests**: oui (guide des agents : un test par règle et cas limite ; parcours Maestro pour la story de l'app).

**Organization**: une phase par user story, dans l'ordre des priorités de la spec.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`. Seuls le push et le squash sur `main` attendent l'utilisatrice.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: textes partagés par le site et l'app.

- [X] T001 Lire `node_modules/next/dist/docs/` (pages App Router, `redirect`, `notFound`) avant de toucher `app/lists/[id]/page.tsx`
- [X] T002 [P] Ajouter le groupe `accessHelp` (`title`, `body`, `howTo`, `followedBody`, `viewFollowed`, `backToLists`) dans `locales/fr/list.json` et `locales/en/list.json`, textes FR de `contracts/screens.md` (vouvoiement, « liste », « lien de la liste »), mêmes clés en EN

---

## Phase 2: Foundational

Aucune : pas de donnée ni de route d'API (data-model.md).

---

## Phase 3: User Story 1 - Comprendre le refus et savoir quoi demander (Priority: P1) 🎯 MVP

**Goal**: sur le site, un non-membre connecté qui ouvre `/lists/<id>` voit une page d'aide sans aucune information sur la liste, avec un retour à « Mes listes ».

**Independent Test**: quickstart.md, section US1.

### Implementation for User Story 1

- [X] T003 [US1] Créer `components/site/list-access-help.tsx` (composant serveur, `getTranslations("list")`) : titre `accessHelp.title`, `accessHelp.body`, `accessHelp.howTo`, `LinkButton` `accessHelp.backToLists` vers `withLocale(locale, "/lists")` ; prop `followedReadUrl: string | null` prévue pour US3 mais non affichée tant qu'elle est `null`. Mise en page avec les primitives de `components/ui/` (`Empty` ou `Card`), aucune donnée de la liste en prop (FR-003)
- [X] T004 [US1] Dans `app/lists/[id]/page.tsx`, remplacer le bloc `if (!membership)` (titre `errors.accessDenied` + `errors.notMember`) par `<ListAccessHelp followedReadUrl={null} />` ; garder l'ordre actuel : session absente → `/login?next=/lists/<id>`, `mustChangePassword` → `/account`, liste absente → `notFound()` ; ne pas retirer `errors.accessDenied` / `errors.notMember` des locales (encore utilisés par l'API et l'app)
- [X] T005 [US1] Vérifier à la main (quickstart US1, points 1 à 4), dont l'ancienne adresse `/connexion?next=/listes/<id>` et la version anglaise `/en/lists/<id>` : aucun titre de liste ni nom de propriétaire visible
- [X] T006 [US1] Commit de la story : contrôles verts, puis `feat: explain the list access-denied page (US1)` (avec Setup), sans demander

**Checkpoint**: le cas observé en prod est résolu sur le site.

---

## Phase 4: User Story 2 - L'app ouvre l'adresse de gestion (Priority: P2)

**Goal**: sur un téléphone, l'adresse de gestion ouvre l'app : la liste pour un membre, l'écran d'aide sinon, y compris sans session et sous les anciennes formes françaises.

**Independent Test**: quickstart.md, section US2 ; jest ; Maestro `026-us2`.

### Tests for User Story 2

- [X] T007 [P] [US2] `tests/domain/app-links.test.ts` : `appPathForSiteUrl` donne `/links/list/abc` pour `https://<host>/lists/abc`, `/links/list/abc?tab=sharing` pour `/en/lists/abc?tab=sharing` et pour `/listes/abc?onglet=partage`, `/links/list/new` pour `/lists/new`, `/links/list/abc` pour `ohyoushouldnt://lists/abc` ; `/lists` seul → `null` ; `appleAssociation` contient `/lists/*`, `/en/lists/*`, `/listes/*`, `/en/listes/*` ; `androidPathPrefixes()` contient `/lists/`, `/en/lists/`, `/listes/`, `/en/listes/`
- [X] T008 [P] [US2] `mobile/__tests__/links/linked-list.test.ts` : `linkedListTarget` → membre : `/lists/<id>` ; membre + `tab` `sharing`/`archive`/`reservations`/`settings` → `/share`, `/archives`, `/reservations`, `/settings` ; ancienne valeur `partage` → `/share` ; `tab` inconnu → `/lists/<id>` ; `listId = "new"` → `/lists/new` ; abonné → `{ kind: "help", followedReadToken }` ; ni l'un ni l'autre → `{ kind: "help", followedReadToken: null }` ; liste à la fois membre et abonnée → membre
- [X] T009 [P] [US2] `mobile/__tests__/screens/links-list.test.tsx` (helpers `memory-db`, `fetch`) : membre → `router.replace` vers la liste après `GET /lists` ; non-membre → `link-list.help`, `link-list.back` mène à `/` ; `GET /lists` en échec réseau → décision sur la copie locale (membre connu → liste ; inconnu → aide) ; sans session → `setPendingLink("/links/list/<id>")` et invitation à se connecter ; `mustChangePassword` → `/change-password`
- [X] T010 [P] [US2] `mobile/__tests__/links/pending.test.tsx` : `useNextLink` avec `next=/lists/abc` et `next=/listes/abc` garde `/links/list/abc` ; `next=/invite/x` inchangé ; `next=/account` ignoré
- [X] T011 [P] [US2] `mobile/__tests__/links/app-config.test.ts` : les intent filters Android de `mobile/app.config.ts` contiennent les préfixes `/lists/` et `/listes/` (avec et sans `/en`)

### Implementation for User Story 2

- [X] T012 [US2] Ajouter `{ "site": "/lists/:listId", "app": "/links/list/:listId", "keepQuery": ["tab"] }` à `src/site/app-link-routes.json` ; dans `src/site/app-links.ts`, retirer la phrase « No `/lists/:id`: the app opens these site pages on purpose… » du commentaire de `APP_LINK_ROUTES` (research R1) ; vérifier que `mobile/app.config.ts` reprend la ligne sans autre changement
- [X] T013 [US2] Créer `mobile/src/links/linked-list.ts` (pur, sans import React) : `linkedListTarget(listId, tab, { lists, subscriptions })` selon research R3 et R5 et la table « Correspondance des onglets » de data-model.md ; l'onglet passe par `parseListTab` de `src/site/list-tabs.ts`
- [X] T014 [US2] Dans `mobile/src/links/pending.ts`, `useNextLink` garde aussi un `next` qui se résout en `/links/list/…` ; mettre à jour son commentaire (invitation et adresse de gestion)
- [X] T015 [US2] Créer `mobile/src/features/lists/ListAccessHelp.tsx` : textes `list:accessHelp.*` (`title`, `body`, `howTo`, bouton `backToLists`), composants de `mobile/src/ui/` seulement, aucun style en dur ; prop `followedReadToken` prévue pour US3, non affichée tant qu'elle est `null` ; testID `link-list.help`, `link-list.back`
- [X] T016 [US2] Créer `mobile/app/links/list/[listId].tsx` sur le modèle de `mobile/app/links/invite/[token].tsx` : sans session ou `signedOut` → `setPendingLink(self)` (avec `?tab=` s'il y en a) et invitation à se connecter (`link-list.screen`) ; `mustChangePassword` → `<Redirect href="/change-password" />` ; connecté → `clearPendingLink()`, `refreshLists()` (erreur avalée : on garde la copie locale), état `link-list.loading`, puis `linkedListTarget` sur les données de `useMyLists` : cible de liste → `router.replace`, sinon `<ListAccessHelp>` ; `link-list.back` → `router.replace("/")`
- [X] T017 [US2] Parcours Maestro `mobile/.maestro/flows/026-us2-management-link.yaml` (tag `026-us2`, `name:` en anglais) : compte démo connecté ; `openLink` `ohyoushouldnt://lists/<id d'une liste du compte>` → `list.screen` ; `openLink` `ohyoushouldnt://listes/<id d'une liste d'un autre compte>` → `link-list.help`, `tapOn link-list.back` → `lists.screen`. Obtenir les deux ids depuis la base e2e (script de `mobile/.maestro/scripts/` existant si l'un convient, sinon nouveau script) ; chaque `id:` doit exister dans l'app (vérifié par `npm --prefix mobile test`)
- [ ] T018 [US2] (À FAIRE : le 2026-11-18, Maestro n'a pas pu démarrer son pilote iOS, machine surchargée, charge moyenne 83 ; trois simulateurs démarrés, d'où un lancement direct de `maestro test --device E26F…` au lieu de la commande e2e) Lancer le parcours : serveur sur `WISHLIST_DATA_PATH=tmp/e2e/wishlist.json` (port 3010), app sur le simulateur iOS de référence, `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/026-us2-management-link.yaml` vert ; vérifier à la main quickstart US2 (points 4 à 6 : sans session, liste inconnue, mode avion)
- [X] T019 [US2] Commit de la story : contrôles verts, puis `feat: open list management links in the app (US2)`, sans demander

**Checkpoint**: l'adresse de gestion ouvre l'app sur la bonne destination.

---

## Phase 5: User Story 3 - Accès direct pour une personne qui suit déjà la liste (Priority: P3)

**Goal**: un abonné non membre voit « Voir la liste » sur la page d'aide (site) et sur l'écran d'aide (app).

**Independent Test**: quickstart.md, section US3.

### Tests for User Story 3

- [X] T020 [P] [US3] `tests/domain/subscription.test.ts` : `viewerRelation` → abonné non membre `{ isMember: false, subscribed: true }` ; membre et abonné → `subscribed: false` ; ni l'un ni l'autre → les deux `false` (compléter seulement les cas absents)
- [X] T021 [P] [US3] `mobile/__tests__/screens/links-list.test.tsx` : abonné → `link-list.view-followed` visible, mène à `/guest/<readToken>` ; non abonné → absent

### Implementation for User Story 3

- [X] T022 [US3] Dans `app/lists/[id]/page.tsx`, pour un non-membre : `viewerRelation(doc, id, user.id)` ; si `subscribed`, passer `followedReadUrl = withLocale(locale, "/l/<readToken>")` à `<ListAccessHelp>` ; le `readToken` n'est lu que dans ce cas (FR-003)
- [X] T023 [US3] Dans `components/site/list-access-help.tsx`, quand `followedReadUrl` est donné : `accessHelp.followedBody` à la place de `accessHelp.howTo` et `LinkButton` `accessHelp.viewFollowed` vers ce lien (la page publique applique le mot de passe de lecture, FR-004)
- [X] T024 [US3] Dans `mobile/src/features/lists/ListAccessHelp.tsx`, quand `followedReadToken` est donné : `accessHelp.followedBody` à la place de `accessHelp.howTo` et `Button` `accessHelp.viewFollowed` (testID `link-list.view-followed`) → `router.replace("/guest/<readToken>")`
- [ ] T025 [US3] Vérifier à la main quickstart US3 (site et app, dont le mot de passe de lecture) — site vérifié le 2026-11-18 (Playwright : « Voir la liste » pour l'abonné, absent sinon, mot de passe de lecture demandé) ; app à vérifier sur le simulateur (couverte par jest)
- [X] T026 [US3] Commit de la story : contrôles verts, puis `feat: offer the followed list on the access-denied page (US3)`, sans demander

---

## Phase 6: User Story 4 - La propriétaire partage le bon lien (Priority: P4)

**Goal**: action « Partager » visible depuis tous les onglets de la page de gestion, et note dans l'onglet Partage.

**Independent Test**: quickstart.md, section US4.

### Implementation for User Story 4

- [X] T027 [P] [US4] Ajouter `share.action` (« Partager » / « Share ») et `share.addressNote` (texte de `contracts/screens.md`) dans `locales/fr/list.json` et `locales/en/list.json`
- [X] T028 [US4] Dans `app/lists/[id]/page.tsx`, ajouter dans l'en-tête (à côté du titre) un `LinkButton` `share.action` vers `withLocale(locale, tabHref(id, "sharing"))`, masqué quand `tab === "sharing"` (FR-006)
- [X] T029 [US4] Dans l'onglet Partage de `app/lists/[id]/page.tsx`, afficher `share.addressNote` sous `share.description` (FR-007)
- [X] T030 [US4] Vérifier à la main quickstart US4 sur chaque onglet, en français et en anglais, y compris en largeur de téléphone
- [X] T031 [US4] Commit de la story : contrôles verts, puis `feat: make the list sharing action visible (US4)`, sans demander

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T032 [P] `mobile/__tests__/e2e/coverage.test.ts` : ajouter `"026": "specs/026-access-denied-help/spec.md"` ; dans `mobile/.maestro/exclusions.md`, lignes `026-us1` et `026-us4` (site seulement) et `026-us3` (couverte par jest et le quickstart), au format des lignes existantes
- [X] T033 [P] `README.md` ou `deploy/` : rien à changer (aucune variable) ; noter dans le ticket WISH-30 l'ordre de mise en prod de research R2 (app publiée sur les stores avant le merge sur `main`)
- [X] T034 Commit Polish : contrôles verts, puis `chore: record the 026 e2e coverage`, sans demander

---

## Dependencies & Execution Order

- Setup (T001-T002) → US1 → US2 → US3 → US4 → Polish.
- US2 ne dépend pas du code de US1, seulement des textes de T002.
- US3 dépend de US1 (composant du site) et de US2 (écran de l'app).
- US4 est indépendante (seulement `app/lists/[id]/page.tsx`, déjà touché par US1 et US3 : commiter seulement les changements de la story).

### Parallel Opportunities

- T007 à T011 (tests US2) en parallèle ; T012 et T013 en parallèle après eux.
- T020 et T021 en parallèle.
- T027 en parallèle de toute tâche hors `locales/`.

## Parallel Example: User Story 2

```bash
Task: "app-links tests in tests/domain/app-links.test.ts"
Task: "linkedListTarget tests in mobile/__tests__/links/linked-list.test.ts"
Task: "screen tests in mobile/__tests__/screens/links-list.test.tsx"
Task: "useNextLink tests in mobile/__tests__/links/pending.test.tsx"
```

## Implementation Strategy

1. MVP : Setup + US1 → la page du site débloque le cas observé en prod ; déployable seule (aucun effet sur l'app).
2. US2 : nécessite une nouvelle version de l'app ; à publier sur les stores avant que le site (fichier Apple) ne la déclare en prod (research R2).
3. US3 puis US4 : améliorations indépendantes.
