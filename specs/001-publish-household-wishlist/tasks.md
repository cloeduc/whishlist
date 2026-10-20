---
description: "Task list for personal and shared wishlists"
---

# Tasks: Wishlists personnelles et communes

**Input**: Design documents from `/specs/001-publish-household-wishlist/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Inclus. `plan.md` et `quickstart.md` §5 exigent `npm test` (`node:test` + `tsx`) sur le domaine et le store. Pas de Playwright. Les tests de chaque histoire s'écrivent d'abord et échouent avant l'implémentation.

**Organization**: Une phase par histoire de `spec.md`, dans l'ordre de priorité P1 → P7. Le label `[US1]`…`[US7]` est le numéro d'histoire de la spec, pas le rang de priorité.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: fichiers distincts, pas de dépendance sur une tâche inachevée de la même phase
- **[Story]**: histoire de la spec. Absent en Setup, Foundational et Polish

## Path Conventions

Un seul package à la racine : `app/`, `src/domain/`, `src/store/`, `src/auth/`, `data/`, `tests/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Projet Next.js 15 démarrable par Passenger

- [x] T001 Créer `package.json` avec `next` 15, `react` 19, `react-dom` 19, `proper-lockfile`, `typescript`, `tsx`, `@types/node`, `@types/react`. `engines.node` `>=20`. Scripts : `dev` = `next dev`, `build` = `next build`, `start` = `node app.js`, `test` = `node --import tsx --test tests/**/*.test.ts`. Aucune dépendance native
- [x] T002 [P] Ajouter `tsconfig.json` (strict) et `next.config.ts` sans `output: "standalone"` dans `next.config.ts`
- [x] T003 [P] Créer `app.js` : `next({ dev: false })`, `listen(process.env.PORT)`, hostname `process.env.HOSTNAME || "0.0.0.0"`. Ne pas écrire de `PORT` en dur
- [x] T004 [P] Créer `.env.example` avec `SESSION_SECRET=` et `.gitignore` ignorant `.env`, `.env.*` sauf `.env.example`, `node_modules/`, `.next/`, `data/wishlist.json`
- [x] T005 [P] Créer `app/layout.tsx` (`lang="fr"`) et `app/globals.css` (liste lisible vers 390 px de large, pas de colonne coupée)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Document JSON, verrou, types partagés, modèle d'import. Bloque toutes les histoires

**⚠️ CRITICAL**: Aucune histoire ne démarre avant la fin de cette phase

- [x] T006 Déclarer dans `src/domain/types.ts` les entités de `data-model.md` : User (`email` unique insensible à la casse et trimé, `passwordHash` jamais en clair, `displayName` non vide après trim), Wishlist (`title` non vide, `readToken` non devinable et unique, `inviteToken` distinct de `readToken`), Membership (un seul `owner` par liste, couple wishlist+user unique, `role` `owner` | `member`), Item (`name` non vide, `url` `null` ou `http`/`https`, `priceCents` `null` ou entier ≥ 0, `priority` `null` ou texte), Reservation (`fromName` et `note` `null` si vides)
- [x] T007 Implémenter dans `src/store/file.ts` le lock `proper-lockfile` et l'écriture atomique (fichier temporaire dans `data/` puis rename par-dessus `data/wishlist.json`)
- [x] T008 Implémenter dans `src/store/db.ts` le chargement sous lock : si `data/wishlist.json` est absent, le créer vide (`users`, `wishlists`, `memberships`, `types`, `people`, `views`, `items`, `reservations` à `[]`). Ne pas copier le seed au démarrage
- [x] T009 [P] Écrire `data/seed.json` depuis l'annexe de `spec.md` : 79 idées dans l'ordre, libellés tels quels, prix vides en `null`, priorité `null`, types du FR-010 sauf Blank, personnes `cloe` / `tat` / `couple`, onze vues épinglées de `data-model.md` (`maison` filtre `divers`, pas de vue pour `couple`)
- [x] T010 [P] Implémenter dans `src/domain/price.ts` le parse d'un prix saisi (`18` ou `18.50`) vers des centimes entiers ≥ 0, et l'affichage `€` + deux décimales avec un point (`€18.00`). Vide → `null`
- [x] T011 [P] Implémenter dans `src/domain/tokens.ts` des tokens non devinables, avec `readToken` ≠ `inviteToken`

