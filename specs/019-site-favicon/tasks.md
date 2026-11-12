---

description: "Tasks for the site favicon (019, WISH-14)"
---

# Tasks: Nouveau favicon du site

**Input**: Design documents from `/specs/019-site-favicon/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (aucune donnée), quickstart.md

**Tests**: un test de domaine, `tests/domain/site-icons.test.ts` (research.md, décision 5 ; règle du projet : chaque règle a son test). Il grandit avec chaque story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Un commit par user story (règle du projet)

Chaque phase de user story se termine par une tâche **« Commit de la story »**, la dernière de la phase. Règles :

- Les phases Setup et Foundational n'ont pas de commit propre : elles entrent dans le commit de la première story.
- Chaque commit est vert (lint, types, tests). Un test existant à adapter va dans le commit de la story qui rend l'adaptation nécessaire.
- Un fichier modifié par deux stories est commité en deux temps (seulement les changements de la story en cours).
- La phase Polish a son propre commit (`chore:` ou `feat:` selon le contenu). Les corrections de la revue lancée par le hook `after_implement` forment un commit à part, `fix: corrections de la revue`, avec `review.md`.
- Message en anglais, préfixé `feat:`, `fix:` ou `chore:`, terminé par `(USn)`.
- Le commit se crée sans demander l'accord : une fois la story verte, on commite et on passe à la suivante. Si une vérification échoue, on corrige avant de commiter ; on ne commite jamais un état rouge. Le commit Polish suit la même règle. Seuls le push et le squash sur `main` attendent l'utilisateur.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

Rien à installer : `sharp` est déjà une dépendance du site, et le dossier `scripts/` existe.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: un seul dessin pour le site et l'app (research.md, décision 1)

- [X] T001 Créer `scripts/gift-icon.mjs` : y déplacer depuis `mobile/scripts/make-icons.mjs` le `theme` (couleurs), `gift()`, `frame` et `svg()`, exportés, avec leurs commentaires en anglais (dessin repris de `components/site/gift-mark.tsx` et `src/domain/theme.ts`). Ne rien changer au code déplacé : la sortie SVG doit rester identique octet pour octet.
- [X] T002 Faire importer `theme` et `svg` par `mobile/scripts/make-icons.mjs` depuis `../../scripts/gift-icon.mjs` (le script garde sa liste de fichiers et son dossier de sortie), puis lancer `node mobile/scripts/make-icons.mjs` et vérifier que `git status mobile/assets/images` ne montre aucun changement (FR-008). Si un fichier change, corriger T001 jusqu'à ce que la sortie soit identique.
- [X] T003 Créer `scripts/make-icons.mjs` (ESM, commentaires en anglais, usage en tête : `node scripts/make-icons.mjs`) : importe `svg`/`theme` de `./gift-icon.mjs` et `sharp`, écrit dans `app/` à côté du script ; pour l'instant, sans aucun fichier dans sa liste (rempli par US1 et US2).

**Checkpoint**: dessin partagé, icônes de l'app inchangées.

---

## Phase 3: User Story 1 - Reconnaître le site dans ses onglets et ses favoris (Priority: P1) 🎯 MVP

**Goal**: l'icône de l'app dans les onglets, favoris et à `/favicon.ico`, nette en 16/32 px, sans fond blanc opaque ; les anciennes images JPEG ne sont plus servies.

**Independent Test**: quickstart.md, parcours 1 (onglets en clair et sombre dans Chrome, Safari, Firefox ; `/favicon.ico` → nouvelle icône ; `/favicon.png` → introuvable).

### Tests for User Story 1

- [X] T004 [US1] Créer `tests/domain/site-icons.test.ts` (`node:test`, descriptions en anglais, lecture des fichiers par `node:fs` depuis la racine du dépôt, sans `sharp` pour rester rapide) :
  - `app/icon1.svg` existe, commence par `<svg`, n'a pas de `<rect` plein carré de fond (pas de fond opaque, FR-003) ;
  - `app/icon2.png` a la signature PNG, une largeur et une hauteur de 192 lues dans l'en-tête IHDR, un type de couleur avec alpha (6) ;
  - `app/favicon.ico` a l'en-tête ICO (réservé 0, type 1), 3 images de 16, 32 et 48 px, chacune un PNG (signature à l'offset indiqué) ;
  - `public/favicon.png` et `app/icon.png` n'existent plus (FR-007) ;
  - `app/layout.tsx` ne contient plus `icons:` ni `favicon.png` (FR-005 : Next annonce les fichiers sur toutes les pages).
  Le lancer : il échoue.

### Implementation for User Story 1

- [X] T005 [US1] Dans `scripts/make-icons.mjs`, ajouter l'écriture de `app/icon1.svg` (le SVG brut de `svg()` à 136 px de côté, sans `background`, échelle ~0.95 pour remplir l'onglet : research.md, décision 4) et de `app/icon2.png` (même dessin rendu en PNG 192 × 192 par `sharp`, fond transparent).
- [X] T006 [US1] Dans `scripts/make-icons.mjs`, ajouter l'assemblage de `app/favicon.ico` sans dépendance (research.md, décision 3) : rendre le même dessin en PNG 16, 32 et 48 px avec `sharp`, puis écrire ICONDIR (6 octets : 0, 1, nombre d'images) suivi d'une ICONDIRENTRY de 16 octets par image (largeur, hauteur, 0 couleur, 0 réservé, 1 plan, 32 bits, taille, offset) et des PNG bout à bout.
- [X] T007 [US1] Lancer `node scripts/make-icons.mjs` ; ouvrir les trois fichiers (aperçu) et vérifier qu'on reconnaît le cadeau à 16 px. Ajuster l'échelle de T005 si le cadre est coupé ou trop petit.
- [X] T008 [US1] Supprimer `public/favicon.png` et `app/icon.png` (`git rm`), et retirer le bloc `icons: { … }` de `generateMetadata` dans `app/layout.tsx`.
- [X] T009 [US1] `npm test` : `site-icons.test.ts` passe. Lancer `WISHLIST_DATA_PATH=tmp/demo-wishlist.json PORT=3010 npm run dev` et faire le parcours 1 du quickstart, y compris le code source de la page (une seule série de balises d'icône) et une ancienne adresse française redirigée. Vérifier aussi que `npm run build` passe (les fichiers de `app/` sont embarqués dans `.next/standalone`).
- [X] T010 [US1] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `feat: use the app icon as the website favicon (US1)` des fichiers de cette story et de la phase 2 (`scripts/gift-icon.mjs`, `scripts/make-icons.mjs`, `mobile/scripts/make-icons.mjs`, `app/favicon.ico`, `app/icon1.svg`, `app/icon2.png`, suppressions, `app/layout.tsx`, `tests/domain/site-icons.test.ts`), sans demander

**Checkpoint**: les onglets montrent la nouvelle icône ; US1 livrable seule.

---

## Phase 4: User Story 2 - Ajouter le site à l'écran d'accueil d'un téléphone (Priority: P2)

**Goal**: un raccourci d'écran d'accueil qui remplit le carré, comme l'icône iOS de l'app.

**Independent Test**: quickstart.md, parcours 2 (iPhone : Sur l'écran d'accueil ; Android : Ajouter à l'écran d'accueil).

### Tests for User Story 2

- [X] T011 [US2] Dans `tests/domain/site-icons.test.ts`, ajouter : `app/apple-icon.png` a la signature PNG, 180 × 180 dans IHDR, un type de couleur sans alpha (2) : opaque, donc rien de noir sur iOS (FR-004). Le lancer : il échoue.

### Implementation for User Story 2

- [X] T012 [US2] Dans `scripts/make-icons.mjs`, ajouter `app/apple-icon.png` : `svg(180, { background: theme.background, scale: 0.78 })` (mêmes réglages que `icon.png` de l'app), rendu par `sharp` avec `.flatten({ background: theme.background }).png()` pour un PNG sans canal alpha. Relancer le script : seuls `app/apple-icon.png` apparaît, les fichiers de US1 restent identiques.
- [X] T013 [US2] `npm test` vert ; vérifier dans le code source de la page la balise `apple-touch-icon` vers `/apple-icon.png?…` ; faire le parcours 2 du quickstart sur l'adresse IP locale du Mac (ou noter qu'il se fera sur staging après déploiement).
- [X] T014 [US2] Commit de la story : `npm run lint`, `npm run typecheck` et `npm test` verts, puis créer le commit `feat: give the website a home screen icon matching the app (US2)` de `scripts/make-icons.mjs`, `app/apple-icon.png` et `tests/domain/site-icons.test.ts` (changements de US2 seulement), sans demander

**Checkpoint**: onglets et écran d'accueil portent l'icône de l'app.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Ajouter à la section « Commandes » de `AGENTS.md` : « Icônes : `node scripts/make-icons.mjs` (site, écrit `app/favicon.ico`, `app/icon1.svg`, `app/icon2.png`, `app/apple-icon.png`) et `node mobile/scripts/make-icons.mjs` (app), après un changement de `scripts/gift-icon.mjs` ».
- [ ] T016 [P] Mettre à jour les commentaires « gift favicon » de `src/domain/theme.ts` et `src/domain/types.ts` s'ils ne décrivent plus le dessin (ils parlent toujours du cadeau : ne changer que si c'est faux).
- [ ] T017 Relire le quickstart en entier et cocher ce qui a été vérifié ; noter dans `quickstart.md` ce qui reste à faire après déploiement (SC-004, téléphone si non fait).
- [ ] T018 Commit Polish : lint, types et tests verts, puis `chore: document the icon scripts (019)`, sans demander

---

## Dependencies & Execution Order

- **Phase 2** (T001 → T002 → T003) bloque tout : les deux stories écrivent leurs fichiers par `scripts/make-icons.mjs`.
- **US1** (T004 → T005/T006 → T007 → T008 → T009 → T010) : T005 et T006 touchent le même fichier, donc à la suite.
- **US2** dépend seulement de la phase 2 en principe, mais partage `scripts/make-icons.mjs` et le test avec US1 : on la fait après US1.
- **Polish** après US2.

### Parallel Opportunities

- T015 et T016 (fichiers différents).
- Le reste est séquentiel : un seul script et un seul test, partagés.

## Parallel Example

```bash
Task: "T015 Documenter les scripts d'icônes dans AGENTS.md"
Task: "T016 Relire les commentaires de src/domain/theme.ts et types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2 : dessin partagé, app inchangée.
2. US1 : onglets, favoris, `/favicon.ico`, suppression des anciennes images.
3. **STOP and VALIDATE** : parcours 1 du quickstart, puis commit.

### Incremental Delivery

1. US1 → commit (MVP : la nouvelle icône est visible partout dans les navigateurs).
2. US2 → commit (raccourci d'écran d'accueil).
3. Polish → commit, puis revue (`wishlist-feature-review`, hook `after_implement`).
