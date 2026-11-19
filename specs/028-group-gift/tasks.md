---

description: "Tasks for feature 028: cadeau commun"
---

# Tasks: Cadeau commun, plusieurs participants sur une même idée

**Input**: Design documents from `specs/028-group-gift/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/screens.md, quickstart.md

**Tests**: oui. AGENTS.md demande un test de domaine pour chaque règle métier et chaque cas limite (`tests/domain/*.test.ts`, `node:test` + `tsx`, base temporaire via `withStore` / `withTempDataPath`, `closeStore()` avant suppression). App : jest-expo dans `mobile/__tests__/` et un parcours Maestro par story de l'app.

**Organization**: une phase par user story, dans l'ordre des priorités (US1, US2 en P1 ; US6, US3, US4, US7 en P2 ; US5 en P3). US5 (fil de messages) arrive en dernier et porte sa propre partie API et app, puisque US7 (app) la précède.

## Un commit par user story (règle du projet)

Chaque phase de user story se termine par une tâche **« Commit de la story »**, la dernière de la phase, avec le label de la story. Règles :

- Les phases Setup et Foundational n'ont pas de commit propre : elles entrent dans le commit de la première story (US1).
- Chaque commit est vert (lint, types, tests). Un test existant à adapter va dans le commit de la story qui rend l'adaptation nécessaire.
- Un fichier modifié par deux stories est commité en deux temps (seulement les changements de la story en cours).
- La phase Polish a son propre commit. Les corrections de la revue lancée par le hook `after_implement` forment un commit à part, `fix: corrections de la revue`, avec `review.md`.
- Message en anglais, préfixé `feat:`, `fix:` ou `chore:`, terminé par `(USn)`.
- Le commit se crée sans demander l'accord, sur la branche `028-group-gift` (jamais sur `staging` ni `main`). Seuls le push et le squash sur `main` attendent l'utilisatrice.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers différents, pas de dépendance sur une tâche non finie)
- **[Story]** : US1 … US7

---

## Phase 1: Setup

**Purpose**: préalables de gouvernance et de branche

- [X] T001 Vérifier que `.specify/memory/constitution.md` porte l'amendement daté des principes III et V (texte proposé : research.md R12, version MINOR 2.2.0, décision de Cloé). **S'il manque, s'arrêter et le demander à l'utilisatrice** : aucune tâche suivante ne commence sans lui
- [X] T002 Créer la branche `028-group-gift` depuis `staging` (`git switch -c 028-group-gift staging`), après avoir vérifié que l'arbre de travail est propre ; y apporter le dossier `specs/028-group-gift/`
- [X] T003 Lire dans `node_modules/next/dist/docs/` les guides des server actions, des formulaires (`useActionState`) et des route handlers avant d'écrire du code Next

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: données et règles communes à toutes les stories. Aucune story ne commence avant la fin de cette phase.

- [X] T004 Ajouter les types dans `src/domain/types.ts` : `Reservation.groupGiftId: string | null` (« null = réservation seule ») et `Reservation.amountCents: number | null` ; `GroupGift { id, wishlistId, itemId, token, status: "open" | "complete", createdAt, completedAt: string | null }` ; `GroupGiftMessage { id, groupGiftId, userId: string | null, authorName: string | null, body, createdAt }` ; `Database.groupGifts`, `Database.groupGiftMessages`. Mettre à jour toutes les créations de `Reservation` (`src/domain/reserve.ts`, fixtures de `tests/domain/helpers/`, `data/seed.json` si besoin, `scripts/create-demo-data.mjs`) avec `groupGiftId: null, amountCents: null`
- [X] T005 Schéma dans `src/store/schema.ts` (data-model.md) : table `group_gifts` (`id` PK, `wishlist_id` → wishlists, `item_id` → items **UNIQUE**, `token` **UNIQUE**, `status` TEXT NOT NULL DEFAULT 'open', `created_at`, `completed_at` NULL, index `group_gifts_wishlist_id`) ; table `group_gift_messages` (`id` PK, `group_gift_id` → group_gifts, `user_id` NULL → users, `author_name` NULL, `body` NOT NULL, `created_at`, index `group_gift_messages_group_gift_id`) ; `reservations` : + `group_gift_id` NULL → group_gifts, + `amount_cents` INTEGER NULL, `item_id` **sans** `.unique()`, `uniqueIndex("reservations_item_single").on(item_id).where(sql\`group_gift_id IS NULL\`)`, `uniqueIndex("reservations_gift_user").on(group_gift_id, user_id)`, index `reservations_group_gift_id` ; mettre à jour le commentaire « principle III »
- [X] T006 `npm run db:generate` → `drizzle/0008_*.sql` : relire la reconstruction de `reservations` (toutes les colonnes recopiées, index `reservations_wishlist_id` et `reservations_user_id` recréés, `PRAGMA foreign_keys` rétabli) ; renommer le fichier `0008_group_gifts.sql` si le nom généré est aléatoire (et `drizzle/meta/_journal.json`) ; vérifier sur une copie de `data/wishlist.db` avec `npm run db:check -- <copie> --counts` avant/après démarrage (même nombre de réservations)
- [X] T007 `src/store/rows.ts` : `COLLECTIONS.groupGifts = byId(schema.groupGifts)`, `COLLECTIONS.groupGiftMessages = byId(schema.groupGiftMessages)` ; `COLLECTION_NAMES` avec `groupGifts` **avant** `reservations` et `groupGiftMessages` après ; `readAll` lit les deux tables
- [X] T008 [P] `src/store/legacy-json.ts` : normaliser un ancien JSON (`groupGifts: []`, `groupGiftMessages: []`, `groupGiftId: null`, `amountCents: null` sur chaque réservation) ; test dans `tests/domain/store-import.test.ts`
- [X] T009 [P] Tests du store dans `tests/domain/store-write.test.ts` et `tests/domain/store-rows.test.ts` : deux réservations seules sur la même idée refusées par la base ; deux participations (même idée, même `group_gift_id`, `user_id` NULL) acceptées ; deux participations du même compte au même cadeau refusées ; suppression de la dernière participation et du cadeau dans la même écriture valide
- [X] T010 Créer `src/domain/group-gift.ts` (pur, sans `server-only`) : constantes `MAX_AMOUNT_CENTS = 10_000_000`, `parseAmount(input)` (réutilise `parsePrice` de `src/domain/price.ts` ; vide → null ; invalide, 0 ou > max → `"invalid"`) ; `findGroupGiftByToken`, `groupGiftOfItem`, `participationsOf(doc, groupGiftId)` ; `isParticipant(doc, gift, userId, claimedIds)` ; `totals(doc, gift)` → `{ participantCount, totalCents, remainingCents: max(0, price − total) | null sans prix, goalReached: price !== null && total ≥ price }` (prix lu à l'affichage) ; `pruneGroupGifts(doc)` : supprime tout cadeau sans participation et ses messages
- [X] T011 Brancher l'invariant : `removeReservation` (`src/domain/items.ts:479`) appelle `pruneGroupGifts` ; la suppression d'une liste (`src/domain/membership.ts:71`) supprime aussi ses `groupGifts` et leurs `groupGiftMessages`
- [X] T012 [P] Tests de fondation dans `tests/domain/group-gift.test.ts` (nouveau) : `parseAmount` (« 18,50 », « 18.50 », vide, « 0 », « -3 », « abc », 100 000,01 €), `totals` (avec et sans prix, total > prix → reste 0 et `goalReached`), `pruneGroupGifts`, suppression de liste. Tous les tests existants restent verts (réservation seule inchangée)

**Checkpoint** : base et règles prêtes ; le comportement visible n'a pas changé.

---

## Phase 3: User Story 1 - Lancer un cadeau commun et y participer (Priority: P1) 🎯 MVP

**Goal**: en réservant, choisir « Lancer un cadeau commun » ; d'autres participent avec nom, message et montant facultatifs ; le reste s'affiche ; chacun peut se retirer.

**Independent Test**: quickstart.md § US1 (deux navigateurs, idée à 100 €, 30 € puis 50 € → reste 20 €).

### Tests for User Story 1

- [X] T013 [P] [US1] Tests de domaine dans `tests/domain/group-gift.test.ts` : lancer (idée libre → cadeau `open` + 1 participation) ; refus `itemAlreadyReserved` sur une idée réservée seule ou qui a déjà un cadeau commun ; `itemNotInList` pour une idée archivée ou d'une autre liste ; participer (compteur, total) ; `groupGiftAlreadyJoined` par compte et par preuve ; `fieldTooLong` (nom > 200, message > 2000) ; `invalidAmount` ; se retirer par compte ou par preuve, `accessDenied` sinon ; dernier retrait → idée libre, cadeau supprimé
- [X] T014 [P] [US1] Compléter `tests/domain/reserve.test.ts` (réservation seule refusée sur une idée qui a un cadeau commun) et `tests/domain/read-list.test.ts` (cadeau ouvert visible des non-participants avec son résumé ; participation « à moi » par compte et par preuve ; réservation seule d'un autre toujours absente) et `tests/domain/offrir.test.ts` (`listMyOffers` : participation marquée cadeau commun, avec montant et reste)
- [X] T015 [P] [US1] Test de non-régression de l'API dans `tests/domain/commands-public-list.test.ts` ou `api-views` : `GET /public/lists/{readToken}` **sans** `groupGifts=true` n'expose pas un cadeau commun à un non-participant, et l'expose en `mine` + `reservationId` à un participant (research R9, FR-026)

### Implementation for User Story 1

- [X] T016 [US1] `src/domain/group-gift.ts` : `startGroupGift(doc, { wishlistId, itemId, fromName, note, amountCents, userId, now, id, token })` (crée `GroupGift` avec `token = newToken()` et la première `Reservation` avec `groupGiftId`), `joinGroupGift(doc, { groupGiftId, fromName, note, amountCents, userId, claimedIds, now })` (`groupGiftComplete` si `status === "complete"`, `groupGiftAlreadyJoined`), `leaveGroupGift` (réutilise `cancelOwnReservation` de `src/domain/items.ts`) ; mêmes longueurs que `MAX_FROM_NAME` / `MAX_NOTE` de `src/domain/reserve.ts`
- [X] T017 [US1] `src/domain/reserve.ts` : `reserveItem` refuse `itemAlreadyReserved` si l'idée a un cadeau commun ; `reservedItemIds` / `availableItems` excluent les idées à cadeau commun du choix « Réserver seul » ; la vérification « déjà réservée » ne regarde que les réservations seules
- [X] T018 [US1] `src/domain/read.ts` : `PublicItem.groupGift: GroupGiftSummary | null` (`token, status, participantCount, totalCents, remainingCents, goalReached, mine`) ; `toPublicItem` cherche la réservation seule (`groupGiftId === null`) pour `reserved`/`reservationId`, et le cadeau pour `groupGift` ; `listPublicVisibleItems(doc, wishlistId, mineIds, { groupGifts })` : avec `groupGifts: true`, un cadeau `open` est visible de tous ; sans, il est traité comme une réservation (visible seulement s'il est à moi, `mine` + `reservationId` de ma participation)
- [X] T019 [US1] `src/domain/offrir.ts` : `MyOfferRow` + `groupGift: { token, status, amountCents, remainingCents } | null` dans `listMyOffers`
- [X] T020 [US1] `src/server/commands/public-list.ts` : `reserve(ctx, { …, mode: "single" | "group", amount })` (mode `group` → `startGroupGift`, `parseAmount` côté commande, rend `groupGiftToken`) ; nouveau `src/server/commands/group-gift.ts` (`import "server-only"`) : `readGroupGift(ctx, { token, isUnlocked, claimedIds })`, `joinGroupGift`, `leaveGroupGift`, avec `canAccessPublicListWith` sur la liste du cadeau et `rateLimitForIp` (lancer et participer : seau `reserve:` existant, 15/h ; se retirer : 30/h) ; aucune donnée ne contient le `readToken`
- [X] T021 [US1] Vue du cadeau dans `src/domain/group-gift.ts` : `groupGiftDetail(doc, gift, { userId, claimedIds, locale })` → `GroupGiftDetail` de data-model.md (`participantNames` pour tous ; `participations` avec montants et messages pour les participants seulement ; `me` avec `editable: false` pour l'instant ; `thread: null`) ; tests dans `tests/domain/group-gift.test.ts` (un non-participant ne reçoit ni montant ni message ; pas de `readToken` dans la vue)
- [X] T022 [US1] `src/auth/reservation-claim.ts` : lecture des preuves d'une liste à partir de son `Wishlist` (pour la page du cadeau, sans exposer le `readToken`) ; `grantReservationClaim` réutilisé pour une participation ; test dans `tests/domain/reservation-claim.test.ts`
- [X] T023 [US1] Server actions dans `src/server/actions.ts` : `reserveAction` lit `mode` et `amount` (mode `group` → redirection vers `withLocale("/g/<token>?ok=1")`) ; `joinGroupGiftAction`, `leaveGroupGiftAction` (piège `website`, `grantReservationClaim` / `revokeReservationClaim`, `useActionState` pour garder la saisie en cas d'erreur, comme `reservation-form.tsx`)
- [X] T024 [P] [US1] Primitive `components/ui/radio-group.tsx` (shadcn sur Base UI, même style que `checkbox.tsx`) et son test d'accessibilité si le projet en a un pour les primitives
- [X] T025 [US1] `components/site/reservation-form.tsx` : choix `public:reserve.modeSingle` / `public:reserve.modeGroup` (+ `modeGroupHint`) avec `radio-group` ; champ montant `public:groupGift.amount` et phrase `public:groupGift.privacyHint` en mode cadeau commun (contracts/screens.md)
- [X] T026 [US1] `components/site/public-item-card.tsx` : badge `public:groupGift.badge`, résumé (`summary` avec pluriels, `goalReached`, `total` sans prix), « Participer » ou « Vous participez » + « Voir le cadeau commun » vers `withLocale("/g/<token>")` ; `app/l/[readToken]/page.tsx` appelle `getPublicWishlist` avec `groupGifts: true`
- [X] T027 [US1] Page `app/g/[token]/page.tsx` (nouvelle ; résumé, participants et ma participation écrits dans la page, sans composant à part) et `components/site/group-gift-join-form.tsx` (champs partagés avec « J'offre » dans `components/site/giver-fields.tsx`) : en-tête de l'idée (`public:groupGift.fromList`), résumé, participants (noms pour tous, montants `amountUnknown` et messages pour les participants), formulaire « Participer » (cadeau ouvert, non-participant), ma participation avec « Retirer ma participation » (`ConfirmForm`), `?ok=1`, cadeau disparu → `public:groupGift.missing` (pas de titre de liste) ; `generateMetadata` sans le titre de la liste en `noindex`, et sans le nom de l'idée avant le mot de passe de lecture
- [X] T028 [US1] `app/account/page.tsx` : badge « Cadeau commun », `auth:account.offersAmount`, reste, lien vers `/g/<token>`
- [X] T029 [P] [US1] Textes FR et EN de la story dans `locales/{fr,en}/public.json`, `auth.json`, `errors.json` (`groupGiftMissing`, `groupGiftComplete`, `groupGiftAlreadyJoined`, `invalidAmount`), mêmes clés dans les deux langues, vouvoiement et lexique du produit ; codes dans `src/server/api/errors.ts` (404, 409, 409, 422)
- [X] T030 [US1] Parcours quickstart.md § US1 à la main sur la base de démo (étapes 1 à 8)
- [X] T031 [US1] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `feat: start and join a group gift on the site (US1)` des fichiers de cette story et des phases 1-2, sans demander

**Checkpoint** : le cadeau commun marche sur le site ; l'API et l'app installée ne le voient que comme une réservation.

---

## Phase 4: User Story 2 - Déclarer le cadeau commun complet (Priority: P1)

**Goal**: un participant déclare complet ou rouvre ; un cadeau complet disparaît pour les non-participants.

**Independent Test**: quickstart.md § US2.

- [X] T032 [P] [US2] Tests dans `tests/domain/group-gift.test.ts` et `read-list.test.ts` : `setGroupGiftStatus` par un participant (compte ou preuve) ; `accessDenied` pour un non-participant ; participer à un cadeau complet → `groupGiftComplete` ; complet invisible des non-participants sur la liste, visible des participants ; retrait d'un participant sur un cadeau complet → reste complet ; dernier retrait → idée libre ; rouvrir → visible de nouveau
- [X] T033 [US2] `src/domain/group-gift.ts` : `setGroupGiftStatus(doc, { groupGiftId, status, userId, claimedIds, now })` (`completedAt` à la déclaration) ; `src/domain/read.ts` : cadeau `complete` visible des seuls participants
- [X] T034 [US2] `src/server/commands/group-gift.ts` : `setStatus` (30/h) ; `src/server/actions.ts` : `setGroupGiftStatusAction`
- [X] T035 [US2] `app/g/[token]/page.tsx` et `components/site/group-gift-mine.tsx` : « Le cadeau est complet » / « Rouvrir le cadeau » ; badge « Complet » ; vue d'un non-participant sur un cadeau complet → `public:groupGift.closed`, sans formulaire ; `public-item-card.tsx` : badge « Complet » pour le participant
- [X] T036 [P] [US2] Textes FR/EN (`markComplete`, `reopen`, `complete`, `closed`) dans `locales/{fr,en}/public.json`
- [X] T037 [US2] Parcours quickstart.md § US2
- [X] T038 [US2] Commit de la story : lint, types et tests verts, puis `feat: mark a group gift complete or reopen it (US2)`, sans demander

---

## Phase 5: User Story 6 - Le cadeau commun vu par les membres de la liste (Priority: P2)

**Goal**: pour un membre, un cadeau commun est une idée réservée, regroupée en une entrée dans « Réservations », sans montant ni fil ; annulation d'une participation ou du cadeau entier.

**Independent Test**: quickstart.md § US6.

- [X] T039 [P] [US6] Tests : `tests/domain/offrir.test.ts` (`toOffrirRows` regroupe les participations d'un cadeau, aucune ligne ne contient `amountCents`) ; `tests/domain/surprise.test.ts` (cadeau commun rangé comme une idée réservée, en mode surprise ou non) ; `tests/domain/items.test.ts` (suppression et déplacement refusés) ; `tests/domain/group-gift.test.ts` (`cancelGroupGiftAsMember` : `notMember` ; supprime participations, messages et cadeau) ; `tests/domain/mcp-server.test.ts` (`get_list` : `reserved: true`, aucun autre détail) ; `tests/domain/account-export.test.ts` (export d'une liste par un membre : participations sans montant)
- [X] T040 [US6] `src/domain/offrir.ts` : `OffrirRow` + `groupGift: { id, status, participants: [{ reservationId, fromName, note }] } | null`, une entrée par cadeau ; `src/domain/group-gift.ts` : `cancelGroupGiftAsMember(doc, { wishlistId, actorId, groupGiftId })`
- [X] T041 [US6] `src/server/commands/items.ts` : `cancelGroupGiftAsMember` ; `src/server/actions.ts` : `cancelGroupGiftAction`
- [X] T042 [US6] `components/site/reservation-card.tsx` (et `reservations-reveal.tsx`) : carte de cadeau commun (`list:reservations.groupGift`, état, participants, « Annuler la participation », « Annuler le cadeau commun » avec la confirmation `cancelGroupGiftBody`) ; `app/lists/[id]/page.tsx` : compteur de l'onglet par entrée
- [X] T043 [US6] API membres, sans casser les anciens clients : `src/server/api/views.ts` `MemberReservationView` + `groupGiftId` (nullable), `MemberList.groupGifts: [{ id, itemId, status }]` ; route `app/api/v1/lists/[listId]/group-gifts/[groupGiftId]/route.ts` (`DELETE`, 204 / 403 `notMember` / 404 `groupGiftMissing`) ; décrire d'abord dans `specs/004-mobile-api/contracts/openapi.yaml` (contracts/api.md, version mineure suivante) ; `tests/domain/api-contract.test.ts` vert
- [X] T044 [P] [US6] Textes FR/EN dans `locales/{fr,en}/list.json`
- [X] T045 [US6] Parcours quickstart.md § US6 (étapes 1 à 6)
- [X] T046 [US6] Commit de la story : lint, types et tests verts, puis `feat: show group gifts to list members (US6)`, sans demander

---

## Phase 6: User Story 3 - Inviter d'autres personnes avec le lien du cadeau (Priority: P2)

**Goal**: lien `/g/<token>` à copier ; il ne donne accès qu'au cadeau ; mot de passe de lecture demandé.

**Independent Test**: quickstart.md § US3.

- [X] T047 [P] [US3] Tests : `tests/domain/commands-public-list.test.ts` ou nouveau `tests/domain/commands-group-gift.test.ts` (liste protégée : `readPasswordRequired` sans déverrouillage, corps sans `readToken` ; déverrouillage par le cadeau valable pour la liste ; jeton inconnu → `groupGiftMissing`) ; `tests/domain/sitemap.test.ts` / robots (`/g/` interdit) ; `tests/domain/analytics.test.ts` (jeton masqué)
- [X] T048 [US3] `src/auth/public-list.ts` et `src/server/commands/group-gift.ts` : `unlockGroupGift(ctx, { token, password })` qui pose la même preuve de déverrouillage que la liste (même seau de débit que `unlockPublicList`) ; `src/server/actions.ts` : action de déverrouillage depuis la page du cadeau
- [X] T049 [US3] `app/g/[token]/page.tsx` : formulaire de mot de passe (composant existant de la liste publique) ; section « Inviter à participer », écrite dans la page avec le composant existant `CopyLinkField`, avec copie du lien absolu (origine publique du site, `withLocale`) pour les participants
- [X] T050 [P] [US3] `app/robots.ts` : `Disallow: /g/` ; `src/site/analytics-public.ts` : masquer `/g/<token>` comme `/l/<readToken>`
- [X] T051 [P] [US3] Textes FR/EN (`invite`, `copyLink`, copié) dans `locales/{fr,en}/public.json`
- [X] T052 [US3] Parcours quickstart.md § US3 (dont : le HTML de la page ne contient pas le `readToken`)
- [X] T053 [US3] Commit de la story : lint, types et tests verts, puis `feat: share a group gift link (US3)`, sans demander

---

## Phase 7: User Story 4 - Changer son montant, avec un compte (Priority: P2)

**Goal**: un participant connecté change ou efface son montant ; sans compte, rien n'est modifiable.

**Independent Test**: quickstart.md § US4.

- [X] T054 [P] [US4] Tests dans `tests/domain/group-gift.test.ts` : `setParticipationAmount` par le compte lié (ouvert et complet) ; `accessDenied` pour une participation sans compte (même avec preuve) ou d'un autre compte ; `invalidAmount` ; `null` → « montant non précisé » ; reste recalculé ; `me.editable` vrai seulement pour une participation liée au compte
- [X] T055 [US4] `src/domain/group-gift.ts` : `setParticipationAmount(doc, { groupGiftId, reservationId, userId, amountCents })` ; `groupGiftDetail` : `me.editable`
- [X] T056 [US4] `src/server/commands/group-gift.ts` (`setAmount`, 30/h) ; `src/server/actions.ts` : `setGroupGiftAmountAction`
- [X] T057 [US4] `components/site/group-gift-mine.tsx` : champ montant modifiable (compte) ou phrase `public:groupGift.noAccountHint` (sans compte)
- [X] T058 [P] [US4] Textes FR/EN dans `locales/{fr,en}/public.json`
- [X] T059 [US4] Parcours quickstart.md § US4
- [X] T060 [US4] Commit de la story : lint, types et tests verts, puis `feat: let signed-in participants change their amount (US4)`, sans demander

---

## Phase 8: User Story 7 - Le cadeau commun dans l'app mobile (Priority: P2)

**Goal**: l'app offre lancer, participer, se retirer, complet, lien, montant, et l'onglet Réservations regroupé ; les anciennes apps restent correctes. (Le fil de messages arrive avec US5.)

**Independent Test**: quickstart.md § US7 (étapes 1 à 3, 5, 6 ; l'étape 4 sans le fil).

### API

- [X] T061 [US7] Contrat `specs/004-mobile-api/contracts/openapi.yaml` (contracts/api.md) : schémas `GroupGiftSummary`, `GroupGift`, `GroupGiftParticipation` ; `PublicItem.groupGift`, `PublicList.claimKey` ; query `groupGifts` ; `POST …/reservations` + `mode`, `amountCents`, réponse + `claimKey`, `groupGiftToken` ; opérations `GET /public/group-gifts/{token}`, `POST …/unlock`, `POST …/participations`, `PATCH` et `DELETE …/participations/{reservationId}`, `PUT …/status` ; codes d'erreur
- [X] T062 [US7] `src/auth/reservation-claim.ts` : `claimKeyFor(readToken)` (même condensé que le nom du cookie, research R7) ; `src/server/api/views.ts` : `PublicItemView.groupGift`, `toPublicListView` + `claimKey`, `toGroupGiftView` (jamais de `readToken`)
- [X] T063 [US7] Routes dans `app/api/v1/` (adaptateurs `withApi` → commande → `apiJson` / `apiError`) : `public/lists/[readToken]/route.ts` (`groupGifts=true`), `public/lists/[readToken]/reservations/route.ts` (`mode`, `amountCents`), `public/group-gifts/[token]/route.ts`, `…/unlock/route.ts`, `…/participations/route.ts`, `…/participations/[reservationId]/route.ts` (`PATCH` compte, `DELETE` compte ou `X-Reservation-Claims`), `…/status/route.ts`
- [X] T064 [P] [US7] Tests : `tests/domain/api-contract.test.ts` (chaque opération a sa route) ; tests des vues et commandes (`claimKey` stable, aucun `readToken` dans `GroupGift`, ancien client sans `groupGifts` inchangé, `POST` sans `mode` refusé sur un cadeau commun)

### App

- [X] T065 [US7] `npm --prefix mobile run api:types` (régénère `mobile/src/api/schema.d.ts`)
- [X] T066 [US7] `mobile/src/features/guest/storage.ts` : ranger chaque preuve avec `claimKey` (et `readToken` quand connu) ; `proofHeaders` par `claimKey` ou `readToken` (preuves déjà stockées toujours lues) ; `mobile/src/features/guest/api.ts` : `groupGifts=true` sur la liste, `mode` et `amountCents` à la réservation ; nouveau `mobile/src/features/group-gift/api.ts` (lire, déverrouiller, participer, se retirer, statut, montant) ; tout reste en ligne (jamais la file hors ligne, comme la réservation)
- [X] T067 [P] [US7] `mobile/src/ui/RadioGroup.tsx` (pendant de `components/ui/radio-group.tsx`, jetons de `mobile/src/theme/tokens.ts`, vérifié par le test des jetons) et son entrée dans `mobile/app/dev/catalog.tsx`
- [X] T068 [US7] `mobile/app/guest/[readToken]/reserve.tsx` : choix seul / cadeau commun, montant, puis `router.replace("/gift/<token>")` ; `mobile/src/features/guest/GuestItemCard.tsx` : badge, résumé, « Participer » / « Voir le cadeau commun » (`testID` de contracts/screens.md)
- [X] T069 [US7] Écran `mobile/app/gift/[token].tsx` et sections dans `mobile/src/features/group-gift/` : mêmes sections que le site (résumé, participants, participer, ma participation, montant si compte, complet/rouvrir, partager le lien par la feuille de partage, mot de passe), tirer pour recharger, recharge au focus ; composants de `mobile/src/ui/` uniquement
- [X] T070 [US7] `src/site/app-link-routes.json` : `{ "site": "/g/:token", "app": "/gift/:token", "keepQuery": [] }` ; vérifier `appleAssociation`, `androidPathPrefixes` et `mobile/app.config.ts` (préfixe `/g/`) ; `tests/domain/app-links.test.ts` et `mobile/__tests__/links/` complétés
- [X] T071 [US7] `mobile/app/(app)/lists/[listId]/reservations.tsx` : regroupement par `groupGiftId`, « Annuler le cadeau commun » (`mobile/src/data/labels.ts` ou `sharing.ts` : `DELETE /lists/{listId}/group-gifts/{groupGiftId}`, en ligne)
- [X] T072 [P] [US7] Textes propres à l'app dans `locales/{fr,en}/mobile.json` (« Partager le lien »…) ; `npm --prefix mobile run licenses` seulement si une dépendance change (aucune prévue)
- [X] T073 [P] [US7] Tests jest dans `mobile/__tests__/` : stockage des preuves par `claimKey` (et lecture des anciennes), carte invité, écran du cadeau (non-participant, participant sans compte, avec compte), onglet Réservations regroupé
- [X] T074 [US7] Parcours Maestro `mobile/.maestro/flows/028-us7-group-gift.yaml` (tag `028-us7`) : ouvrir une liste de démo, lancer un cadeau commun avec un montant, voir le reste, se retirer ; `testID` `<écran>.<élément>` ; `npm --prefix mobile test` vérifie les `id:` et la présence du parcours
- [X] T075 [US7] `npm --prefix mobile run lint`, `typecheck`, `test` ; suite e2e du parcours ; quickstart.md § US7 étapes 1-3, 5 et 6 (ancienne app : build de `main`)
- [X] T076 [US7] Commit de la story : lint, types et tests verts (site et app), puis `feat: group gifts in the mobile app (US7)`, sans demander

---

## Phase 9: User Story 5 - Échanger entre participants dans un fil de messages (Priority: P3)

**Goal**: fil propre au cadeau pour les participants avec compte, site et app ; jamais visible des membres non participants.

**Independent Test**: quickstart.md § US5, puis US7 étape 4 avec le fil.

- [X] T077 [P] [US5] Tests dans `tests/domain/group-gift.test.ts` : `postGroupGiftMessage` (participant avec compte ; `accessDenied` sans compte, non-participant, membre non participant ; `messageEmpty` ; `fieldTooLong` au-delà de 2000) ; `authorName` figé (nom de participation, sinon nom du compte) ; `deleteGroupGiftMessage` par l'auteur seulement ; participant retiré : plus d'accès, messages gardés et signés ; cadeau supprimé → messages supprimés ; `thread` dans `groupGiftDetail` : 200 derniers, ordre de création, `null` sauf participant avec compte
- [X] T078 [P] [US5] Tests compte dans `tests/domain/account-deletion.test.ts` (messages : `userId` et `authorName` à `null` → « Ancien participant » ; participations gardées, détachées) et `tests/domain/account-export.test.ts` (`groupGiftMessages`, `myReservations[].groupGift`)
- [X] T079 [US5] `src/domain/group-gift.ts` : `postGroupGiftMessage`, `deleteGroupGiftMessage`, `thread` dans `groupGiftDetail` ; `src/domain/account.ts` : `deleteAccount` anonymise les messages ; export `groupGiftMessages` et `myReservations[].groupGift: { status, amountCents }`
- [X] T080 [US5] `src/server/commands/group-gift.ts` (`postMessage`, `deleteMessage`, 30/h) ; `src/server/actions.ts` : `postGroupGiftMessageAction`, `deleteGroupGiftMessageAction`
- [X] T081 [US5] `components/site/group-gift-thread.tsx` sur `app/g/[token]/page.tsx` (liste, champ, « Envoyer », « Supprimer », `formerParticipant`) ; phrase pour le participant sans compte
- [X] T082 [US5] API : contrat (`GroupGiftMessage`, `GroupGift.thread`, `POST …/messages`, `DELETE …/messages/{messageId}`, export), routes `app/api/v1/public/group-gifts/[token]/messages/route.ts` et `…/messages/[messageId]/route.ts`, vues ; `api:types`
- [X] T083 [US5] App : section fil dans `mobile/src/features/group-gift/` et `mobile/app/gift/[token].tsx` (`gift.message`, `gift.send`) ; tests jest ; parcours Maestro `mobile/.maestro/flows/028-us5-group-gift-thread.yaml` (tag `028-us5`, compte de démo participant : écrire un message, le voir, le supprimer)
- [X] T084 [P] [US5] Textes FR/EN (`thread`, `send`, `deleteMessage`, `formerParticipant`, `messageEmpty`) dans `locales/{fr,en}/public.json`, `errors.json`
- [X] T085 [US5] Parcours quickstart.md § US5 et US7 étape 4 ; lint, types et tests du site et de l'app
- [X] T086 [US5] Commit de la story : tout vert, puis `feat: message thread for group gift participants (US5)`, sans demander

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T087 [P] Pages de confidentialité FR/EN du site (`app/privacy/page.tsx` et ses textes) et de l'app (`mobile/app/legal/privacy.tsx`) : montant annoncé, noms visibles des autres participants et des personnes qui ont le lien du cadeau, fil de messages (qui le lit, conservation, suppression du compte)
- [X] T088 [P] Guide et FAQ (fait : une question de FAQ ; le guide en images n'a pas de nouvelle étape, ses captures restent celles d'avant) (`locales/{fr,en}/content.json`, `app/guide/page.tsx`) : section « Offrir à plusieurs » ; captures si besoin (`npm run demo:capture`)
- [X] T089 [P] Données de démo `scripts/create-demo-data.mjs` : un cadeau commun ouvert à deux participants (montants, un message de fil), comptes `@example.test` seulement ; `tests/domain/demo-seed.test.ts`
- [X] T090 [P] Écran « Nouveautés » de l'app (`mobile/src/whats-new/`, feature 022) : la 1.2.0 (qui reprend la 1.1.1 jamais sortie, avec la 026) annonce le « Cadeau commun »
- [X] T091 Vérifier `tests/domain/code-language.test.ts` (commentaires et descriptions de tests en anglais) et `server-only.test.ts` (`src/server/commands/group-gift.ts`)
- [X] T092 Repasser tout quickstart.md sur la base de démo, site et app
- [X] T093 Commit Polish : lint, types et tests verts (site et app), puis `chore: group gift docs, privacy and demo data`, sans demander
- [X] T094 Rappeler à l'utilisatrice l'ordre de sortie (research R9, comme la 026) : publier la version de l'app qui contient la 028 avant de merger sur `main` ; ne pas pousser ni merger sans son accord

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : T001 (amendement) bloque tout.
- **Foundational (Phase 2)** : après Setup ; bloque toutes les stories.
- **US1 (Phase 3)** : après Foundational. MVP.
- **US2 (Phase 4)** : après US1 (statut sur la page du cadeau).
- **US6 (Phase 5)** : après Foundational ; indépendante de US2 côté domaine, mais commitée après pour garder l'ordre.
- **US3 (Phase 6)** : après US1 (page du cadeau).
- **US4 (Phase 7)** : après US1.
- **US7 (Phase 8)** : après US1, US2, US3, US4, US6 (l'app reprend leurs actions).
- **US5 (Phase 9)** : après US1 ; sa partie app après US7.
- **Polish** : après les stories voulues.

### Within Each User Story

- Tests de domaine d'abord (ils échouent), puis domaine → commandes → actions/routes → composants/écrans → textes → parcours → commit.
- Le commit de la story est la dernière tâche de sa phase.

### Parallel Opportunities

- Phase 2 : T008, T009, T012 en parallèle une fois T004-T007 faits.
- US1 : T013, T014, T015 (tests) ensemble ; T024 (primitive) et T029 (textes) en parallèle du domaine.
- US7 : T067, T072, T073 en parallèle des écrans une fois `api:types` fait.
- Les tâches de textes `[P]` de chaque story touchent seulement `locales/`.

---

## Parallel Example: User Story 1

```bash
Task: "Tests de domaine du lancement et de la participation dans tests/domain/group-gift.test.ts"
Task: "Compléter reserve.test.ts, read-list.test.ts et offrir.test.ts"
Task: "Test de non-régression de l'API publique sans groupGifts=true"
Task: "Primitive components/ui/radio-group.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 (amendement, branche) et Phase 2 (données, règles).
2. US1 sur le site → parcours quickstart § US1 → commit.
3. US2 (complet) : le cadeau commun est utilisable de bout en bout sur le site.

### Incremental Delivery

US1 → US2 → US6 → US3 → US4 → US7 → US5 → Polish, un commit par story. L'app (US7) et le lien `/g/` imposent l'ordre de sortie de research R9 : la 028 part avec la prochaine version de l'app (comme la 026).

---

## Notes

- Chaque tâche cite ses fichiers ; les contraintes de data-model.md sont reprises telles quelles (longueurs, montant 1 … 10 000 000 centimes, états `open` / `complete`).
- Aucune variable d'environnement ni dépendance nouvelle.
- Revue après implémentation : hook `after_implement` (`wishlist-feature-review`, cinq agents).