**Checkpoint**: Store vide au boot, seed versionné, prêt pour les histoires

---

## Phase 3: User Story 1 - Lire une liste sans compte (Priority: P1) 🎯 MVP

**Goal**: Le lien de lecture montre les idées sans session. L'accueil sans lien ne révèle aucune liste

**Independent Test**: Insérer une liste fixture, ouvrir `/l/{readToken}` déconnecté, lire une idée (nom, type, lien, prix, priorité, Qui). `/` ne liste aucune wishlist

### Tests for User Story 1

- [x] T012 [P] [US1] Écrire `tests/domain/read-list.test.ts` : token inconnu ne renvoie pas une liste ; les idées sortent par `sortOrder` puis id ; `url` / `priceCents` / `priority` à `null` restent vides ; une idée réservée est encore dans la liste ; aucune lecture n'exige un user

### Implementation for User Story 1

- [x] T013 [US1] Implémenter `getPublicWishlist` dans `src/domain/read.ts` (recherche par `readToken` uniquement)
- [x] T014 [US1] Rendre `GET /l/{readToken}` dans `app/l/[readToken]/page.tsx` : colonnes Item, Type, Lien, Prix, Priorité, Qui ; lien marchand dans un nouvel onglet ; idée réservée marquée et conservée ; token inconnu = liste introuvable, sans dire si elle a existé
- [x] T015 [P] [US1] Rendre la lecture seule de `GET /l/{readToken}/types` dans `app/l/[readToken]/types/page.tsx` (labels de cette liste seulement)
- [x] T016 [US1] Rendre `GET /` déconnecté dans `app/page.tsx` : liens vers l'inscription et la connexion, zéro wishlist d'autrui

**Checkpoint**: Une liste déjà en JSON se lit sans compte

---

## Phase 4: User Story 5 - S'inscrire et créer sa wishlist (Priority: P2)

**Goal**: Compte e-mail + mot de passe + nom. Plusieurs listes, vides ou importées. Le lien de lecture de l'une n'affiche pas les idées de l'autre

**Independent Test**: S'inscrire, créer « Anniversaire » vide, l'ouvrir en navigation privée. Importer le modèle : 79 idées. Le même e-mail une seconde fois est refusé

### Tests for User Story 5

- [x] T017 [P] [US5] Écrire `tests/domain/accounts.test.ts` : e-mail unique insensible à la casse et trimé ; deux inscriptions simultanées du même e-mail ne créent qu'un user ; `passwordHash` n'est pas le mot de passe ; `displayName` vide après trim est refusé
- [x] T018 [P] [US5] Écrire `tests/domain/import.test.ts` : l'import copie les 79 idées sans en ajouter ; les ids sont préfixés par l'id de wishlist (`{wishlistId}:item-001`) ; deux imports ne partagent pas d'ids ; `couple` n'a pas de vue

### Implementation for User Story 5

- [x] T019 [US5] Implémenter l'inscription dans `src/domain/users.ts` avec `crypto.scrypt` (sel + hash), e-mail trimé comparé en minuscules
- [x] T020 [US5] Implémenter la copie du seed dans `src/domain/import.ts` (`fromTemplate: true`, vues épinglées copiées seulement dans ce cas)
- [x] T021 [US5] Implémenter le cookie de session dans `src/auth/session.ts` : `HttpOnly`, `SameSite=Lax`, `Secure` si HTTPS, valeur = id de compte + HMAC de `SESSION_SECRET`, jamais le secret ni le mot de passe
- [x] T022 [US5] Créer `app/inscription/page.tsx` : `POST` e-mail libre → session et redirection `/` ; e-mail pris → message explicite, pas de second compte
- [x] T023 [P] [US5] Créer `app/connexion/page.tsx` : échec avec un message générique qui ne dit pas si l'e-mail ou le mot de passe est faux
- [x] T024 [US5] Étendre `app/page.tsx` connecté : « mes wishlists » (memberships de la session seulement) et le bouton créer. Ajouter `POST /deconnexion` qui efface le cookie
- [x] T025 [US5] Créer la wishlist dans `app/listes/new/page.tsx` (`title` non vide, `importTemplate` 0 ou 1) et poser le membership `owner`. Rediriger vers `app/listes/[id]/page.tsx` qui affiche le lien de lecture

