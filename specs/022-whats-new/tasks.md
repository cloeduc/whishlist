---

description: "Task list for feature 022-whats-new"
---

# Tasks: Fenêtre « Quoi de neuf » après une mise à jour de l'app

**Input**: Design documents from `specs/022-whats-new/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/screens.md, quickstart.md

**Tests**: oui (guide des agents : un test par règle et cas limite ; un parcours Maestro par story de l'app, ou une ligne d'exclusion).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`/`chore:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

- [X] T001 Ajouter le bloc `whatsNew` de `contracts/screens.md` à `locales/fr/mobile.json` et `locales/en/mobile.json` (mêmes clés ; `releases.1_1_1` = les deux phrases de research R9, FR et EN, à faire valider par l'utilisatrice avant la publication)

---

## Phase 2: Foundational (Blocking Prerequisites)

### Tests (écrits d'abord, rouges)

- [X] T002 [P] Écrire `mobile/__tests__/whats-new/policy.test.ts` : `compareVersions` (`1.1.10 > 1.1.9`, `1.2.0 > 1.1.9`, égalité, longueurs différentes `1.1` = `1.1.0`) ; `whatsNewFor` pour chaque ligne du tableau de `data-model.md` (installation neuve ; version inconnue avec traces d'usage, avec et sans nouveautés pour `installed` ; `lastSeen = installed` ; `lastSeen > installed` ; `lastSeen < installed` avec versions manquées dans `]lastSeen, installed]`, plus récente en premier, et sans aucune)
- [X] T003 [P] Écrire `mobile/__tests__/whats-new/releases.test.ts` : `RELEASES` trié par `compareVersions` ; pour chaque version, `whatsNew.releases.<x_y_z>` existe en FR et en EN (fichiers `locales/{fr,en}/mobile.json` lus directement), tableau de 1 à 5 phrases non vides, même nombre dans les deux langues
- [X] T004 [P] Écrire `mobile/__tests__/whats-new/state.test.ts` (base en mémoire) : lecture et écriture de `device.whatsNew.lastSeenVersion` (`null` si absente) ; `hasPastUsage()` faux sur une base vide, vrai avec une ligne `snapshot`, une ligne `outbox` ou `meta.userId` ; `clearAll()` garde `lastSeenVersion`

### Implementation

- [X] T005 [P] Créer `mobile/src/whats-new/releases.ts` : `RELEASES = ["1.1.1"]` et `releaseKey(version)` (`"1.1.1"` → `"1_1_1"`)
- [X] T006 [P] Créer `mobile/src/whats-new/policy.ts` : `compareVersions(a, b)` et `whatsNewFor({ installed, lastSeen, hasPastUsage, releases })` → `{ show: string[]; markSeen: boolean }` (data-model.md) ; T002 au vert
- [X] T007 [P] Créer `mobile/src/whats-new/state.ts` : `getLastSeenVersion()`, `setLastSeenVersion(v)` sur `` `${DEVICE_META_PREFIX}whatsNew.lastSeenVersion` `` via `getMeta`/`setMeta` (`mobile/src/offline/snapshot.ts`) ; `hasPastUsage()` (research R5) ; T004 au vert, T003 au vert après T001 et T005

**Checkpoint**: règle, textes et stockage testés.

---

## Phase 3: User Story 1 - Découvrir les nouveautés après une mise à jour (Priority: P1) 🎯 MVP

**Goal**: au premier lancement d'une version plus récente, la fenêtre « Quoi de neuf » liste les nouveautés des versions manquées ; « C'est noté » la ferme pour de bon ; rien après une installation neuve ; la fenêtre de la 021 attend son tour.

**Independent Test**: jest (T008, T009) ; Maestro `022-us1` (installation neuve : rien) ; quickstart.md, section US1.

### Tests

- [X] T008 [P] [US1] Écrire `mobile/__tests__/features/whats-new.test.tsx` (base en mémoire, `expo-constants` simulé avec une `version`) : `lastSeen` plus ancien → fenêtre avec `whatsNew.title`, une section par version manquée (`whats-new.version-<x_y_z>`) dans l'ordre ; « C'est noté » (`whats-new.done`) → fermée, `lastSeen` = version installée, nouveau rendu → rien ; installation neuve (base vide) → rien et `lastSeen` enregistré ; version inconnue avec une ligne `snapshot` → fenêtre de la seule version installée ; `lastSeen` plus récent → rien et `lastSeen` inchangé ; `onShownChange(true/false)` appelé ; `enabled={false}` → rien
- [X] T009 [P] [US1] Compléter `mobile/__tests__/features/update-prompt.test.tsx` : `paused` vrai → la fenêtre iOS n'apparaît pas et `startUpdate` Android n'est pas appelé ; `paused` repasse à faux → la fenêtre iOS apparaît, la proposition Android est lancée

### Implementation

- [X] T010 [US1] Créer `mobile/src/features/whats-new/WhatsNew.tsx` : au montage, lit la version installée (`Constants.expoConfig?.version`), `getLastSeenVersion`, `hasPastUsage`, applique `whatsNewFor` ; si `markSeen` → `setLastSeenVersion(installed)` ; si `show` non vide → `ModalCard` (`mobile/src/ui/ConfirmDialog.tsx`, `testID="whats-new.dialog"`) avec `whatsNew.title`, pour chaque version `whatsNew.version` et ses phrases (`t("whatsNew.releases.<key>", { returnObjects: true })`), un `Button` `whatsNew.done` (`whats-new.done`) ; fermeture (bouton ou `onDismiss`) → `setLastSeenVersion(installed)` ; prop `enabled` (défaut `!__DEV__`) et `onShownChange(shown)` ; erreurs de stockage avalées (aucune fenêtre plutôt qu'une erreur)
- [X] T011 [US1] `mobile/src/features/update/UpdatePrompt.tsx` : prop `paused?: boolean` ; tant qu'elle est vraie, garder l'offre iOS en attente (fenêtre non visible) et différer `startUpdate(false)` Android jusqu'à `paused` faux (research R7)
- [X] T012 [US1] `mobile/app/_layout.tsx` : monter `<WhatsNew onShownChange={setWhatsNewShown} />` avant `<UpdatePrompt paused={whatsNewShown} />` ; l'état démarre à « en cours de décision » pour que la 021 attende la réponse de `WhatsNew` au démarrage
- [X] T013 [US1] Écrire `mobile/.maestro/flows/022-us1-fresh-install.yaml` (tag `022-us1`, `name:` en anglais) : `launch-clean` puis attendre l'écran de connexion : `whats-new.dialog` n'est pas visible ; se connecter (démo) : toujours pas de fenêtre
- [ ] T014 [US1] Vérifier à la main quickstart.md, section US1, étapes 1 à 7 (build installé par-dessus un build plus ancien de numéro inférieur ; sinon le noter) — **pas fait** : en build Debug la fenêtre est coupée (`__DEV__`) ; il faut deux builds Release de numéros différents installés l’un par-dessus l’autre, à faire avant la publication de la 1.1.1
- [X] T015 [US1] Commit de la story : contrôles verts, puis `feat: show what's new after an app update (US1)` (avec Setup et Foundational), sans demander

