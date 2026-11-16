---

description: "Task list for feature 020-surprise-mode"
---

# Tasks: Mode surprise, ne pas voir ce qui est réservé sur sa propre liste

**Input**: Design documents from `specs/020-surprise-mode/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/screens.md, quickstart.md

**Tests**: oui. Le guide des agents demande un test de domaine pour chaque règle métier et chaque cas limite, et un parcours Maestro par story de l'app.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`/`chore:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

Avant d'écrire du code Next.js : lire le guide utile dans `node_modules/next/dist/docs/` (server actions, composants client).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: aucun outil ni dépendance à ajouter ; on prépare seulement la base de démo pour les vérifications.

- [X] T001 Vérifier que `npm run demo:data -- tmp/demo-wishlist.json` produit une liste partagée par deux comptes de démo et au moins une réservation d'invité ; sinon, compléter les données de démo dans `scripts/` (comptes `@example.test` seulement) et le test `tests/domain/demo-seed.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: une réservation n'archive plus l'idée (research R1), le réglage existe (R2), et une seule règle range une idée pour un membre (R3). Hors mode surprise, tout se comporte comme avant, sauf la phrase des Archives (R1).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests de domaine (écrits d'abord, rouges)

- [X] T002 [P] Écrire `tests/domain/surprise.test.ts` : `surpriseModeOf` (faux par défaut, vrai après `setSurpriseMode`, propre au membre : un autre membre de la même liste reste à faux) ; `setSurpriseMode` refusé à un non-membre (`notMember`) ; `memberShelf` pour les quatre lignes du tableau « Placement » de `data-model.md` (libre/réservée × archivée ou non × mode surprise ou non)
- [X] T003 [P] Compléter `tests/domain/reserve.test.ts` : `reserveItem` laisse `archived` à `false` ; une seconde réservation reste refusée (`itemAlreadyReserved`) ; une idée archivée par un membre reste refusée (`itemNotInList`)
- [X] T004 [P] Compléter `tests/domain/items.test.ts` : annuler une réservation (`cancelReservation`, `cancelOwnReservation`) ne change pas `archived` ; une idée réservée puis archivée par un membre reste archivée après l'annulation
- [X] T005 [P] Compléter `tests/domain/read-list.test.ts` (FR-014) : la vue publique cache une idée réservée par un autre alors que `archived` vaut `false`, et montre celle du visiteur ; `availableItems` l'exclut aussi
- [X] T006 [P] Compléter `tests/domain/store-import.test.ts` (ou le test de `legacy-json`) : un ancien JSON avec une idée réservée `archived: true` est importé avec `archived: false`, et ses appartenances avec `surpriseMode: false`

### Modèle et stockage

- [X] T007 Ajouter `surpriseMode: boolean` à `Membership` dans `src/domain/types.ts`, et `false` partout où une appartenance est créée (création de liste, invitation acceptée, transfert de propriété à la suppression d'un compte : chercher `role: "owner"` et `role: "member"` dans `src/domain/`)
- [X] T008 Ajouter la colonne dans `src/store/schema.ts` : `surpriseMode: integer("surprise_mode", { mode: "boolean" }).notNull().default(false)` sur `memberships` ; lancer `npm run db:generate`, puis ajouter à la main à la fin de la migration générée `drizzle/0006_*.sql` : `UPDATE items SET archived = 0 WHERE id IN (SELECT item_id FROM reservations);` (relire et versionner le `.sql` et `drizzle/meta/`)
- [X] T009 Dans `src/store/legacy-json.ts` : `surpriseMode` optionnel (`"boolean?"`) sur `memberships`, défaut `false` ; normaliser `archived = false` pour toute idée qui a une réservation (research R10)

### Règles de domaine

- [X] T010 `src/domain/reserve.ts` : `reserveItem` ne met plus `archived = true` ; mettre à jour le commentaire « A reserved idea is archived » (l'idée réservée est reconnue par sa réservation)
- [X] T011 `src/domain/items.ts` : `removeReservation` ne touche plus `archived`
- [X] T012 Créer `src/domain/surprise.ts` : `surpriseModeOf(doc, wishlistId, userId): boolean`, `isReserved(doc, itemId): boolean`, `memberShelf(doc, item, surprise): "ideas" | "archives"` (hors mode surprise : `archives` si `item.archived` ou réservée ; en mode surprise : `archives` seulement si `item.archived`), `setSurpriseMode(doc, { wishlistId, actorId, enabled })` (`notMember` si l'acteur n'est pas membre ; n'écrit que la ligne de l'acteur) ; T002 passe au vert

### Vues existantes à garder identiques hors mode surprise

- [X] T013 `src/server/api/views.ts` : `toMemberListView` et `toListSummary` reçoivent l'id du compte ; `items[].archived` = `memberShelf(...) === "archives"` ; `itemCount` compte les idées du rayon « ideas » du compte ; passer l'id depuis `src/server/commands/lists.ts` (`memberListView`, `listMine`). Hors mode surprise, les valeurs sont exactement celles d'avant (research R7)
- [X] T014 `app/lists/[id]/page.tsx` : `activeItems` / `archivedItems` calculés avec `memberShelf` et `surpriseModeOf` (au lieu de `item.archived`)
- [X] T015 [P] Archives, site : dans `app/lists/[id]/page.tsx`, sur une idée réservée, remplacer le formulaire « Remettre dans la liste » par le texte `list:archives.reservedHint` (« Cette idée est réservée : annulez la réservation pour la remettre dans la liste. »), ajouté à `locales/fr/list.json` et `locales/en/list.json`
- [X] T016 [P] Archives, app : dans `mobile/app/(app)/lists/[listId]/archives.tsx`, sur une idée dont l'id figure dans `list.reservations`, afficher `t("archives.reservedHint")` (`testID="archives.reserved-hint"`) à la place du bouton `archives.restore` ; test d'écran dans `mobile/__tests__/screens/`
- [X] T017 Lancer `npm test` (T002 à T006 verts, aucun test existant cassé ; adapter ceux qui supposaient qu'une réservation archive l'idée) et `npm run db:check -- data/wishlist.db --counts` sur une copie de la base locale migrée

**Checkpoint**: hors mode surprise, le site et l'app se comportent comme avant (sauf la phrase des Archives).

---

## Phase 3: User Story 1 - Activer le mode surprise et ne plus voir les réservations (Priority: P1) 🎯 MVP

**Goal**: sur le site, un membre coche « Ne pas voir les cadeaux réservés » ; ses idées réservées restent dans « Idées » sans marque, absentes d'« Archives », l'onglet « Réservations » n'a ni compteur ni contenu, les refus sont neutres, « Voir comme invité » prévient.

**Independent Test**: quickstart.md, section US1 (étapes 1 à 9).

### Tests

- [X] T018 [P] [US1] Compléter `tests/domain/items.test.ts` et `tests/domain/move-copy.test.ts` (FR-010a) : acteur en mode surprise → supprimer ou déplacer une idée réservée rend `itemLockedSurprise` ; acteur hors mode surprise → `itemHasReservation` / `itemReservedCannotMove` inchangés ; copier reste permis ; idée libre : suppression permise dans les deux modes
- [X] T019 [P] [US1] Compléter `tests/domain/commands-lists.test.ts` : commande `setSurpriseMode` (compte requis, membre requis, bascule et relecture) ; `readMemberList` en mode surprise rend `surpriseMode: true`, `reservations: []`, l'idée réservée avec `archived: false` ; un second membre de la même liste reçoit toujours les réservations

### Implementation

- [X] T020 [US1] `src/domain/items.ts` : dans `deleteItem` et dans le déplacement (refus `itemReservedCannotMove`, l. ~223), rendre `itemLockedSurprise` quand `surpriseModeOf(doc, wishlistId, actorId)` est vrai
- [X] T021 [P] [US1] Ajouter `itemLockedSurprise` à `locales/fr/errors.json` (« Cette idée ne peut pas être supprimée ou déplacée pour le moment. Voir les réservations pour en savoir plus. ») et `locales/en/errors.json`
- [X] T022 [US1] `src/server/commands/lists.ts` : commande `setSurpriseMode(ctx, { wishlistId, enabled })` (`activeUser`, `findMembership`, `updateDocument`, relit la vue membre) ; `toMemberListView` (`src/server/api/views.ts`) ajoute `surpriseMode` et rend `reservations: []` quand il est vrai
- [X] T023 [US1] `src/server/actions.ts` : `setSurpriseModeAction(formData)` (FormData → commande → redirection vers l'onglet `sharing` avec `ok=surprise` ou `ok=surpriseCleared`)
- [X] T024 [P] [US1] Ajouter les clés `list:surprise.*` de `contracts/screens.md` (titre, description, case, messages, `hiddenHint`, `guestView*`) à `locales/fr/list.json` et `locales/en/list.json` (mêmes clés, vouvoiement, lexique du produit)
- [X] T025 [P] [US1] Créer `components/site/surprise-mode-form.tsx` : carte « Garder la surprise » avec `components/ui/checkbox.tsx`, envoi par `setSurpriseModeAction`
- [X] T026 [P] [US1] Créer `components/site/guest-view-link.tsx` : hors mode surprise, le `LinkButton` actuel ; en mode surprise, un `components/ui/dialog.tsx` avec `guestViewTitle`, `guestViewBody`, « Ouvrir la vue invité » (navigue) et « Rester ici » (remplacé à la revue par `ConfirmForm` avec `href`)
- [X] T027 [US1] `app/lists/[id]/page.tsx` : carte `SurpriseModeForm` dans l'onglet Partage (après « Protéger l'accès à votre liste », avant « Gérer les membres », visible de tout membre) ; alertes `ok=surprise` / `ok=surpriseCleared` ; `GuestViewLink` à la place du lien « Voir comme invité » ; en mode surprise, pas de compteur sur l'onglet « Réservations », et l'onglet ne rend que `list:surprise.hiddenHint` sans aucune donnée de réservation dans le HTML (le bouton de révélation arrive en US2)
- [X] T028 [US1] `src/server/mcp/server.ts` : description de `get_list` (« `reserved` is always false when the user chose not to see reservations on this list ») ; compléter `tests/domain/mcp-server.test.ts` : en mode surprise, `get_list` rend `reserved: false` et l'idée réservée non archivée, `delete_idea` rend le refus neutre
- [X] T029 [US1] Vérifier à la main quickstart.md, section US1, sur la base de démo (site)
- [X] T030 [US1] Commit de la story : contrôles verts, puis `feat: let a member hide reservations on their own list (US1)` (avec Setup et Foundational), sans demander

**Checkpoint**: le mode surprise marche sur le site ; on ne peut pas encore révéler les réservations.

---

## Phase 4: User Story 2 - Aller voir volontairement les réservations (Priority: P1)

**Goal**: en mode surprise, « Voir les réservations » + confirmation affiche les réservations ; elles sont de nouveau cachées au rechargement ou au changement d'onglet.

**Independent Test**: quickstart.md, section US2 (étapes 1 à 6).

### Tests

- [X] T031 [P] [US2] Compléter `tests/domain/commands-lists.test.ts` : commande `revealReservations` (compte requis, membre requis, rend les lignes de `listOffrir` quel que soit le mode surprise, liste vide → `[]`)

### Implementation

- [X] T032 [US2] `src/server/commands/lists.ts` : `revealReservations(ctx, { wishlistId })` → `{ ok: true, reservations }` (mêmes champs que `MemberReservation`)
- [X] T033 [US2] `src/server/actions.ts` : `revealReservationsAction(wishlistId)` qui rend les lignes (pas de redirection), pour un composant client
- [X] T034 [P] [US2] Ajouter les clés `list:surprise.reveal`, `revealTitle`, `revealBody`, `revealConfirm`, `revealKeep` à `locales/fr/list.json` et `locales/en/list.json` (clés ajoutées avec celles de US1, dans le même bloc `surprise`)
- [X] T035 [US2] Créer `components/site/reservations-reveal.tsx` : `hiddenHint`, bouton « Voir les réservations », `components/ui/dialog.tsx` de confirmation, puis appel de `revealReservationsAction` et affichage des cartes habituelles (idée, catégorie, « De la part de … », mot, `ConfirmForm` « Annuler la réservation » avec `cancelReservationAction`) ; état local seulement (rien dans l'adresse ni le stockage du navigateur) ; liste vide → `list:reservations.empty`. Extraire la carte d'une réservation de `app/lists/[id]/page.tsx` en un composant partagé plutôt que la dupliquer
- [X] T036 [US2] `app/lists/[id]/page.tsx` : en mode surprise, l'onglet « Réservations » rend `ReservationsReveal` (toujours sans données de réservation dans le HTML)
- [X] T037 [US2] Vérifier à la main quickstart.md, section US2
- [X] T038 [US2] Commit de la story : contrôles verts, puis `feat: reveal reservations on demand in surprise mode (US2)`, sans demander

**Checkpoint**: US1 et US2 complètes sur le site.

---

## Phase 5: User Story 3 - Le mode surprise dans l'app mobile (Priority: P2)

**Goal**: l'app a la même carte, applique le même rangement, cache le compteur et révèle à la demande, sans jamais garder de réservation révélée sur le téléphone.

**Independent Test**: quickstart.md, section US3 ; parcours `mobile/.maestro/flows/020-us3-surprise-mode.yaml`.

### Contrat et API

- [X] T039 [US3] Reporter `contracts/api.md` dans `specs/004-mobile-api/contracts/openapi.yaml` : `MemberList.surpriseMode` (requis) et descriptions de `items` / `reservations` ; `PUT /lists/{listId}/surprise-mode` (`{ enabled: boolean }` → `200 MemberList`, `400`, `401`, `404`) ; `GET /lists/{listId}/reservations` (`200 { reservations: MemberReservation[] }`, `401`, `404`) ; `itemLockedSurprise` dans les erreurs de `DELETE …/items/{itemId}` et `POST …/move`
- [X] T040 [P] [US3] Créer `app/api/v1/lists/[listId]/surprise-mode/route.ts` (PUT : `withApi` → corps JSON → `setSurpriseMode` → `apiJson`)
- [X] T041 [P] [US3] Créer `app/api/v1/lists/[listId]/reservations/route.ts` (GET : `withApi` → `revealReservations` → `apiJson`) à côté du dossier `[reservationId]` existant
- [X] T042 [US3] Compléter `tests/domain/api-http.test.ts` : les deux routes (succès, non membre → 404, corps invalide → 400) ; `tests/domain/api-contract.test.ts` vert (chaque opération a sa route)
- [X] T043 [US3] `npm --prefix mobile run api:types` (régénère `mobile/src/api/schema.d.ts`)

### App

- [X] T044 [P] [US3] `mobile/src/data/sharing.ts` : `setSurpriseMode(listId, enabled)` (PUT, puis remplace la copie locale de la liste par la `MemberList` reçue) et `revealReservations(listId)` (GET, rend les lignes sans rien écrire dans la base locale)
- [X] T045 [P] [US3] Créer `mobile/src/features/sharing/SurpriseCard.tsx` : carte « Garder la surprise » avec `mobile/src/ui/Checkbox.tsx`, désactivée hors ligne (`useOnline` + `NetworkNote`), message `saved`/`cleared` ; `testID` `share.surprise`, `share.surprise-toggle`, `share.surprise-saved`
- [X] T046 [US3] `mobile/app/(app)/lists/[listId]/share.tsx` : insérer `SurpriseCard` à la même place que sur le site
- [X] T047 [P] [US3] `mobile/src/features/lists/ListScreen.tsx` : pas de compteur sur l'onglet « Réservations » quand `list.surpriseMode`
- [X] T048 [US3] `mobile/app/(app)/lists/[listId]/reservations.tsx` : quand `list.surpriseMode`, ne jamais lire `list.reservations` ; afficher `hiddenHint` (`testID="reservations.hidden"`), bouton « Voir les réservations » (`reservations.reveal`, désactivé hors ligne avec `NetworkNote`), `ConfirmDialog` (`reservations.reveal-confirm`), puis les lignes de `revealReservations` en état local ; après une annulation, recharger ces lignes ; quitter l'écran les oublie
- [X] T049 [US3] Afficher `errors:itemLockedSurprise` reçu du serveur à la suppression et au déplacement (vérifier que `mobile/src/features/errors` traduit le code sans changement, sinon l'ajouter) (rien à changer : l’app traduit le code avec les mêmes `locales/`)
- [X] T050 [P] [US3] Tests jest dans `mobile/__tests__/` (faux `fetch`, base en mémoire) : `SurpriseCard` (bascule en ligne, désactivée hors ligne) ; `reservations.tsx` en mode surprise (rien d'affiché avant confirmation, lignes après, rien écrit dans la base locale) ; `ListScreen` sans compteur
- [X] T051 [US3] Écrire `mobile/.maestro/flows/020-us3-surprise-mode.yaml` (tag `020-us3`, `name:` en anglais) : cocher le mode dans Partage, vérifier qu'une idée réservée est dans Idées et pas dans Archives, révéler les réservations, quitter et revenir (caché), décocher ; ajouter `"020": "specs/020-surprise-mode/spec.md"` à `mobile/__tests__/e2e/coverage.test.ts`, et dans `mobile/.maestro/exclusions.md` deux lignes « story entière » pour `020-us1` et `020-us2` (site, sans suite e2e ; leur comportement dans l'app est couvert par `020-us3`), avec des liens vers les sections du quickstart
- [X] T052 [US3] Lancer le parcours `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/020-us3-surprise-mode.yaml` sur le simulateur de référence, et vérifier à la main quickstart.md, section US3 (dont le mode avion) — parcours vert sur iPhone 17 Pro (iOS 26.5), build Debug ; mode avion couvert par `reservations.test.tsx` ; `dev-client-reconnect.yaml` attend désormais le lanceur d’un build Debug fraîchement installé
- [X] T053 [US3] Commit de la story : contrôles verts, puis `feat: surprise mode in the mobile app and the API (US3)`, sans demander

**Checkpoint**: les trois stories marchent seules et ensemble.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T054 [P] Mettre à jour le guide du site si une page décrit l'onglet Réservations ou les Archives (`app/guide/`, `locales/*/guide*.json`), et la FAQ si elle parle de « voir les réservations »
- [ ] T055 [P] Relancer `npm run db:check -- <copie de la base de prod> --counts` après migration, et noter dans `quickstart.md` le résultat (nombre d'idées réservées désarchivées) — **à faire au déploiement** : pas de copie de la base de prod sur la machine de développement
- [X] T056 Relire `tests/domain/code-language.test.ts` vert (commentaires et descriptions de tests en anglais)
- [X] T057 Commit Polish : contrôles verts, puis `chore: polish the surprise mode docs (020)`, sans demander (sauter si rien n'a changé)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance.
- **Foundational (Phase 2)** : après Setup ; bloque toutes les stories (le découplage réservation/archive change le rangement partout).
- **US1 (Phase 3)** : après Foundational.
- **US2 (Phase 4)** : après US1 (l'onglet caché de T027 reçoit le bouton de révélation).
- **US3 (Phase 5)** : après Foundational ; réutilise les commandes de US1 (`setSurpriseMode`) et US2 (`revealReservations`), donc en pratique après US2.
- **Polish (Phase 6)** : après les stories.

### Within Each Phase

- Tests de domaine écrits d'abord, rouges, puis la règle.
- Domaine → commandes → adaptateurs (actions, routes) → écrans.
- « Commit de la story » est la dernière tâche de la phase, après la vérification du quickstart.

### Parallel Opportunities

- T002 à T006 (fichiers de test distincts).
- T015 (site) et T016 (app).
- US1 : T018/T019, puis T021, T024, T025, T026 (fichiers distincts).
- US3 : T040/T041 (deux routes), puis T044, T045, T047, T050.

---

## Parallel Example: User Story 3

```bash
Task: "Créer app/api/v1/lists/[listId]/surprise-mode/route.ts"
Task: "Créer app/api/v1/lists/[listId]/reservations/route.ts"

Task: "mobile/src/data/sharing.ts : setSurpriseMode et revealReservations"
Task: "Créer mobile/src/features/sharing/SurpriseCard.tsx"
Task: "mobile/src/features/lists/ListScreen.tsx : pas de compteur en mode surprise"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (fondation, comportement inchangé hors mode surprise).
2. US1 : le mode surprise sur le site.
3. **STOP and VALIDATE** : quickstart US1.

### Incremental Delivery

1. Fondation + US1 → commit (US1).
2. US2 → commit (US2) : le mode surprise est complet sur le site.
3. US3 → commit (US3) : l'app et l'API ; une nouvelle version de l'app sera à publier (les versions 1.0/1.1 ne spoilent pas mais ne révèlent pas).
4. Polish → commit.
5. Revue `wishlist-feature-review` (hook `after_implement`), corrections dans un commit à part avec `review.md`.

---

## Notes

- Hors mode surprise, `items[].archived` dans l'API garde la valeur d'avant la 020 : ne pas changer les écrans de l'app qui le lisent, sauf `archives.tsx` (T016).
- Aucune donnée de réservation dans le HTML ni dans la `MemberList` d'un membre en mode surprise : c'est la garantie de SC-001, à vérifier en affichant la source de la page.
- Push et squash sur `main` : attendre l'utilisateur.