**Checkpoint**: Un compte crée une liste vide et une liste importée, lisibles via US1

---

## Phase 5: User Story 6 - Wishlist commune (Priority: P3)

**Goal**: Lien d'invitation distinct du lien de lecture. Un autre compte devient membre et édite. Régénérer l'invitation invalide l'ancienne. L'owner qui part transmet le rôle au membre le plus ancien

**Independent Test**: Compte A invite, compte B rejoint et ajoute une idée visible par A. Sans session, le lien de lecture montre l'idée et pas l'édition. L'ancien token d'invite ne recrute plus

### Tests for User Story 6

- [x] T026 [P] [US6] Écrire `tests/domain/membership.test.ts` : `inviteToken` ≠ `readToken` ; accepter sans user est refusé ; déjà membre ne duplique pas la ligne ; régénérer remplace le token et l'ancien échoue ; retirer un member garde la liste et le `readToken` ; l'owner qui quitte alors qu'il reste quelqu'un passe `owner` au `joinedAt` le plus ancien ; l'owner seul ne peut pas quitter ; un non-membre ne peut pas éditer

### Implementation for User Story 6

- [x] T027 [US6] Implémenter rejoindre, retirer, quitter, régénérer et supprimer dans `src/domain/membership.ts` avec les règles de `data-model.md` (exactement un `owner`)
- [x] T028 [US6] Afficher sur `app/listes/[id]/page.tsx` le lien de lecture et le lien d'invitation à copier, réservés aux membres
- [x] T029 [US6] Créer `app/inviter/[token]/page.tsx` : token courant + session → `role=member` puis redirection vers la liste ; sans session → inscription ou connexion puis ajout ; token inconnu → refus, personne n'est ajouté
- [x] T030 [US6] Brancher sur `app/listes/[id]/page.tsx` la régénération d'invitation (owner), le retrait d'un member (owner, pas soi), quitter, et supprimer (owner). Supprimer retire idées et réservations ; le `readToken` répond introuvable

**Checkpoint**: Deux comptes éditent la même liste. Le lien public ne donne pas l'édition

---

## Phase 6: User Story 7 - Les membres mettent à jour la liste (Priority: P4)

**Goal**: Un membre ajoute, modifie, retire une idée non réservée, gère types et Qui, annule une réservation. Un non-membre est refusé. Une idée réservée ne se supprime pas

**Independent Test**: Sans membership, toute modification est refusée. Membre : ajouter « test », la voir sur le lien de lecture et dans le formulaire, la supprimer, annuler une réservation

### Tests for User Story 7

- [x] T031 [P] [US7] Écrire `tests/domain/items.test.ts` : `name` vide refusé ; `typeId` et `personId` doivent exister dans la même wishlist ; `url` hors `http`/`https` refusée, vide → `null` ; `priceCents` négatif refusé ; supprimer un item qui a une réservation est refusé et la réservation reste ; annuler supprime la ligne de réservation

### Implementation for User Story 7

