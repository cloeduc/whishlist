---

description: "Task list for feature 021-app-update-prompt"
---

# Tasks: Prévenir qu'une mise à jour de l'app est disponible

**Input**: Design documents from `specs/021-app-update-prompt/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/screens.md, quickstart.md

**Tests**: oui. Le guide des agents demande un test pour chaque règle et chaque cas limite ; les parcours ne peuvent pas être joués par Maestro (il faut une version publiée), ils sont donc couverts par des tests jest et le quickstart.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`/`chore:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

- [X] T001 Installer la lib : `cd mobile && npx expo install expo-in-app-updates` (version 0.13.x attendue, research R1) ; vérifier `mobile/package.json` et `mobile/package-lock.json`, puis `npx npm@10 ci --dry-run` dans `mobile/` (la CI est en npm 10)
- [X] T002 Configuration iOS dans `mobile/app.config.ts` : ajouter à `ios.infoPlist` `AppStoreCountry: "fr"` et `AppStoreID` (identifiant numérique de la fiche App Store, à demander à l'utilisatrice, relevé dans App Store Connect ; laisser la clé absente si elle n'est pas fournie, la lib cherche alors par identifiant d'app — research R7) ; vérifier que la cible iOS minimale est 16.4 ou plus (exigence de la lib) — fait sans `AppStoreID` (non fourni) : `AppStoreCountry: "fr"` seulement
- [X] T003 [P] Simuler la lib pour jest : `jest.mock("expo-in-app-updates", …)` dans `mobile/__tests__/setup.ts` (ou un mock manuel `mobile/__mocks__/expo-in-app-updates.ts`) : `checkForUpdate`, `startUpdate`, `addUpdateListener` (rend une fonction de désabonnement), `AppUpdateType`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: la règle de fréquence et de report, et son stockage local (research R4 à R6, data-model.md).

### Tests (écrits d'abord, rouges)

- [X] T004 [P] Écrire `mobile/__tests__/update/policy.test.ts` pour chaque ligne du tableau « Règles » de `data-model.md` : `shouldCheck` (démarrage → oui ; premier plan à moins de 24 h → non ; 24 h ou plus, ou jamais → oui) ; `shouldPrompt` (pas de report → oui ; même `storeVersion` à moins de 7 jours → non ; même version à 7 jours ou plus → oui ; autre `storeVersion` → oui ; `storeVersion` absente : report de 7 jours quelle que soit la version)
- [X] T005 [P] Écrire `mobile/__tests__/update/state.test.ts` (base en mémoire, `__tests__/helpers/memory-db.ts`) : lire et écrire `device.update.lastCheckAt` et `device.update.snooze` (JSON `{ storeVersion, at }`) ; valeur absente ou JSON illisible → `null`
- [X] T006 [P] Compléter `mobile/__tests__/offline/snapshot.test.ts` : `clearAll()` efface `userId` mais garde les clés `device.*`

### Implementation

- [X] T007 [P] Créer `mobile/src/update/policy.ts` (fonctions pures, `CHECK_INTERVAL_MS = 24 h`, `SNOOZE_MS = 7 jours`) : `shouldCheck({ now, lastCheckAt, coldStart })` et `shouldPrompt({ storeVersion, snooze, now })` ; T004 au vert
- [X] T008 [P] Créer `mobile/src/update/state.ts` : `getLastCheckAt()`, `setLastCheckAt(date)`, `getSnooze()`, `setSnooze({ storeVersion, at })` sur la table `meta` (`INSERT … ON CONFLICT(key) DO UPDATE`, comme `ensureUser` dans `mobile/src/offline/snapshot.ts`) ; T005 au vert
- [X] T009 `mobile/src/offline/snapshot.ts` : dans `clearAll()`, `DELETE FROM meta WHERE key NOT LIKE 'device.%'` (les clés concernent le téléphone, pas le compte, research R6) ; T006 au vert

**Checkpoint**: règles et stockage prêts, testés.

---

## Phase 3: User Story 1 - Être prévenu et mettre à jour sur iPhone (Priority: P1) 🎯 MVP

**Goal**: sur iOS, une fenêtre « Nouvelle version disponible » au démarrage (et au retour au premier plan après 24 h), par-dessus l'écran ouvert ; « Mettre à jour » ouvre la fiche App Store ; « Plus tard » reporte de 7 jours ; rien hors ligne, en cas d'erreur ou en build de développement.

**Independent Test**: tests jest de T010 ; quickstart.md, section US1, sur un iPhone avec une version plus ancienne que celle de l'App Store.

### Tests

- [X] T010 [P] [US1] Écrire `mobile/__tests__/features/update-prompt.test.tsx` (lib simulée, `Platform.OS = "ios"`, base en mémoire, horloge contrôlée) : mise à jour disponible → fenêtre avec `update.title`, `update.body` (`testID` `update.prompt`, `update.prompt-keep`) ; « Mettre à jour » → `startUpdate()` appelé ; « Plus tard » → fenêtre fermée et report enregistré avec la `storeVersion` ; report de moins de 7 jours → aucune fenêtre ; `checkForUpdate` rejette ou pas de mise à jour → rien et aucune erreur affichée ; `__DEV__` → aucun appel à la lib ; retour au premier plan (`AppState` → `active`) à moins de 24 h → pas de nouvelle vérification, à 24 h ou plus → vérification

### Implementation

- [X] T011 [P] [US1] Ajouter les clés `update.title`, `update.body`, `update.now`, `update.later` de `contracts/screens.md` à `locales/fr/mobile.json` et `locales/en/mobile.json` (à côté du bloc `upgrade`, vouvoiement)
- [X] T012 [US1] Créer `mobile/src/features/update/UpdatePrompt.tsx` : au montage (démarrage) et sur `AppState` → `active`, si `shouldCheck` → `setLastCheckAt`, `checkForUpdate()` (erreurs avalées en silence) ; sur iOS, si `updateAvailable` et `shouldPrompt` → `ConfirmDialog` (`mobile/src/ui/ConfirmDialog.tsx`, `destructive={false}`, `testID="update.prompt"`) ; « Mettre à jour » → `startUpdate()` (erreur avalée) ; « Plus tard » → `setSnooze({ storeVersion, at: now })` ; rien si `__DEV__` ou `Platform.OS === "web"` ; une seule vérification en cours à la fois
- [X] T013 [US1] Monter `<UpdatePrompt />` dans `mobile/app/_layout.tsx`, après la pile d'écrans (par-dessus tout écran, y compris après un lien, FR-010), hors de l'écran `UpgradeRequired`
- [ ] T014 [US1] Vérifier à la main quickstart.md, section US1 (si une version plus ancienne que celle de l'App Store peut être installée ; sinon le noter dans le commit et dans la tâche) — **pas fait** : l’App Store publie la 1.0.0 et un build local porte 1.1.0, la fenêtre ne peut pas apparaître ; à faire avec la 1.1.1 publiée (installer une 1.1.0 face à elle) ou un build Release de numéro plus bas
- [X] T015 [US1] Commit de la story : contrôles verts, puis `feat: tell iPhone users a new app version is available (US1)` (avec Setup et Foundational), sans demander

**Checkpoint**: la fenêtre iOS marche ; Android ne fait encore rien.

---

## Phase 4: User Story 2 - Être prévenu et mettre à jour sur Android (Priority: P1)

**Goal**: sur Android, la proposition flexible de Google Play au démarrage (et au retour au premier plan après 24 h) ; téléchargement en arrière-plan puis installation automatique ; un refus reporte de 7 jours.

**Independent Test**: tests jest de T016 ; quickstart.md, section US2, avec le partage interne d'app de la Play Console.

### Tests

- [X] T016 [P] [US2] Compléter `mobile/__tests__/features/update-prompt.test.tsx` (`Platform.OS = "android"`) : mise à jour disponible et `flexibleAllowed` → `startUpdate(false)` appelé, aucune fenêtre de l'app ; `flexibleAllowed: false` → rien ; événement `updateCancelled` → report enregistré avec la `storeVersion` ; report de moins de 7 jours → `startUpdate` pas appelé ; `startUpdate` rejette → rien d'affiché ; désabonnement de l'écouteur au démontage

### Implementation

- [X] T017 [US2] `mobile/src/features/update/UpdatePrompt.tsx` : branche Android : si `updateAvailable`, `flexibleAllowed` et `shouldPrompt` → `startUpdate(false)` (mode flexible imposé, jamais immédiat) ; `addUpdateListener("updateCancelled", …)` → `setSnooze({ storeVersion, at: now })` ; l'installation après téléchargement est faite par la lib (research R2), aucune fenêtre de l'app
- [ ] T018 [US2] Vérifier à la main quickstart.md, section US2 (partage interne d'app ; sinon le noter) — **pas fait** : demande deux versions dans la Play Console (partage interne d’app) ; à faire avec la 1.1.1
- [X] T019 [US2] Commit de la story : contrôles verts, puis `feat: offer the Google Play in-app update on Android (US2)`, sans demander

**Checkpoint**: les deux stories marchent.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T020 [P] Ajouter `"021": "specs/021-app-update-prompt/spec.md"` à `mobile/__tests__/e2e/coverage.test.ts` et, dans `mobile/.maestro/exclusions.md`, deux lignes « Story entière » pour `021-us1` et `021-us2` (il faut une vraie version publiée sur un store ; couvert par `update-prompt.test.tsx`), avec un lien vers les sections du quickstart
- [X] T021 [P] Passer la version de l'app à 1.1.1 (d'abord 1.2.0, ramenée à 1.1.1 à la demande de l'utilisatrice) dans `mobile/app.config.ts` (`version`), la première qui embarque la feature (research R8)
- [X] T022 Commit Polish : contrôles verts, puis `chore: record the 021 e2e exclusions and bump the app to 1.2.0`, sans demander

---

## Dependencies & Execution Order

- **Setup (Phase 1)** : aucune dépendance ; T002 attend l'identifiant App Store (facultatif).
- **Foundational (Phase 2)** : après Setup ; bloque les deux stories.
- **US1 (Phase 3)** : après Foundational.
- **US2 (Phase 4)** : après US1 (même composant `UpdatePrompt.tsx`, même fichier de test).
- **Polish (Phase 5)** : après les stories.

### Parallel Opportunities

- T003 avec T001/T002 une fois la lib installée.
- T004, T005, T006 (fichiers de test distincts), puis T007, T008.
- T010 et T011 en US1.

## Parallel Example: Foundational

```bash
Task: "Écrire mobile/__tests__/update/policy.test.ts"
Task: "Écrire mobile/__tests__/update/state.test.ts"
Task: "Compléter mobile/__tests__/offline/snapshot.test.ts"
```

## Implementation Strategy

1. Setup + Foundational → règles testées.
2. US1 (iPhone, le store en production) → commit (MVP).
3. US2 (Android) → commit.
4. Polish → commit ; revue `wishlist-feature-review`.
5. Publier 1.1.1 sur les deux stores (EAS) : à faire par l'utilisatrice, hors de ces tâches.

## Notes

- Aucune règle du produit côté serveur, aucun changement d'API.
- Push et squash sur `main` : attendre l'utilisatrice.