**Checkpoint**: la fenêtre marche ; l'écran « Nouveautés » n'existe pas encore.

---

## Phase 4: User Story 2 - Revoir les nouveautés plus tard (Priority: P2)

**Goal**: « Mon compte » → « Nouveautés » ouvre un écran qui liste les versions et leurs nouveautés, jusqu'à la version installée, la plus récente en premier, hors ligne compris.

**Independent Test**: jest (T016, T017) ; Maestro `022-us2` ; quickstart.md, section US2.

### Tests

- [X] T016 [P] [US2] Écrire `mobile/__tests__/screens/whats-new.test.tsx` : une section par version de `RELEASES` jusqu'à la version installée (`whats-new.section-<x_y_z>`), la plus récente en premier, avec ses phrases ; une version plus récente que l'installée n'est pas listée
- [X] T017 [P] [US2] Compléter `mobile/__tests__/screens/account.test.tsx` : le lien `account.whats-new` est dans la carte des données, avant « Licences », et ouvre `/whats-new`

### Implementation

- [X] T018 [US2] Créer `mobile/app/(app)/whats-new.tsx` sur le modèle de `mobile/app/legal/licenses.tsx` (`ScreenList`, `BackLink`, `ContentPage` avec `whatsNew.screenEyebrow`, `whatsNew.title`, `whatsNew.screenIntro` ; une `ContentSection` par version, titre `whatsNew.version`) ; `testID="whats-new.screen"`
- [X] T019 [US2] `mobile/app/(app)/account.tsx` : bouton lien `account.whats-new` (`whatsNew.account`) avant « Licences », `router.push("/whats-new")`
- [X] T020 [US2] Écrire `mobile/.maestro/flows/022-us2-whats-new-screen.yaml` (tag `022-us2`) : se connecter (démo), « Mon compte », déplier la carte des données, « Nouveautés » : `whats-new.screen` et `whats-new.section-1_1_1` visibles ; retour : « Mon compte »
- [X] T021 [US2] Lancer `DEMO_PASSWORD=… npm --prefix mobile run e2e -- --platform ios .maestro/flows/022-us1-fresh-install.yaml .maestro/flows/022-us2-whats-new-screen.yaml` (prérequis : `mobile/.maestro/README.md`) ; vérifier à la main quickstart.md, section US2 — 022-us1, 022-us2 (et 020-us3) verts sur iPhone 17 Pro, build Debug ; dans ce build la fenêtre « Quoi de neuf » est coupée (`__DEV__`), 022-us1 ne prouve que l’absence de fenêtre
- [X] T022 [US2] Commit de la story : contrôles verts, puis `feat: list what's new from the account screen (US2)`, sans demander

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T023 [P] Ajouter `"022": "specs/022-whats-new/spec.md"` à `mobile/__tests__/e2e/coverage.test.ts` ; dans `mobile/.maestro/exclusions.md`, une ligne `022-us1` : « Fenêtre après une vraie mise à jour (version vue plus ancienne) » — la suite efface l'app à chaque parcours, couvert par `whats-new.test.tsx`, lien vers quickstart US1
- [X] T024 Commit Polish : contrôles verts, puis `chore: record the 022 e2e coverage`, sans demander

---

## Dependencies & Execution Order

- **Setup → Foundational → US1 → US2 → Polish.**
- US2 ne dépend que de la fondation (textes, `RELEASES`), mais vient après US1 pour garder un seul fichier de textes par commit.
- T011 (pause de `UpdatePrompt`) avant T012 (montage).

### Parallel Opportunities

- T002, T003, T004 ; puis T005, T006, T007.
- T008 et T009 ; T016 et T017.

## Implementation Strategy

1. Fondation + US1 → commit (MVP : la fenêtre).
2. US2 → commit.
3. Polish → commit ; revue `wishlist-feature-review`.
4. Publier 1.1.1 (avec la 021) : à faire par l'utilisatrice.

## Notes

- Les phrases de chaque nouvelle version s'ajoutent à `RELEASES` et aux deux fichiers de langue à la préparation de la version ; le test T003 refuse une version sans textes complets.
