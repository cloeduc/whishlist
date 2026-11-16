---

description: "Task list for feature 023-add-category-from-idea"
---

# Tasks: Ajouter une catégorie depuis le formulaire d'idée

**Input**: Design documents from `specs/023-add-category-from-idea/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/screens.md, quickstart.md

**Tests**: oui (guide des agents : un test par règle et cas limite ; parcours Maestro pour la story de l'app).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Un commit par user story (règle du projet)

Chaque phase de story se termine par « Commit de la story » : `npm run lint`, `npm run typecheck`, `npm test`, `npm --prefix mobile run lint`, `npm --prefix mobile run typecheck` et `npm --prefix mobile test` verts, puis le commit (message en anglais, `feat:`/`chore:`, terminé par `(USn)`), sans demander. Setup et Foundational entrent dans le commit de US1. Un fichier touché par deux stories est commité en deux temps. Les corrections de la revue `after_implement` forment un commit à part avec `review.md`.

Branche : `023-add-category-from-idea`, créée depuis `staging` avant le premier commit (mémoire « une branche par feature »).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

- [X] T001 Créer la branche `023-add-category-from-idea` depuis `staging` (`git switch -c 023-add-category-from-idea`) ; vérifier que l'arbre ne contient que les fichiers de spec de la 023 en plus de `next-env.d.ts` et `specs/019-site-favicon/review.md` (laissés hors des commits)
- [X] T002 [P] Ajouter `form.newTypeOption` (« + Nouvelle catégorie » / « + New category ») à `locales/fr/list.json` et `locales/en/list.json`, dans le bloc `form`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T003 [P] Compléter `tests/domain/commands-labels.test.ts` : `manageLabel` `add` d'une catégorie rend `label` = la catégorie créée (`{ id, label }`) ; avec « Jeux, Cuisine », deux catégories sont créées et `label` est la première ; nom vide → `typeNeedsName` ; doublon sans tenir compte des majuscules → `typeExists`
- [X] T004 `src/server/actions.ts` : `manageLabelAction` rend `{ ok: true; label: LabelView | null }` (le `label` de la commande) au lieu de `{ ok: true }` ; ses appelants actuels (Réglages) ignorent la valeur
- [X] T005 [P] `mobile/src/data/labels.ts` : `addLabel` rend la `Label` créée (`Schemas["Label"]`, corps de la réponse `201`) au lieu de `void` ; `LabelEditor` ignore la valeur ; compléter le test existant de `addLabel` s'il y en a un dans `mobile/__tests__/data/`

**Checkpoint**: la catégorie créée remonte jusqu'aux deux formulaires.

---

## Phase 3: User Story 1 - Nouvelle catégorie depuis le formulaire d'idée, app (Priority: P1) 🎯 MVP

**Goal**: dans le formulaire d'idée de l'app (ajout et modification), « + Nouvelle catégorie » crée une catégorie et la sélectionne, sans perdre la saisie ; désactivée hors ligne et pour une liste pas encore envoyée.

**Independent Test**: jest (T006, T007) ; Maestro `023-us1` ; quickstart.md, section US1.

### Tests

- [X] T006 [P] [US1] Compléter `mobile/__tests__/ui/components.test.tsx` : `Select` avec `action` montre la ligne d'action en dernier dans la feuille ; l'appui appelle `onPress` et ferme la feuille sans `onChange` ; `disabled` → l'appui ne fait rien et `hint` est affiché
- [X] T007 [P] [US1] Compléter `mobile/__tests__/screens/item-form.test.tsx` (faux `fetch`, liste à une catégorie « Livres ») : saisir un nom et un prix, « + Nouvelle catégorie » → « Jeux » → « Ajouter la catégorie » → `POST /lists/{id}/types` `{ label: "Jeux" }` rendant `{ id: "t-jeux", label: "Jeux" }`, puis `GET /lists/{id}` avec les deux catégories : « Jeux » est sélectionnée, le nom et le prix sont inchangés ; `typeExists` (400) → message `errors:typeExists`, bloc ouvert, saisie gardée ; nom vide → `typeNeedsName` sans appel ; « Annuler » → bloc fermé, « Livres » toujours choisie, aucun appel ; hors ligne (`setOnline(false)`) → ligne désactivée avec `mobile:offline.needsNetwork` ; liste `localOnly` → ligne désactivée ; écran de modification d'une idée : même entrée

### Implementation

- [X] T008 [US1] `mobile/src/ui/Select.tsx` : prop facultative `action?: { label: string; onPress: () => void; disabled?: boolean; hint?: string; testID?: string }`, dernière ligne de la feuille (même `PressableShadow` que les options, `accessibilityRole="button"`, `accessibilityState.disabled`) ; l'appui ferme la feuille puis appelle `onPress` ; désactivée : opacité réduite et `hint` dessous (`Text size="sm"`, couleur `mutedForeground`) ; aucun style en dur hors des jetons
- [X] T009 [US1] `mobile/src/features/items/ItemForm.tsx` : `testID="item-form.type"` sur le champ ; `action` = `t("form.newTypeOption")`, `testID="item-form.new-type"`, désactivée si `!online || list.localOnly` (`hint` = `t("mobile:offline.needsNetwork")`) ; état local `newType: { open: boolean; name: string; error: string | null; busy: boolean }` ; bloc sous le champ quand ouvert : `Field` (`categories.newType`), `Input` (`item-form.new-type-name`, placeholder `categories.newTypePlaceholder`), `Button` « Ajouter la catégorie » (`item-form.new-type-add`, `categories.addTypeAria`), `Button` lien « Annuler » (`item-form.new-type-cancel`, `common:actions.cancel`), `Alert` d'erreur (`item-form.new-type-error`) ; « Ajouter » : nom vide → `typeNeedsName` sans appel ; sinon `addLabel(list.id, "types", name)` → `set("typeId", created.id)`, bloc fermé ; erreur → `errorText(caught)` ; aucun autre champ du brouillon modifié
- [X] T010 [US1] Écrire `mobile/.maestro/flows/023-us1-new-category.yaml` (tag `023-us1`, `name:` en anglais) : connexion (démo), `create-list` (« Livres » seule), `open-new-item`, saisir un nom, `item-form.type` → `item-form.new-type` → `item-form.new-type-name` « Jeux » → `item-form.new-type-add` ; vérifier que le champ affiche « Jeux » ; enregistrer ; `open-category` « Jeux » : l'idée y est
- [X] T011 [US1] Lancer le parcours `023-us1` (prérequis : `mobile/.maestro/README.md` ; build Debug à jour) ; vérifier à la main quickstart.md, section US1 — 023-us1 et 005-us3 verts sur iPhone 17 Pro (Debug)
- [X] T012 [US1] Commit de la story : contrôles verts, puis `feat: create a category from the idea form in the app (US1)` (avec Setup et Foundational), sans demander

**Checkpoint**: l'app permet de créer une catégorie depuis le formulaire.

---

## Phase 4: User Story 2 - Nouvelle catégorie depuis le formulaire d'idée, site (Priority: P2)

**Goal**: même entrée dans le formulaire d'idée du site (ajout et modification).

**Independent Test**: quickstart.md, section US2 (le site n'a pas de suite e2e).

### Implementation

- [ ] T013 [US2] `components/site/item-form.tsx` : dernière `<NativeSelectOption value="__new__">` (`form.newTypeOption`) dans le choix de catégorie ; la choisir garde `draft.typeId` inchangé et ouvre un bloc sous le champ : `Field` + `FieldLabel` (`categories.newType`), `Input` (placeholder `categories.newTypePlaceholder`), `Button` « Ajouter la catégorie » (`categories.addTypeAria`), `Button` `variant="link"` « Annuler » (`common:actions.cancel`), `FormRefusal` pour l'erreur ; « Ajouter » : nom vide → `typeNeedsName` sans appel ; sinon `manageLabelAction({ wishlistId, kind: "type", op: "add", label })` dans une transition → succès : `setField("typeId", result.label.id)` et bloc fermé ; refus : code d'erreur affiché, bloc ouvert ; aucun autre champ du brouillon modifié (lire `node_modules/next/dist/docs/` sur les server functions appelées depuis un composant client avant d'écrire)
- [ ] T014 [US2] Vérifier à la main quickstart.md, section US2, sur la base de démo (serveur de dev) : ajout et modification, doublon, nom vide, « Annuler »
- [ ] T015 [US2] Commit de la story : contrôles verts, puis `feat: create a category from the idea form on the website (US2)`, sans demander

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T016 [P] Ajouter `"023": "specs/023-add-category-from-idea/spec.md"` à `mobile/__tests__/e2e/coverage.test.ts` ; ligne « Story entière » `023-us2` dans `mobile/.maestro/exclusions.md` (site, sans suite e2e ; lien quickstart US2)
- [ ] T017 [P] `.specify/bugs/idea-category-locked/assessment.md` : noter en tête que la remédiation passe par la feature 023 (lien vers `specs/023-add-category-from-idea/spec.md`)
- [ ] T018 Commit Polish : contrôles verts, puis `chore: record the 023 e2e coverage and link the bug assessment`, sans demander

---

## Dependencies & Execution Order

- **Setup → Foundational → US1 → US2 → Polish.**
- US2 ne dépend que de la fondation (T004) ; elle vient après US1 pour un commit par story.

### Parallel Opportunities

- T002 avec T001 fait ; T003, T005 en parallèle ; T006 et T007.

## Implementation Strategy

1. Fondation + US1 → commit (MVP : l'app, d'où vient le signalement).
2. US2 → commit.
3. Polish → commit ; revue `wishlist-feature-review`.
4. Push et squash : à l'utilisatrice.