- [x] T032 [US7] Implémenter créer, modifier, retirer une idée, ajouter et renommer un type (les items gardent le `typeId`), ajouter un Qui, et annuler une réservation dans `src/domain/items.ts`
- [x] T033 [US7] Ajouter ces formulaires sur `app/listes/[id]/page.tsx`, refusés si la session n'est pas membre. `sortOrder` d'une idée créée = max + 1. Renommer un type ne change pas le libellé d'une vue épinglée du modèle (ex. « Crochet (Sam) ») ; une vue générée suit le nouveau label
- [x] T034 [US7] Sur une liste non importée, créer la vue en même temps que le type ou le Qui (`kind=types` ou `kind=person`, `pinned=false`) dans `src/domain/items.ts`. Sur une liste importée, ne pas créer de vue pour la personne seed `couple`

**Checkpoint**: Le catalogue d'une liste se maintient par ses membres seulement

---

## Phase 7: User Story 2 - Filtrer comme dans le doc (Priority: P5)

**Goal**: Sur une liste importée, les boutons du doc. Sur une liste vide, un bouton par type et par Qui seulement

**Independent Test**: Importer le modèle, activer chaque bouton. Maison ramène les idées Divers. Crochet ne ramène pas toutes les idées Sam. Revenir à toute la liste restaure les 79

### Tests for User Story 2

- [x] T035 [P] [US2] Écrire `tests/domain/filters.test.ts` : `outils` = types `outil-jardinage` et `outils-bricolage` seulement ; `crochet` filtre le type Crochet, pas le Qui Sam ; `cloe` et `tat` excluent `couple` ; `maison` ne renvoie que les idées `divers` ; une vue inconnue retombe sur toute la liste

### Implementation for User Story 2

- [x] T036 [US2] Implémenter `applyView` dans `src/domain/filters.ts` (`kind` `all` | `types` | `person`)
- [x] T037 [US2] Brancher la query `vue` sur `app/l/[readToken]/page.tsx` : boutons dans l'ordre des vues, id inconnu = liste complète. Maison liste les idées Divers et garde les boutons plus le lien « Je réserve une idée ». Sur une liste importée, la vue `all` s'intitule « Toute la whishlist » et le rappel des filtres est affiché

**Checkpoint**: Les filtres du doc et les filtres d'une liste neuve sont justes

---

## Phase 8: User Story 3 - Réserver une idée (Priority: P6)

**Goal**: Formulaire sans compte. Une seule réservation active. La seconde confirmation, même simultanée, est refusée

**Independent Test**: Réserver « The Gang » avec prénom et mot. L'idée est marquée réservée, absente du formulaire, encore sur la liste. Un second envoi est refusé. Relancer le process : la réservation est là

### Tests for User Story 3

- [x] T038 [P] [US3] Écrire `tests/domain/reserve.test.ts` : `itemId` obligatoire ; type autre que Blank limite les idées proposées ; Blank liste toutes les idées non réservées de cette liste ; `fromName` et `note` vides deviennent `null` ; seconde confirmation refusée et la première ligne inchangée ; deux confirmations simultanées sous lock ne laissent qu'une réservation

### Implementation for User Story 3

- [x] T039 [US3] Implémenter la confirmation dans `src/domain/reserve.ts` (au plus une réservation par `itemId`, idée de cette wishlist seulement)
- [x] T040 [US3] Créer `app/l/[readToken]/reserver/page.tsx` : titre « Réserver un cadeau pour Alex et Sam » si `fromTemplate`, sinon le titre de la liste. Champs `typeId`, `itemId`, `fromName`, `note`. Changer de type recharge via la query, sans JavaScript obligatoire. Succès → redirection vers la page offrir de cette liste. Refus → formulaire réaffiché, aucune seconde ligne
- [x] T041 [US3] Prendre le lock de `src/store/file.ts` autour du `POST` de réservation dans `app/l/[readToken]/reserver/page.tsx`

**Checkpoint**: Deux invités ne confirment pas la même idée

---

## Phase 9: User Story 4 - Voir qui offre quoi (Priority: P7)

**Goal**: « Je veux offrir » liste les réservations de cette liste seulement, sans compte

**Independent Test**: Après la réservation de US3, la page montre l'idée, le type, le prénom et le mot. Une réservation sans prénom ni mot laisse ces champs vides. Zéro réservation : une phrase le dit

### Tests for User Story 4

- [x] T042 [P] [US4] Écrire `tests/domain/offrir.test.ts` : seules les réservations de cette wishlist ; prénom ou mot `null` absents ; liste vide signalée ; aucune session requise

### Implementation for User Story 4

- [x] T043 [US4] Implémenter la projection dans `src/domain/offrir.ts`
- [x] T044 [US4] Créer `app/l/[readToken]/offrir/page.tsx` en français, lisible sans compte, scopée au `readToken`

**Checkpoint**: L'offreur et le mot sont visibles par quiconque a le lien de lecture

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Passe quickstart et contraintes d'hébergement

- [x] T045 [P] Vérifier dans `app/globals.css` qu'une idée reste entière vers 390 px (`quickstart.md` §1)
- [x] T046 Vérifier que `package.json` n'a pas de module natif, pas de client SMTP, et que `start` reste `node app.js`
- [x] T047 Exécuter `quickstart.md` de bout en bout (lecture, compte, invitation, filtres, réservation, relance du process)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: rien avant
- **Foundational (Phase 2)**: après Setup. Bloque toutes les histoires
- **Histoires (Phase 3+)**: après Foundational, dans l'ordre P1 → P7
- **Polish**: après les histoires qu'on veut livrer

### User Story Dependencies

- **US1 (P1)**: après Foundational. Pas de compte. Une liste fixture suffit
- **US5 (P2)**: après Foundational. Le lien créé se relit avec US1. Indépendant de US6
- **US6 (P3)**: après US5 pour la session UI. Les tests de `src/domain/membership.ts` peuvent fabriquer deux users en mémoire
- **US7 (P4)**: après US6 (il faut un membre). Annuler une réservation suppose qu'une réservation existe ; le test la crée en mémoire, sans US3
- **US2 (P5)**: après US1 pour les boutons sur la page de lecture. Le test de filtre ne dépend pas de l'UI
- **US3 (P6)**: après US1 (page liste) et US7 n'est pas requis pour réserver. Le marquage « réservé » de US1 s'allume ici
- **US4 (P7)**: après US3 pour un cas non vide. L'état zéro réservation se vérifie seul

### Within Each User Story

- Test d'abord, il échoue, puis le domaine, puis la page
- Pas de SMTP, pas de reset de mot de passe, pas d'annuaire

### Parallel Opportunities

- T002, T003, T004, T005 après T001
- T009, T010, T011 en parallèle de T006
- T017 et T018 ensemble
- Les tests `[P]` d'histoires différentes une fois la fondation finie, si chacun a son fichier

---

## Parallel Example: User Story 5

```bash
# Tests du compte et de l'import ensemble :
Task: "tests/domain/accounts.test.ts"
Task: "tests/domain/import.test.ts"

# Pages sans dépendance mutuelle :
Task: "app/connexion/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 et Phase 2
2. Phase 3 (US1)
3. Stop. Ouvrir un `readToken` fixture sans compte
4. La démo « 79 idées du doc » attend US5 (import). Ne pas la confondre avec le MVP lecture

### Incremental Delivery

1. US1 lecture sans compte
2. US5 inscription, liste vide, import du modèle
3. US6 invitation
4. US7 édition membre
5. US2 filtres du doc
6. US3 réservation sans collision
7. US4 « Je veux offrir »
8. Phase 10 sur `quickstart.md`

### Parallel Team Strategy

Après la Phase 2 : une personne sur US1 (pages de lecture), une autre sur les tests de domaine US5 (`accounts`, `import`) qui ne touchent pas `app/l/`. Ne pas partager `app/page.tsx` entre US1 et US5 en même temps.

---

## Notes

- Label d'histoire = numéro dans `spec.md` (US2 = filtres, priorité P5)
- `[P]` = autre fichier, pas de tâche préalable ouverte
- Commit après chaque histoire
- Arrêt possible à chaque checkpoint
